// FILEPATH: frontend/src/domains/meta/features/app_studio/AppStudioView.tsx
// @file: App Studio Container (Router)
// @role: 🧠 Logic Orchestrator */
// @author: The Engineer
// @description: Orchestrates Lobby, Canvas, and Brick Library. Passes Meta History to Editor.
// @security-level: LEVEL 9 (Deep Linking) */

import React, { useState, useMemo } from 'react';
import { type DragEndEvent } from '@dnd-kit/core';
import { useUrlState } from '../../../../platform/hooks/useUrlState';
import { logger } from '../../../../platform/logging';

// ⚡ FRACTAL IMPORTS
import { AppStudioLobby } from './components/AppStudioLobby';
import { CreateAppModal } from './components/CreateAppModal';
import { StudioEditor } from './components/StudioEditor';
import { useAppStudio } from './hooks/useAppStudio';
import { type SystemBrick } from './types';

// ⚡ DATA LAYER
import { useWorkspace } from '../../../workspace/hooks/useWorkspace';

export const AppStudioView: React.FC = () => {
    // 1. GLOBAL STATE (URL)
    const [appIdStr, setAppIdStr] = useUrlState('app_id', '');
    const activeAppId = appIdStr ? parseInt(appIdStr, 10) : null;

    // 2. LOGIC HOOK (Actions & Screens List)
    const { 
        screens, 
        installApp, 
        updateApp, 
        deleteApp, 
        manifestApp,
        publishApp,
        isLoading: isActionLoading 
    } = useAppStudio();

    // 3. DERIVED STATE
    const activeScreen = screens.find(s => s.id === activeAppId);

    // 4. DATA HOOK (Layout & Content)
    // We only fetch layout if we have an active screen
    const { 
        layout, 
        refresh: refreshLayout, 
        isLoading: isLayoutLoading 
    } = useWorkspace(activeScreen?.route_slug || '', 'DRAFT');

    const isLoading = isActionLoading || isLayoutLoading;
    const [isManifestOpen, setIsManifestOpen] = useState(false);

    // ⚡ NORMALIZE APPS FOR EDITOR
    const apps = useMemo(() => {
        if (!layout?.layout) return [];
        
        const normalize = (items: any[], zone: string) => 
            (items || []).map(item => ({
                ...item,
                placement: item.placement || { zone, order: item.order || 0 }
            }));

        return [
            ...normalize(layout.layout.TOP_BAR, 'TOP_BAR'),
            ...normalize(layout.layout.SIDEBAR, 'SIDEBAR'),
            ...normalize(layout.layout.MAIN, 'MAIN'),
            ...normalize(layout.layout.BOTTOM_BAR, 'BOTTOM_BAR'),
            ...normalize(layout.layout.USER_MENU, 'USER_MENU'), 
            ...normalize(layout.layout.COMMAND_PALETTE, 'COMMAND_PALETTE')
        ];
    }, [layout]);

    // --- HANDLERS ---

    const handleSelectApp = (id: number) => {
        setAppIdStr(id.toString());
    };

    const handleBackToLobby = () => {
        setAppIdStr('');
    };

    const handleManifestSubmit = async (values: { title: string; route_slug: string; description?: string }) => {
        const newScreen = await manifestApp(values);
        setIsManifestOpen(false);
        if (newScreen && newScreen.id) {
            handleSelectApp(newScreen.id);
        }
    };

    // ⚡ DND HANDLER (Delegated from Editor)
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || !activeAppId) return;

        const brick = active.data.current?.brick;
        if (!brick) return;

        const targetData = over.data.current;
        
        try {
            // CASE A: Dropped on a ZONE
            if (targetData && targetData.type === 'ZONE') {
                const zone = targetData.zone;
                const zoneApps = apps.filter(a => a.placement.zone === zone);
                const nextOrder = zoneApps.length; 

                logger.tell("STUDIO", `🎯 Drag-Install: [${brick.label}] -> ${zone}`);
                
                await installApp({
                    screen_id: activeAppId,
                    scope_id: parseInt(brick.id, 10), 
                    placement: { zone, order: nextOrder }, 
                    config: {}
                });
                refreshLayout(); 
            }

            // CASE B: Dropped on a FOLDER (Container)
            if (targetData && targetData.type === 'APP') {
                const parentApp = targetData.app;
                if (parentApp.scope_type === 'CONTAINER' || parentApp.type === 'CONTAINER') {
                    logger.tell("STUDIO", `🎯 Nesting: [${brick.label}] under ${parentApp.config?.label}`);
                    
                    await installApp({
                        screen_id: activeAppId,
                        scope_id: parseInt(brick.id, 10),
                        parent_app_id: parentApp.id,
                        placement: { zone: parentApp.placement.zone, order: 999 },
                        config: {}
                    });
                    refreshLayout();
                }
            }
        } catch (error) {
            logger.error("STUDIO", "Drop action failed", error);
        }
    };

    // ⚡ CONTEXT MENU HANDLER (The "Easy Way")
    const handleInstallBrick = async (brick: SystemBrick, zone: string) => {
        if (!activeAppId) return;

        const zoneApps = apps.filter(a => a.placement.zone === zone);
        const maxOrder = zoneApps.length > 0 
            ? Math.max(...zoneApps.map(a => a.placement.order)) 
            : -1;
        const nextOrder = maxOrder + 1;

        await installApp({
            screen_id: activeAppId,
            scope_id: parseInt(brick.id, 10),
            placement: { zone, order: nextOrder },
            config: {}
        });
        refreshLayout();
    };

    const handleUpdateApp = async (appId: number, updates: any) => {
        await updateApp(appId, updates);
        refreshLayout();
    };

    const handleDeleteApp = async (appId: number) => {
        await deleteApp(appId);
        refreshLayout();
    };

    // --- RENDER: LOBBY MODE ---
    if (!activeAppId) {
        return (
            <>
                <AppStudioLobby 
                    screens={screens}
                    onSelect={handleSelectApp}
                    onCreate={() => setIsManifestOpen(true)}
                    onDelete={(id) => console.log('Delete not implemented for screens', id)}
                    isLoading={isLoading}
                />
                <CreateAppModal 
                    open={isManifestOpen} 
                    onCancel={() => setIsManifestOpen(false)} 
                    onSubmit={handleManifestSubmit}
                    isLoading={isLoading}
                />
            </>
        );
    }

    // --- RENDER: EDITOR MODE ---
    return (
        <StudioEditor 
            screen={activeScreen}
            apps={apps}
            screens={screens}
            // ⚡ INJECT HISTORY: Pass the meta from the layout response
            lastRelease={layout?.meta} 
            isLoading={isLoading}
            onBack={handleBackToLobby}
            onSelectScreen={handleSelectApp}
            onInstall={handleInstallBrick}
            onUpdate={handleUpdateApp}
            onDelete={handleDeleteApp}
            onPublish={publishApp}
            onRefresh={refreshLayout}
            onDragEnd={handleDragEnd}
        />
    );
};

