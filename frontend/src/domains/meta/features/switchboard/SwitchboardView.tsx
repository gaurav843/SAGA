// 
// FILEPATH: frontend/src/domains/meta/features/switchboard/SwitchboardView.tsx
// @file: Switchboard Console (Manifest Driven)
// @role: 🎨 UI Presentation */
// @author: The Engineer
// @description: Dumb UI implementation. Renders strictly what the Backend Manifest dictates.
// @security-level: LEVEL 9 (Dumb UI) */

import React, { useMemo, useState } from 'react';
import { 
    Layout, Card, Button, Typography, Space, Popconfirm, theme, 
    Input, Table, Badge, Empty, Tag
} from 'antd';
import { 
    PlusOutlined, ReloadOutlined, AppstoreOutlined, SearchOutlined, DatabaseOutlined
} from '@ant-design/icons';

import { useMetaContext } from '../../_kernel/MetaContext'; 
import { useUrlState } from '../../../../platform/hooks/useUrlState'; 
import { FadeIn } from '../../../../platform/ui/animation/FadeIn'; 
import { IconFactory } from '../../../../platform/ui/icons/IconFactory';
import { useSwitchboard } from './hooks/useSwitchboard';
import { AssignmentModal } from './components/AssignmentModal';

const { Title, Text } = Typography;
const { Content } = Layout;

export const SwitchboardView: React.FC = () => {
    const { token } = theme.useToken();
    const { selectedItem, setSelectedItem } = useMetaContext();
    const [searchText, setSearchTerm] = useUrlState('q', '');

    const { 
        manifest,
        isLoading, 
        dispatchAction,
        availablePolicies,
        availableGroups,
        assignPolicy,
        isAssigning
    } = useSwitchboard();

    // Local loading state to show spinners on specific buttons during transit
    const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

    // ⚡ UNIVERSAL ACTION DISPATCHER
    const handleAction = async (actionKey: string, record: any) => {
        const rowId = record.id;
        const taskKey = `${actionKey}-${rowId}`;
        
        setLoadingIds(prev => new Set(prev).add(taskKey));
        try {
            await dispatchAction({ actionKey, payload: record });
        } finally {
            setLoadingIds(prev => {
                const next = new Set(prev);
                next.delete(taskKey);
                return next;
            });
        }
    };

    // Modal State
    const isAssignmentModalOpen = selectedItem === 'NEW';
    const setAssignmentModalOpen = (open: boolean) => setSelectedItem(open ? 'NEW' : null);

    // --- ⚡ MANIFEST COLUMN FACTORY ---
    const dynamicColumns = useMemo(() => {
        if (!manifest) return [];
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cols: any[] = manifest.columns.map(col => ({
            title: col.label,
            key: col.key,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            render: (_: unknown, record: any) => {
                const cellData = record[col.key];
                const opacity = record.is_active ? 1 : 0.5;

                // God Backend dictating rendering formats via Data Types
                if (col.data_type === 'SOURCE_TAG') {
                    return (
                        <Space style={{ opacity }}>
                            <IconFactory icon={cellData.icon} style={{ color: cellData.color || token.colorPrimary }} />
                            <Text strong>{cellData.label}</Text>
                            {cellData.version && <Tag bordered={false} style={{ fontSize: 10 }}>{cellData.version}</Tag>}
                        </Space>
                    );
                }
                if (col.data_type === 'SCOPE_TAG') {
                    return (
                        <Space style={{ opacity }}>
                            <IconFactory icon={cellData.icon} />
                            <span>{cellData.scope}</span>
                            {cellData.context && <Tag style={{ margin: 0 }}>{cellData.context}</Tag>}
                        </Space>
                    );
                }
                if (col.data_type === 'STATUS') {
                    return (
                        <Tag color={cellData === 'ACTIVE' ? 'success' : 'warning'}>
                            {cellData}
                        </Tag>
                    );
                }
                if (col.data_type === 'PRIORITY_TAG') {
                    return (
                        <div style={{ opacity }}>
                            <Tag color={cellData >= 100 ? 'gold' : cellData >= 50 ? 'orange' : 'blue'}>{cellData}</Tag>
                        </div>
                    );
                }
                return <span style={{ opacity }}>{String(cellData)}</span>;
            }
        }));

        // ⚡ ACTION BUTTON FACTORY (Driven by Manifest)
        cols.push({
            title: 'Action',
            key: 'action',
            align: 'right',
            width: 180,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            render: (_: unknown, record: any) => (
                <Space>
                    {manifest.actions.map(action => {
                        // Compute dynamic labels (e.g. Activate vs Deactivate) if needed,
                        // though strictly speaking the backend should compute this. We do a minor fallback here for UX.
                        let computedLabel = action.label;
                        let computedDanger = action.danger;
                        
                        if (action.key === 'TOGGLE_ACTIVE') {
                            computedLabel = record.is_active ? 'Deactivate' : 'Activate';
                            computedDanger = record.is_active;
                        }

                        const taskKey = `${action.key}-${record.id}`;
                        const btn = (
                            <Button 
                                type="text" 
                                size="small" 
                                danger={computedDanger}
                                icon={action.icon ? <IconFactory icon={action.icon} /> : undefined}
                                loading={loadingIds.has(taskKey)}
                                onClick={action.requires_confirmation ? undefined : () => handleAction(action.key, record)}
                            >
                                {computedLabel}
                            </Button>
                        );

                        if (action.requires_confirmation) {
                            return (
                                <Popconfirm
                                    key={action.key}
                                    title={action.confirmation_text}
                                    onConfirm={() => handleAction(action.key, record)}
                                    okButtonProps={{ loading: loadingIds.has(taskKey), danger: computedDanger }}
                                >
                                    {btn}
                                </Popconfirm>
                            );
                        }

                        return React.cloneElement(btn, { key: action.key });
                    })}
                </Space>
            )
        });

        return cols;
    }, [manifest, token, loadingIds]);

    // Group data by Domain 
    const groupedData = useMemo(() => {
        if (!manifest?.data) return [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const groups: Record<string, any[]> = {};
        manifest.data.forEach(row => {
            const d = row.domain;
            if (!groups[d]) groups[d] = [];
            groups[d].push(row);
        });
        return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
    }, [manifest]);

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
                            <Text type="secondary">System Event Wiring & Jurisdiction Enforcement.</Text>
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
                    ) : groupedData.length === 0 ? (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No active policies enforced." />
                    ) : (
                        <Space direction="vertical" style={{ width: '100%' }} size="large">
                            {groupedData.map(([domain, rows]) => (
                                <Card 
                                    key={domain}
                                    size="small"
                                    title={
                                        <Space>
                                            <DatabaseOutlined style={{ color: token.colorTextSecondary }} />
                                            <Text strong style={{ fontSize: 16 }}>{domain}</Text>
                                            <Badge count={rows.filter(r => r.is_active).length} style={{ backgroundColor: token.colorFillContent, color: token.colorText }} />
                                        </Space>
                                    }
                                    style={{ borderColor: token.colorBorderSecondary }}
                                    styles={{ body: { padding: 0 } }}
                                >
                                    <Table 
                                        dataSource={rows}
                                        columns={dynamicColumns}
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
