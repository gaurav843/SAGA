// FILEPATH: frontend/src/domains/system/manifest.tsx
// @file: System Module Manifest
// @role: 📦 Module Definition */
// @description: Registers the "System Internals" domain.

import React from 'react';
import { SettingOutlined } from '@ant-design/icons';

// Lazy Load the Console to keep the bundle light for non-admins
const SystemConsole = React.lazy(() => import('./features/admin_console/SystemDashboard'));

export const systemManifest = {
    key: 'system',
    name: 'System Internals',
    icon: <SettingOutlined />,
    order: 900,
    routes: [
        {
            path: 'console',
            name: 'System Control',
            icon: <SettingOutlined />,
            component: SystemConsole,
            description: 'System Administration Console.'
        }
    ]
};



