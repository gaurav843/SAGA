// FILEPATH: frontend/src/domains/meta/features/states/StatesView.tsx
// @file: States View (Workflow Orchestrator)
// @role: 🎨 UI Presentation */
// @author: The Engineer
// @description: The Orchestrator for State Machines. Uses Tree Topology for Navigation.
// @security-level: LEVEL 9 (UI Safe) */

import React, { useState, useEffect, useMemo } from 'react';
import { 
    Layout, Button, Empty, Spin, theme, Typography, Space, Breadcrumb, 
    Tag, Divider, Alert 
} from 'antd';
import ReactFlow, { 
    Background, Controls, MiniMap, ReactFlowProvider,
    useNodesState, useEdgesState, Panel
} from 'reactflow';
import 'reactflow/dist/style.css';

import { 
    ArrowLeftOutlined, PlusOutlined, ReloadOutlined, 
    PartitionOutlined, DeleteOutlined, SaveOutlined 
} from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';

// ⚡ SHARED COMPONENTS (Fractal Architecture)
import { DomainTree } from '../../components/DomainTree';
import { useMetaContext } from '../../_kernel/MetaContext';

// Local Logic & Components
import { useDomains } from './hooks/useDomains';
import { useWorkflows } from './hooks/useWorkflows';
import { useEditorSession } from './hooks/useEditorSession';
import { useDomainSchema } from './hooks/useDomainSchema'; // For context awareness
import { EditorToolbar } from './components/EditorToolbar';
import { InspectorPanel } from './components/InspectorPanel';
import { FlowCanvas } from './components/FlowCanvas';
import { WorkflowGenesis } from './components/WorkflowGenesis'; // New Modal
import { CodeEditorDrawer } from './components/CodeEditorDrawer';

// ⚡ CRITICAL FIX: Adjusted relative path depth (added one '../')
import { logger } from '../../../../platform/logging/Narrator'; 

// ⚡ CRITICAL FIX: Isolate Type Imports
import type { StateMachineDraft } from './types';
import type { WorkflowTypeDef } from './constants';
import { WORKFLOW_TYPES } from './constants';

const { Content, Sider } = Layout;
const { Title, Text } = Typography;

export const StatesView: React.FC = () => {
    const { token } = theme.useToken();
    const [searchParams, setSearchParams] = useSearchParams();

    // 1. GLOBAL CONTEXT (Deep Linking for Selection)
    const { 
        selectedDomain, 
        selectDomain, 
        selectScope,
        selectedScope,
        selectedItem,
        selectItem 
    } = useMetaContext();

    // Resolve active state from context (Handle DEFAULT case)
    const domainKey = selectedDomain?.key || null;
    const scopeKey = selectedScope?.key || null;

    // 2. UNIVERSAL URL STATE (Persistence)
    const urlDomain = searchParams.get('domain');
    const urlScope = searchParams.get('scope');
    const urlFilter = searchParams.get('filter'); // WIZARD | JOB | GOVERNANCE
    const urlNode = searchParams.get('node'); // ⚡ NODE SELECTION DEEP LINK (The "Amnesia" Cure)

    // Sync URL -> Context
    useEffect(() => {
        if (urlDomain && urlDomain !== domainKey) selectDomain(urlDomain);
        if (urlScope && urlScope !== scopeKey) selectScope(urlScope);
        
        // ⚡ NODE SYNC: If URL has node, sync to context. If URL has NO node, clear context.
        // We use '' to represent no selection in the URL, effectively null
        if (urlNode && urlNode !== selectedItem) {
            selectItem(urlNode);
        } else if (!urlNode && selectedItem) {
            selectItem(null);
        }
    }, [urlDomain, urlScope, urlNode]);

    // 3. DATA LOADING
    const { domains, isLoading: isDomainsLoading } = useDomains();
    
    // We only fetch workflows if a domain is selected
    const { 
        workflows, 
        isLoading: isWorkflowsLoading, 
        createWorkflow,
        updateWorkflow,
        deleteWorkflow,
        refresh: refreshWorkflows 
    } = useWorkflows(domainKey);

    // 4. Local UI State (Transient)
    const [isInspectorOpen, setIsInspectorOpen] = useState(false);
    const [isJsonDrawerOpen, setIsJsonDrawerOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Auto-open right panel if we have a deep link selection
    useEffect(() => {
        if (selectedItem) setIsInspectorOpen(true);
    }, [selectedItem]);

    // Effect: Keep right panel sync with selection
    useEffect(() => {
        if (!isInspectorOpen && selectedItem) {
            // If panel closed but item selected, deselect item (two-way bind)
            selectItem(null);
            
            // Clean URL
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('node');
            setSearchParams(newParams);
        }
    }, [isInspectorOpen]);


    // 5. Data Hooks
    // Find the definition for the selected scope
    const activeDefinition = useMemo(() => {
        if (!scopeKey) return null;
        return workflows.find(w => w.scope_key === scopeKey) || null;
    }, [workflows, scopeKey]);

    // ⚡ HELPER: Resolve Workflow Type Logic
    // We need to know if this is a WIZARD, JOB, or GOVERNANCE flow to render the right tools.
    const activeTypeInfo: WorkflowTypeDef | null = useMemo(() => {
        if (!activeDefinition && !scopeKey) return null;
        
        // A. Check Registry
        const registryScope = selectedDomain?.scopes.find(s => s.key === scopeKey);
        let typeKey = registryScope?.type || activeDefinition?.type;

        // B. Check Metadata
        if (!typeKey && activeDefinition?.meta?.type) {
            typeKey = activeDefinition.meta.type;
        }

        // C. Fallback
        if (!typeKey) typeKey = 'GOVERNANCE'; // Default

        // ⚡ SMART TYPE RESOLUTION
        // Some keys might be "WIZARD" (Backend enum) vs "WIZARD_FLOW" (UI Constant)
        // We normalize here.
        if (typeKey === 'WIZARD') return WORKFLOW_TYPES.WIZARD;
        if (typeKey === 'JOB') return WORKFLOW_TYPES.JOB;
        
        return WORKFLOW_TYPES.GOVERNANCE;
    }, [activeDefinition, selectedDomain, scopeKey]);


    // ⚡ FILTERED LIST
    const visibleWorkflows = useMemo(() => {
        if (!urlFilter) return workflows;
        return workflows.filter(w => w.type === urlFilter);
    }, [workflows, urlFilter]);


    // 6. Session Manager
    // Manages the "Draft" state vs "Live" state
    const session = useEditorSession(domainKey || '', scopeKey || '', activeDefinition);

    // 7. Navigation Guard
    const handleSelectWorkflow = (scope: string) => {
        if (scope === scopeKey) return; // No op
        selectScope(scope);
        setSearchParams({ domain: domainKey!, scope: scope }); // Keep filter if any? No, reset.
        
        // Close panels
        setIsInspectorOpen(false);
        selectItem(null);
    };

    const handleBack = () => {
        selectDomain('');
        setSearchParams({});
    };

    // If we have a domain but no scope selected, 
    // AND we have workflows, maybe auto-select the first one?
    // No, better to show a list/gallery view.
    useEffect(() => {
        if (domainKey && !scopeKey && workflows.length > 0) {
            // Optional: Auto-select first? 
            // handleSelectWorkflow(workflows[0].scope_key);
        }
    }, [domainKey, scopeKey, workflows]);

    // Sync Reset (If scope invalid for domain)
    useEffect(() => {
        if (scopeKey && !isWorkflowsLoading && workflows.length > 0) {
            const exists = workflows.find(w => w.scope_key === scopeKey);
            if (!exists) {
                // Only reset if we are sure it's loaded and truly missing
                // selectScope(''); // Commented out to prevent flash resets during load
            }
        }
    }, [scopeKey, workflows, isWorkflowsLoading]);

    // Canvas Update
    const onNodeSelect = (nodeId: string | null) => {
        logger.tell("FLOW", `👇 Node Selected: ${nodeId}`);
        selectItem(nodeId);
        
        // Sync URL for F5 safety
        const newParams = new URLSearchParams(searchParams);
        if (nodeId) {
            newParams.set('node', nodeId);
            setIsInspectorOpen(true);
        } else {
            newParams.delete('node');
        }
        setSearchParams(newParams);
    };

    // --- RENDER: STATE A (LOBBY) ---
    if (!selectedDomain) {
        return (
            <div style={{ padding: 48, minHeight: '100%', background: token.colorBgLayout }}>
                {isDomainsLoading ? <Spin size="large" /> : (
                    // ⚡ REFACTOR: Use DomainTree instead of Flat Picker
                    <DomainTree 
                        domains={domains} 
                        onSelect={(val) => {
                            selectDomain(val);
                            setSearchParams({ domain: val });
                        }} 
                        isLoading={isDomainsLoading} 
                    />
                )}
            </div>
        );
    }

    // --- RENDER: STATE B (WORKFLOW GALLERY) ---
    if (!selectedScope) {
        return (
            <Layout style={{ height: '100%' }}>
                <div style={{ padding: '16px 24px', background: token.colorBgContainer, borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
                    <Space>
                        <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>Back</Button>
                        <Breadcrumb items={[
                            { title: 'Workflows' },
                            { title: selectedDomain.label }
                        ]} />
                    </Space>
                </div>
                <Content style={{ padding: 24 }}>
                    <div style={{ maxWidth: 800, margin: '0 auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                            <Title level={3}>Process Definitions</Title>
                            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateModalOpen(true)}>
                                Create Workflow
                            </Button>
                        </div>
                        
                        {isWorkflowsLoading ? <Spin /> : (
                            <Space direction="vertical" style={{ width: '100%' }}>
                                {workflows.map(w => (
                                    <div 
                                        key={w.scope_key}
                                        onClick={() => handleSelectWorkflow(w.scope_key)}
                                        className="hover-card"
                                        style={{ 
                                            padding: 16, 
                                            background: token.colorBgContainer, 
                                            border: `1px solid ${token.colorBorderSecondary}`,
                                            borderRadius: 8,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
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
                                                <Text strong>{w.label}</Text>
                                                <div><Text type="secondary" style={{ fontSize: 12 }}>{w.scope_key}</Text></div>
                                            </div>
                                        </Space>
                                        <Space>
                                            <Tag>{w.type}</Tag>
                                            <Tag color="blue">{w.version}</Tag>
                                        </Space>
                                    </div>
                                ))}
                                {workflows.length === 0 && (
                                    <Empty description="No Workflows Found for this Domain" />
                                )}
                            </Space>
                        )}
                    </div>
                </Content>
                
                <WorkflowGenesis 
                    open={isCreateModalOpen} 
                    onClose={() => setIsCreateModalOpen(false)}
                    domain={selectedDomain}
                    onSuccess={(key) => {
                        setIsCreateModalOpen(false);
                        refreshWorkflows();
                        handleSelectWorkflow(key);
                    }}
                />
            </Layout>
        );
    }

    // --- RENDER: STATE C (EDITOR) ---
    return (
        <Layout style={{ height: '100vh', background: token.colorBgLayout }}>
            {/* 1. TOOLBAR */}
            <div style={{ 
                height: 64, 
                background: token.colorBgContainer, 
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
                padding: '0 24px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
                <Space>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => handleSelectWorkflow('')} />
                    <div>
                        <Title level={4} style={{ margin: 0 }}>{activeDefinition?.label || scopeKey}</Title>
                        <Text type="secondary" style={{ fontSize: 12 }}>{scopeKey}</Text>
                    </div>
                </Space>

                <EditorToolbar 
                    session={session} 
                    onSave={async () => {
                        await updateWorkflow(session.draft);
                        session.commit();
                    }}
                    onReset={session.reset}
                    onOpenJson={() => setIsJsonDrawerOpen(true)}
                    onDelete={() => deleteWorkflow(scopeKey!).then(() => handleSelectWorkflow(''))}
                />
            </div>

            <Layout>
                {/* 2. CANVAS */}
                <Content style={{ position: 'relative' }}>
                    <FlowCanvas 
                        definition={session.draft} 
                        readOnly={session.mode === 'VIEW'}
                        onNodeSelect={onNodeSelect}
                        onSelectionChange={(nodes) => {
                            // If multiple selection or drag select, handle here if needed
                        }}
                        onNodesChange={(changes) => {
                            // If user drags node, we update draft layout
                            // session.updateLayout(changes); // Todo: Implement granular layout update
                        }}
                    />
                </Content>

                {/* 3. INSPECTOR (Right Panel) */}
                {isInspectorOpen && (
                    <Sider 
                        width={400} 
                        theme="light" 
                        style={{ 
                            borderLeft: `1px solid ${token.colorBorderSecondary}`,
                            height: 'calc(100vh - 64px)',
                            overflowY: 'auto'
                        }}
                    >
                        <InspectorPanel 
                            nodeId={selectedItem}
                            domain={domainKey!}
                            scope={scopeKey!}
                            workflowType={activeTypeInfo} 
                            readOnly={session.mode === 'VIEW'}
                            onUpdate={(nodeData) => {
                                session.updateNode(selectedItem!, nodeData);
                            }}
                            onClose={() => setIsInspectorOpen(false)}
                        />
                    </Sider>
                )}
            </Layout>

            {/* MODALS */}
            <CodeEditorDrawer 
                open={isJsonDrawerOpen} 
                onClose={() => setIsJsonDrawerOpen(false)} 
                code={JSON.stringify(session.draft, null, 2)}
                onChange={(newCode) => {
                    try {
                        const json = JSON.parse(newCode);
                        session.updateDraft(json); // Full replace
                    } catch (e) {
                        // wait for valid json
                    }
                }}
            />
        </Layout>
    );
};
