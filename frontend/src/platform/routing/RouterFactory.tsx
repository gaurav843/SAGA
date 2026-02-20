// FILEPATH: frontend/src/platform/routing/RouterFactory.tsx
// @file: Router Factory (The Cartographer - v2.3)
// @role: 🔌 Wiring */
// @author: The Engineer
// @description: Converts System Manifest into React Router Object.
// DIAGNOSTIC MODE: Telemetry added to verify V2 route registration.


// @security-level: LEVEL 0 (Kernel) */

import React, { Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Result, Button, Spin } from 'antd';

// 🔌 TELEMETRY
import { useTrace } from '../logging/useTrace';
import { logger } from '../logging'; // ⚡ NEW: Import Logger

// 🔌 CORE SHELLS
import { MetaRoot } from '../../domains/meta/_shell/MetaRoot';

// 🔌 META FEATURES (Static)
import MetaDashboard from '../../domains/meta/views/MetaDashboard';
import { StatesView } from '../../domains/meta/features/states/StatesView';
import { DictionaryView } from '../../domains/meta/features/dictionary/DictionaryView';
import { GovernanceView } from '../../domains/meta/features/governance/GovernanceView';
import { PolicyGroupsView } from '../../domains/meta/features/policy_groups/PolicyGroupsView';
import { SwitchboardView } from '../../domains/meta/features/switchboard/SwitchboardView';
import { RunnerView } from '../../domains/meta/features/runner/RunnerView';
import { AppStudioView } from '../../domains/meta/features/app_studio';

// 🔌 WORKSPACE RUNTIME
import { WorkspaceRuntime } from '../../domains/workspace/views/WorkspaceRuntime';

// 🧪 LAB BENCH
import { TestWorkflow } from '../../pages/TestWorkflow';

// ⚡ SYSTEM CONSOLE (Lazy Loaded)
const SystemDashboard = React.lazy(() => import('../../domains/system/features/admin_console/SystemDashboard'));

// ⚡ CORTEX STUDIO (Lazy Loaded)
const CortexView = React.lazy(() => import('../../domains/meta/features/cortex/CortexView').then(m => ({ default: m.CortexView })));

// ⚡ META V2 (The Kernel Lab) - ISOLATED IMPORT
const MetaV2Root = React.lazy(() => import('../../domains/meta_v2/MetaV2Root').then(m => ({ default: m.MetaV2Root })));

// --- ERROR BOUNDARY ---
const ErrorPage = () => {
  useTrace('ErrorPage', { 
    status: 404, 
    path: window.location.pathname, 
    referrer: document.referrer || 'Direct'
  });

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Result
        status="404"
        title="404"
        subTitle="The page you visited does not exist."
        extra={<Button type="primary" href="/">Back Home</Button>}
      />
    </div>
  );
};

// --- FACTORY ---
export const createDynamicRouter = (manifest: any) => {
  logger.whisper('ROUTER', '🏭 Factory: Constructing Router Tree...');
  
  try {
      // 1. Define Static Routes (System & Dev Tools)
      const staticRoutes = [
        {
          path: '/login',
          element: <div>Login Placeholder</div> // Should be handled by AuthContext but keeping route structure
        },
        {
          path: '/',
          element: <ShellLayout />, // ⚡ MASTER SHELL (Top Bar + Theme)
          errorElement: <ErrorPage />,
          children: [
            {
              index: true,
              element: <Navigate to="/meta" replace />
            },
            {
              path: '/test-workflow', // ⚡ THE LAB BENCH
              element: <TestWorkflow />,
            },
            // ⚡ SYSTEM ADMIN CONSOLE
            {
              path: '/system',
              element: (
                <Suspense fallback={
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Spin size="large" tip="Loading System Core..." />
                  </div>
                }>
                  <SystemDashboard />
                </Suspense>
              )
            },
            // Meta Kernel Routes
            {
              path: '/meta',
              element: <MetaRoot />,
              children: [
                {
                  index: true,
                  element: <MetaDashboard />
                },
                {
                  path: 'dictionary',
                  element: <DictionaryView />
                },
                {
                  path: 'governance',
                  element: <GovernanceView />
                },
                {
                  path: 'groups',
                  element: <PolicyGroupsView />
                },
                {
                  path: 'states',
                  element: <StatesView />,
                },
                {
                  path: 'switchboard',
                  element: <SwitchboardView />
                },
                {
                  path: 'studio',
                  element: <AppStudioView />
                },
                {
                  path: 'cortex', // ⚡ NEW: Cortex Studio
                  element: (
                    <Suspense fallback={<Spin size="large" />}>
                         <CortexView />
                     </Suspense>
                  )
                },
                {
                  path: 'runner', // Sandbox
                  element: <RunnerView />
                },
                {
                  path: 'production', // Live
                  element: <RunnerView />
                }
              ]
            },
            
            // ⚡ META V2 (The Kernel Lab)
            // ✅ NESTED INSIDE SHELL to inherit Top Bar & Theme
            {
              path: '/meta-v2/*',
              element: (
                <Suspense fallback={<div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin size="large" tip="Booting Kernel V2..." /></div>}>
                  <MetaV2Root />
                </Suspense>
              )
            },

            // ⚡ DYNAMIC WORKSPACE ROUTES (The "Player")
            {
                path: '/app/:slug/*',
                element: <WorkspaceRuntime />
            }
          ]
        }
      ];
      
      logger.tell('ROUTER', '✅ Router Tree Constructed Successfully.');
      
      // 2. Construct Router
      const router = createBrowserRouter(staticRoutes);
      return router;

  } catch (error) {
      logger.scream('ROUTER', '🔥 CRITICAL: Router Construction Failed', error);
      throw error;
  }
};

// ⚡ SHELL IMPORT FIX (Lazy load avoided for Core Shell to prevent flicker)
import { ShellLayout } from '../shell/ShellLayout';
import { LoginScreen } from '../auth/LoginScreen';

