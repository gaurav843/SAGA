// FILEPATH: frontend/src/domains/meta/features/policy_groups/PolicyGroupsView.tsx
// @file: Policy Groups Dashboard (Deep Linked + Smooth)
// @author: The Engineer
// @description: Main view for managing Policy Bundles (Groups).
// REFACTOR: Implemented 'useUrlState' for View Mode and Search Persistence.
// VISUAL: Added <FadeIn> wrapper for standard transitions.


import React, { useMemo } from 'react';
import { 
    Layout, Card, Button, Typography, Row, Col, Tag, 
    Empty, Space, Popconfirm, theme, Tooltip, Segmented, Input, Table 
} from 'antd';
import { 
    PlusOutlined, EditOutlined, DeleteOutlined, 
    SolutionOutlined, CheckCircleOutlined, StopOutlined,
    AppstoreOutlined, BarsOutlined, SearchOutlined
} from '@ant-design/icons';

import { useMetaContext } from '../../_kernel/MetaContext'; // ⚡ GLOBAL STATE (Editor)
import { useUrlState } from '../../../../platform/hooks/useUrlState'; // ⚡ UNIVERSAL STATE (View/Search)
import { FadeIn } from '../../../../platform/ui/animation/FadeIn'; // ⚡ ANIMATION
import { usePolicyGroups } from './hooks/usePolicyGroups';
import { GroupEditor } from './components/GroupEditor';
import { useSwitchboard } from '../switchboard/hooks/useSwitchboard';
import type { PolicyGroup } from './types';

const { Title, Text, Paragraph } = Typography;
const { Content } = Layout;

export const PolicyGroupsView: React.FC = () => {
    const { token } = theme.useToken();

    // 1. GLOBAL CONTEXT (Editor State via ?select=...)
    const { selectedItem, setSelectedItem } = useMetaContext();

    // 2. UNIVERSAL URL STATE (View State)
    const [viewMode, setViewMode] = useUrlState<'Grid' | 'List'>('view', 'List');
    const [searchText, setSearchText] = useUrlState('q', '');

    // 3. Data
    const { 
        groups, 
        isLoading, 
        createGroup, 
        updateGroup, 
        deleteGroup, 
        isMutating 
    } = usePolicyGroups();

    const { availablePolicies } = useSwitchboard();

    // 4. Computed (Filter)
    const filteredGroups = useMemo(() => {
        if (!searchText) return groups;
        const lower = searchText.toLowerCase();
        return groups.filter(g => 
            g.name.toLowerCase().includes(lower) || 
            g.key.toLowerCase().includes(lower)
        );
    }, [groups, searchText]);

    // --- COMPUTED EDITOR STATE ---
    const isEditorOpen = !!selectedItem;
    const editingGroup = useMemo(() => {
        if (selectedItem === 'NEW') return null;
        return groups.find(g => String(g.id) === selectedItem) || null;
    }, [groups, selectedItem]);

    // --- ACTIONS ---
    const handleCreate = () => setSelectedItem('NEW');
    const handleEdit = (group: PolicyGroup) => setSelectedItem(String(group.id));
    
    const handleCloseEditor = () => setSelectedItem(null);

    const handleSave = async (payload: any) => {
        if (editingGroup) {
            await updateGroup({ id: editingGroup.id, data: payload });
        } else {
            await createGroup(payload);
        }
        handleCloseEditor();
    };

    // --- TABLE COLUMNS ---
    const columns = [
        {
            title: 'Bundle Name',
            key: 'name',
            render: (_: any, r: PolicyGroup) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{r.name}</Text>
                    <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>{r.key}</Text>
                </Space>
            )
        },
        {
            title: 'Execution Sequence',
            key: 'policies',
            render: (_: any, r: PolicyGroup) => (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {r.policy_keys.map((key, idx) => (
                        <Tag key={`${r.id}-${key}`} color="blue">
                             <span style={{ marginRight: 4, opacity: 0.6 }}>#{idx + 1}</span>
                            {key}
                        </Tag>
                    ))}
                </div>
            )
        },
        {
            title: 'Status',
            key: 'status',
            width: 100,
            render: (_: any, r: PolicyGroup) => (
                r.is_active 
                    ? <Tag color="success" icon={<CheckCircleOutlined />}>Active</Tag> 
                    : <Tag color="error" icon={<StopOutlined />}>Inactive</Tag>
            )
        },
        {
            title: 'Action',
            key: 'action',
            align: 'right' as const,
            render: (_: any, r: PolicyGroup) => (
                <Space>
                    <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)} />
                    <Popconfirm 
                        title="Delete Group?" 
                        onConfirm={() => deleteGroup(r.id)}
                        okButtonProps={{ loading: isMutating }}
                    >
                        <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <FadeIn>
            <Layout style={{ background: 'transparent', height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* HEADER */}
                <div style={{ marginBottom: 24, padding: '0 24px', paddingTop: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div>
                            <Title level={2} style={{ margin: 0 }}>
                                <Space>
                                    <SolutionOutlined style={{ color: token.colorPrimary }} />
                                    Policy Groups
                                </Space>
                            </Title>
                            <Text type="secondary">Bundle logic rules into ordered execution kits.</Text>
                        </div>
                        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleCreate}>
                            Create Group
                        </Button>
                    </div>
                    
                    {/* TOOLBAR */}
                    <div style={{ display: 'flex', gap: 16, background: token.colorBgContainer, padding: 12, borderRadius: 8 }}>
                        <Input 
                            prefix={<SearchOutlined style={{ color: token.colorTextDisabled }} />} 
                            placeholder="Search groups..." 
                            style={{ flex: 1 }}
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            allowClear
                        />
                        <Segmented
                            options={[
                                { value: 'Grid', icon: <AppstoreOutlined /> },
                                { value: 'List', icon: <BarsOutlined /> },
                            ]}
                            value={viewMode}
                            onChange={val => setViewMode(val as 'Grid' | 'List')}
                        />
                    </div>
                </div>

                {/* CONTENT */}
                <Content style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>
                    {isLoading ? (
                        <Card loading />
                    ) : filteredGroups.length === 0 ? (
                        <Empty 
                            image={Empty.PRESENTED_IMAGE_SIMPLE} 
                            description={searchText ? "No matches found." : "No Policy Groups defined."} 
                        />
                    ) : viewMode === 'List' ? (
                        <Card styles={{ body: { padding: 0 } }}>
                            <Table 
                                dataSource={filteredGroups} 
                                columns={columns} 
                                rowKey="id" 
                                pagination={false} 
                                size="small"
                            />
                        </Card>
                    ) : (
                        <Row gutter={[16, 16]}>
                            {filteredGroups.map(group => (
                                <Col xs={24} sm={12} lg={8} xl={6} key={group.id}>
                                    <Card
                                        hoverable
                                        style={{ 
                                            height: '100%', 
                                            display: 'flex', 
                                            flexDirection: 'column',
                                            borderColor: group.is_active ? token.colorBorderSecondary : token.colorErrorBorder,
                                            opacity: group.is_active ? 1 : 0.6
                                        }}
                                        styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }}
                                        actions={[
                                            <Tooltip title="Edit Bundle">
                                                <EditOutlined key="edit" onClick={() => handleEdit(group)} />
                                            </Tooltip>,
                                            <Popconfirm
                                                title="Deactivate Group?"
                                                onConfirm={() => deleteGroup(group.id)}
                                                okButtonProps={{ loading: isMutating }}
                                            >
                                                <DeleteOutlined key="delete" style={{ color: token.colorError }} />
                                            </Popconfirm>
                                        ]}
                                    >
                                        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                            <Space direction="vertical" size={0}>
                                                <Text strong style={{ fontSize: 16 }}>{group.name}</Text>
                                                <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>{group.key}</Text>
                                            </Space>
                                            {group.is_active ? (
                                                <Tag color="success" icon={<CheckCircleOutlined />} />
                                            ) : (
                                                <Tag color="error" icon={<StopOutlined />} />
                                            )}
                                        </div>

                                        <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ fontSize: 13, marginBottom: 16 }}>
                                            {group.description || "No description provided."}
                                        </Paragraph>

                                        <div style={{ marginTop: 'auto', background: token.colorFillAlter, padding: 8, borderRadius: 6 }}>
                                            <Text type="secondary" style={{ fontSize: 10, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
                                                Execution Sequence ({group.policy_keys.length})
                                            </Text>
                                            {/* SEQUENTIAL LIST */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                {group.policy_keys.slice(0, 4).map((key, idx) => (
                                                    <div key={key} style={{ display: 'flex', alignItems: 'center', fontSize: 11 }}>
                                                        <div style={{ 
                                                            width: 16, height: 16, borderRadius: '50%', 
                                                            background: token.colorFillContent, color: token.colorTextSecondary,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            marginRight: 6, fontSize: 9, fontWeight: 'bold'
                                                        }}>
                                                            {idx + 1}
                                                        </div>
                                                        <Text ellipsis style={{ flex: 1 }}>{key}</Text>
                                                    </div>
                                                ))}
                                                {group.policy_keys.length > 4 && (
                                                    <Text type="secondary" style={{ fontSize: 10, paddingLeft: 22 }}>
                                                        +{group.policy_keys.length - 4} more...
                                                    </Text>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    )}
                </Content>

                <GroupEditor
                    open={isEditorOpen}
                    onClose={handleCloseEditor}
                    availablePolicies={availablePolicies}
                    initialValues={editingGroup || undefined}
                    onSave={handleSave}
                    isSaving={isMutating}
                />
            </Layout>
        </FadeIn>
    );
};

