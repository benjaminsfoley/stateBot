// Updated types/statebot.store.ts

// LLM Provider types
export type LLMProvider = 'claude' | 'gemini' | 'chatgpt';

// Configuration for the state bot
export interface StateBotConfig<TStateTypes extends string> {
  provider: LLMProvider;
  apiKey: string;
  states: Record<TStateTypes, string[]>;
  cacheExpiry?: number; // Time in ms before cache expires
  debounceTime?: number; // Time in ms to wait before sending batch updates
  retryCount?: number; // Number of times to retry failed LLM calls
  determinationThreshold?: number; // Confidence threshold for state determination
}

// The state interface that will be stored in the Svelte store
export interface StateBotState<TStateTypes extends string> {
  currentState: TStateTypes | null;
  previousState: TStateTypes | null;
  facts: string[];
  confidence: number;
  lastUpdated: Date;
  transitions: Array<{
    from: TStateTypes | null;
    to: TStateTypes;
    timestamp: Date;
    facts: string[];
  }>;
  error?: string;
}

// A fact that can be added to the state
export interface Fact {
  content: string;
  source?: string;
  timestamp?: Date;
}

// Response from LLM services
export interface LLMStateResponse<TStateTypes extends string> {
  state: TStateTypes;
  confidence: number;
  reasoning?: string;
}

// Interface for LLM service implementations
export interface LLMService<TStateTypes extends string> {
  determineState(
    states: Record<TStateTypes, string[]>,
    facts: string[]
  ): Promise<LLMStateResponse<TStateTypes>>;
}

// Type for subscribers
export type StateBotSubscriber<TStateTypes extends string> = (state: StateBotState<TStateTypes>) => void;

// Public API for the StateBot
export interface StateBot<TStateTypes extends string> {
  // Subscribe to state changes
  subscribe: (callback: StateBotSubscriber<TStateTypes>) => () => void;
  
  // Add a new fact
  addFact: (fact: Fact | string) => Promise<void>;
  
  // Add multiple facts
  addFacts: (facts: Array<Fact | string>) => Promise<void>;
  
  // Remove a fact
  removeFact: (fact: Fact | string) => Promise<void>;
  
  // Clear all facts
  clearFacts: () => Promise<void>;
  
  // Get current state
  getState: () => StateBotState<TStateTypes>;
  
  // Force state determination
  determineState: () => Promise<TStateTypes>;
  
  // Reset to initial state
  reset: () => void;
}