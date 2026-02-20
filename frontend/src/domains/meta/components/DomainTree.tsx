// FILEPATH: frontend/src/domains/meta/components/DomainTree.tsx
// @file: Domain Tree (Recursive Topology)
// @role: 🎨 UI Presentation */
// @author: The Engineer
// @description: A hierarchical visual grid to select Domains. Supports nesting (Parent -> Child).
// @security-level: LEVEL 9 (Read-Only) */

import React, { useMemo } from 'react';
import { Typography, theme, Empty, Button, Badge, Space } from 'antd';
import { 
    RightOutlined, 
    AppstoreOutlined,
    LinkOutlined
} from '@ant-design/icons';

import { IconFactory } from '../../../platform/ui/icons/IconFactory';
import { logger } from '../../../platform/logging';
import { DomainSummary } from '../types';

const { Text, Title, Paragraph } = Typography;

interface DomainTreeProps {
    domains: DomainSummary[];
    onSelect: (domainKey: string) => void;
    isLoading?: boolean;
}

// ⚡ HELPER: Tree Node Structure
interface DomainNode extends DomainSummary {
    children: DomainNode[];
}

export const DomainTree: React.FC<DomainTreeProps> = ({ domains, onSelect, isLoading }) => {
    const { token } = theme.useToken();

    // ⚡ TOPOLOGY ENGINE: Build the Tree
    const domainTree = useMemo(() => {
        const map = new Map<string, DomainNode>();
        const roots: DomainNode[] = [];

        // 1. Initialize Nodes
        domains.forEach(d => {
            map.set(d.key, { ...d, children: [] });
        });

        // 2. Link Parents & Children
        domains.forEach(d => {
            const node = map.get(d.key)!;
            // If parent exists in the map, link it. Otherwise, treat as root.
            if (d.parent_domain && map.has(d.parent_domain)) {
                map.get(d.parent_domain)!.children.push(node);
            } else {
                roots.push(node);
            }
        });

        // 3. Sort by Module then Label
        return roots.sort((a, b) => a.system_module.localeCompare(b.system_module) || a.label.localeCompare(b.label));
    }, [domains]);

    const handleSelect = (domain: DomainSummary) => {
        logger.tell("UI", `📂 Selected Domain: ${domain.label} (${domain.key})`);
        onSelect(domain.key);
    };

    // ⚡ RENDERER: Recursive Node
    const renderNode = (node: DomainNode, level: number = 0) => {
        const isRoot = level === 0;
        const hasChildren = node.children.length > 0;
        const isSystem = node.system_module === 'SYSTEM';

        // Card Style
        const cardStyle: React.CSSProperties = {
            cursor: 'pointer',
            borderColor: isSystem ? token.colorWarningBorder : token.colorBorderSecondary,
            background: isRoot ? token.colorBgContainer : token.colorBgLayout, // Subtle contrast for children
            marginLeft: level * 24, // Indent Children
            marginBottom: 8,
            transition: 'all 0.2s',
            position: 'relative',
        };

        const content = (
            <div 
                onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(node);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px' }}
            >
                {/* ICON */}
                <div style={{
                    width: 40, height: 40, borderRadius: 8,
                    background: isSystem ? token.colorWarningBg : token.colorPrimaryBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isSystem ? token.colorWarningText : token.colorPrimaryText,
                    fontSize: 20
                }}>
                    <IconFactory icon={node.icon || node.module_icon} />
                </div>

                {/* TEXT */}
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text strong style={{ fontSize: 15 }}>{node.label}</Text>
                        {isSystem && <Badge status="warning" text="System" />}
                        {node.type === 'CONFIG' && <Badge color="purple" text="Config" />}
                        {node.parent_domain && <Badge count={<LinkOutlined />} style={{ backgroundColor: token.colorInfo }} />}
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {node.description || `Schema definition for ${node.key}`}
                    </Text>
                </div>

                {/* ACTION */}
                <Button type="text" icon={<RightOutlined />} size="small" />
            </div>
        );

        return (
            <div key={node.key}>
                {/* ⚡ HIERARCHY VISUALIZER: Connectors for children */}
                {level > 0 && (
                    <div style={{
                        position: 'absolute',
                        left: (level * 24) - 12,
                        top: -14,
                        bottom: 24,
                        width: 2,
                        background: token.colorBorderSecondary,
                        borderBottomLeftRadius: 4
                    }} />
                )}
                
                <div 
                    className="domain-card-hover"
                    style={{ 
                        ...cardStyle, 
                        border: `1px solid ${token.colorBorderSecondary}`, 
                        borderRadius: token.borderRadiusLG 
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = token.colorPrimary}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = isSystem ? token.colorWarningBorder : token.colorBorderSecondary}
                >
                    {content}
                </div>

                {/* RECURSION */}
                {hasChildren && (
                    <div style={{ position: 'relative' }}>
                        {node.children.map(child => renderNode(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    if (domains.length === 0 && !isLoading) {
        return <Empty description="No Domains Registered" />;
    }

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', paddingBottom: 48 }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <Title level={2}>Data Dictionary</Title>
                <Paragraph type="secondary">
                    Select a Domain to inspect its Schema, Attributes, and Relationships.
                </Paragraph>
            </div>

            <Space direction="vertical" style={{ width: '100%' }} size={4}>
                {domainTree.map(root => renderNode(root))}
            </Space>
        </div>
    );
};

