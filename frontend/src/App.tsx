// FILEPATH: frontend/src/App.tsx
// @file: Application Entry Point (Scroll-Aware)
// @author: ansav8@gmail.com
// @description: Root Provider Stack with fixed locale and fluid height.
// Note: Integrated with UniversalNarrator for boot sequence tracking.

import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US'; 
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from './platform/auth/AuthContext';
import { SystemProvider, useSystem } from './platform/kernel/SystemContext';
import { CapabilitiesProvider } from './domains/meta/_kernel/CapabilitiesContext';
import { createDynamicRouter } from './platform/routing/RouterFactory';
import { ThemeProvider } from './platform/shell/ThemeContext';

const queryClient = new QueryClient();

const AppRouter = () => {
  const { manifest } = useSystem();
  // Standardize the router creation with the current manifest state
  const router = React.useMemo(() => createDynamicRouter(manifest), [manifest]);
  return <RouterProvider router={router} />;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
        <ConfigProvider locale={enUS}>
            <QueryClientProvider client={queryClient}>
              <AuthProvider>
                <SystemProvider>
                  <CapabilitiesProvider>
                      {/* Fluid wrapper to ensure AppRouter expands naturally */}
                      <div className="flodock-app-root" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                        <AppRouter />
                      </div>
                  </CapabilitiesProvider>
                </SystemProvider>
              </AuthProvider>
            </QueryClientProvider>
        </ConfigProvider>
    </ThemeProvider>
  );
};

export default App;

