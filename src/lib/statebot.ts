// Updated lib/statebot.ts

import type { StateBotConfig, StateBot, Fact, StateBotSubscriber } from '../types/statebot.store';
import { StateBotStore } from '../stores/statebot.store';

// Factory function to create a new StateBot instance
export function createStateBot<TStateTypes extends string>(
  config: StateBotConfig<TStateTypes>
): StateBot<TStateTypes> {
  const stateBotStore = new StateBotStore<TStateTypes>(config);
  
  // Return the public API
  return {
    subscribe: (callback: StateBotSubscriber<TStateTypes>) => stateBotStore.subscribe(callback),
    addFact: (fact: Fact | string) => stateBotStore.addFact(fact),
    addFacts: (facts: Array<Fact | string>) => stateBotStore.addFacts(facts),
    removeFact: (fact: Fact | string) => stateBotStore.removeFact(fact),
    clearFacts: () => stateBotStore.clearFacts(),
    getState: () => stateBotStore.getState(),
    determineState: () => stateBotStore.determineState(),
    reset: () => stateBotStore.reset()
  };
}

// Export a helper to create SvelteKit endpoints
export function createStateBotEndpoints<TStateTypes extends string>(
  stateBot: StateBotStore<TStateTypes>
) {
  return {
    GET: async (request: Request) => stateBot.handleGetState(request),
    POST: async (request: Request) => stateBot.handlePostStateFacts(request)
  };
}

// Export the main StateBot class for server-side usage
export { StateBotStore };