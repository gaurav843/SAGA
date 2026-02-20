// FILEPATH: frontend/src/domains/meta/manifest.tsx
// @file: Meta Domain Manifest
// @role: 📦 Module Definition */
// @description: Registers the System Configuration Module.
// @fix: Lazy Loaded MetaRoot to prevent Circular Dependency with Sidebar.


import React from 'react';
import { 
    AppstoreAddOutlined, 
    BookOutlined, 
    SafetyCertificateOutlined, 
    PartitionOutlined,
    RocketOutlined,
    AppstoreOutlined,
    ThunderboltOutlined 
} from '@ant-design/icons';

// ⚡ LAZY LOAD THE LAYOUT (Breaks the Circular Dependency Cycle)
// Previously: import { MetaRoot } from './_shell/MetaRoot';
const MetaRoot = React.lazy(() => import('./_shell/MetaRoot').then(m => ({ default: m.MetaRoot })));

// ⚡ LAZY LOAD VIEWS
const DictionaryView = React.lazy(() => import('./features/dictionary/DictionaryView').then(m => ({ default: m.DictionaryView })));
const GovernanceView = React.lazy(() => import('./features/governance/GovernanceView').then(m => ({ default: m.GovernanceView })));
const StatesView = React.lazy(() => import('./features/states/StatesView').then(m => ({ default: m.StatesView })));
const RunnerView = React.lazy(() => import('./features/runner/RunnerView').then(m => ({ default: m.RunnerView })));
const SwitchboardView = React.lazy(() => import('./features/switchboard/SwitchboardView').then(m => ({ default: m.SwitchboardView })));
const AppStudioView = React.lazy(() => import('./features/app_studio/AppStudioView').then(m => ({ default: m.AppStudioView })));
const CortexView = React.lazy(() => import('./features/cortex/CortexView').then(m => ({ default: m.CortexView })));

export const metaManifest = {
    key: 'meta',
    name: 'Meta Kernel',
    icon: <AppstoreAddOutlined />,
    order: 100,
    layout: MetaRoot, // ⚡ PASSED AS LAZY COMPONENT
    routes: [
        {
            path: 'dictionary',
            name: 'Data Dictionary',
            icon: <BookOutlined />,
            component: DictionaryView,
            description: 'Manage Domain Schemas and Attributes.'
        },
        {
            path: 'governance',
            name: 'Governance',
            icon: <SafetyCertificateOutlined />,
            component: GovernanceView,
            description: 'Define Policies and Compliance Rules.'
        },
        {
            path: 'switchboard',
            name: 'Switchboard',
            icon: <AppstoreOutlined />,
            component: SwitchboardView,
            description: 'Active Policy Enforcement Map.'
        },
        {
            path: 'states',
            name: 'Workflows',
            icon: <PartitionOutlined />,
            component: StatesView,
            description: 'Design State Machines and Business Process Logic.'
        },
        {
            path: 'studio',
            name: 'App Studio',
            icon: <AppstoreAddOutlined />,
            component: AppStudioView,
            description: 'Compose Low-Code Applications.'
        },
        {
            path: 'runner',
            name: 'Process Runner',
            icon: <RocketOutlined />,
            component: RunnerView,
            description: 'Execute Business Processes.'
        },
        {
            path: 'cortex',
            name: 'Cortex Studio',
            icon: <ThunderboltOutlined />,
            component: CortexView,
            description: 'AI-Assisted System Architecture.'
        }
    ]
};

