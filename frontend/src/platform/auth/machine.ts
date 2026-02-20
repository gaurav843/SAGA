/* FILEPATH: frontend/src/platform/auth/machine.ts */
/* @file Root Authentication Machine (Level 7 - Auto-Generated) */
/* @author The Engineer */
/* @description The Core Identity Engine.
 * UPGRADE: Now uses 'src/api' (OpenAPI) for strict typing and API calls.
 * BENEFIT: If you change the Backend User model, this file updates automatically via 'npm run gen'.
 */

import { setup, assign, fromPromise } from 'xstate';

// ⚡ LEVEL 7 IMPORTS
import { AuthService } from '../../api/services/AuthService';
import type { User } from '../../api/models/User'; 
import type { Body_login_auth_login } from '../../api/models/Body_login_auth_login'; // Or 'LoginRequest' depending on your Pydantic model name

// 1. Define the Data (Context)
// We no longer hardcode "id, name, role". We use the Backend's definition.
interface AuthContext {
  token: string | null;
  user: User | null; // <--- The Robot maintains this type now
  error: string | null;
}

// 2. Define the Events
type AuthEvent =
  | { type: 'LOGIN'; payload: Body_login_auth_login }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

// 3. The API Logic (The "Promise Actor")
// ⚡ REPLACED: Manual fetch() -> Generated Service
const loginLogic = fromPromise(async ({ input }: { input: Body_login_auth_login }) => {
  try {
    // The Generator handles the URL, Headers, and JSON serialization automatically.
    // It also throws typed errors that match the Backend definition.
    const response = await AuthService.loginAuthLogin(input);
    return response; // Expected: { access_token: string, user: User }
  } catch (err: any) {
    console.error("🔥 [AUTH] Login Failed:", err);
    // The generator wraps errors. We extract the message for the UI.
    const msg = err.body?.detail || err.message || 'Connection Failed';
    throw new Error(msg); 
  }
});

// 4. The Machine Definition
export const authMachine = setup({
  types: {
    context: {} as AuthContext,
    events: {} as AuthEvent,
  },
  actors: {
    loginLogic,
  },
  actions: {
    setSession: assign({
      token: ({ event }) => (event as any).output.access_token,
      user: ({ event }) => (event as any).output.user,
      error: () => null,
    }),
    clearSession: assign({
      token: null,
      user: null,
      error: () => null,
    }),
    setError: assign({
      error: ({ event }) => (event as any).error?.message || 'Login Failed',
    }),
    clearError: assign({ error: null }),
    persistToken: ({ context }) => {
      if (context.token) {
        localStorage.setItem('flodock_token', context.token);
        if (context.user) {
          localStorage.setItem('flodock_user', JSON.stringify(context.user));
        }
      } else {
        localStorage.removeItem('flodock_token');
        localStorage.removeItem('flodock_user');
      }
    },
  },
}).createMachine({
  id: 'rootAuth',
  context: {
    token: null,
    user: null,
    error: null,
  },
  initial: 'checkingSession',
  states: {
    // 1. Boot Sequence
    checkingSession: {
      entry: assign({
        token: () => localStorage.getItem('flodock_token'),
        user: () => {
          const u = localStorage.getItem('flodock_user');
          try {
            return u ? JSON.parse(u) : null;
          } catch (e) {
            return null;
          }
        },
      }),
      always: [
        { target: 'authenticated', guard: ({ context }) => !!context.token },
        { target: 'unauthenticated' },
      ],
    },

    // 2. Login Flow
    unauthenticated: {
      on: {
        LOGIN: { target: 'authenticating' },
        CLEAR_ERROR: { actions: 'clearError' },
      },
    },

    // 3. The Async "Thinking" State
    authenticating: {
      invoke: {
        src: 'loginLogic',
        input: ({ event }) => (event as any).payload,
        onDone: {
          target: 'authenticated',
          actions: ['setSession', 'persistToken'],
        },
        onError: {
          target: 'unauthenticated',
          actions: ['setError'],
        },
      },
    },

    // 4. The Platform
    authenticated: {
      on: {
        LOGOUT: {
          target: 'unauthenticated',
          actions: ['clearSession', 'persistToken'],
        },
      },
    },
  },
});
