// Example usage with updated types

// Create a StateBot for authentication
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
  },
  cacheExpiry: 10 * 60 * 1000, // 10 minutes
  debounceTime: 300 // 300ms
});

// Example with form states
type FormState = 'empty' | 'partially_complete' | 'validation_errors' | 'complete' | 'submitted';

const formStateBot = createStateBot<FormState>({
  provider: 'chatgpt',
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  states: {
    empty: [
      'No form fields have been filled',
      'All required fields are empty'
    ],
    partially_complete: [
      'Some form fields have been filled',
      'At least one required field is filled'
    ],
    validation_errors: [
      'Email format is invalid',
      'Password does not meet complexity requirements',
      'Required fields are missing'
    ],
    complete: [
      'All required fields are filled',
      'All form data passes validation rules'
    ],
    submitted: [
      'Form has been submitted to the server',
      'Form data has been processed'
    ]
  }
});