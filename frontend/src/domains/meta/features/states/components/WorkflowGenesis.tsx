/* FILEPATH: frontend/src/domains/meta/features/states/components/WorkflowGenesis.tsx */
/* @file Workflow Genesis Wizard */
/* @author The Engineer */
/* @description The "New Workflow" Modal.
 * UPDATED: Uses centralized constants for Types/Icons.
 * FIXED: Removed aggressive scrollbar constraints.
 */

import React, { useState } from 'react';
import { ModalForm, ProFormText, ProFormSelect, ProFormTextArea, ProFormDependency } from '@ant-design/pro-components';
import { Form, message, Alert, Space } from 'antd';
import { PlusOutlined, RocketOutlined } from '@ant-design/icons';

import { useWorkflows } from '../hooks/useWorkflows';
import type { StateMachineCreate } from '@api/models/StateMachineCreate';
import { logger } from '../../../../../platform/logging';
import { WORKFLOW_TYPES } from '../constants'; // ⚡ SHARED TRUTH

interface WorkflowGenesisProps {
    domain: string;
    onSuccess: () => void;
    existingScopes?: string[];
}

export const WorkflowGenesis: React.FC<WorkflowGenesisProps> = ({ domain, onSuccess, existingScopes = [] }) => {
    const [form] = Form.useForm();
    const { createWorkflow } = useWorkflows(domain);
    const [modalVisible, setModalVisible] = useState(false);

    const handleSubmit = async (values: any) => {
        logger.tell("UI", "🚀 Initiating Workflow Genesis", values);

        try {
            if (existingScopes.includes(values.scope)) {
                message.error(`Workflow '${values.scope}' already exists!`);
                logger.warn("VALIDATOR", "Duplicate Scope", { scope: values.scope });
                return false; 
            }

            const skeletonDef = generateSkeleton(values.scope, values.type);

            const payload: StateMachineCreate = {
                domain: domain,
                scope: values.scope,
                name: values.name,
                governed_field: values.governed_field || (values.type === 'WIZARD' ? 'virtual' : 'status'), 
                definition: skeletonDef
            };

            await createWorkflow.mutateAsync(payload);
            
            message.success('✨ Workflow Initialized Successfully');
            logger.story("Workflow Genesis", `Created ${values.type}: ${values.scope}`);
            
            setModalVisible(false);
            form.resetFields();
            onSuccess();
            return true;
        } catch (error) {
            console.error("Genesis Failed:", error);
            logger.scream("API", "Genesis Failed", error);
            return false;
        }
    };

    const generateSkeleton = (key: string, type: string) => {
        const id = key.toLowerCase();
        
        if (type === 'JOB') {
            return {
                id: id,
                initial: 'queued',
                states: {
                    queued: {
                        type: 'atomic',
                        meta: { nodeType: 'task', job_config: { queue: 'default', retries: 3 } },
                        on: { START: 'processing' }
                    },
                    processing: { 
                        type: 'atomic',
                        meta: { nodeType: 'task' },
                        on: { SUCCESS: 'completed', FAIL: 'failed' } 
                    },
                    completed: { type: 'final', meta: { nodeType: 'task' } },
                    failed: { type: 'final', meta: { nodeType: 'task' } }
                }
            };
        }

        if (type === 'WIZARD') {
            return {
                id: id,
                initial: 'step_1',
                states: {
                    step_1: {
                        type: 'atomic',
                        meta: { nodeType: 'screen', title: 'Step 1', form_schema: [] },
                        on: { NEXT: 'step_2' }
                    },
                    step_2: { 
                        type: 'final',
                        meta: { nodeType: 'screen', title: 'Submission' }
                    }
                }
            };
        }

        // Default: Governance
        return {
            id: id,
            initial: 'DRAFT',
            states: {
                DRAFT: { 
                    type: 'atomic',
                    meta: { nodeType: 'standard', color: '#faad14' },
                    on: { ACTIVATE: 'ACTIVE' } 
                },
                ACTIVE: { 
                    type: 'atomic',
                    meta: { nodeType: 'standard', color: '#52c41a' },
                    on: { ARCHIVE: 'ARCHIVED' } 
                },
                ARCHIVED: { 
                    type: 'final',
                    meta: { nodeType: 'standard', color: '#bfbfbf' }
                }
            }
        };
    };

    return (
        <ModalForm
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <RocketOutlined style={{ color: '#1890ff' }} />
                    <span>Initialize New Workflow</span>
                </div>
            }
            trigger={
                <div onClick={() => setModalVisible(true)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                    <PlusOutlined /> New
                </div>
            }
            open={modalVisible}
            onOpenChange={setModalVisible}
            form={form}
            autoFocusFirstInput
            modalProps={{ 
                destroyOnClose: true,
                centered: true,
                // ⚡ FIX: Removed aggressive maxHeight/overflow on body. 
                // AntD handles this natively better.
            }}
            onFinish={handleSubmit}
            width={600}
            submitter={{
                searchConfig: { submitText: 'Initialize' },
            }}
        >
            <Alert 
                message="Kernel Scope Association" 
                description="Creating a workflow registers a new 'Scope' in the OS Kernel. The Type determines which Engine (Wizard/Job/Governance) will power this workflow."
                type="info" 
                showIcon 
                style={{ marginBottom: 24 }}
            />

            <ProFormText
                name="name"
                label="Friendly Name"
                placeholder="e.g. User Onboarding Wizard"
                rules={[{ required: true, message: 'Please provide a name' }]}
            />

            <div style={{ display: 'flex', gap: 16 }}>
                <ProFormText
                    name="scope"
                    label="Scope Key (ID)"
                    placeholder="e.g. ONBOARDING_V1"
                    width="md"
                    fieldProps={{ style: { textTransform: 'uppercase' } }}
                    normalize={(value) => value?.toUpperCase()}
                    rules={[
                        { required: true, message: 'Unique Key required' },
                        { pattern: /^[A-Z0-9_]+$/, message: 'Must be UPPERCASE_WITH_UNDERSCORES' },
                    ]}
                />

                <ProFormSelect
                    name="type"
                    label="Kernel Association (Type)"
                    tooltip="This tells the OS which engine to use."
                    width="md"
                    // ⚡ CONSTANT DRIVEN OPTIONS
                    options={WORKFLOW_TYPES.map(t => ({
                        label: <Space>{t.icon} {t.label}</Space>,
                        value: t.value
                    }))}
                    rules={[{ required: true }]}
                    initialValue="GOVERNANCE"
                />
            </div>

            <ProFormDependency name={['type']}>
                {({ type }) => {
                    if (['GOVERNANCE', 'SUB_FLOW'].includes(type)) {
                        return (
                            <ProFormText
                                name="governed_field"
                                label="Target Database Column"
                                tooltip="The actual database column in the Entity table that this state machine will update."
                                initialValue={type === 'GOVERNANCE' ? 'status' : 'approval_state'}
                                placeholder="status"
                                rules={[{ required: true }]}
                            />
                        );
                    }
                    return null;
                }}
            </ProFormDependency>

            <ProFormTextArea
                name="description"
                label="Description"
                placeholder="What is the purpose of this workflow?"
            />
        </ModalForm>
    );
};

