// FILEPATH: frontend/src/domains/meta_v2/features/workflows/components/WorkflowGenesis.tsx
// @file: Workflow Creation Drawer (V2)
// @role: 🎨 UI Presentation / 🧠 Logic Container */
// @author: The Engineer
// @description: UI for defining the root properties of a new State Machine. Rewired to V2.
// @security-level: LEVEL 9 (Data Validation) */

import React, { useState, useEffect } from 'react';
import { Drawer, Form, Input, Button, Select, Space, Typography, theme, Divider, Alert } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

import { logger } from '@/platform/logging/Narrator';

// ⚡ LOCAL V2 IMPORTS (Severed from V1 Meta)
import { useWorkflows } from '../hooks/useWorkflows';
import { useDomainSchema } from '../hooks/useDomainSchema';
import { WORKFLOW_TYPES } from '../constants';

const { Text } = Typography;

interface WorkflowGenesisProps {
    open: boolean;
    onClose: () => void;
    domain: any; // ⚡ FIX: Accept any context shape and extract the key dynamically
    onSuccess?: (scopeKey: string) => void;
}

export const WorkflowGenesis: React.FC<WorkflowGenesisProps> = ({ open, onClose, domain, onSuccess }) => {
    const { token } = theme.useToken();
    const [form] = Form.useForm();
    
    // ⚡ ROBUST DOMAIN RESOLUTION
    const domainKey = typeof domain === 'string' ? domain : domain?.key || '';

    // ⚡ V2 HOOKS
    const { updateWorkflow } = useWorkflows(domainKey);
    const { fields: schemaFields } = useDomainSchema(domainKey);

    const [selectedType, setSelectedType] = useState<string>('GOVERNANCE');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form on open
    useEffect(() => {
        if (open) {
            form.resetFields();
            setSelectedType('GOVERNANCE'); // Default
        }
    }, [open, form]);

    const handleCreate = async (values: any) => {
        setIsSubmitting(true);
        try {
            logger.whisper("WORKFLOWS", "Initializing new workflow definition");

            const payload = {
                domain: domainKey,
                scope: values.scope_key,
                name: values.name,
                governed_field: values.governed_field || 'status',
                type: values.type,
                definition: {
                    id: values.scope_key,
                    initial: 'start',
                    states: {
                        start: {
                            type: 'initial',
                            meta: { nodeType: 'standard', x: 250, y: 100 }
                        }
                    }
                }
            };

            // V2 uses 'updateWorkflow' (which runs POST) for creation
            await updateWorkflow(payload);
            
            logger.tell("WORKFLOWS", `✅ Created new workflow: ${values.scope_key}`);
            onSuccess?.(values.scope_key);
        } catch (error) {
            logger.scream("WORKFLOWS", "Failed to create workflow", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Drawer
            title="Initialize New Workflow"
            width={480}
            onClose={onClose}
            open={open}
            extra={
                <Space>
                    <Button onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                    <Button type="primary" onClick={() => form.submit()} loading={isSubmitting}>
                        Initialize
                    </Button>
                </Space>
            }
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleCreate}
                initialValues={{ type: 'GOVERNANCE' }}
                onValuesChange={(changedValues) => {
                    if (changedValues.type) {
                        setSelectedType(changedValues.type);
                    }
                    if (changedValues.name && !form.isFieldTouched('scope_key')) {
                        const autoSlug = changedValues.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
                        form.setFieldsValue({ scope_key: autoSlug });
                    }
                }}
            >
                <Alert 
                    message={`Target Domain: ${domainKey}`} 
                    type="info" 
                    showIcon 
                    style={{ marginBottom: 24 }} 
                />

                <Form.Item
                    name="name"
                    label="Workflow Name"
                    rules={[{ required: true, message: 'Please provide a human-readable name.' }]}
                    tooltip="e.g. 'User Onboarding', 'Invoice Approval'"
                >
                    <Input placeholder="e.g., Document Approval" />
                </Form.Item>

                <Form.Item
                    name="scope_key"
                    label="Technical Scope Key"
                    rules={[
                        { required: true, message: 'Scope key is required.' },
                        { pattern: /^[A-Z0-9_]+$/, message: 'UPPERCASE_AND_UNDERSCORES_ONLY' }
                    ]}
                    tooltip="The permanent technical identifier. Cannot be changed later."
                >
                    <Input placeholder="e.g., DOC_APPROVAL" />
                </Form.Item>

                <Divider />

                <Form.Item
                    name="type"
                    label="Workflow Classification"
                    rules={[{ required: true }]}
                >
                    <Select>
                        {WORKFLOW_TYPES.map(t => (
                            <Select.Option key={t.value} value={t.value}>
                                <Space>
                                    <span style={{ color: token[t.color as keyof typeof token] as string }}>{t.icon}</span>
                                    {t.label}
                                </Space>
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <div style={{ background: token.colorFillAlter, padding: 12, borderRadius: 8, marginBottom: 24 }}>
                    <Space align="start">
                        <InfoCircleOutlined style={{ color: token.colorPrimary, marginTop: 4 }} />
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            {WORKFLOW_TYPES.find(t => t.value === selectedType)?.description}
                        </Text>
                    </Space>
                </div>

                {selectedType === 'GOVERNANCE' && (
                    <Form.Item
                        name="governed_field"
                        label="Target DB Column"
                        tooltip="Which column does this state machine control?"
                        rules={[{ required: true, message: 'Must specify the governed column.' }]}
                        initialValue="status"
                    >
                        <Select showSearch placeholder="Select a column (e.g. 'status')">
                            <Select.Option value="status">status (Default)</Select.Option>
                            <Select.Option value="state">state</Select.Option>
                            <Select.Option value="phase">phase</Select.Option>
                            {schemaFields.map((f: any) => (
                                <Select.Option key={f.key} value={f.key}>
                                    {f.key} <Text type="secondary" style={{ fontSize: 12 }}>({f.data_type})</Text>
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                )}
            </Form>
        </Drawer>
    );
};

