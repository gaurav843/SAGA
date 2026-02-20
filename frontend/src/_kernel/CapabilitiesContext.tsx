/* FILEPATH: frontend/src/_kernel/CapabilitiesContext.tsx */
/* @file Capabilities Provider (The Hydrator) */
/* @author The Engineer */
/* @description Blocks app rendering until the System Registry is synced.
 * MIGRATION: Swapped Material UI for Ant Design v5.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Spin, Typography, theme, Flex } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

// Types
import { SystemRegistry } from './SystemRegistry';

// The Context Interface
interface CapabilitiesContextType {
  isReady: boolean;
  registry: typeof SystemRegistry;
}

const CapabilitiesContext = createContext<CapabilitiesContextType | null>(null);

export const CapabilitiesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const { token } = theme.useToken();

  useEffect(() => {
    const boot = async () => {
      // Execute the Handshake
      await SystemRegistry.initialize();
      setIsReady(true);
    };
    boot();
  }, []);

  if (!isReady) {
    return (
      <Flex 
        vertical 
        align="center" 
        justify="center" 
        style={{ 
          height: '100vh', 
          backgroundColor: '#0a0a0a', // Deep dark
          color: '#ffffff',
          gap: 16 
        }}
      >
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48, color: token.colorPrimary }} spin />} />
        
        <Typography.Text style={{ fontFamily: 'monospace', opacity: 0.8, color: token.colorPrimary }}>
          INITIALIZING KERNEL LINK...
        </Typography.Text>
        
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Fetching System Capabilities
        </Typography.Text>
      </Flex>
    );
  }

  return (
    <CapabilitiesContext.Provider value={{ isReady, registry: SystemRegistry }}>
      {children}
    </CapabilitiesContext.Provider>
  );
};

// Hook for consuming the capabilities
export const useCapabilities = () => {
  const context = useContext(CapabilitiesContext);
  if (!context) {
    throw new Error("useCapabilities must be used within a CapabilitiesProvider");
  }
  return context.registry;
};

