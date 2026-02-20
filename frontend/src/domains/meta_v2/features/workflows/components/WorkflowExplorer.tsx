// FILEPATH: frontend/src/domains/meta_v2/features/workflows/components/WorkflowExplorer.tsx
// @file: Workflow Explorer (The Lobby)
// @role: 🎨 UI Presentation / 🧠 Logic Container */
// @author: The Engineer
// @description: Renders a filterable gallery of workflows. Now strictly uses V2 imports.
// @security-level: LEVEL 9 (UI Safe) */

import React, { useMemo, useEffect } from 'react';
import { Typography, theme, Button, Space, Spin, Empty, Tag, Segmented } from 'antd';
import { PlusOutlined, PartitionOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import { logger } from '@/platform/logging/Narrator';
import { useUrlState } from '@/platform/hooks/useUrlState';

// ⚡ LOCAL V2 IMPORTS (Cord Severed completely)
import { useWorkflows } from '../hooks/useWorkflows';
import { WorkflowGenesis } from './WorkflowGenesis'; 
import { useKernel } from '../../../_kernel/KernelContext';

const { Title, Text } = Typography;

interface WorkflowExplorerProps {
    domain: string;
}

export const WorkflowExplorer: React.FC<WorkflowExplorerProps> = ({ domain }) => {
    const { token } = theme.useToken();
    const navigate = useNavigate();

    // ⚡ CONTEXT
    const { activeContext } = useKernel();

    // ⚡ DEEP LINKING BY DEFAULT
    const [filterType, setFilterType] = useUrlState('type', 'ALL');
    const [modalState, setModalState] = useUrlState('action', '');

    // ⚡ DATA FETCH
    const { workflows, isLoading, refreshWorkflows } = useWorkflows(domain);

    useEffect(() => {
        logger.whisper("WORKFLOWS", `Entering Workflow Lobby for Domain: ${domain}`);
    }, [domain]);

    // ⚡ LOGIC: Filter Workflows
    const visibleWorkflows = useMemo(() => {
        if (!workflows) return [];
        if (filterType === 'ALL') return workflows;
        
        const filtered = workflows.filter((w: any) => w.type === filterType);
        logger.trace("WORKFLOWS", "Filtered workflow list", { type: filterType, count: filtered.length });
        return filtered;
    }, [workflows, filterType]);

    // ⚡ HANDLERS
    const handleSelectWorkflow = (scope: string) => {
        logger.tell("WORKFLOWS", `👉 Selected Workflow Scope: ${scope}`);
        navigate(`/meta-v2/workflows/${domain}/${scope}?domain=${domain}`);
    };

    const handleCreateSuccess = (key: string) => {
        logger.tell("WORKFLOWS", `✅ Workflow created successfully: ${key}`);
        setModalState('');
        if (refreshWorkflows) refreshWorkflows();
        navigate(`/meta-v2/workflows/${domain}/${key}?domain=${domain}`);
    };

    // ⚡ SAFE RETURN: Loading State
    if (isLoading) {
        return (
            <div style={{ padding: 48, textAlign: 'center' }}>
                <Spin size="large" />
                <div style={{ marginTop: 16, color: token.colorTextSecondary }}>
                    Loading Domain Workflows...
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            {/* TOOLBAR */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Space direction="vertical" size={0}>
                    <Title level={3} style={{ margin: 0 }}>Process Definitions</Title>
                    <Text type="secondary">Manage the logic, forms, and jobs for {domain}.</Text>
                </Space>
                <Space>
                    <Segmented 
                        value={filterType}
                        onChange={(val) => {
                            logger.whisper("UI", `Switched workflow filter to ${val}`);
                            setFilterType(val);
                        }}
                        options={[
                            { label: 'All', value: 'ALL' },
                            { label: 'Wizards', value: 'WIZARD' },
                            { label: 'Jobs', value: 'JOB' },
                            { label: 'Rules', value: 'GOVERNANCE' }
                        ]}
                    />
                    <Button 
                        type="primary" 
                        icon={<PlusOutlined />} 
                        onClick={() => {
                            logger.tell("UI", "Intent: Create new workflow");
                            setModalState('create');
                        }}
                    >
                        Create Workflow
                    </Button>
                </Space>
            </div>
            
            {/* GALLERY GRID */}
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {visibleWorkflows.map((w: any) => (
                    <div 
                        key={w.scope_key || w.scope}
                        onClick={() => handleSelectWorkflow(w.scope_key || w.scope)}
                        style={{ 
                            padding: 16, 
                            background: token.colorBgContainer, 
                            border: `1px solid ${token.colorBorderSecondary}`,
                            borderRadius: 8,
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.2s',
                            boxShadow: token.boxShadowSmall
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = token.colorPrimary;
                            e.currentTarget.style.boxShadow = token.boxShadowSecondary;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = token.colorBorderSecondary;
                            e.currentTarget.style.boxShadow = token.boxShadowSmall;
                        }}
                    >
                        <Space>
                            <div style={{ 
                                width: 40, height: 40, 
                                background: token.colorPrimaryBg, 
                                color: token.colorPrimary,
                                borderRadius: 8,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 20
                            }}>
                                <PartitionOutlined />
                            </div>
                            <div>
                                <Text strong style={{ fontSize: 16 }}>{w.name || w.label}</Text>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12, fontFamily: 'monospace' }}>
                                        {w.scope_key || w.scope}
                                    </Text>
                                </div>
                            </div>
                        </Space>
                        <Space>
                            <Tag color="purple">{w.type}</Tag>
                            <Tag color="blue">v{w.version}</Tag>
                        </Space>
                    </div>
                ))}

                {visibleWorkflows.length === 0 && (
                    <Empty 
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={`No ${filterType === 'ALL' ? '' : filterType} workflows found for this Domain.`} 
                    />
                )}
            </Space>

            {/* ⚡ MODAL INJECTION (V2 Native) */}
            <WorkflowGenesis 
                open={modalState === 'create'} 
                onClose={() => {
                    logger.whisper("UI", "Cancelled workflow creation");
                    setModalState('');
                }}
                domain={domain} // Passed as pure string now, Genesis handles it natively
                onSuccess={handleCreateSuccess}
            />
        </div>
    );
};

