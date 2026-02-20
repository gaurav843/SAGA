// FILEPATH: frontend/src/domains/workspace/features/widget_runner/WidgetHost.tsx
// @file: Widget Host (The Controller)
// @author: ansav8@gmail.com
// @description: Connects the URL Route to the Active App definition.
// ⚡ LOG: Performs and Logs a Pre-Flight Governance Check before mounting.

import React, { useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Empty, Typography, theme } from 'antd';
import { WidgetRegistry } from './WidgetRegistry';
import { logger } from '../../../../platform/logging';
import { useSystem } from '../../../../platform/kernel/SystemContext'; // ⚡ NEW
import type { RuntimeLayout } from '../../types';

interface WidgetHostProps {
    layout: RuntimeLayout;
    slug: string;
}

export const WidgetHost: React.FC<WidgetHostProps> = ({ layout, slug }) => {
    const location = useLocation();
    const { token } = theme.useToken();
    const { manifest } = useSystem(); // ⚡ NEW

    // 1. PARSE URL TO FIND APP SCOPE
    const activeScopeKey = useMemo(() => {
        const parts = location.pathname.split('/');
        if (parts.length < 4) return null;
        return parts[3].toUpperCase().replace(/-/g, '_'); 
    }, [location.pathname]);

    // 2. FIND APP DEFINITION
    const activeApp = useMemo(() => {
        if (!activeScopeKey) return null;
        
        const allApps = [
            ...(layout.layout.SIDEBAR || []),
            ...(layout.layout.TOP_BAR || []),
            ...(layout.layout.BOTTOM_BAR || []),
            ...(layout.layout.COMMAND_PALETTE || [])
        ];

        const match = allApps.find(a => 
            a.scope_key === activeScopeKey || 
            a.scope_key.endsWith(`:${activeScopeKey}`)
        );

        if (match) {
            logger.whisper("HOST", `🎯 Targeted App: ${match.label} (${match.scope_key})`);
        } else {
            logger.warn("HOST", `❌ App Not Found: ${activeScopeKey}`);
        }

        return match;
    }, [layout, activeScopeKey]);

    // ⚡ 3. PRE-FLIGHT GOVERNANCE CHECK (Loud)
    useEffect(() => {
        if (activeApp && manifest) {
            const [domain] = activeApp.scope_key.split(':');
            const moduleDef = manifest.modules.find(m => m.key === domain);
            
            const status = {
                domain,
                ui: moduleDef?.config?.ui_enabled !== false ? 'ALLOWED' : 'BLOCKED',
                active: moduleDef?.is_active ? 'YES' : 'NO'
            };

            const color = status.ui === 'BLOCKED' ? 'color:red' : 'color:green';
            // We use 'console.log' directly here for formatting, or extend Narrator
            logger.tell("GOVERNANCE", `🛡️ Pre-Flight Check for [${activeApp.label}]`, status);
        }
    }, [activeApp, manifest]);

    // 4. RENDER
    if (!activeApp) {
        return (
            <div style={{ 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexDirection: 'column',
                color: token.colorTextQuaternary
            }}>
                <Empty 
                    image={Empty.PRESENTED_IMAGE_SIMPLE} 
                    description={<span style={{ fontSize: 16 }}>Select a tool from the menu to begin.</span>} 
                />
            </div>
        );
    }

    return (
        <WidgetRegistry app={activeApp} slug={slug} />
    );
};
