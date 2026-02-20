/* FILEPATH: frontend/src/domains/meta/features/switchboard/components/GroupPolicyModal.tsx */
/* @file Group Policy Modal (Tagging Engine) */
/* @author The Engineer */
/* @description Allows users to bulk-assign Tags to Policies, effectively creating "Policy Groups".
 * FEATURES:
 * - Multi-Select Policies.
 * - Create/Select Tag.
 * - Bulk Updates via 'useGovernance'.
 * UPDATED: Uses Centralized Kernel Config via Alias.
 */

import React, { useState } from 'react';
import { 
    Modal, Form, Select, Input, Typography, Space, 
    Alert, Button, theme, message 
} from 'antd';
import { 
    TagsOutlined, FileProtectOutlined
} from '@ant-design/icons';
import type { PolicyDefinition } from '../types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
// ⚡ FRACTAL IMPORT
import { API_BASE_URL } from '@kernel/config';

const { Text } = Typography;
const { Option } = Select;

interface GroupPolicyModalProps {
    open: boolean;
    onClose: () => void;
    policies: PolicyDefinition[];
}

export const GroupPolicyModal: React.FC<GroupPolicyModalProps> = ({ 
    open, onClose, policies 
}) => {
    const [form] = Form.useForm();
    const { token } = theme.useToken();
    const queryClient = useQueryClient();
    const [isSaving, setIsSaving] = useState(false);

    // ⚡ MUTATION: Patch Policy
    const updatePolicyMutation = useMutation({
        mutationFn: async ({ id, tags }: { id: number, tags: string[] }) => {
            // ⚡ GATEWAY: Use standardized base
            return axios.patch(`${API_BASE_URL}/api/v1/meta/policies/${id}`, { tags });
        }
    });

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const selectedIds: number[] = values.policy_ids;
            const newTag: string = values.tag_name;

            setIsSaving(true);

            // ⚡ BULK OPERATION: Update each selected policy
            // We append the new tag to existing tags to avoid overwriting.
            const updates = selectedIds.map(async (id) => {
                const policy = policies.find(p => p.id === id);
                if (!policy) return;

                const currentTags = policy.tags || [];
            
                if (!currentTags.includes(newTag)) {
                    await updatePolicyMutation.mutateAsync({
                        id,
                        tags: [...currentTags, newTag]
                    });
                }
            });

            await Promise.all(updates);

            message.success(`Grouped ${selectedIds.length} policies under "${newTag}"`);
            queryClient.invalidateQueries({ queryKey: ['meta', 'policies'] }); // Refresh lists
            form.resetFields();
            onClose();

        } catch (error) {
            console.error(error);
            message.error("Failed to group policies.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            title={
                <Space>
                    <TagsOutlined style={{ color: token.colorPrimary }} />
                    <span>Create Policy Group</span>
                </Space>
            }
            open={open}
            onOk={handleOk}
            onCancel={onClose}
            confirmLoading={isSaving}
            okText="Create Group"
            width={600}
        >
            <Form form={form} layout="vertical">
                <Alert 
                    message="What is a Policy Group?" 
                    description="A Group is simply a Tag (e.g. 'SECURITY') shared by multiple policies. You can enforce the entire group at once in the Switchboard." 
                    type="info" 
                    showIcon 
                    style={{ marginBottom: 24 }}
                />

                <Form.Item 
                    name="tag_name" 
                    label="Group Tag Name"
                    rules={[{ required: true, message: 'Please enter a tag name' }]}
                    help="e.g. SECURITY_BUNDLE, GDPR_COMPLIANCE, NIGHTLY_JOB"
                >
                    <Input 
                        prefix={<TagsOutlined style={{ color: token.colorTextSecondary }} />} 
                        placeholder="Enter unique tag..." 
                    />
                </Form.Item>

                <Form.Item 
                    name="policy_ids" 
                    label="Select Policies to Group"
                    rules={[{ required: true, message: 'Select at least one policy' }]}
                >
                    <Select 
                        mode="multiple" 
                        placeholder="Choose policies..." 
                        optionLabelProp="label"
                        style={{ width: '100%' }}
                        filterOption={(input, option) => 
                            (option?.label as string ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                    >
                        {policies.filter(p => p.is_active).map(p => (
                            <Option key={p.id} value={p.id} label={p.name}>
                                <Space>
                                    <FileProtectOutlined />
                                    {p.name}
                                    {p.tags && p.tags.length > 0 && (
                                        <Text type="secondary" style={{ fontSize: 10 }}>
                                            ({p.tags.join(', ')})
                                        </Text>
                                    )}
                                  </Space>
                            </Option>
                        ))}
                    </Select>
                </Form.Item>
            </Form>
        </Modal>
    );
};
