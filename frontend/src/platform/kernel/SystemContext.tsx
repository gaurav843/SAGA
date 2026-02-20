// FILEPATH: frontend/src/platform/kernel/SystemContext.tsx
// @file: System Context (The BIOS - Robust Edition)
// @author: ansav8@gmail.com
// @description: Stores the Auto-Discovered System Manifest.
// ⚡ FIX: Guaranteed 'refresh' function to prevent TypeErrors.
// ⚡ FIX: Exported Context Type for consumers.

import React, { createContext, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { SystemManifest } from './types';
import { API_BASE_URL } from '@kernel/config';
import { logger } from '../logging';

// ⚡ EXPORTED INTERFACE
export interface SystemContextType {
  manifest: SystemManifest | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

// ⚡ SAFE DEFAULT: Prevents crash if accessed before provider mount (though unlikely)
const defaultContext: SystemContextType = {
    manifest: null,
    isLoading: true,
    error: null,
    refresh: () => console.warn("SystemContext: Refresh called before initialization")
};

const SystemContext = createContext<SystemContextType>(defaultContext);

export const SystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error, isFetching, refetch } = useQuery({
    queryKey: ['system', 'manifest'],
    queryFn: async () => {
        logger.whisper("BIOS", "📡 Contacting System Kernel...");
        const start = performance.now();
        
        try {
            const response = await axios.get<SystemManifest>(`${API_BASE_URL}/api/v1/system/manifest`);
            const duration = (performance.now() - start).toFixed(0);
            
            logger.tell("BIOS", `✅ System Manifest Loaded (${duration}ms)`, {
                version: response.data.version,
                environment: response.data.environment,
                module_count: response.data.modules.length
            });
            
            return response.data;
        } catch (err: any) {
            const duration = (performance.now() - start).toFixed(0);
            logger.scream("BIOS", `🔥 System Boot Failed (${duration}ms)`, err);
            throw new Error(err.response?.data?.detail || "Failed to load System Manifest");
        }
    },
    staleTime: 1000 * 60 * 5, 
    refetchOnWindowFocus: false, 
    retry: 2 
  });

  useEffect(() => {
    if (isFetching && !isLoading) {
        logger.whisper("BIOS", "🔄 Refreshing System State...");
    }
  }, [isFetching, isLoading]);

  // ⚡ STABLE HANDLER: Force Refresh
  const handleRefresh = useCallback(() => {
      logger.tell("BIOS", "⚡ Forced System Refresh Requested");
      // Invalidate both manifest and specific queries to be safe
      queryClient.invalidateQueries({ queryKey: ['system'] });
      refetch();
  }, [queryClient, refetch]);

  const value: SystemContextType = {
      manifest: data || null,
      isLoading,
      error: error ? (error as Error).message : null,
      refresh: handleRefresh
  };

  return (
    <SystemContext.Provider value={value}>
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = () => {
  const context = useContext(SystemContext);
  if (!context) {
      const msg = 'useSystem must be used within a SystemProvider';
      logger.scream("CODE", "❌ Context Error", { error: msg });
      throw new Error(msg);
  }
  return context;
};
