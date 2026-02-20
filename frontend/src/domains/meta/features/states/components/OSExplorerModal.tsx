/* FILEPATH: frontend/src/domains/meta/features/states/components/OSExplorerModal.tsx */
/* @file OS Explorer (The Global Data Map) */
/* @author The Engineer */
/* @description A high-fidelity "File Picker" for the Operating System.
 * UPDATED: Replaced broken relative import with '@kernel' alias.
 */

import React, { useState, useMemo } from 'react';
import { Modal, Input, Tree, Tabs, Empty, Typography, theme, Tag, Space } from 'antd';
import { 
    SearchOutlined, 
    GlobalOutlined, 
    PartitionOutlined,
    NumberOutlined,
    CalendarOutlined,
    SelectOutlined
} from '@ant-design/icons';

// ⚡ FIX: Using Absolute Alias to resolve build error
import { useCapabilities } from '@kernel/CapabilitiesContext';

const { Text } = Typography;
const { DirectoryTree } = Tree;

interface OSExplorerModalProps {
    open: boolean;
    onCancel: () => void;
    onSelect: (referencePath: string) => void;
    mode?: 'FIELD' | 'SCOPE' | 'DOMAIN';
}

export const OSExplorerModal: React.FC<OSExplorerModalProps> = ({ 
    open, onCancel, onSelect, mode = 'FIELD' 
}) => {
    const { token } = theme.useToken();
    const { registry } = useCapabilities(); 
    // Safe access
    const domains = registry?.domains || [];

    const [searchText, setSearchText] = useState('');
    const [activeTab, setActiveTab] = useState('DOMAINS');

    // ⚡ DATA TRANSFORMATION: Registry -> AntD Tree Data
    const treeData = useMemo(() => {
        if (!domains) return [];

        return domains.map(domain => {
            const domainNode = {
                title: <Text strong>{domain.label}</Text>,
                key: domain.key,
                icon: <PartitionOutlined style={{ color: token.colorWarning }} />,
                children: domain.scopes?.map(scope => {
                    // Mock fields for visual feedback
                    const children = (scope.type === 'GOVERNANCE' || scope.type === 'WIZARD') ? [
                        { title: 'id', key: `${domain.key}.${scope.key}.id`, isLeaf: true, icon: <NumberOutlined /> },
                        { title: 'status', key: `${domain.key}.${scope.key}.status`, isLeaf: true, icon: <SelectOutlined /> },
                        { title: 'created_at', key: `${domain.key}.${scope.key}.created_at`, isLeaf: true, icon: <CalendarOutlined /> }
                    ] : [];

                    return {
                        title: scope.label,
                        key: `${domain.key}.${scope.key}`,
                        icon: <GlobalOutlined style={{ color: token.colorTextSecondary }} />,
                        children: children,
                        isLeaf: children.length === 0
                    };
                }) || []
            };
            return domainNode;
        });
    }, [domains, token]);

    // ⚡ FILTER LOGIC
    const filteredTreeData = useMemo(() => {
        if (!searchText) return treeData;
        const lowerSearch = searchText.toLowerCase();
        
        const filterNodes = (nodes: any[]): any[] => {
            return nodes.map(node => {
                const match = node.title.props?.children?.toLowerCase().includes(lowerSearch) || 
                              (typeof node.title === 'string' && node.title.toLowerCase().includes(lowerSearch));
                const children = node.children ? filterNodes(node.children) : [];
                if (match || children.length > 0) {
                    return { ...node, children, expanded: true };
                }
                return null;
            }).filter(Boolean);
        };

        return filterNodes(treeData);
    }, [treeData, searchText]);

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            footer={null}
            title={<Space><GlobalOutlined style={{ color: token.colorPrimary }} /> OS Explorer</Space>}
            width={600}
            styles={{ body: { padding: 0 } }}
        >
            <div style={{ padding: 16, borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
                <Input 
                    placeholder="Search global schema..." 
                    prefix={<SearchOutlined style={{ color: token.colorTextDisabled }} />} 
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    allowClear
                />
            </div>

            <div style={{ display: 'flex', height: 400 }}>
                {/* SIDEBAR TABS */}
                <div style={{ width: 140, borderRight: `1px solid ${token.colorBorderSecondary}`, background: token.colorFillAlter }}>
                    <Tabs 
                        activeKey={activeTab} 
                        onChange={setActiveTab}
                        tabPosition="left"
                        items={[
                            { key: 'DOMAINS', label: 'Domains' },
                            { key: 'SYSTEM', label: 'System' },
                            { key: 'CONSTANTS', label: 'Constants' }
                        ]}
                        style={{ height: '100%' }}
                    />
                </div>

                {/* MAIN TREE VIEW */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
                    {activeTab === 'DOMAINS' ? (
                        filteredTreeData.length > 0 ? (
                            <DirectoryTree
                                treeData={filteredTreeData}
                                onSelect={(keys, info) => {
                                    if (info.node.isLeaf) {
                                        const path = keys[0] as string;
                                        onSelect(`Ref(${path})`);
                                    }
                                }}
                                showIcon
                                defaultExpandAll={!!searchText}
                            />
                        ) : (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No matching data found" />
                        )
                    ) : (
                        <div style={{ padding: 20, textAlign: 'center', opacity: 0.5 }}>
                            <Empty description="System Variables coming in Level 8" />
                        </div>
                    )}
                </div>
            </div>
            
            <div style={{ padding: '8px 16px', background: token.colorFillQuaternary, borderTop: `1px solid ${token.colorBorderSecondary}`, fontSize: 11, color: token.colorTextSecondary }}>
                <Space>
                    <Tag color="blue">Ref(...)</Tag>
                    <span>Use References to bind data across domains dynamically.</span>
                </Space>
            </div>
        </Modal>
    );
};

