
// FILEPATH: frontend/src/domains/meta_v2/manifest.tsx
// @file: Meta V2 Module Manifest
// @role: 📦 Module Definition */
// @author: The Engineer
// @description: Registers the V2 System Configurator in the Global Menu.
// @security-level: LEVEL 0 (Public) */

import React, { lazy } from 'react';
import { ExperimentOutlined } from '@ant-design/icons';
import type { ModuleManifest } from '../../platform/core/ModuleRegistry';

// ⚡ LAZY LOAD: Performance Optimization
// This ensures the heavy V2 codebase is split into a separate chunk.
const MetaV2Root = lazy(() => import('./MetaV2Root').then(m => ({ default: m.MetaV2Root })));

export const metaV2Manifest: ModuleManifest = {
    key: 'meta-v2',
    name: 'Meta Kernel V2', // Standardized 'name' to match ModuleManifest interface
    description: 'Next-Gen System Configurator (Fractal Architecture)',
    icon: <ExperimentOutlined />, 
    path: '/meta-v2/*',           // Wildcard for nested topology routing
    element: <MetaV2Root />,
    order: 10                     // High priority, appears near the top of Main Menu
};
