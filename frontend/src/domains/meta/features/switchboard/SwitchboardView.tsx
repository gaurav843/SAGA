// FILEPATH: frontend/src/domains/meta/features/switchboard/SwitchboardView.tsx
// @file: Switchboard Console (Deep Linked + Smooth)
// @author: The Engineer
// @description: The Main Control Panel for Governance.
// REFACTOR: Implemented 'useUrlState' for Search Persistence.
// REFACTOR: Uses Global MetaContext for Modal State (?select=NEW).
// VISUAL: Added <FadeIn> wrapper for standard transitions.


import React, { useState, useMemo } from 'react';
import { 
    Layout, Card, Button, Typography, Space, Popconfirm, theme, 
    Input, Table, Badge, Empty, Tag, Tooltip
} from 'antd';
import { 
    PlusOutlined, StopOutlined, DeleteOutlined,
    GlobalOutlined, AppstoreOutlined, ThunderboltOutlined, 
    SearchOutlined, RobotOutlined, FieldTimeOutlined,
    DatabaseOutlined, FileProtectOutlined, ReloadOutlined,
    CheckCircleOutlined, PauseCircleOutlined
} from '@ant-design/icons';

import { useMetaContext } from '../../_kernel/MetaContext'; // ⚡ GLOBAL STATE
import { useUrlState } from '../../../../platform/hooks/useUrlState'; // ⚡ UNIVERSAL STATE
import { FadeIn } from '../../../../platform/ui/animation/FadeIn'; // ⚡ ANIMATION
import { useSwitchboard } from './hooks/useSwitchboard';
import { AssignmentModal } from './components/AssignmentModal';
import type { PolicyBinding } from './types';

const { Title, Text } = Typography;
const { Content } = Layout;

export const SwitchboardView: React.FC = () => {
    const { token } = theme.useToken();

    // 1. GLOBAL CONTEXT (Deep Link for Modal)
    const { selectedItem, setSelectedItem } = useMetaContext();

    // 2. UNIVERSAL URL STATE (Search Persistence)
    const [searchText, setSearchTerm] = useUrlState('q', '');

    // 3. Data Hooks
    const { 
        activeBindings, 
        availablePolicies,
        availableGroups,
        isLoading, 
        assignPolicy, 
        removeAssignment, 
        isAssigning 
    } = useSwitchboard();

    // Local loading state for individual row actions
    const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());

    const handleUnbind = async (id: number) => {
        setLoadingIds(prev => new Set(prev).add(id));
        try {
            await removeAssignment(id);
        } finally {
            setLoadingIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    // --- MODAL STATE (Derived from Global) ---
    const isAssignmentModalOpen = selectedItem === 'NEW';
    const setAssignmentModalOpen = (open: boolean) => setSelectedItem(open ? 'NEW' : null);

    // --- GROUPING LOGIC ---
    const jurisdictions = useMemo(() => {
        const groups: Record<string, PolicyBinding[]> = {};
        
        const filtered = activeBindings.filter(b => 
            !searchText || 
            b.target_domain.toLowerCase().includes(searchText.toLowerCase()) ||
            b.policy?.name.toLowerCase().includes(searchText.toLowerCase()) ||
            b.group?.name.toLowerCase().includes(searchText.toLowerCase())
        );

        filtered.forEach(b => {
            if (!groups[b.target_domain]) groups[b.target_domain] = [];
            groups[b.target_domain].push(b);
        });

        // Sort: Active first, then by Priority
        Object.keys(groups).forEach(key => {
            groups[key].sort((a, b) => {
                if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
                return (b.priority - a.priority) || (b.id - a.id);
            });
        });

        return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
    }, [activeBindings, searchText]);

    // --- RENDER HELPERS ---
    const getScopeIcon = (scope: string) => {
        if (scope === 'GLOBAL') return <GlobalOutlined />;
        if (scope === 'JOB') return <RobotOutlined />;
        if (scope === 'TRANSITION') return <FieldTimeOutlined />;
        if (scope === 'PROCESS') return <ThunderboltOutlined />;
        return <AppstoreOutlined />;
    };

    const getColumns = (domain: string) => [
        {
            title: '#',
            key: 'sequence',
            width: 50,
            render: (_: any, record: PolicyBinding, index: number) => (
                <Text type="secondary" style={{ fontSize: 11, opacity: record.is_active ? 1 : 0.5 }}>{index + 1}</Text>
            )
        },
        {
            title: 'Policy Source',
            key: 'policy',
            render: (_: any, record: PolicyBinding) => {
                const opacity = record.is_active ? 1 : 0.5;
                if (record.policy) {
                    return (
                        <Space style={{ opacity }}>
                            <FileProtectOutlined style={{ color: token.colorPrimary }} />
                            <Text strong>{record.policy.name}</Text>
                            <Tag bordered={false} style={{ fontSize: 10 }}>v{record.policy.version_major}.{record.policy.version_minor}</Tag>
                        </Space>
                    );
                } else if (record.group) {
                    return (
                        <Space style={{ opacity }}>
                            <AppstoreOutlined style={{ color: token.colorSuccess }} />
                            <Text strong>{record.group.name}</Text>
                            <Tag color="cyan" style={{ fontSize: 10 }}>BUNDLE</Tag>
                        </Space>
                    );
                }
                return <Text type="secondary">Unknown Source</Text>;
            }
        },
        {
            title: 'Scope',
            key: 'scope',
            render: (_: any, record: PolicyBinding) => (
                <Space style={{ opacity: record.is_active ? 1 : 0.5 }}>
                    {getScopeIcon(record.target_scope)}
                    <span>{record.target_scope}</span>
                    {record.target_context && (
                        <Tag style={{ margin: 0 }}>{record.target_context}</Tag>
                    )}
                </Space>
            )
        },
        {
            title: 'Status',
            key: 'status',
            width: 100,
            render: (_: any, record: PolicyBinding) => (
                record.is_active ? (
                    <Tag icon={<CheckCircleOutlined />} color="success">Active</Tag>
                ) : (
                    <Tag icon={<PauseCircleOutlined />} color="warning">Inactive</Tag>
                )
            )
        },
        {
            title: 'Priority',
            dataIndex: 'priority',
            key: 'priority',
            width: 80,
            render: (p: number, record: PolicyBinding) => (
                <div style={{ opacity: record.is_active ? 1 : 0.5 }}>
                    <Tag color={p >= 100 ? 'gold' : p >= 50 ? 'orange' : 'blue'}>{p}</Tag>
                </div>
            )
        },
        {
            title: 'Action',
            key: 'action',
            align: 'right' as const,
            width: 120,
            render: (_: any, record: PolicyBinding) => {
                if (record.is_active) {
                    // STEP 1: DEACTIVATE
                    return (
                        <Popconfirm
                            title="Deactivate Enforcement?"
                            description="This policy will stop applying, but the binding remains."
                            onConfirm={() => handleUnbind(record.id)}
                            okButtonProps={{ loading: loadingIds.has(record.id) }}
                            okText="Deactivate"
                        >
                            <Button 
                                type="text" 
                                size="small" 
                                style={{ color: token.colorWarning }}
                                icon={<StopOutlined />}
                                loading={loadingIds.has(record.id)}
                            >
                                Deactivate
                            </Button>
                        </Popconfirm>
                    );
                } else {
                    // STEP 2: REMOVE
                    return (
                        <Popconfirm
                            title="Remove Permanently?"
                            description="This binding configuration will be deleted."
                            onConfirm={() => handleUnbind(record.id)}
                            okButtonProps={{ loading: loadingIds.has(record.id), danger: true }}
                            okText="Remove"
                        >
                            <Button 
                                type="text" 
                                danger 
                                size="small" 
                                icon={<DeleteOutlined />}
                                loading={loadingIds.has(record.id)}
                            >
                                Remove
                            </Button>
                        </Popconfirm>
                    );
                }
            }
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
                                    <AppstoreOutlined style={{ color: token.colorPrimary }} />
                                    Switchboard
                                </Space>
                            </Title>
                            <Text type="secondary">Manage Active Jurisdictions.</Text>
                        </div>
                        <Space>
                            <Button icon={<ReloadOutlined />} onClick={() => window.location.reload()} />
                            <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setAssignmentModalOpen(true)}>
                                Enforce Policy
                            </Button>
                        </Space>
                    </div>
                    
                    <div style={{ background: token.colorBgContainer, padding: 12, borderRadius: 8 }}>
                        <Input 
                            prefix={<SearchOutlined style={{ color: '#ccc' }} />} 
                            placeholder="Search jurisdictions..." 
                            style={{ width: '100%' }}
                            value={searchText}
                            onChange={e => setSearchTerm(e.target.value)}
                            allowClear
                        />
                    </div>
                </div>

                {/* CONTENT AREA */}
                <Content style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>
                    {isLoading ? (
                        <Card loading />
                    ) : jurisdictions.length === 0 ? (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No active policies enforced." />
                    ) : (
                        <Space direction="vertical" style={{ width: '100%' }} size="large">
                            {jurisdictions.map(([domain, bindings]) => (
                                <Card 
                                    key={domain}
                                    size="small"
                                    title={
                                        <Space>
                                            <DatabaseOutlined style={{ color: token.colorTextSecondary }} />
                                            <Text strong style={{ fontSize: 16 }}>{domain}</Text>
                                            <Badge count={bindings.filter(b => b.is_active).length} style={{ backgroundColor: token.colorFillContent, color: token.colorText }} />
                                        </Space>
                                    }
                                    style={{ borderColor: token.colorBorderSecondary }}
                                    styles={{ body: { padding: 0 } }}
                                >
                                    <Table 
                                        dataSource={bindings}
                                        columns={getColumns(domain)}
                                        rowKey="id"
                                        pagination={false} 
                                        size="small"
                                    />
                                </Card>
                            ))}
                        </Space>
                    )}
                </Content>

                <AssignmentModal 
                    open={isAssignmentModalOpen} 
                    onClose={() => setAssignmentModalOpen(false)}
                    onAssign={assignPolicy}
                    policies={availablePolicies}
                    groups={availableGroups}
                    loading={isAssigning}
                />
            </Layout>
        </FadeIn>
    );
};

