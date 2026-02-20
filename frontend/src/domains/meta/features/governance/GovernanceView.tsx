// FILEPATH: frontend/src/domains/meta/features/governance/GovernanceView.tsx
// @file: Governance Console (Deep Linked + Smooth)
// @role: 🎨 UI Presentation */
// @author: The Engineer
// @description: The Master Controller for the Rule Engine.
// VISUAL: Added <FadeIn> wrapper for standard transitions.
// UX: Added Back Button for Domain Selection.


import React, { useMemo, useState } from 'react';
import { Layout, Typography, Empty, theme, FloatButton, Spin, Button, Space, Tag, Tooltip } from 'antd';
import { 
    MenuUnfoldOutlined, MenuFoldOutlined, 
    SafetyCertificateOutlined, PlusOutlined,
    BankOutlined, ArrowLeftOutlined
} from '@ant-design/icons';

import { useMetaContext } from '../../_kernel/MetaContext';
import { useUrlState } from '../../../../platform/hooks/useUrlState'; // ⚡ UNIVERSAL STATE
import { FadeIn } from '../../../../platform/ui/animation/FadeIn'; // ⚡ ANIMATION
import { DomainPicker } from '../dictionary/components/DomainPicker'; // Reuse picker
import { PolicyExplorer } from './components/PolicyExplorer';
import { PolicyEditor } from './components/PolicyEditor';
import { useGovernance } from './hooks/useGovernance';

const { Content, Sider } = Layout;
const { Text, Title } = Typography;

export const GovernanceView: React.FC = () => {
    const { token } = theme.useToken();

    // 1. GLOBAL CONTEXT (The Session)
    const { 
        selectedDomainKey, 
        setSelectedDomainKey,
        selectedItem,
        setSelectedItem,
        activeDomain,
        domainList,
        isLoadingDomains
    } = useMetaContext();

    // ⚡ GLOBAL STATE: Deep Linking
    const [searchTerm, setSearchTerm] = useUrlState('q', '');

    // Local UI State (Transient)
    const [leftOpen, setLeftOpen] = useState(true);

    // 2. LOGIC (Only runs if domain is selected)
    const { 
        policies, 
        isLoading: isGovernanceLoading,
        createPolicy,
        updatePolicy,
        deletePolicy,
        dryRunPolicy,
        isMutating
    } = useGovernance(selectedDomainKey || '');

    // 3. HANDLERS
    const handleDomainSelect = (key: string) => {
        setSelectedDomainKey(key);
    };

    const handleBackToLobby = () => {
        setSelectedDomainKey(null);
    };

    const handleSelectPolicy = (key: string) => {
        setSelectedItem(key);
    };

    const handleCreate = () => {
        setSelectedItem('NEW');
    };

    const handleSave = async (payload: any) => {
        if (selectedItem === 'NEW') {
            await createPolicy(payload);
        } else {
            const policy = policies?.find(p => p.key === selectedItem);
            if (policy) {
                await updatePolicy(policy.id, payload);
            }
        }
        setSelectedItem(null);
    };

    const handleDelete = async (id: number) => {
        await deletePolicy(id);
        const policy = policies?.find(p => p.id === id);
        if (policy && policy.key === selectedItem) {
            setSelectedItem(null);
        }
    };

    // 4. COMPUTED
    const activeDraft = useMemo(() => {
        if (!selectedItem || selectedItem === 'NEW') return null;
        return policies?.find(p => p.key === selectedItem);
    }, [policies, selectedItem]);

    // --- RENDER: STATE A (LOBBY) ---
    if (!selectedDomainKey) {
        return (
            <FadeIn>
                <div style={{ padding: 40, maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 40 }}>
                        <Title level={2}>
                            <Space>
                                <SafetyCertificateOutlined style={{ color: token.colorWarning }} />
                                Governance Engine
                            </Space>
                        </Title>
                        <Text type="secondary" style={{ fontSize: 16 }}>
                            Select a Domain to enforce Business Rules and Compliance Policies.
                        </Text>
                    </div>
                    
                    {isLoadingDomains ? (
                        <div style={{ textAlign: 'center', padding: 40 }}>
                            <Spin size="large" tip="Loading Registry..." />
                        </div>
                    ) : (
                        <DomainPicker 
                            domains={domainList} 
                            onSelect={handleDomainSelect} 
                        />
                    )}
                </div>
            </FadeIn>
        );
    }

    // --- RENDER: STATE B (EDITOR) ---
    return (
        <FadeIn>
            <Layout style={{ height: 'calc(100vh - 60px)', overflow: 'hidden', background: token.colorBgLayout }}>
                {/* LEFT PANEL: EXPLORER */}
                <Sider 
                    width={340} 
                    theme="light" 
                    collapsible 
                    collapsed={!leftOpen} 
                    collapsedWidth={0} 
                    trigger={null}
                    style={{ 
                        borderRight: `1px solid ${token.colorBorderSecondary}`,
                        zIndex: 10
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        {/* HEADER */}
                        <div style={{ 
                            padding: 16, 
                            borderBottom: `1px solid ${token.colorSplit}`,
                            background: token.colorFillQuaternary 
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                <Tooltip title="Change Domain">
                                    <Button 
                                        type="text" 
                                        icon={<ArrowLeftOutlined />} 
                                        onClick={handleBackToLobby} 
                                        size="small"
                                    />
                                </Tooltip>
                                <BankOutlined style={{ color: token.colorWarning }} />
                                <Text strong style={{ fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {activeDomain?.label || selectedDomainKey}
                                </Text>
                            </div>
                            <Button type="primary" block icon={<PlusOutlined />} onClick={handleCreate}>
                                Draft Policy
                            </Button>
                        </div>

                        {/* LIST */}
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <PolicyExplorer 
                                policies={policies || []}
                                selectedKey={selectedItem}
                                onSelect={handleSelectPolicy}
                                isLoading={isGovernanceLoading}
                                searchTerm={searchTerm}
                                onSearchChange={setSearchTerm}
                            />
                        </div>
                    </div>
                </Sider>

                {/* MAIN PANEL: EDITOR */}
                <Content style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <FloatButton 
                        icon={leftOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
                        style={{ position: 'absolute', top: 16, left: 16, zIndex: 100 }}
                        onClick={() => setLeftOpen(!leftOpen)}
                    />

                    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
                        {selectedItem ? (
                            <PolicyEditor 
                                key={selectedItem} // Force remount on switch
                                draft={activeDraft || undefined}
                                isNew={selectedItem === 'NEW'}
                                onSave={handleSave}
                                onDelete={handleDelete}
                                onCancel={() => setSelectedItem(null)}
                                isSaving={isMutating}
                                onDryRun={dryRunPolicy}
                                domain={activeDomain?.key || selectedDomainKey}
                            />
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Empty 
                                    image={Empty.PRESENTED_IMAGE_SIMPLE} 
                                    description={
                                        <Text type="secondary">Select a policy to configure rules</Text>
                                    } 
                                />
                            </div>
                        )}
                    </div>
                </Content>
            </Layout>
        </FadeIn>
    );
};

