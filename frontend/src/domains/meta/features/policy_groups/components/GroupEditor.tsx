/* FILEPATH: frontend/src/domains/meta/features/policy_groups/components/GroupEditor.tsx */
/* @file Group Editor Modal */
/* @author The Engineer */
/* @description A form to Create/Edit Policy Groups.
 * FEATURES:
 * - Auto-Caps for System Key.
 * - Multi-Select Policy Ordering.
 */

import React, { useEffect } from 'react';
import { 
    Modal, Form, Select, Input, Typography, Space, 
    Alert, Tag, theme, Divider
} from 'antd';
import { 
    SolutionOutlined, FileProtectOutlined, NumberOutlined
} from '@ant-design/icons';
import type { PolicyGroup } from '../types';
import type { PolicyDefinition } from '../../switchboard/types';

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface GroupEditorProps {
    open: boolean;
    onClose: () => void;
    availablePolicies: PolicyDefinition[];
    initialValues?: PolicyGroup;
    onSave: (values: any) => Promise<void>;
    isSaving: boolean;
}

export const GroupEditor: React.FC<GroupEditorProps> = ({ 
    open, onClose, availablePolicies, initialValues, onSave, isSaving 
}) => {
    const [form] = Form.useForm();
    const { token } = theme.useToken();

    useEffect(() => {
        if (open) {
            form.resetFields();
            if (initialValues) {
                form.setFieldsValue({
                    key: initialValues.key,
                    name: initialValues.name,
                    description: initialValues.description,
                    policy_keys: initialValues.policy_keys
                });
            }
        }
    }, [open, initialValues]);

    // ⚡ AUTO-CAPS HANDLER
    const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.toUpperCase().replace(/ /g, '_');
        form.setFieldValue('key', val);
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            await onSave(values);
        } catch (info) {
            // Validation failed
        }
    };

    return (
        <Modal
            title={
                <Space>
                    <SolutionOutlined style={{ color: token.colorPrimary }} />
                    <span>{initialValues ? 'Edit Bundle' : 'Create Policy Bundle'}</span>
                </Space>
            }
            open={open}
            onOk={handleOk}
            onCancel={onClose}
            confirmLoading={isSaving}
            okText={initialValues ? "Update" : "Create"}
            width={600}
        >
            <Form form={form} layout="vertical">
                <Alert 
                    message="Bundle Logic" 
                    description="Policies in a group are executed in the sequence they appear below." 
                    type="info" 
                    showIcon 
                    style={{ marginBottom: 24 }}
                />

                <Form.Item 
                    name="name" 
                    label="Bundle Name"
                    rules={[{ required: true, message: 'Required' }]}
                >
                    <Input placeholder="e.g. Standard Security Pack" />
                </Form.Item>

                <Form.Item 
                    name="key" 
                    label="System Key"
                    rules={[
                        { required: true, message: 'Required' },
                        { pattern: /^[A-Z0-9_]+$/, message: 'UPPERCASE_UNDERSCORE_ONLY' }
                    ]}
                    help="Unique identifier (e.g. SECURITY_V1)"
                >
                    <Input 
                        prefix={<NumberOutlined style={{ color: token.colorTextSecondary }} />} 
                        placeholder="SECURITY_BUNDLE" 
                        disabled={!!initialValues} 
                        onChange={handleKeyChange} // ⚡ AUTO CAPS
                    />
                </Form.Item>

                <Form.Item name="description" label="Description">
                    <TextArea rows={2} placeholder="What does this bundle enforce?" />
                </Form.Item>

                <Divider orientation="left" style={{ fontSize: 12, color: token.colorTextSecondary }}>
                    Composition
                </Divider>

                <Form.Item 
                    name="policy_keys" 
                    label="Included Policies (Ordered)"
                    rules={[{ required: true, message: 'Select at least one policy' }]}
                >
                    <Select 
                        mode="multiple" 
                        placeholder="Select policies..." 
                        style={{ width: '100%' }}
                        optionLabelProp="label"
                        filterOption={(input, option) => 
                            (option?.label as string ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                    >
                        {availablePolicies.filter(p => p.is_active).map(p => (
                            <Option key={p.key} value={p.key} label={p.name}>
                                <Space>
                                    <FileProtectOutlined />
                                    {p.name}
                                    <Tag style={{ fontSize: 10 }}>v{p.version_major}.{p.version_minor}</Tag>
                                </Space>
                            </Option>
                        ))}
                    </Select>
                </Form.Item>
            </Form>
        </Modal>
    );
};

