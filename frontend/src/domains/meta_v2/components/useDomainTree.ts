// FILEPATH: frontend/src/domains/meta_v2/components/useDomainTree.ts
// @file: Domain Tree Transformer
// @role: 🧠 Data Transformer */
// @author: The Engineer
// @description: Transforms flat Domain list into a Hierarchy.
// @security-level: LEVEL 9 (UI Safe) */
// @updated: Removed hardcoded 'SYS' check. Uses Backend 'display_weight' for sorting. */

import { useMemo } from 'react';
import type { DomainSummary } from '../_kernel/types';

export interface KernelTreeNode {
    key: string;
    title: string;
    label: string;
    type: string;
    icon?: string;
    capabilities: {
        canBrowseData: boolean;
        canGovern: boolean;
    };
    display_weight: number; // ⚡ ADDED DYNAMIC SORT WEIGHT
    children?: KernelTreeNode[];
}

export const useDomainTree = (domains: DomainSummary[]) => {
    const treeData = useMemo(() => {
        if (!domains || !Array.isArray(domains)) return [];

        const nodeMap: Record<string, KernelTreeNode> = {};
        const roots: KernelTreeNode[] = [];

        // 1. Initialize Nodes
        domains.forEach(domain => {
            nodeMap[domain.key] = {
                key: domain.key,
                title: domain.label,
                label: domain.label,
                type: domain.type || 'UNKNOWN',
                icon: domain.icon || domain.module_icon,
                // ⚡ READ DYNAMIC WEIGHT (Default to 50 if missing)
                display_weight: domain.type_def?.properties?.display_weight ?? 50,
                capabilities: {
                    canBrowseData: domain.type_def?.properties?.storage_strategy === 'TABLE',
                    canGovern: domain.type_def?.properties?.api_strategy === 'CRUD'
                },
                children: []
            };
        });

        // 2. Link Hierarchy
        domains.forEach(domain => {
            // Normalize parent key (handles v2 vs v3 differences)
            const parentKey = (domain as any).parent || domain.parent_domain;
            
            if (parentKey && nodeMap[parentKey]) {
                nodeMap[parentKey].children!.push(nodeMap[domain.key]);
            } else {
                roots.push(nodeMap[domain.key]);
            }
        });

        // 3. Sort & Polish
        const sortNodes = (nodes: KernelTreeNode[]) => {
            nodes.sort((a, b) => {
                // ⚡ DYNAMIC SORT: Compare weights first (lower number = higher up)
                if (a.display_weight !== b.display_weight) {
                    return a.display_weight - b.display_weight;
                }
                
                // Fallback to alphabetical label sorting
                return a.label.localeCompare(b.label);
            });

            nodes.forEach(node => {
                if (node.children && node.children.length > 0) {
                    sortNodes(node.children);
                } else {
                    delete node.children;
                }
            });
        };

        sortNodes(roots);
        return roots;
    }, [domains]);

    return { treeData };
};
