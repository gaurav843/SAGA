// FILEPATH: frontend/src/domains/meta_v2/features/workflows/components/WorkflowEditor.tsx
// @file: Workflow Editor Shell
// @role: 🎨 UI Presentation / 🧠 Logic Container */
// @author: The Engineer
// @description: The Canvas and Inspector workspace. Legacy dependencies completely severed.
// @security-level: LEVEL 9 (UI Safe) */
// @narrator: Deeply traces interactions with nodes and pane background. */

import React, { useMemo, useEffect } from 'react';
import { Layout, theme, Spin, Alert, Button } from 'antd';

import { logger } from '@/platform/logging/Narrator';
import { useUrlState } from '@/platform/hooks/useUrlState';

// ⚡ LOCAL V2 IMPORTS (100% Decoupled)
import { useWorkflows } from '../hooks/useWorkflows';
import { useEditorSession } from '../hooks/useEditorSession';
import { WORKFLOW_TYPES, WorkflowTypeDef } from '../constants';

import { EditorToolbar } from './EditorToolbar';
import { FlowCanvas } from './FlowCanvas';
import { WorkflowInspector } from './inspector/WorkflowInspector';
import { CodeEditorDrawer } from './CodeEditorDrawer';

const { Content, Sider } = Layout;

interface WorkflowEditorProps {
    domain: string;
    scope: string;
    onBack: () => void;
}

export const WorkflowEditor: React.FC<WorkflowEditorProps> = ({ domain, scope, onBack }) => {
    const { token } = theme.useToken();

    // ⚡ DEEP LINKING BY DEFAULT
    const [nodeId, setNodeId] = useUrlState('node', '');
    const [drawerState, setDrawerState] = useUrlState('view', '');

    const { workflows, isLoading, updateWorkflow, deleteWorkflow } = useWorkflows(domain);

    const activeDefinition = useMemo(() => {
        if (!workflows || !scope) return null;
        return workflows.find((w: any) => (w.scope_key || w.scope) === scope) || null;
    }, [workflows, scope]);

    const activeTypeInfo: WorkflowTypeDef | null = useMemo(() => {
        if (!activeDefinition && !scope) return null;
        let typeKey = activeDefinition?.type || activeDefinition?.meta?.type || 'GOVERNANCE';
        return WORKFLOW_TYPES.find(t => t.value === typeKey) || WORKFLOW_TYPES[1]; 
    }, [activeDefinition, scope]);

    const session = useEditorSession(domain, scope, activeDefinition);

    // ⚡ REACTFLOW HANDLERS (TELEMETRY ENABLED)
    const handleNodeClick = (e: React.MouseEvent, node: any) => {
        logger.trace("WORKFLOW_EDITOR", `Node Focused: [${node.id}]`, { type: node.type });
        setNodeId(node.id);
    };

    const handlePaneClick = () => {
        if (nodeId) {
            logger.trace("WORKFLOW_EDITOR", "Canvas pane clicked, clearing node selection", {});
            setNodeId('');
        }
    };

    // ⚡ API MUTATION HANDLERS
    const handleSave = async () => {
        logger.trace("WORKFLOW_EDITOR", `Initiating save for [${scope}]`, { hasChanges: session.hasChanges });
        
        if (updateWorkflow && session.draft && activeDefinition) {
            const payload = {
                domain: domain,
                scope: scope,
                name: activeDefinition.name || activeDefinition.label || scope,
                governed_field: activeDefinition.governed_field || 'status',
                definition: session.draft
            };
            
            await updateWorkflow(payload);
            session.actions.publishDraft();
            logger.tell("WORKFLOW_EDITOR", `✅ Successfully published [${scope}]`);
        } else {
            logger.scream("WORKFLOW_EDITOR", "Missing required state to save workflow");
        }
    };

    const handleDelete = async () => {
        if (activeDefinition?.id && deleteWorkflow) {
            logger.tell("WORKFLOW_EDITOR", `🗑️ Executing delete for ID: ${activeDefinition.id}`);
            await deleteWorkflow(activeDefinition.id).then(() => onBack());
        }
    };

    if (isLoading) {
        return (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spin size="large" tip="Synchronizing Graph Data..." />
            </div>
        );
    }

    if (!activeDefinition && !isLoading) {
        logger.trace("WORKFLOW_EDITOR", `Definition missing for scope: ${scope}. Halting render.`);
        return (
            <div style={{ padding: 24 }}>
                <Alert 
                    type="error" 
                    message="Process Definition Missing" 
                    description={`The scope '${scope}' was not found in the ${domain} registry.`} 
                    action={<Button onClick={onBack}>Return to Explorer</Button>}
                    showIcon
                />
            </div>
        );
    }

    return (
        <Layout style={{ height: '100%', background: token.colorBgLayout }}>
            <EditorToolbar 
                workflowName={activeDefinition.name || activeDefinition.label || scope}
                version={activeDefinition.version || 1}
                mode={session.mode}
                hasChanges={session.hasChanges}
                isPublishing={false}
                onEdit={() => {
                    logger.trace("WORKFLOW_EDITOR", "User initiated Edit Mode", {});
                    session.actions.enterEditMode();
                }}
                onDiscard={() => {
                    logger.trace("WORKFLOW_EDITOR", "User discarded changes", {});
                    session.actions.discardChanges();
                }}
                onPublish={handleSave}
                onViewJson={() => {
                    logger.trace("WORKFLOW_EDITOR", "User opened Raw JSON view", {});
                    setDrawerState('json');
                }}
                onDelete={handleDelete}
                onBack={onBack} 
            />

            <Layout>
                <Content style={{ position: 'relative' }}>
                    <FlowCanvas 
                        initialDefinition={session.draft || activeDefinition.transitions || activeDefinition.definition} 
                        scopeType={activeTypeInfo?.value}
                        onChange={session.actions.updateDraft}
                        readOnly={session.isReadOnly}
                        onNodeClick={handleNodeClick}
                        onPaneClick={handlePaneClick}
                    />
                </Content>

                {nodeId && (
                    <Sider width={400} theme="light" style={{ borderLeft: `1px solid ${token.colorBorderSecondary}`, height: '100%', overflowY: 'auto' }}>
                        <WorkflowInspector 
                            domain={domain}
                            workflowType={activeTypeInfo?.value || 'GOVERNANCE'}
                            activeMachine={activeDefinition}
                            selectedNodeId={nodeId}
                            readOnly={session.isReadOnly}
                            onUpdate={(nodeData) => {
                                if (session.draft) {
                                    logger.trace("WORKFLOW_EDITOR", `Applying updates to Node [${nodeId}]`);
                                    const newDraft = JSON.parse(JSON.stringify(session.draft));
                                    newDraft.states[nodeId] = nodeData;
                                    session.actions.updateDraft(newDraft);
                                }
                            }}
                            onClose={() => setNodeId('')}
                        />
                    </Sider>
                )}
            </Layout>

            <CodeEditorDrawer 
                open={drawerState === 'json'} 
                onClose={() => setDrawerState('')} 
                definition={session.draft || activeDefinition.transitions || activeDefinition.definition}
                readOnly={session.isReadOnly}
                onApply={(newDef) => {
                    logger.trace("WORKFLOW_EDITOR", "Applied modifications via Raw JSON Editor");
                    session.actions.updateDraft(newDef);
                    setDrawerState('');
                }}
            />
        </Layout>
    );
};
