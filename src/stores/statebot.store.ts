// Updated stores/statebot.store.ts

import { writable, get } from 'svelte/store';
import type { 
  StateBotConfig, 
  StateBotState, 
  Fact, 
  LLMService,
  StateBotSubscriber
} from '../types/statebot.store';
import { ClaudeService } from '../services/statebot/claude-integration.service';
import { GeminiService } from '../services/statebot/gemini-integration.service';
import { ChatGPTService } from '../services/statebot/chatgpt-integration.service';

export class StateBotStore<TStateTypes extends string> {
  private config: StateBotConfig<TStateTypes>;
  private store = writable<StateBotState<TStateTypes>>({
    currentState: null,
    previousState: null,
    facts: [],
    confidence: 0,
    lastUpdated: new Date(),
    transitions: []
  });
  private llmService: LLMService<TStateTypes>;
  private updateTimer: ReturnType<typeof setTimeout> | null = null;
  private cache: Map<string, { state: TStateTypes, confidence: number, timestamp: Date }> = new Map();
  
  constructor(config: StateBotConfig<TStateTypes>) {
    this.config = {
      ...config,
      cacheExpiry: config.cacheExpiry || 5 * 60 * 1000, // 5 minutes default
      debounceTime: config.debounceTime || 500, // 500ms default
      retryCount: config.retryCount || 3,
      determinationThreshold: config.determinationThreshold || 0.7
    };
    
    // Initialize the appropriate LLM service
    this.llmService = this.createLLMService();
  }
  
  private createLLMService(): LLMService<TStateTypes> {
    switch (this.config.provider) {
      case 'claude':
        return new ClaudeService<TStateTypes>(this.config.apiKey, this.config.retryCount!);
      case 'gemini':
        return new GeminiService<TStateTypes>(this.config.apiKey, this.config.retryCount!);
      case 'chatgpt':
        return new ChatGPTService<TStateTypes>(this.config.apiKey, this.config.retryCount!);
      default:
        throw new Error(`Unsupported LLM provider: ${this.config.provider}`);
    }
  }
  
  // Allow setting a custom LLM service for testing or custom providers
  setLLMService(service: LLMService<TStateTypes>): void {
    this.llmService = service;
  }
  
  // Subscribe to state changes
  subscribe(callback: StateBotSubscriber<TStateTypes>): () => void {
    return this.store.subscribe(callback);
  }
  
  // Get the current state
  getState(): StateBotState<TStateTypes> {
    return get(this.store);
  }
  
  // Add a single fact
  async addFact(fact: Fact | string): Promise<void> {
    const factContent = typeof fact === 'string' ? fact : fact.content;
    
    this.store.update(state => ({
      ...state,
      facts: [...state.facts, factContent]
    }));
    
    this.scheduleStateUpdate();
  }
  
  // Add multiple facts
  async addFacts(facts: Array<Fact | string>): Promise<void> {
    const factContents = facts.map(fact => typeof fact === 'string' ? fact : fact.content);
    
    this.store.update(state => ({
      ...state,
      facts: [...state.facts, ...factContents]
    }));
    
    this.scheduleStateUpdate();
  }
  
  // Remove a fact
  async removeFact(fact: Fact | string): Promise<void> {
    const factContent = typeof fact === 'string' ? fact : fact.content;
    
    this.store.update(state => ({
      ...state,
      facts: state.facts.filter(f => f !== factContent)
    }));
    
    this.scheduleStateUpdate();
  }
  
  // Clear all facts
  async clearFacts(): Promise<void> {
    this.store.update(state => ({
      ...state,
      facts: []
    }));
    
    // Clear the current state when all facts are removed
    this.store.update(state => ({
      ...state,
      currentState: null,
      confidence: 0
    }));
  }
  
  // Force state determination immediately
  async determineState(): Promise<TStateTypes> {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }
    
    return this.updateState();
  }
  
  // Reset to initial state
  reset(): void {
    this.store.set({
      currentState: null,
      previousState: null,
      facts: [],
      confidence: 0,
      lastUpdated: new Date(),
      transitions: []
    });
    
    this.cache.clear();
  }
  
  // Schedule a state update after debounce time
  private scheduleStateUpdate(): void {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }
    
    this.updateTimer = setTimeout(async () => {
      try {
        await this.updateState();
      } catch (error) {
        console.error('Error updating state:', error);
        this.store.update(state => ({
          ...state,
          error: error instanceof Error ? error.message : String(error)
        }));
      }
    }, this.config.debounceTime);
  }
  
  // Update the state based on current facts
  private async updateState(): Promise<TStateTypes> {
    const currentState = this.getState();
    const facts = currentState.facts;
    
    // If there are no facts, we can't determine a state
    if (facts.length === 0) {
      return currentState.currentState as TStateTypes;
    }
    
    // Generate a cache key from facts
    const cacheKey = this.generateCacheKey(facts);
    
    // Check if we have a valid cache entry
    const cacheEntry = this.cache.get(cacheKey);
    if (cacheEntry && this.isCacheValid(cacheEntry.timestamp)) {
      this.updateStateStore(cacheEntry.state, cacheEntry.confidence);
      return cacheEntry.state;
    }
    
    // No valid cache, determine state using LLM
    try {
      const response = await this.llmService.determineState(this.config.states, facts);
      
      // Cache the result
      this.cache.set(cacheKey, {
        state: response.state,
        confidence: response.confidence,
        timestamp: new Date()
      });
      
      // Update the store
      this.updateStateStore(response.state, response.confidence);
      
      return response.state;
    } catch (error) {
      console.error('Error determining state:', error);
      this.store.update(state => ({
        ...state,
        error: error instanceof Error ? error.message : String(error)
      }));
      
      throw error;
    }
  }
  
  // Update the store with new state information
  private updateStateStore(newState: TStateTypes, confidence: number): void {
    this.store.update(state => {
      // Check if state has changed
      const stateChanged = state.currentState !== newState;
      
      // Only add to transitions if the state has changed
      const transitions = stateChanged
        ? [...state.transitions, {
            from: state.currentState,
            to: newState,
            timestamp: new Date(),
            facts: [...state.facts]
          }]
        : state.transitions;
      
      return {
        ...state,
        previousState: stateChanged ? state.currentState : state.previousState,
        currentState: newState,
        confidence,
        lastUpdated: new Date(),
        transitions,
        error: undefined // Clear any previous errors
      };
    });
  }
  
  // Generate a cache key from the current facts
  private generateCacheKey(facts: string[]): string {
    // Sort to ensure same facts in different order produce the same key
    return facts.slice().sort().join('|');
  }
  
  // Check if a cache entry is still valid
  private isCacheValid(timestamp: Date): boolean {
    const now = new Date();
    const age = now.getTime() - timestamp.getTime();
    return age < this.config.cacheExpiry!;
  }
  
  // Handle HTTP endpoints
  async handleGetState(_request: Request): Promise<Response> {
    const state = this.getState();
    return new Response(JSON.stringify(state), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  
  async handlePostStateFacts(request: Request): Promise<Response> {
    try {
      const body = await request.json();
      
      if (!body.facts || !Array.isArray(body.facts)) {
        return new Response(JSON.stringify({ error: 'Invalid request. Expected facts array.' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      
      await this.addFacts(body.facts);
      
      // Force state determination immediately
      await this.determineState();
      
      return new Response(JSON.stringify(this.getState()), {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: error instanceof Error ? error.message : String(error) 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  }
}