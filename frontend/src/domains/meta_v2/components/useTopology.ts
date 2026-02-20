// FILEPATH: frontend/src/domains/meta_v2/components/useTopology.ts
// @file: Topology Data Transformer (V2)
// @role: 🧠 Logic Container */
// @author: The Engineer
// @description: Fetches and groups the System Topology Graph from the API.
// @security-level: LEVEL 9 (UI Safe) */
// @updated: Injected "Zero-Touch" Workflow Placeholder for empty domains. */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MetaKernelService } from '@/api/services/MetaKernelService';
import { logger } from '@/platform/logging/Narrator';
import { useKernel } from '../_kernel/KernelContext';

// ⚡ SHARED TYPES
export interface TopologyItem {
    key: string;
    label?: string;
    type: string;
    icon?: string;  
    route?: string;
    description?: string;
    metadata?: Record<string, any>;
    priority?: number;
}

export interface TopologySection {
    id: string;
    label?: string;
    icon?: string;
    items: TopologyItem[];
}

export interface TopologyDomain {
    id: string;
    key: string;
    label?: string;
    icon?: string;
    description?: string;
    sections: TopologySection[]; // Grouped sections mapped from Backend
    items: TopologyItem[]; // Flat list for items explicitly missing a section_key
    weight: number;
}

export interface DomainCluster {
    key?: string;
    label?: string;
    icon?: string;
    description?: string;
    sections: TopologyDomain[];
    weight: number;
}

export const useTopology = (activeContext?: any) => {
    // 1. ⚡ FETCH TOPOLOGY GRAPH (Server-Side Source of Truth)
    const { data: rawNodes = [], isLoading } = useQuery({
        queryKey: ['topology', activeContext?.key],
        queryFn: async () => {
            if (!activeContext?.key) return [];
            logger.whisper("TOPOLOGY", `Fetching Graph for ${activeContext.key}...`);
            const nodes = await MetaKernelService.getTopology(activeContext.key);
            logger.trace("TOPOLOGY", `Received ${nodes.length} nodes`, { nodes });
            return nodes;
        },
        enabled: !!activeContext?.key
    });

    // 2. ⚡ THE DUMB PIPE (Zero Frontend Opinions)
    const domainClusters = useMemo(() => {
        if (!activeContext) return [];
        if (isLoading) return [];

        const dynamicSections = new Map<string, TopologySection>();
        const topLevelItems: TopologyItem[] = [];

        rawNodes.forEach((node: any) => {
            const item: TopologyItem = {
                key: node.key,
                label: node.label,
                type: node.type,
                icon: node.icon,
                route: node.route,
                description: node.description,
                metadata: node.metadata
            };

            // ⚡ DB-DRIVEN MATCHING: Trust the Backend's Section Assignment completely.
            const sectionKey = node.metadata?.section_key;
            
            if (sectionKey) {
                // If the backend commanded a group, build or append to it.
                if (!dynamicSections.has(sectionKey)) {
                    dynamicSections.set(sectionKey, {
                        id: sectionKey,
                        label: node.metadata?.section_label || sectionKey,
                        icon: node.metadata?.section_icon,
                        items: []
                    });
                }
                dynamicSections.get(sectionKey)!.items.push(item);
            } else {
                // ⚡ ROOT ENTITIES: Nodes without a section_key remain at the root
                topLevelItems.push(item);
            }
        });

        // ⚡ ZERO-TOUCH WORKFLOWS: If capability exists but no workflows, offer creation.
        // This ensures the "Workflows" folder always appears if the domain supports it.
        if (activeContext?.capabilities?.canEditWorkflows) {
            const wfSectionKey = 'WORKFLOWS';
            
            // Ensure section exists
            if (!dynamicSections.has(wfSectionKey)) {
                dynamicSections.set(wfSectionKey, {
                    id: wfSectionKey,
                    label: 'Workflows',
                    icon: 'antd:PartitionOutlined',
                    items: []
                });
            }

            const wfSection = dynamicSections.get(wfSectionKey)!;

            // Inject Placeholder if empty
            if (wfSection.items.length === 0) {
                logger.trace("TOPOLOGY", "Injecting Workflow Creation Placeholder");
                wfSection.items.push({
                    key: 'CREATE_FIRST_WORKFLOW',
                    label: 'Create First Workflow',
                    type: 'ACTION', // Visual distinct type, but handled as ITEM by renderer default
                    icon: 'antd:PlusCircleOutlined',
                    route: `workflows/${activeContext.key}`, // Navigates to Lobby
                    description: 'Initialize the process engine',
                    metadata: { is_placeholder: true }
                });
            }
        }

        // Sort dynamic folders alphabetically by their DB label
        const sortedSections = Array.from(dynamicSections.values()).sort((a, b) => 
            (a.label || '').localeCompare(b.label || '')
        );

        // Construct the "Self" Domain representation
        const currentDomain: TopologyDomain = {
            id: activeContext.key,
            key: activeContext.key,
            label: activeContext.label,
            icon: activeContext.source?.icon || activeContext.source?.module_icon, 
            description: activeContext.source?.description,
            sections: sortedSections,
            items: topLevelItems, 
            weight: 100
        };

        // Wrap in a Cluster (to maintain compatibility with DomainTopology.tsx renderer)
        const cluster: DomainCluster = {
            key: activeContext.source?.system_module,
            label: activeContext.source?.module_label,
            icon: activeContext.source?.module_icon,
            description: 'Active Workspace',
            sections: [currentDomain],
            weight: 100
        };

        return [cluster];
    }, [rawNodes, activeContext, isLoading]);

    return { clusters: domainClusters, isLoading };
};
