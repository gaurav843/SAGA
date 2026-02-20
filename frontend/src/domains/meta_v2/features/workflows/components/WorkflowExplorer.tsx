// FILEPATH: frontend/src/domains/meta_v2/features/workflows/components/WorkflowExplorer.tsx
// @file: Workflow Explorer (The Lobby)
// @role: 🎨 UI Presentation / 🧠 Logic Container */
// @author: The Engineer
// @description: Renders a filterable gallery of workflows. Hides non-graph scopes (JOB/VIEW).
// @security-level: LEVEL 9 (UI Safe) */
// @invariant: MUST filter out 'JOB' and 'VIEW' scopes as they lack XState engines. */
// @narrator: Emits traces for all list calculations and segment filters. */

import React, { useMemo, useEffect } from 'react';
import { Typography, theme, Button, Space, Spin, Empty, Tag, Segmented } from 'antd';
import { PlusOutlined, PartitionOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import { logger } from '@/platform/logging/Narrator';
import { useUrlState } from '@/platform/hooks/useUrlState';

// ⚡ LOCAL V2 IMPORTS
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
        logger.whisper("WORKFLOW_EXPLORER", `Entering Workflow Lobby for Domain: ${domain}`);
    }, [domain]);

    // ⚡ LOGIC: Robust Union & Strict Filter
    const visibleWorkflows = useMemo(() => {
        logger.trace("WORKFLOW_EXPLORER", "Recalculating visible workflows engine compatibility...");
        
        const scopeMap = new Map();

        // 1. Gather allowed code-first scopes (STRICTLY filter out JOB and VIEW)
        const baseScopes = (activeContext?.scopes || []).filter((s: any) => 
            ['WIZARD', 'GOVERNANCE', 'SUB_FLOW'].includes(s.type)
        );
        
        baseScopes.forEach((s: any) => scopeMap.set(s.key, { 
            ...s, 
            scope_key: s.key, 
            is_code_first: true,
            is_instantiated: false 
        }));

        // 2. Add/Merge db-first workflows
        (workflows || []).forEach((w: any) => {
            const key = w.scope_key || w.scope;
            // 🛡️ Safety: Only union if it's an allowed state machine type
            if (['WIZARD', 'GOVERNANCE', 'SUB_FLOW'].includes(w.type)) {
                if (scopeMap.has(key)) {
                    scopeMap.set(key, { ...scopeMap.get(key), ...w, scope_key: key, is_instantiated: true });
                } else {
                    scopeMap.set(key, { ...w, scope_key: key, is_instantiated: true, is_code_first: false });
                }
            }
        });

        // 3. Convert to array and apply user's UI filter
        const result = Array.from(scopeMap.values()).filter(w => filterType === 'ALL' || w.type === filterType);
        
        logger.trace("WORKFLOW_EXPLORER", `Gallery compiled with ${result.length} compatible items`, { filter: filterType });
        return result;
    }, [activeContext?.scopes, workflows, filterType]);

    // ⚡ HANDLERS
    const handleSelectWorkflow = (scope: string) => {
        logger.tell("WORKFLOW_EXPLORER", `👉 Navigating to Workflow Editor for Scope: ${scope}`);
        navigate(`/meta-v2/workflows/${domain}/${scope}?domain=${domain}`);
    };

    const handleCreateSuccess = (key: string) => {
        logger.tell("WORKFLOW_EXPLORER", `✅ Workflow created successfully: ${key}`);
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
                    Synchronizing Domain Workflows...
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
                    <Text type="secondary">Manage the logic and forms for {domain}.</Text>
                </Space>
                <Space>
                    <Segmented 
                        value={filterType}
                        onChange={(val) => {
                            logger.trace("WORKFLOW_EXPLORER", `User changed filter segment to ${val}`);
                            setFilterType(val);
                        }}
                        options={[
                            { label: 'All', value: 'ALL' },
                            { label: 'Wizards', value: 'WIZARD' },
                            { label: 'Rules', value: 'GOVERNANCE' }
                        ]}
                    />
                    <Button 
                        type="primary" 
                        icon={<PlusOutlined />} 
                        onClick={() => {
                            logger.trace("WORKFLOW_EXPLORER", "User invoked Workflow Creation Modal");
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
                                    {!w.is_instantiated && (
                                        <Tag color="default" style={{ marginLeft: 8, fontSize: 10 }}>Requires Initialization</Tag>
                                    )}
                                </div>
                            </div>
                        </Space>
                        <Space>
                            <Tag color="purple">{w.type}</Tag>
                            <Tag color={w.is_instantiated ? "blue" : "default"}>
                                {w.is_instantiated ? `v${w.version}` : 'Unpublished'}
                            </Tag>
                        </Space>
                    </div>
                ))}

                {visibleWorkflows.length === 0 && (
                    <Empty 
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={`No compatible ${filterType === 'ALL' ? '' : filterType} workflows found.`} 
                    />
                )}
            </Space>

            {/* ⚡ MODAL INJECTION */}
            <WorkflowGenesis 
                open={modalState === 'create'} 
                onClose={() => {
                    logger.trace("WORKFLOW_EXPLORER", "User cancelled workflow creation");
                    setModalState('');
                }}
                domain={domain}
                onSuccess={handleCreateSuccess}
            />
        </div>
    );
};
