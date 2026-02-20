// FILEPATH: frontend/src/domains/meta_v2/components/DomainTopology.tsx
// @file: Domain Topology Visualizer
// @role: 🎨 UI Presentation
// @author: The Engineer
// @description: Renders the System Hierarchy using a Recursive Engine for infinite nesting support.
// @security-level: LEVEL 9 (UI Safe)
// @updated: Added support for 'ACTION' node type to render "Create" placeholders distinctively.

import React, { useMemo } from 'react';
import { Typography, theme, Empty, Tree, Tag, Input, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useKernel } from '../_kernel/KernelContext';
import { useTopology, type TopologyItem, TopologySection, TopologyDomain, DomainCluster } from './useTopology';
import { useMetaUI } from '../_shell/MetaUIContext';
import { IconFactory } from '@/platform/ui/icons/IconFactory';
import { logger } from '@/platform/logging/Narrator';
import { useUrlState } from '@/platform/hooks/useUrlState'; // ⚡ UPGRADE: Persistence

import { 
    SearchOutlined, 
    ReloadOutlined
} from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';

/** @description Extracted Typography components for cleaner JSX */
const { Title, Text } = Typography;

/** @description Extracted DirectoryTree component from AntD Tree */
const { DirectoryTree } = Tree;

// ⚡ UNIVERSAL RECURSIVE NODE STRUCTURE
/**
 * @description Standardized data structure for recursive rendering of the system tree.
 */
interface UniversalTreeNode {
    key: string;
    label: string;
    icon?: string;
    type: 'CLUSTER' | 'DOMAIN' | 'FOLDER' | 'ITEM' | 'ACTION'; // ⚡ ADDED ACTION TYPE
    description?: string;
    children?: UniversalTreeNode[];
    data?: {
        item?: TopologyItem;
        domainKey?: string;
    };
    selectable?: boolean;
    color?: string;
}

/**
 * @description Renders the System Hierarchy using a Recursive Engine.
 */
export const DomainTopology: React.FC = () => {
    const { token } = theme.useToken();
    const navigate = useNavigate();
    
    // 1. DATA
    const { activeContext, isLoading, refresh, selectContext } = useKernel();
    const { clusters } = useTopology(activeContext);

    // 2. STATE
    const { topologyExpandedKeys, setTopologyExpandedKeys } = useMetaUI();
    const [searchTerm, setSearchTerm] = useUrlState('q', ''); // ⚡ UPGRADE: Deep Linking

    // 3. ROUTING LOGIC
    /**
     * @description Handles navigation clicks on tree nodes, routing to appropriate V2 features.
     */
    const handleNavigate = (item: TopologyItem, domainKey: string) => {
        logger.tell('TOPOLOGY', `🧭 Navigating: [${item.type}] ${item.label}`, item);

        if (item.type === 'ENTITY') {
            logger.tell('TOPOLOGY', `➡️ Drilling down to Dictionary for Domain: ${domainKey}`);
            navigate(`dictionary/${domainKey}?domain=${domainKey}`);
            return;
        }

        if (item.type === 'GOVERNANCE') {
            logger.tell('TOPOLOGY', `➡️ Drilling down to Governance for Domain: ${domainKey}`);
            navigate(`governance/${domainKey}?domain=${domainKey}`);
            return;
        }

        // ⚡ V2 ROUTING HOOK: Workflow Editor Integration
        if (item.type === 'SCOPE') {
            const technicalKey = (item as any).metadata?.technical_key || item.key.replace('scope_', '');
            logger.tell('TOPOLOGY', `➡️ Drilling down to Workflows for Domain: ${domainKey}, Scope: ${technicalKey}`);
            navigate(`workflows/${domainKey}/${technicalKey}?domain=${domainKey}`);
            return;
        }

        if (item.type === 'FOLDER') {
            // ⚡ UX: If it's the Workflows folder, navigate to the Workflow Lobby
            if ((item as any).metadata?.section_key === 'WORKFLOWS') {
                logger.tell('TOPOLOGY', `📂 Entering Workflow Lobby for Domain: ${domainKey}`);
                navigate(`workflows/${domainKey}?domain=${domainKey}`);
                return;
            }

            const childKey = (item as any).metadata?.domain_key || item.key.replace('domain_', '');
            logger.tell('TOPOLOGY', `📂 Entering Child Domain: ${childKey}`);
            selectContext(childKey);
            setSearchTerm('');
            return;
        }

        // ⚡ ACTION HANDLER (For Placeholders)
        if (item.type === 'ACTION') {
            logger.tell('TOPOLOGY', `⚡ Executing Action: ${item.label}`);
            // Actions like "Create First Workflow" route to the lobby
            if (item.route) {
                navigate(item.route);
            }
            return;
        }

        // Default: External Route
        const params = new URLSearchParams();
        params.set('domain', domainKey);
        if (item.type !== 'ENTITY') {
            params.set('scope', item.key);
        }
        
        const fullPath = `${item.route || item.path}?${params.toString()}`;
        logger.whisper('TOPOLOGY', `➡️ External Link to: ${fullPath}`);
        navigate(fullPath);
    };

    // 4. NORMALIZATION ENGINE (The Flattening & Recursive Builder)
    const { normalizedNodes, searchExpandedKeys } = useMemo(() => {
        if (!clusters) return { normalizedNodes: [], searchExpandedKeys: [] };
        
        const lowerTerm = searchTerm.toLowerCase().trim();
        const expanded: React.Key[] = [];

        logger.trace('TOPOLOGY', '⚙️ Normalizing Topology Data Tree', { term: lowerTerm });
    
    // Helper: Recursive Filter & Map
        /**
         * @description Recursively filters and maps tree nodes based on the active search term.
         */
        const processNode = (
            node: UniversalTreeNode, 
            parentKey: string
        ): UniversalTreeNode | null => {
            // Check self match
            const selfMatch = (node.label || '').toLowerCase().includes(lowerTerm) ||
                              (node.type.toLowerCase().includes(lowerTerm)) ||
                              (node.key.toLowerCase().includes(lowerTerm));

            // Process children recursively
            const validChildren: UniversalTreeNode[] = [];
            if (node.children) {
                node.children.forEach(child => {
                    const processed = processNode(child, node.key);
                    if (processed) validChildren.push(processed);
                });
            }

            // If searched, only return if self matches or has matching children
            if (lowerTerm && !selfMatch && validChildren.length === 0) {
                return null;
            }

            // If we have matches in children, expand this node
            if (validChildren.length > 0 && lowerTerm) {
                expanded.push(node.key);
            }

            return {
                ...node,
                children: validChildren.length > 0 ? validChildren : undefined
            };
        };

        // TRANSFORM: Cluster -> Domain -> Section -> Item -> UniversalTreeNode
        const rawRoots: UniversalTreeNode[] = clusters.map(cluster => ({
            key: `DOMAIN_${cluster.key}`,
            label: cluster.label || 'Unknown Cluster',
            icon: cluster.icon,
            type: 'CLUSTER',
            description: cluster.description,
            color: token.colorTextHeading,
            selectable: false,
            children: (cluster.sections || []).map(domain => ({
                key: `DOMAIN_NODE_${domain.key}`,
                label: domain.label || domain.key,
                icon: domain.icon,
                type: 'DOMAIN',
                color: token.colorText,
                selectable: false,
                children: [
                    // Root Items
                    ...(domain.items || []).map(item => ({
                        key: `${domain.key}_${item.key}`,
                        label: item.label || item.key,
                        icon: item.icon,
                        type: (item.type === 'ACTION' ? 'ACTION' : 'ITEM') as any, // ⚡ Map ACTION type
                        description: item.description,
                        selectable: true,
                        data: { item, domainKey: domain.key },
                        // metadata for display
                        metadata: item.metadata
                    })),
                    // Sections (Folders)
                    ...(domain.sections || []).map(section => ({
                        key: `${domain.key}_SECTION_${section.id}`,
                        label: section.label || 'Section',
                        icon: section.icon,
                        type: 'FOLDER' as const,
                        color: token.colorText,
                        selectable: false,
                        children: (section.items || []).map(item => ({
                            key: `${domain.key}_${item.key}`,
                            label: item.label || item.key,
                            icon: item.icon,
                            type: (item.type === 'ACTION' ? 'ACTION' : 'ITEM') as any, // ⚡ Map ACTION type
                            description: item.description,
                            selectable: true,
                            data: { item, domainKey: domain.key },
                            metadata: item.metadata
                        }))
                    }))
                ]
            }))
        }));

        // Run Filter
        const filteredRoots = rawRoots
            .map(root => processNode(root, 'ROOT'))
            .filter(Boolean) as UniversalTreeNode[];

        return { normalizedNodes: filteredRoots, searchExpandedKeys: expanded };

    }, [clusters, searchTerm, token]);

    // 5. RECURSIVE RENDERER
    /**
     * @description Translates UniversalTreeNode objects into Ant Design DataNodes.
     */
    const renderTreeNodes = (nodes: UniversalTreeNode[]): DataNode[] => {
        return nodes.map(node => {
            // Determine styles based on type
            const isLeaf = node.type === 'ITEM' || node.type === 'ACTION';
            const iconColor = node.type === 'CLUSTER' ? token.colorTextHeading : 
                              node.type === 'DOMAIN' ? token.colorPrimary :
                              node.type === 'ACTION' ? token.colorSuccess : // ⚡ Green for Actions
                              token.colorTextSecondary;
            
            const titleNode = (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '2px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                        {/* Inline Icon */}
                        <span style={{ color: iconColor, display: 'flex', alignItems: 'center', fontSize: 14 }}>
                            <IconFactory icon={node.icon} />
                        </span>
                        
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <Text 
                                strong={node.type === 'CLUSTER' || node.type === 'DOMAIN' || node.type === 'ACTION'} 
                                style={{ 
                                    fontSize: 14, 
                                    color: node.type === 'ACTION' ? token.colorSuccess : (node.color || token.colorText),
                                    // ⚡ Italicize placeholders
                                    fontStyle: node.type === 'ACTION' ? 'italic' : 'normal'
                                }}
                            >
                                {node.label}
                            </Text>

                            {/* Metadata / Tech Key */}
                            {!isLeaf && node.key && (
                                <Text type="secondary" style={{ fontSize: 10, fontFamily: 'monospace' }}>
                                    {node.type === 'CLUSTER' ? '' : node.key.split('_').pop()}
                                </Text>
                            )}
                        </div>

                        {/* Leaf Details */}
                        {isLeaf && (
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                {(node as any).metadata?.technical_key && (
                                    <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>
                                        {(node as any).metadata.technical_key}
                                    </Text>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Side Tags */}
                    {isLeaf && (
                        <div style={{ display: 'flex', gap: 4 }}>
                            {(node as any).metadata?.target_entity && (
                                <Tag style={{ margin: 0, fontSize: 9 }}>
                                    {(node as any).metadata.target_entity}
                                </Tag>
                            )}
                             {/* Hide tag for Actions to keep it clean */}
                             {node.type !== 'ACTION' && (
                                <Tag style={{ margin: 0, fontSize: 9, border: 'none', background: token.colorFillAlter }}>
                                    {(node as any).metadata?.scope_type || (node.data?.item?.type)}
                                </Tag>
                             )}
                        </div>
                    )}
                </div>
            );

            return {
                key: node.key,
                title: titleNode,
                isLeaf: isLeaf,
                selectable: node.selectable,
                data: node.data,
                children: node.children ? renderTreeNodes(node.children) : undefined
            };
        });
    };

    if (!activeContext) {
        return (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Empty description="Select a Domain to view its Topology" />
            </div>
        );
    }

    const activeExpandedKeys = searchTerm ? searchExpandedKeys : topologyExpandedKeys;

    return (
        <div style={{ padding: '24px 40px', maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* HEADER */}
            <div style={{ marginBottom: 24, borderBottom: `1px solid ${token.colorSplit}`, paddingBottom: 16, flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <Title level={2} style={{ margin: 0 }}>
                            <IconFactory icon={activeContext.source.icon || activeContext.source.module_icon} style={{ marginRight: 12 }} />
                            {activeContext.label}
                        </Title>
                        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                            <Tag color="blue">{clusters?.length || 0} Modules</Tag>
                            <Tag>{activeContext.source.type || 'SYSTEM'}</Tag>
                        </div>
                    </div>
                    <Button 
                        type="text" 
                        icon={<ReloadOutlined spin={isLoading} />} 
                        onClick={() => {
                            logger.whisper("UI", "User requested manual topology refresh");
                            refresh();
                        }} 
                    />
                </div>

                <div style={{ marginTop: 24 }}>
                    <Input 
                        placeholder={`Search inside ${activeContext.label}...`} 
                        prefix={<SearchOutlined style={{ color: token.colorTextPlaceholder }} />}
                        allowClear
                        value={searchTerm}
                        onChange={e => {
                            logger.whisper("UI", `Topology Search updated: ${e.target.value}`);
                            setSearchTerm(e.target.value);
                        }}
                        style={{ maxWidth: 400 }}
                    />
                </div>
            </div>

            {/* TREE VIEW */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {normalizedNodes.length === 0 ? (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No modules matched your search" />
                ) : (
                    <DirectoryTree
                        multiple={false}
                        expandedKeys={activeExpandedKeys}
                        onExpand={(keys) => {
                            if (!searchTerm) {
                                logger.trace("UI", "Topology node expanded/collapsed");
                                setTopologyExpandedKeys(keys as React.Key[]);
                            }
                        }}
                        autoExpandParent={!!searchTerm}
                        showIcon={false} // Icons handled by renderer
                        treeData={renderTreeNodes(normalizedNodes)}
                        onSelect={(_, info) => {
                            logger.trace('TOPOLOGY', `🖱️ Tree Select: ${info.node.key}`, { selected: info.selected, isLeaf: info.node.isLeaf });
                            
                            if (info.node.isLeaf && (info.node as any).data) {
                                const { item, domainKey } = (info.node as any).data;
                                handleNavigate(item, domainKey);
                            }
                        }}
                        style={{ 
                            background: 'transparent',
                            fontSize: 14,
                            fontFamily: token.fontFamily
                        }}
                        expandAction="click"
                    />
                )}
            </div>
        </div>
    );
};

