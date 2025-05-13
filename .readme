# StateBot

<div align="center">
  <img src="https://via.placeholder.com/200x200?text=SB" alt="StateBot Logo" width="200" height="200">
  <p>A deterministic state manager for SvelteKit leveraging LLMs</p>
</div>

## 📋 Overview

StateBot is a unique state management solution for SvelteKit that uses large language models (LLMs) to determine application state based on facts. Instead of defining explicit state transitions, you define:

1. Different possible states (e.g., `authenticated`, `unauthenticated`)
2. Facts that qualify something as being in each state

The LLM analyzes the facts and determines the current state, creating a more semantic and flexible state system.

## ✨ Features

- 🧠 **LLM-Powered State Management**: Uses AI to determine application state based on defined facts
- 🔄 **Reactive Svelte Store**: Built on Svelte's reactivity system
- 📊 **Dev Tools**: Interactive visualization and debugging of state transitions
- 🛠️ **Multiple LLM Providers**: Support for Claude, Gemini, and ChatGPT
- 🔒 **Type-Safe**: Written in TypeScript with strong typing
- 🚀 **Performance Optimized**: Includes caching and debouncing to minimize API calls
- 🌐 **SvelteKit API Integration**: Built-in support for server endpoints

## 📦 Installation

```bash
npm install statebot
```

## 🏁 Quick Start

### 1. Define your states and facts

```typescript
// src/lib/stores/auth.ts
import { createStateBot } from 'statebot';

// Define your state types
type AuthState = 'unauthenticated' | 'authenticated' | 'expired';

// Create a StateBot store
export const authStateBot = createStateBot<AuthState>({
  provider: 'claude', // or 'gemini' or 'chatgpt'
  apiKey: import.meta.env.VITE_CLAUDE_API_KEY,
  states: {
    authenticated: [
      'User has valid JWT token',
      'Token is not expired',
      'Token passes signature validation'
    ],
    unauthenticated: [
      'User has no JWT token',
      'JWT token is missing'
    ],
    expired: [
      'JWT token has expired',
      'Token timestamp is in the past'
    ]
  }
});
```

### 2. Use in a Svelte component

```svelte
<script>
  import { onDestroy } from 'svelte';
  import { authStateBot } from '$lib/stores/auth';
  import { StateBotDevTools } from 'statebot';
  
  let currentState = null;
  
  // Subscribe to state changes
  const unsubscribe = authStateBot.subscribe(state => {
    currentState = state.currentState;
  });
  
  // Add facts to determine the state
  function login() {
    authStateBot.addFacts([
      'User has valid JWT token',
      'Token is not expired'
    ]);
  }
  
  function logout() {
    authStateBot.clearFacts();
    authStateBot.addFact('User has no JWT token');
  }
  
  // Clean up subscription
  onDestroy(unsubscribe);
</script>

<div>
  <h1>Current state: {currentState || 'Determining...'}</h1>
  
  {#if currentState === 'unauthenticated'}
    <button on:click={login}>Log in</button>
  {:else if currentState === 'authenticated'}
    <button on:click={logout}>Log out</button>
  {:else if currentState === 'expired'}
    <p>Your session has expired</p>
    <button on:click={login}>Renew session</button>
  {/if}
  
  <!-- Add dev tools in development mode -->
  {#if import.meta.env.DEV}
    <StateBotDevTools stateBot={authStateBot} />
  {/if}
</div>
```

## 🧩 Core API

### `createStateBot<TStateTypes>(config)`

Creates a new StateBot instance with the specified configuration.

**Parameters**:
- `config`: Configuration object for the StateBot
  - `provider`: LLM provider to use ('claude', 'gemini', or 'chatgpt')
  - `apiKey`: API key for the LLM provider
  - `states`: Object mapping state names to arrays of qualifying facts
  - `cacheExpiry`: (Optional) Time in ms before cache expires (default: 5 minutes)
  - `debounceTime`: (Optional) Time in ms to wait before sending batch updates (default: 500ms)
  - `retryCount`: (Optional) Number of times to retry failed LLM calls (default: 3)
  - `determinationThreshold`: (Optional) Confidence threshold for state determination (default: 0.7)

**Methods**:
- `subscribe(callback)`: Subscribe to state changes
- `addFact(fact)`: Add a single fact
- `addFacts(facts)`: Add multiple facts
- `removeFact(fact)`: Remove a fact
- `clearFacts()`: Clear all facts
- `getState()`: Get the current state
- `determineState()`: Force state determination
- `reset()`: Reset to initial state

### StateBotDevTools Component

A Svelte component for visualizing and debugging StateBot instances.

**Props**:
- `stateBot`: The StateBot instance to debug

### SvelteKit API Integration

```typescript
// src/routes/api/state/+server.ts
import { createStateBotEndpoints } from 'statebot';
import { myStateBot } from '$lib/stores';

export const { GET, POST } = createStateBotEndpoints(myStateBot);
```

This creates:
- `GET /api/state` - Returns the current state
- `POST /api/state/facts` - Accepts new facts and returns the updated state

## 📝 Examples

### Authentication State Management

```typescript
type AuthState = 'unauthenticated' | 'authenticated' | 'expired' | 'locked';

const authStateBot = createStateBot<AuthState>({
  provider: 'claude',
  apiKey: import.meta.env.VITE_CLAUDE_API_KEY,
  states: {
    unauthenticated: [
      'User has no JWT token',
      'JWT token is missing',
      'User has not logged in'
    ],
    authenticated: [
      'User has valid JWT token',
      'Token is not expired',
      'Token passes signature validation'
    ],
    expired: [
      'JWT token has expired',
      'Token timestamp is in the past'
    ],
    locked: [
      'Account has been locked due to suspicious activity',
      'Multiple failed login attempts detected',
      'Admin has manually locked the account'
    ]
  }
});
```

### Multi-Step Form

```typescript
type FormState = 'empty' | 'partially_complete' | 'validation_errors' | 'complete' | 'submitted';

const formStateBot = createStateBot<FormState>({
  provider: 'chatgpt',
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  states: {
    empty: [
      'No form fields have been filled',
      'User has not interacted with the form',
      'All required fields are empty'
    ],
    partially_complete: [
      'Some form fields have been filled',
      'At least one required field is filled',
      'Form has been partially completed'
    ],
    validation_errors: [
      'Email format is invalid',
      'Password does not meet complexity requirements',
      'Required fields are missing',
      'Form data fails validation rules'
    ],
    complete: [
      'All required fields are filled',
      'All form data passes validation rules',
      'Form is ready to be submitted'
    ],
    submitted: [
      'Form has been submitted to the server',
      'Submission is complete',
      'Form data has been processed'
    ]
  }
});
```

## 🛠️ Troubleshooting

### Common Issues

- **State not updating**: Check that you're adding facts correctly and waiting for state determination
- **High latency**: Consider increasing cache duration or implementing optimistic updates
- **Incorrect state determination**: Make facts more specific and distinctive

### Debugging

Use the StateBotDevTools component to visualize state changes and debug issues:

```svelte
<StateBotDevTools stateBot={myStateBot} />
```

## 🚀 Performance Optimization

StateBot includes several features to optimize performance:

- **Caching**: Results of state determinations are cached to minimize API calls
- **Debouncing**: Updates are batched to prevent excessive API calls
- **Retry Logic**: Failed API requests are retried with exponential backoff

## 🔧 Configuration

Fine-tune StateBot performance with these configuration options:

```typescript
const stateBot = createStateBot<AuthState>({
  // ... other config
  
  // Cache state determinations for 30 minutes
  cacheExpiry: 30 * 60 * 1000,
  
  // Wait 200ms before determining state after facts change
  debounceTime: 200,
  
  // Retry failed LLM calls up to 5 times
  retryCount: 5,
  
  // Only accept state determinations with confidence > 0.8
  determinationThreshold: 0.8
});
```

## 📜 License

MIT

---

<div align="center">
  <p>
    <a href="https://github.com/yourusername/statebot">GitHub</a> ·
    <a href="https://www.npmjs.com/package/statebot">NPM</a>
  </p>
</div>