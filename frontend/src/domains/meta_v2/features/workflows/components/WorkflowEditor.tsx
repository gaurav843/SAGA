// FILEPATH: frontend/src/domains/meta_v2/features/workflows/components/WorkflowEditor.tsx
// @file: Workflow Editor Shell
// @role: 🎨 UI Presentation / 🧠 Logic Container */
// @author: The Engineer
// @description: The Canvas and Inspector workspace. Safely synthesizes missing Database definitions using Code Defaults.
// @security-level: LEVEL 9 (Strict Null Checks & Memory Synthesis) */
// @narrator: Deeply traces interactions with nodes and pane background. */

import React, { useMemo } from 'react';
import { Layout, theme, Spin, Alert, Button } from 'antd';

import { logger } from "@/platform/logging/Narrator";
import { useUrlState } from '@/platform/hooks/useUrlState';
import { } from '@platform/logging/'

// ⚡ LOCAL V2 IMPORTS
import { useWorkflows, type WorkflowDefinition } from '../hooks/useWorkflows';
import { useEditorSession } from '../hooks/useEditorSession';
import { WORKFLOW_TYPES, type WorkflowTypeDef } from '../constants';
import { useKernel } from '../../../_kernel/KernelContext';

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
    const { selectedDomain } = useKernel();

    // ⚡ DEEP LINKING BY DEFAULT
    const [nodeId, setNodeId] = useUrlState('node', '');
    const [drawerState, setDrawerState] = useUrlState('view', '');

    const { workflows, isLoading, updateWorkflow, deleteWorkflow } = useWorkflows(domain);

    // ⚡ THE SYNTHESIS ENGINE (Fixes the "Process Definition Missing" bug for Jobs/Views)
    const activeDefinition: WorkflowDefinition | null = useMemo(() => {
        if (!scope) return null;
        
        // 1. Try to find it in the Database
        if (workflows) {
            const dbDef = workflows.find((w: WorkflowDefinition) => (w.scope_key || w.scope) === scope);
            if (dbDef) return dbDef;
        }

        // 2. Fallback to Code Registry (Kernel Context) to Synthesize a Draft
        const codeDef = selectedDomain?.scopes?.find(s => s.key === scope);
        if (codeDef) {
            logger.trace("WORKFLOW_EDITOR", `Synthesizing UI definition for code-first scope: ${scope}`);
            
            let nodeType = 'standard';
            if (codeDef.type === 'WIZARD') nodeType = 'screen';
            if (codeDef.type === 'JOB') nodeType = 'task';
            if (codeDef.type === 'VIEW') nodeType = 'screen';

            return {
                id: `synthetic_${scope}`,
                entity_key: domain,
                scope: scope,
                scope_key: scope,
                name: codeDef.label || scope,
                type: codeDef.type,
                is_active: true,
                is_latest: true,
                governed_field: codeDef.target_field || 'status',
                definition: {
                    id: scope,
                    initial: scope,
                    states: {
                        [scope]: {
                            type: 'atomic',
                            meta: {
                                nodeType: nodeType,
                                x: 250,
                                y: 150,
                                job_config: codeDef.config || {},
                                form_schema: codeDef.config?.components ? [] : undefined, // Hack to support Views
                                description: codeDef.config?.description || ''
                            }
                        }
                    }
                }
            } as unknown as WorkflowDefinition;
        }

        return null;
    }, [workflows, scope, selectedDomain]);

    const activeTypeInfo: WorkflowTypeDef = useMemo(() => {
        if (!activeDefinition && !scope) return WORKFLOW_TYPES[1]; 
        const typeKey = activeDefinition?.type || (activeDefinition as any)?.meta?.type || 'GOVERNANCE';
        return WORKFLOW_TYPES.find(t => t.value === typeKey) || WORKFLOW_TYPES[1]; 
    }, [activeDefinition, scope]);

    const session = useEditorSession(domain, scope, activeDefinition);

    // ⚡ REACTFLOW HANDLERS
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
        // Only attempt to delete if it's a real DB record (not a synthetic one)
        if (activeDefinition?.id && typeof activeDefinition.id === 'number' && deleteWorkflow) {
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
                workflowName={activeDefinition?.name || activeDefinition?.label || scope}
                version={activeDefinition?.version || 1}
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
                onDelete={typeof activeDefinition?.id === 'number' ? handleDelete : undefined}
                onBack={onBack} 
            />

            <Layout>
                <Content style={{ position: 'relative' }}>
                    <FlowCanvas 
                        initialDefinition={session.draft || activeDefinition?.transitions || activeDefinition?.definition} 
                        scopeType={activeTypeInfo.value} 
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
                            workflowType={activeTypeInfo.value || 'GOVERNANCE'}
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
                definition={session.draft || activeDefinition?.transitions || activeDefinition?.definition}
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
