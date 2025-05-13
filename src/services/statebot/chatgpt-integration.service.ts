import type { LLMService, LLMStateResponse } from '../../types/statebot.store';

export class ChatGPTService<TStateTypes extends string> implements LLMService<TStateTypes> {
  private apiKey: string;
  private retryCount: number;
  private model: string = 'gpt-4'; // Default model

  constructor(apiKey: string, retryCount: number = 3) {
    this.apiKey = apiKey;
    this.retryCount = retryCount;
  }

  async determineState(
    states: Record<string, string[]>,
    facts: string[]
  ): Promise<LLMStateResponse<TStateTypes>> {
    // Construct the prompt for ChatGPT
    const prompt = this.constructPrompt(states, facts);
    
    let attempts = 0;
    let lastError: Error | null = null;
    
    while (attempts < this.retryCount) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              { role: 'system', content: 'You are a deterministic state manager that analyzes facts and determines the current state.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0,
            max_tokens: 500
          })
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return this.parseResponse(data);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        attempts++;
        
        // Wait before retrying with exponential backoff
        if (attempts < this.retryCount) {
          await new Promise(resolve => setTimeout(resolve, 2 ** attempts * 500));
        }
      }
    }

    throw lastError || new Error('Failed to determine state with OpenAI API');
  }

  private constructPrompt(states: Record<string, string[]>, facts: string[]): string {
    return `
You are a deterministic state manager whose job is to determine the current state based on a set of facts.

# States and their qualifying facts:
${Object.entries(states).map(([stateName, qualifyingFacts]) => `
## ${stateName}
${qualifyingFacts.map(fact => `- ${fact}`).join('\n')}
`).join('\n')}

# Current Facts:
${facts.map(fact => `- ${fact}`).join('\n')}

Based on these facts, determine which state is most appropriate. Respond in JSON format with the following structure:
{
  "state": "the_determined_state",
  "confidence": 0.95, // A number between 0 and 1
  "reasoning": "Your step-by-step reasoning for selecting this state"
}

If none of the states fully match, select the most appropriate one and adjust the confidence accordingly.
Respond ONLY with the JSON object and nothing else.
`;
  }

  private parseResponse(response: any): LLMStateResponse<TStateTypes> {
    try {
      // Extract JSON from ChatGPT's response
      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                       content.match(/{[\s\S]*?}/);
      
      if (!jsonMatch) {
        throw new Error('Could not extract JSON from ChatGPT response');
      }
      
      const jsonString = jsonMatch[1] || jsonMatch[0];
      const parsedResponse = JSON.parse(jsonString);
      
      return {
        state: parsedResponse.state as TStateTypes,
        confidence: parsedResponse.confidence,
        reasoning: parsedResponse.reasoning
      };
    } catch (error) {
      console.error('Error parsing ChatGPT response:', error);
      throw new Error('Failed to parse ChatGPT response');
    }
  }
}