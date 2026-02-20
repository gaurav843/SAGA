// FILEPATH: frontend/src/platform/core/ModuleRegistry.ts
// @file: Module Registry
// @role: 🔌 Plugin System Kernel */
// @author: The Architect
// @description: Singleton registry for Feature Modules.
// DIAGNOSTIC MODE: Added High-Volume Telemetry to trace Boot Sequence.


// @security-level: LEVEL 0 (Kernel) */

import React from 'react';
import { logger } from '../logging';

// 1. Static Import of Manifests
import { metaManifest } from '../../domains/meta/manifest'; 
import { systemManifest } from '../../domains/system/manifest';

export interface ModuleManifest {
    key: string;
    name: string;
    order?: number;
    icon?: React.ReactNode;
    layout?: React.ComponentType<any> | React.LazyExoticComponent<any>;
    routes?: any[];
}

export interface MenuItem {
    id: string;
    label: string;
    path: string;
    icon: React.ReactNode;
}

class ModuleRegistryImpl {
    private modules: Map<string, ModuleManifest> = new Map();

    constructor() {
        this.discover();
    }

    private discover() {
        logger.group('🔌 [ModuleRegistry] Discovery Phase');
        
        // Silent discovery to keep console clean, we log the result later
        const candidates = [
            { path: '../../domains/meta/manifest.tsx', manifest: metaManifest },
            { path: '../../domains/system/manifest.tsx', manifest: systemManifest }
        ];

        candidates.forEach(({ path, manifest }) => {
            try {
                if (!manifest) {
                     logger.scream('BOOT', `⚠️  Manifest is UNDEFINED at ${path}. Circular Dependency suspected.`);
                     return;
                }

                if (this.validate(manifest)) {
                    logger.whisper('BOOT', `✅ Registered Module: [${manifest.key}]`);
                    this.register(manifest);
                } else {
                    logger.warn('BOOT', `⚠️  Invalid Manifest Structure at ${path}`, manifest);
                }
            } catch (e) {
                logger.scream('BOOT', `🔥 CRASH loading manifest at ${path}`, e);
            }
        });
        
        logger.tell('BOOT', `🏁 Registry Boot Complete. Modules: ${this.modules.size}`);
        logger.groupEnd();
    }

    private validate(m: any): m is ModuleManifest {
        const hasKey = !!m.key;
        const hasRoutes = Array.isArray(m.routes);
        return hasKey && hasRoutes;
    }

    private register(manifest: ModuleManifest) {
        this.modules.set(manifest.key, manifest);
    }

    public getModules(): ModuleManifest[] {
        return Array.from(this.modules.values()).sort((a, b) => (a.order || 99) - (b.order || 99));
    }

    /**
     * @description Returns the navigation menu items for the Sidebar.
     * @invariant Called by ShellLayout to render the Main Menu.
     */
    public getMenuItems(): MenuItem[] {
        const items = this.getModules().map(m => ({
            id: m.key,
            label: m.name,
            path: `/${m.key}`,
            icon: m.icon
        }));
        
        // 🔍 DIAGNOSTIC LOG
        // logger.trace('REGISTRY', 'Generated Menu Items', items);
        
        return items;
    }

    /**
     * @description Generates the React Router configuration and logs it for debugging.
     */
    public getRouteConfig() {
        logger.group('🗺️ [ModuleRegistry] Generating Route Config');
        
        const routeConfig = this.getModules().flatMap(m => {
            if (!m.routes || m.routes.length === 0) {
                logger.warn('ROUTER', `Empty routes for module: ${m.key}`);
                return [];
            }

            // STRATEGY A: NESTED LAYOUT (Parent "/key" -> Children "path")
            if (m.layout) {
                logger.trace('ROUTER', `📍 Wiring Layout Route: /${m.key}`, { layout: m.layout.name || 'LazyLayout' });
                return [{
                    path: m.key, 
                    element: React.createElement(m.layout),
                    children: m.routes.map(r => ({
                        path: r.path, 
                        element: React.createElement(r.component)
                    }))
                }];
            }

            // STRATEGY B: FLAT ROUTES (Prefix "/key/path")
            return m.routes.map(r => {
                const fullPath = `${m.key}/${r.path}`;
                logger.trace('ROUTER', `📍 Wiring Flat Route: /${fullPath}`);
                return {
                    ...r,
                    path: fullPath,
                    element: React.createElement(r.component)
                };
            });
        });

        // ⚡ ROUTING TELEMETRY (The "Help Me" Feature)
        this.printRouteTable(routeConfig);
        logger.groupEnd();

        return routeConfig;
    }

    /**
     * @description Visualizes the Routing Tree in the Console.
     */
    private printRouteTable(routes: any[]) {
        if (routes.length === 0) {
            logger.warn('BOOT', '🗺️ [System Router] No static routes registered.');
            return;
        }

        const flatList: any[] = [];

        routes.forEach(route => {
            if (route.children) {
                // Parent
                flatList.push({
                    Type: '📦 LAYOUT',
                    Path: `/${route.path}`,
                    Component: route.element?.type?.name || 'Anonymous',
                    Children: route.children.length
                });
                // Children
                route.children.forEach((child: any) => {
                    flatList.push({
                        Type: '  ↳ VIEW',
                        Path: `/${route.path}/${child.path}`,
                        Component: child.element?.type?.name || 'LazyComponent',
                        Children: 0
                    });
                });
            } else {
                // Flat
                flatList.push({
                    Type: '📄 PAGE',
                    Path: `/${route.path}`,
                    Component: route.element?.type?.name || 'Anonymous',
                    Children: 0
                });
            }
        });

        console.table(flatList);
    }
}

export const ModuleRegistry = new ModuleRegistryImpl();

