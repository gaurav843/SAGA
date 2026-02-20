// FILEPATH: frontend/src/domains/workspace/views/WorkspaceRuntime.tsx
// @file: Workspace Runtime Controller (Governance Aware)
// @author: ansav8@gmail.com
// @description: Bridges Logic to UI with crash protection and Governance Checks.
// ⚡ FIX: Forces System Manifest refresh on mount to ensure Admin toggles apply immediately.
// ⚡ LOG: Announces the detailed status of all modules on load.

import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Result, Button, Spin, theme } from 'antd';
import { useWorkspace } from '../hooks/useWorkspace';
import { ShellLayout } from '../../../platform/shell/ShellLayout';
import { WidgetHost } from '../features/widget_runner/WidgetHost';
import { logger } from '../../../platform/logging';
import { useTrace } from '../../../platform/logging/useTrace';
import { useSystem } from '../../../platform/kernel/SystemContext'; // ⚡ NEW

export const WorkspaceRuntime: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const { token } = theme.useToken();
    const { manifest, refresh: refreshSystem } = useSystem(); // ⚡ NEW: Access Refresh
    
    useTrace('WorkspaceRuntime', { slug });

    // 1. DATA LINK
    const { 
        screen, 
        menuData, 
        actionsData, 
        userMenuData, 
        footerData, 
        searchIndex,
        isLoading, 
        error, 
        layout 
    } = useWorkspace(slug || '');

    // 2. GOVERNANCE SYNC (Critical Fix)
    useEffect(() => {
        // When entering a Workspace, we MUST know the latest System State.
        // If an Admin just disabled a module, we can't rely on a 5-minute cache.
        logger.whisper("RUNTIME", "🔄 Synchronizing System Governance...");
        refreshSystem();
    }, [slug]);

    // 3. SECURITY GATE & LOGGING
    useEffect(() => {
        if (error) {
            logger.warn("RUNTIME", `⛔ Access Denied or Missing: /${slug}`);
        }
        if (screen && manifest) {
            logger.tell("RUNTIME", `🚀 Launched Workspace: ${screen.title}`, {
                actions: actionsData?.length || 0,
                footer_links: footerData?.length || 0
            });

            // ⚡ GOVERNANCE ROLL CALL
            const governanceReport = manifest.modules.map(m => ({
                module: m.key,
                ui: m.config?.ui_enabled !== false ? '✅ ON' : '❌ OFF',
                api: m.config?.api_enabled !== false ? '✅ ON' : '❌ OFF'
            }));

            logger.story("SYSTEM", "🛡️ ACTIVE GOVERNANCE PROTOCOLS", {
                environment: manifest.environment,
                modules: governanceReport
            });
        }
    }, [error, slug, screen, actionsData, footerData, manifest]);

    if (isLoading) {
        return (
            <div style={{ 
                height: '100vh', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                background: token.colorBgContainer
            }}>
                <Spin size="large" tip={`Loading ${slug}...`} />
            </div>
        );
    }

    if (error || !screen || !layout) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Result
                    status="404"
                    title="Workspace Not Found"
                    subTitle={`The workspace "${slug}" does not exist or you do not have permission.`}
                    extra={<Button type="primary" href="/">Return to Control</Button>}
                />
            </div>
        );
    }

    // 3. RENDER THE SHELL
    return (
        <ShellLayout 
            menuOverrides={menuData} 
            actionsOverrides={actionsData}   
            userMenuOverrides={userMenuData} 
            footerOverrides={footerData}     
            searchIndex={searchIndex}
            titleOverride={screen.title}
        >
            <WidgetHost layout={layout} slug={slug || ''} />
        </ShellLayout>
    );
};
