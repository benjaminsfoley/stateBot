<script lang="ts">
    import { onDestroy } from 'svelte';
    import type { StateBot, StateBotState } from '../types/statebot.store';
    
    export let stateBot: StateBot<any>;
    
    let state: StateBotState<any>;
    let expanded = false;
    let activeTab = 'current';
    
    // Subscribe to state changes
    const unsubscribe = stateBot.subscribe((newState) => {
      state = newState;
    });
    
    // Clean up the subscription when the component is destroyed
    onDestroy(unsubscribe);
    
    function formatDate(date: Date) {
      return new Date(date).toLocaleString();
    }
    
    function toggleExpanded() {
      expanded = !expanded;
    }
    
    function setActiveTab(tab: string) {
      activeTab = tab;
    }
    
    function forceUpdate() {
      stateBot.determineState();
    }
  </script>
  
  <div class="statebot-devtools" class:expanded>
    <!-- Fixed accessibility issues by changing the div to a button -->
    <button 
      class="header" 
      on:click={toggleExpanded}
      type="button"
      aria-expanded={expanded}
      aria-controls="statebot-content"
    >
      <span class="title">StateBot DevTools</span>
      <span class="current-state">
        {#if state?.currentState}
          Current: <strong>{state.currentState}</strong> ({(state.confidence * 100).toFixed(1)}%)
        {:else}
          No state determined
        {/if}
      </span>
      <span class="toggle-icon">{expanded ? '▼' : '▲'}</span>
    </button>
    
    {#if expanded}
      <div class="content" id="statebot-content">
        <div class="tabs">
          <button 
            class:active={activeTab === 'current'} 
            on:click={() => setActiveTab('current')}
            type="button"
            aria-selected={activeTab === 'current'}
            role="tab"
          >
            Current State
          </button>
          <button 
            class:active={activeTab === 'facts'} 
            on:click={() => setActiveTab('facts')}
            type="button"
            aria-selected={activeTab === 'facts'}
            role="tab"
          >
            Facts ({state?.facts.length || 0})
          </button>
          <button 
            class:active={activeTab === 'transitions'} 
            on:click={() => setActiveTab('transitions')}
            type="button"
            aria-selected={activeTab === 'transitions'}
            role="tab"
          >
            Transitions ({state?.transitions.length || 0})
          </button>
        </div>
        
        <div class="tab-content" role="tabpanel">
          {#if activeTab === 'current'}
            <div class="current-state-details">
              <div class="detail-row">
                <span class="label">Current State:</span>
                <span class="value">{state?.currentState || 'None'}</span>
              </div>
              <div class="detail-row">
                <span class="label">Previous State:</span>
                <span class="value">{state?.previousState || 'None'}</span>
              </div>
              <div class="detail-row">
                <span class="label">Confidence:</span>
                <span class="value">{state ? (state.confidence * 100).toFixed(1) + '%' : 'N/A'}</span>
              </div>
              <div class="detail-row">
                <span class="label">Last Updated:</span>
                <span class="value">{state ? formatDate(state.lastUpdated) : 'Never'}</span>
              </div>
              {#if state?.error}
                <div class="error-message">
                  <span class="label">Error:</span>
                  <span class="value error">{state.error}</span>
                </div>
              {/if}
              <button class="action-btn" on:click={forceUpdate} type="button">Force Update</button>
            </div>
          {/if}
          
          {#if activeTab === 'facts'}
            <div class="facts-list">
              {#if state?.facts.length === 0}
                <p class="empty-message">No facts added yet.</p>
              {:else}
                <ul>
                  {#each state.facts as fact, i}
                    <li>
                      <span class="fact-number">{i + 1}.</span>
                      <span class="fact-content">{fact}</span>
                      <button 
                        class="remove-btn" 
                        on:click={() => stateBot.removeFact(fact)}
                        type="button"
                        aria-label="Remove fact"
                      >
                        ✕
                      </button>
                    </li>
                  {/each}
                </ul>
                <button class="action-btn" on:click={() => stateBot.clearFacts()} type="button">
                  Clear All Facts
                </button>
              {/if}
            </div>
          {/if}
          
          {#if activeTab === 'transitions'}
            <div class="transitions-list">
              {#if state?.transitions.length === 0}
                <p class="empty-message">No state transitions yet.</p>
              {:else}
                <ul>
                  {#each state.transitions as transition, i}
                    <li>
                      <div class="transition-header">
                        <span class="transition-number">{i + 1}.</span>
                        <span class="transition-states">
                          <span class="from-state">{transition.from || 'None'}</span>
                          <span class="arrow">→</span>
                          <span class="to-state">{transition.to}</span>
                        </span>
                        <span class="transition-time">
                          {formatDate(transition.timestamp)}
                        </span>
                      </div>
                      <div class="transition-facts">
                        <strong>Facts at transition:</strong>
                        <ul>
                          {#each transition.facts as fact}
                            <li>{fact}</li>
                          {/each}
                        </ul>
                      </div>
                    </li>
                  {/each}
                </ul>
              {/if}
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
  
  <style>
    .statebot-devtools {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
        Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      border: 1px solid #ccc;
      border-radius: 4px;
      margin: 1rem 0;
      background-color: #f9f9f9;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }
  
    .header {
      display: flex;
      align-items: center;
      padding: 0.75rem 1rem;
      cursor: pointer;
      user-select: none;
      background-color: #eee;
      border-bottom: 1px solid #ddd;
      width: 100%;
      text-align: left;
      border: none;
      font-size: inherit;
      font-family: inherit;
    }
  
    .title {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #333;
      flex-grow: 0;
      margin-right: 1rem;
    }
  
    .current-state {
      flex-grow: 1;
      font-size: 0.9rem;
      color: #555;
    }
  
    .toggle-icon {
      color: #666;
      font-size: 1rem;
    }
  
    .content {
      padding: 1rem;
    }
  
    .tabs {
      display: flex;
      border-bottom: 1px solid #ddd;
      margin-bottom: 1rem;
    }
  
    .tabs button {
      background: none;
      border: none;
      padding: 0.5rem 1rem;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      font-size: 0.9rem;
      color: #555;
    }
  
    .tabs button.active {
      border-bottom-color: #007bff;
      color: #007bff;
      font-weight: 500;
    }
  
    .tab-content {
      padding: 0.5rem 0;
    }
  
    .detail-row {
      display: flex;
      margin-bottom: 0.5rem;
    }
  
    .label {
      font-weight: 500;
      min-width: 120px;
      color: #666;
    }
  
    .value {
      flex-grow: 1;
    }
  
    .error {
      color: #dc3545;
    }
  
    .action-btn {
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 3px;
      padding: 0.5rem 1rem;
      margin-top: 1rem;
      cursor: pointer;
      font-size: 0.9rem;
    }
  
    .action-btn:hover {
      background-color: #0069d9;
    }
  
    .facts-list ul, .transitions-list ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
  
    .facts-list li {
      display: flex;
      align-items: center;
      padding: 0.5rem;
      border-bottom: 1px solid #eee;
    }
  
    .fact-number {
      min-width: 30px;
      color: #777;
    }
  
    .fact-content {
      flex-grow: 1;
    }
  
    .remove-btn {
      background: none;
      border: none;
      color: #dc3545;
      cursor: pointer;
      font-size: 0.8rem;
      padding: 0.25rem;
      opacity: 0.7;
    }
  
    .remove-btn:hover {
      opacity: 1;
    }
  
    .transitions-list li {
      margin-bottom: 1rem;
      padding: 0.5rem;
      border: 1px solid #eee;
      border-radius: 4px;
    }
  
    .transition-header {
      display: flex;
      align-items: center;
      margin-bottom: 0.5rem;
    }
  
    .transition-number {
      min-width: 30px;
      color: #777;
    }
  
    .transition-states {
      flex-grow: 1;
    }
  
    .from-state, .to-state {
      font-weight: 500;
    }
  
    .arrow {
      margin: 0 0.5rem;
      color: #777;
    }
  
    .transition-time {
      font-size: 0.8rem;
      color: #777;
    }
  
    .transition-facts {
      margin-left: 30px;
      font-size: 0.9rem;
    }
  
    .transition-facts ul {
      margin-top: 0.25rem;
      padding-left: 1rem;
    }
  
    .transition-facts li {
      border: none;
      margin-bottom: 0.25rem;
      padding: 0;
    }
  
    .empty-message {
      color: #777;
      font-style: italic;
    }
  </style>