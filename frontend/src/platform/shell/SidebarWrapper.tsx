// FILEPATH: frontend/src/platform/shell/SidebarWrapper.tsx
// @file: Sidebar Security Wrapper (Type-Safe Edition)
// @author: ansav8@gmail.com
// @description: Filters the menu structure based on Governance Rules.
// ⚡ FIX: Casts 'id' to String() before .toUpperCase() to prevent crashes on numeric IDs.
// ⚡ LOGIC: (is_active && ui_enabled) -> Visible.

import { useMemo } from 'react';
import { logger } from '../logging';
import type { SystemManifest } from '../kernel/types';

export const useSidebarSecurity = (
    menuItems: any[], 
    manifest: SystemManifest | null
) => {
    return useMemo(() => {
        // If manifest isn't loaded yet, show default items (fail open/safe)
        if (!manifest) return menuItems;

        const filterItem = (item: any): boolean => {
            // ⚡ FIX: Defensive Casting. item.id might be a number (DB ID).
            const rawId = item.id ? String(item.id) : '';
            const domainKey = rawId.toUpperCase();

            // Always allow System items (SYS) and Root (/)
            if (!rawId || domainKey === 'SYS' || item.path === '/') return true;

            // Find config in Manifest
            const moduleStatus = manifest.modules.find(m => m.key === domainKey);

            // If module exists in manifest, obey its switches
            if (moduleStatus) {
                const isActive = moduleStatus.is_active === true;
                const isUiEnabled = moduleStatus.config?.ui_enabled !== false; // Default true

                const isVisible = isActive && isUiEnabled;

                if (!isVisible) {
                    logger.whisper('SHELL', `🛡️ Cloaking Item: [${item.name}]`, { key: domainKey });
                    return false;
                }
            }
            
            // Recursive check for children (Folders)
            if (item.children) {
                item.children = item.children.filter(filterItem);
                // Optional: Hide empty folders if desired
                // if (item.children.length === 0) return false;
            }

            return true;
        };

        const filtered = menuItems.filter(filterItem);
        return filtered;

    }, [menuItems, manifest]); // Re-run when manifest updates
};

