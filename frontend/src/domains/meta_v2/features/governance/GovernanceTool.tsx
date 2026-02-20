// FILEPATH: frontend/src/domains/meta_v2/features/governance/GovernanceTool.tsx
// @file: V2 Governance Controller
// @role: 🎨 UI Presentation */
// @author: The Engineer
// @description: Master Controller for the V2 Rule Engine. URL-driven, fully decoupled.
// @security-level: LEVEL 9 (UI Safe) */
// @updated: Added 'Tag' import to fix Runtime Crash. */

import React, { useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout, Typography, Empty, theme, Space, Button, Tag } from 'antd';
import { SafetyCertificateOutlined, ArrowLeftOutlined } from '@ant-design/icons';

import { useUrlState } from '@/platform/hooks/useUrlState';
import { FadeIn } from '@/platform/ui/animation/FadeIn';
import { logger } from '@/platform/logging/Narrator';
import { useMetaUI } from '../../_shell/MetaUIContext';

import { useGovernance } from './hooks/useGovernance';
import { PolicyExplorer } from './components/list/PolicyExplorer';
import { PolicyEditor } from './components/editor/PolicyEditor';
import { DEFAULT_POLICY_DRAFT } from '../../../meta/features/governance/types';
import type { PolicyDraft, Policy } from '../../../meta/features/governance/types';

const { Content, Sider } = Layout;
const { Text, Title } = Typography;

export const GovernanceTool: React.FC = () => {
    const { token } = theme.useToken();
    const navigate = useNavigate();

    // ⚡ ROUTING STATE
    const { domain } = useParams<{ domain: string }>();

    // ⚡ V2 UI STATE (Centralized Shell)
    const { isExplorerCollapsed, toggleExplorer } = useMetaUI();

    // ⚡ GLOBAL URL STATE (Deep Linking)
    const [policyKey, setPolicyKey] = useUrlState('policy', '');

    // ⚡ LOGIC HOOK
    const { 
        policies, 
        createPolicy,
        updatePolicy,
        deletePolicy,
        isMutating
    } = useGovernance(domain);

    // ⚡ TELEMETRY
    useEffect(() => {
        if (domain) {
            logger.tell("GOVERNANCE", `🎯 Initialized V2 Governance Tool for domain: ${domain}`);
        }
    }, [domain]);

    // --- HANDLERS ---
    const handleSelectPolicy = (policy: Policy) => {
        logger.tell("GOVERNANCE", `👉 Deep Linking to Policy: ${policy.key}`);
        setPolicyKey(policy.key);
    };

    const handleCreate = () => {
        logger.tell("GOVERNANCE", `📝 Initiated New Policy Draft`);
        setPolicyKey('NEW');
    };

    const handleSave = async (payload: PolicyDraft) => {
        logger.whisper("GOVERNANCE", "Initiating save sequence...");

        // ⚡ TAG-DRIVEN CONTEXT: Automatically associate this policy with the active domain
        const domainTag = `domain:${domain}`;
        const tags = payload.tags || [];
        if (!tags.includes(domainTag)) {
            tags.push(domainTag);
            logger.trace("GOVERNANCE", `Injected Domain Binding Tag: ${domainTag}`, { tags });
        }
        
        const contextualPayload = { ...payload, tags };

        if (policyKey === 'NEW') {
            await createPolicy(contextualPayload);
        } else {
            const policy = policies?.find((p: Policy) => p.key === policyKey);
            if (policy) {
                await updatePolicy({ id: policy.id, payload: contextualPayload });
            }
        }
        setPolicyKey(null);
    };

    const handleDelete = async (id: number) => {
        logger.whisper("GOVERNANCE", `Initiating deletion sequence for ID: ${id}...`);
        await deletePolicy(id);
        const policy = policies?.find((p: Policy) => p.id === id);
        if (policy && policy.key === policyKey) {
            setPolicyKey(null);
        }
    };

    const handleBack = () => {
        navigate('/meta-v2');
    };

    // --- COMPUTED ---
    const activeDraft = useMemo(() => {
        if (!policyKey || policyKey === 'NEW') return null;
        return policies?.find((p: Policy) => p.key === policyKey);
    }, [policies, policyKey]);

    // --- RENDER: EMPTY STATE (No Domain) ---
    if (!domain) {
        return (
            <FadeIn>
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Empty 
                        image={<SafetyCertificateOutlined style={{ fontSize: 64, color: token.colorTextDisabled }} />}
                        description={
                            <Space direction="vertical">
                                <Text strong>No Domain Selected</Text>
                                <Text type="secondary">Select a domain from the System Topology to manage its policies.</Text>
                            </Space>
                        }
                    />
                </div>
            </FadeIn>
        );
    }

    // --- RENDER: WORKSPACE ---
    return (
        <FadeIn triggerKey={domain}>
            <Layout style={{ height: '100%', overflow: 'hidden', background: 'transparent' }}>
                
                {/* ⚡ TOOLBAR (Header) */}
                <div style={{ 
                    padding: '16px 24px', 
                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: token.colorBgContainer
                }}>
                    <Space>
                        <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>Back</Button>
                        <Title level={4} style={{ margin: 0 }}>
                            Governance: {domain}
                        </Title>
                    </Space>
                    <Tag icon={<SafetyCertificateOutlined />} color="blue">Enforcement Active</Tag>
                </div>

                <Layout style={{ height: 'calc(100% - 64px)', overflow: 'hidden', background: token.colorBgLayout }}>
                    {/* LEFT PANEL: EXPLORER */}
                    <Sider 
                        width={340} 
                        theme="light" 
                        collapsible 
                        collapsed={isExplorerCollapsed} 
                        collapsedWidth={0} 
                        trigger={null}
                        style={{ 
                            borderRight: `1px solid ${token.colorBorderSecondary}`,
                            zIndex: 10
                        }}
                    >
                        <PolicyExplorer 
                            policies={policies || []}
                            selectedKey={policyKey}
                            onSelect={handleSelectPolicy}
                            onCreate={handleCreate}
                            collapsed={isExplorerCollapsed}
                            onToggleCollapse={toggleExplorer}
                        />
                    </Sider>

                    {/* MAIN PANEL: EDITOR */}
                    <Content style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
                            {policyKey ? (
                                <PolicyEditor 
                                    key={policyKey} // Force remount on switch
                                    draft={activeDraft || DEFAULT_POLICY_DRAFT}
                                    domain={domain}
                                    onSave={handleSave}
                                    onDelete={activeDraft ? () => handleDelete(activeDraft.id) : undefined}
                                    isSaving={isMutating}
                                />
                            ) : (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Empty 
                                        image={Empty.PRESENTED_IMAGE_SIMPLE} 
                                        description={<Text type="secondary">Select a policy from the sidebar to configure rules.</Text>} 
                                    />
                                </div>
                            )}
                        </div>
                    </Content>
                </Layout>
            </Layout>
        </FadeIn>
    );
};

