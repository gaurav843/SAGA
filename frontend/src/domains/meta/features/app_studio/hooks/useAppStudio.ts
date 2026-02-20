// FILEPATH: frontend/src/domains/meta/features/app_studio/hooks/useAppStudio.ts
// @file: App Studio Logic Hook
// @role: 🧠 Logic Container */
// @author: The Engineer
// @description: Manages IDE Actions. Updates 'publishApp' to support explicit version labels.
// @security-level: LEVEL 9 (Direct Fetch Implementation) */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ⚡ DATA SOURCES
import { useBricks } from '../../../../workspace/hooks/useBricks';
import { OpenAPI } from '../../../../../api/core/OpenAPI';
import { logger } from '../../../../../platform/logging';
import { Screen } from '../types';

// ⚡ PLATFORM UTILS
import { useNotification } from '../../../../../platform/design/system/useNotification';

// ⚡ TYPES
interface ScreenCreate {
    title: string;
    route_slug: string;
    security_policy?: any;
    is_active?: boolean;
}

interface ActiveAppCreate {
    screen_id: number;
    scope_id: number;
    placement?: any;
    config?: any;
    parent_app_id?: number | null;
}

export const useAppStudio = () => {
    const navigate = useNavigate();
    const { notify } = useNotification(); 
    
    // 1. DATA (Bricks Only - Workspace is managed by View)
    const { data: libraryData, isLoading: isLibraryLoading } = useBricks();
    
    // Normalize Library Data
    const library = libraryData 
        ? (Array.isArray(libraryData) ? libraryData : libraryData.items) 
        : [];

    // 2. STATE
    const [isBusy, setIsBusy] = useState(false);
    const [screens, setScreens] = useState<Screen[]>([]);

    // ⚡ HELPER: Direct Fetcher
    const apiCall = useCallback(async (method: string, endpoint: string, body?: any) => {
        const baseUrl = OpenAPI.BASE || '';
        const url = `${baseUrl}/api/v1/workspace${endpoint}`;
        
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (OpenAPI.TOKEN) {
            headers['Authorization'] = `Bearer ${OpenAPI.TOKEN}`;
        }

        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ detail: response.statusText }));
            throw new Error(err.detail || `API Error ${response.status}`);
        }

        if (response.status === 204) return null;

        return response.json();
    }, []);

    // ⚡ ACTION: Fetch Screens List (With Race Condition Fix)
    const fetchScreens = useCallback(async () => {
        setIsBusy(true);
        try {
            const data = await apiCall('GET', '/screens');
            const list = Array.isArray(data) ? data : (data.items || []);
            setScreens(list);
            logger.whisper("STUDIO", `Loaded ${list.length} Apps`);
        } catch (error) {
            logger.warn("STUDIO", "Failed to load app list", error);
        } finally {
            setIsBusy(false);
        }
    }, [apiCall]);

    useEffect(() => {
        fetchScreens();
    }, [fetchScreens]);

    // 3. ACTIONS

    /**
     * ⚡ MANIFEST APPLICATION
     */
    const manifestApp = useCallback(async (values: { title: string; route_slug: string; description?: string }) => {
        setIsBusy(true);
        logger.tell("STUDIO", `🚀 Manifesting App: ${values.title}`);
        
        try {
            const payload: ScreenCreate = {
                title: values.title,
                route_slug: values.route_slug,
                security_policy: { description: values.description },
                is_active: true
            };

            const newScreen = await apiCall('POST', '/screens', payload);
            notify.success(`App "${newScreen.title}" initialized!`);
            await fetchScreens(); 
            return newScreen;

        } catch (error: any) {
            logger.scream("STUDIO", "Manifestation Failed", error);
            notify.error(error.message || "Failed to create app");
            throw error;
        } finally {
            setIsBusy(false);
        }
    }, [apiCall, fetchScreens, notify]);

    /**
     * ⚡ INSTALL BRICK
     */
    const installApp = useCallback(async (payload: ActiveAppCreate) => {
        setIsBusy(true);
        try {
            await apiCall('POST', '/apps', payload);
            logger.tell("STUDIO", `🧱 Brick Installed`);
            notify.success("Component added successfully.");
        } catch (error: any) {
            logger.scream("STUDIO", "Installation Failed", error);
            notify.error("Failed to add component.");
            throw error; 
        } finally {
            setIsBusy(false);
        }
    }, [apiCall, notify]);

    /**
     * ⚡ UPDATE CONFIG
     */
    const updateApp = useCallback(async (appId: number, updates: any) => {
        try {
            await apiCall('PATCH', `/apps/${appId}`, updates);
            notify.success("Configuration saved.");
        } catch (error) {
            notify.error("Update failed.");
            throw error;
        }
    }, [apiCall, notify]);

    /**
     * ⚡ DELETE APP
     */
    const deleteApp = useCallback(async (appId: number) => {
        try {
            await apiCall('DELETE', `/apps/${appId}`);
            notify.success("Component removed.");
        } catch (error) {
            logger.scream("STUDIO", "Deletion Failed", error);
            notify.error("Deletion failed.");
            throw error;
        }
    }, [apiCall, notify]);

    /**
     * ⚡ PUBLISH RELEASE (Corrected)
     */
    // ⚡ FIX: Accept versionLabel explicitly
    const publishApp = useCallback(async (screenId: number, versionLabel: string, description: string) => {
        setIsBusy(true);
        try {
            await apiCall('POST', `/screens/${screenId}/releases`, { 
                version_label: versionLabel, // ⚡ FIX: Pass the actual version!
                description 
            });
            logger.tell("STUDIO", `🚀 Release Published: ${versionLabel}`);
            notify.success("Release published successfully!");
        } catch (error) {
            logger.scream("STUDIO", "Publish Failed", error);
            notify.error("Failed to publish release. See console.");
            throw error;
        } finally {
            setIsBusy(false);
        }
    }, [apiCall, notify]);

    return {
        library,
        screens,
        isLoading: isLibraryLoading || isBusy,
        manifestApp,
        installApp,
        updateApp,
        deleteApp,
        publishApp,
        refreshScreens: fetchScreens
    };
};

