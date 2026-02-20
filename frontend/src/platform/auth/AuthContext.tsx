/* FILEPATH: frontend/src/platform/auth/AuthContext.tsx */
/* @file React Auth Context */
/* @author The Engineer */
/* @description Wraps the XState machine in a React Context. Fixed for ESM/Vite Runtime. */

import React, { createContext, useContext } from 'react';
import { useMachine } from '@xstate/react';
import { authMachine } from './machine';
// ⚡ FIX: Explicitly import 'ActorRefFrom' as a type to prevent Runtime Crash
import type { ActorRefFrom } from 'xstate';

// The Type Definition for the Context
type AuthContextType = {
  authActor: ActorRefFrom<typeof authMachine>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Start the Machine
  const [state, send, authActor] = useMachine(authMachine);

  return (
    <AuthContext.Provider value={{ authActor }}>
      {children}
    </AuthContext.Provider>
  );
};

// Helper Hook for easy access
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

