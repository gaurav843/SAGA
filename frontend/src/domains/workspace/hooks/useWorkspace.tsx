// FILEPATH: frontend/src/domains/workspace/hooks/useWorkspace.tsx
// @file: Workspace Logic Hook
// @author: ansav8@gmail.com
// @description: Fetches Layout Data and normalizes it for the UI.
// @updated: Added robust Label Fallback to prevent "Ghost Apps" in Sidebar. */

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useMemo } from 'react';
import { API_BASE_URL } from '../../../_kernel/config';
import { logger } from '../../../platform/logging';
import type { RuntimeLayout, ActiveApp } from '../types';

/**
 * ⚡ HELPER: Text Formatter
 * Converts "USER_CREATE" -> "User Create"
 */
const formatScope = (key: string) => {
    if (!key) return 'Untitled App';
    return key
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, s => s.toUpperCase());
};

/**
 * RECURSIVE TRANSFORMER
 * Converts ActiveApp[] into a nested structure for the menu.
 */
const buildMenuTree = (apps: ActiveApp[], targetSlug: string): any[] => {
    if (!apps || !Array.isArray(apps)) return [];

    const childrenMap = new Map<number, ActiveApp[]>();
    
    // 1. Index children
    apps.forEach(app => {
        const pid = app.parent_app_id ?? null;
        if (pid !== null) {
            if (!childrenMap.has(pid)) childrenMap.set(pid, []);
            childrenMap.get(pid)?.push(app);
        }
    });

    // 2. Recursive Build
    const traverse = (parentId: number | null): any[] => {
        const items = apps.filter(app => {
            const currentPid = app.parent_app_id ?? null; 
            return currentPid === parentId;
        });

        // Sort by order
        items.sort((a, b) => (a.placement?.order || 0) - (b.placement?.order || 0));

        return items.map(app => {
            const children = traverse(app.id);
            const hasChildren = children.length > 0;
            const isContainer = app.type === 'CONTAINER' || hasChildren;
            
            const segment = app.scope_key.toLowerCase().replace(/_/g, '-');
            const path = isContainer ? undefined : `/app/${targetSlug}/${segment}`;

            // ⚡ FIX: Robust Fallback for Missing Labels
            // 1. Config Label (User Override)
            // 2. Database Label (Snapshot)
            // 3. Formatted Scope Key (System Default)
            const label = app.config?.label || app.label || formatScope(app.scope_key);
            
            const iconStr = app.config?.icon || app.icon;

            return {
                path,
                name: label, // <--- ProLayout requires this to be non-empty
                icon: iconStr,
                key: app.key || `app_${app.id}`,
                children: hasChildren ? children : undefined,
                id: app.id,
                scope_key: app.scope_key,
                scope_type: app.type
            };
        });
    };

    return traverse(null);
};

export const useWorkspace = (slug: string, mode: string = 'LIVE') => {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['workspace', 'layout', slug, mode],
        queryFn: async () => {
            try {
                if (!slug) return null;

                const res = await axios.get(`${API_BASE_URL}/api/v1/workspace/layout/${slug}`, {
                    params: { mode }
                });
            
                return res.data as RuntimeLayout;
            } catch (err: any) {
                logger.scream('WORKSPACE', `🔥 Layout Load Failed`, err);
                throw err;
            }
        },
        enabled: !!slug,
        staleTime: 1000 * 60 * 5 
    });

    // ⚡ SAFE GUARDS
    const layout = data?.layout;
    const sidebarApps = layout?.SIDEBAR || [];
    const topApps = layout?.TOP_BAR || [];
    const userMenuApps = layout?.USER_MENU || [];
    const footerApps = layout?.BOTTOM_BAR || [];

    const menuData = useMemo(() => buildMenuTree(sidebarApps, slug), [sidebarApps, slug]);

    const actionsData = useMemo(() => {
        return topApps.map(app => ({
            key: app.key,
            label: app.config?.label || app.label || formatScope(app.scope_key),
            icon: app.config?.icon || app.icon,
            scope_key: app.scope_key
        }));
    }, [topApps, slug]);

    const userMenuData = useMemo(() => {
        return userMenuApps.map(app => ({
            key: app.scope_key,
            label: app.config?.label || app.label || formatScope(app.scope_key),
            icon: app.config?.icon || app.icon
        }));
    }, [userMenuApps, slug]);

    const footerData = useMemo(() => {
        return footerApps.map(app => ({
            key: app.key,
            label: app.config?.label || app.label || formatScope(app.scope_key),
            icon: app.config?.icon || app.icon,
            href: `/app/${slug}/${app.scope_key.toLowerCase().replace(/_/g, '-')}`
        }));
    }, [footerApps, slug]);

    const searchIndex = useMemo(() => {
        const allApps = [...sidebarApps, ...topApps, ...footerApps, ...userMenuApps];
        const seenPaths = new Set<string>();
        const uniqueApps: any[] = [];

        allApps.forEach(app => {
            const path = `/app/${slug}/${app.scope_key.toLowerCase().replace(/_/g, '-')}`;
            if (!seenPaths.has(path)) {
                seenPaths.add(path);
                uniqueApps.push({
                    id: app.id,
                    title: app.config?.label || app.label || formatScope(app.scope_key),
                    keywords: app.config?.intent?.keywords || [],
                    path: path,
                    icon: app.config?.icon || app.icon || 'antd:AppstoreOutlined'
                });
            }
        });

        return uniqueApps;
    }, [sidebarApps, topApps, footerApps, userMenuApps, slug]);

    return {
        screen: data?.screen,
        menuData, 
        actionsData, 
        userMenuData, 
        footerData, 
        searchIndex,
        isLoading, 
        error, 
        layout: data,
        refresh: refetch 
    };
};

