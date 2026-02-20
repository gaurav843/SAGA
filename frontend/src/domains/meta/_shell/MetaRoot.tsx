// FILEPATH: frontend/src/domains/meta/_shell/MetaRoot.tsx
// @file: Meta Domain Root Layout
// @role: 🐚 Layout Container */
// @author: The Engineer
// @description: Provides the MetaContext and persistent Layout Shell for the Meta Kernel.

import React, { Suspense } from 'react';
import { Spin } from 'antd';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';

import { MetaProvider } from '../_kernel/MetaContext';
import { MetaLayout } from './MetaLayout'; // ⚡ KEEPING THE WORKING LAYOUT

// ⚡ LAZY LOAD VIEWS
const DictionaryView = React.lazy(() => import('../features/dictionary/DictionaryView').then(m => ({ default: m.DictionaryView })));
const GovernanceView = React.lazy(() => import('../features/governance/GovernanceView').then(m => ({ default: m.GovernanceView })));
const StatesView = React.lazy(() => import('../features/states/StatesView').then(m => ({ default: m.StatesView })));
const RunnerView = React.lazy(() => import('../features/runner/RunnerView').then(m => ({ default: m.RunnerView })));
const SwitchboardView = React.lazy(() => import('../features/switchboard/SwitchboardView').then(m => ({ default: m.SwitchboardView })));
const AppStudioView = React.lazy(() => import('../features/app_studio/AppStudioView').then(m => ({ default: m.AppStudioView })));
const CortexView = React.lazy(() => import('../features/cortex/CortexView').then(m => ({ default: m.CortexView })));

export const MetaRoot: React.FC = () => {
  return (
    <MetaProvider>
        {/* ⚡ WRAP ROUTES IN THE EXISTING LAYOUT */}
        <MetaLayout>
            <Suspense fallback={
                <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Spin size="large" tip="Loading Module..." />
                </div>
            }>
                <Routes>
                    {/* Default Redirect */}
                    <Route index element={<Navigate to="dictionary" replace />} />
                    
                    {/* Feature Routes */}
                    <Route path="dictionary/*" element={<DictionaryView />} />
                    <Route path="governance/*" element={<GovernanceView />} />
                    <Route path="switchboard/*" element={<SwitchboardView />} />
                    <Route path="states/*" element={<StatesView />} />
                    <Route path="runner/*" element={<RunnerView />} />
                    <Route path="studio/*" element={<AppStudioView />} />
                    
                    {/* ⚡ NEW: CORTEX STUDIO */}
                    <Route path="cortex/*" element={<CortexView />} />

                    {/* Fallback */}
                    <Route path="*" element={<Outlet />} />
                </Routes>
            </Suspense>
        </MetaLayout>
    </MetaProvider>
  );
};
