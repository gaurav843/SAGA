/* FILEPATH: frontend/src/domains/meta/features/switchboard/components/AssignmentModal.tsx */
/* @file Assignment Modal (Groups Enabled) */
/* @author The Engineer */
/* @description Modal to bind a Policy OR a Group to a Domain Context.
 * UPDATED: Replaced 'Tag' source with 'Group' source.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
    Modal, Form, Select, Input, Divider, Typography, Space, 
    Segmented, InputNumber, theme 
} from 'antd';
import { 
    PartitionOutlined, GlobalOutlined, ThunderboltOutlined, 
    FieldTimeOutlined, DatabaseOutlined, 
    AppstoreOutlined, FileProtectOutlined
} from '@ant-design/icons';
import type { PolicyDefinition, BindingDraft, BindingScope } from '../types';
import type { PolicyGroup } from '../../policy_groups/types';

import { useMetaContext } from '../../../_kernel/MetaContext';

const { Text } = Typography;
const { Option } = Select;

interface AssignmentModalProps {
    open: boolean;
    onClose: () => void;
    onAssign: (draft: BindingDraft) => Promise<void>;
    policies: PolicyDefinition[];
    groups: PolicyGroup[]; // ⚡ NEW: Groups Data
    loading: boolean;
}

type SourceType = 'POLICY' | 'GROUP';

export const AssignmentModal: React.FC<AssignmentModalProps> = ({ 
    open, onClose, onAssign, policies, groups, loading 
}) => {
    const [form] = Form.useForm();
    const { domainList } = useMetaContext(); 
    const { token } = theme.useToken();
    
    // UI State
    const [sourceType, setSourceType] = useState<SourceType>('POLICY');
    const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
    const [scope, setScope] = useState<string>('DOMAIN');

    const activePolicies = useMemo(() => policies.filter(p => p.is_active), [policies]);
    const activeGroups = useMemo(() => groups.filter(g => g.is_active), [groups]);

    const contextOptions = useMemo(() => {
        if (!selectedDomain) return [];
        const domainDef = domainList.find(d => d.key === selectedDomain);
        if (!domainDef) return [];
        return domainDef.scopes.map(s => ({ label: s.label, value: s.key }));
    }, [selectedDomain, domainList]);

    useEffect(() => {
        if (open) {
            form.resetFields();
            setScope('DOMAIN');
            setSelectedDomain(null);
            setSourceType('POLICY');
        }
    }, [open]);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            
            const payload: BindingDraft = {
                binding_type: 'ENTITY', // Enforced
                target_domain: values.target_domain,
                target_scope: values.target_scope as BindingScope,
                target_context: values.target_context || undefined,
                priority: values.priority || 10,
                is_active: true,
                // ⚡ LOGIC: Send either ID or GroupID
                policy_id: sourceType === 'POLICY' ? values.policy_id : undefined,
                policy_group_id: sourceType === 'GROUP' ? values.policy_group_id : undefined
            };

            await onAssign(payload);
            onClose();
        } catch (info) { }
    };

    const segmentedStyle = {
        background: token.colorBgLayout,
        border: `1px solid ${token.colorBorderSecondary}`,
        padding: 4
    };

    return (
        <Modal
            title={<Space><PartitionOutlined style={{ color: token.colorPrimary }} /><span>Enforce Policy</span></Space>}
            open={open}
            onOk={handleOk}
            onCancel={onClose}
            confirmLoading={loading}
            okText="Bind"
            width={700}
            styles={{ body: { padding: '24px 0 0 0' } }}
        >
            <Form form={form} layout="vertical" initialValues={{ target_scope: 'DOMAIN', priority: 10 }}>
                
                {/* === SECTION 1: THE SOURCE (What) === */}
                <div style={{ padding: '0 24px' }}>
                    <Divider orientation="left" style={{ marginTop: 0, fontSize: 12, color: token.colorTextSecondary }}>SOURCE (What)</Divider>
                    <div style={{ marginBottom: 16 }}>
                        <Segmented 
                            value={sourceType} 
                            onChange={val => setSourceType(val as SourceType)}
                            block
                            style={segmentedStyle}
                            options={[
                                { label: 'Single Policy', value: 'POLICY', icon: <FileProtectOutlined /> },
                                { label: 'Policy Bundle', value: 'GROUP', icon: <AppstoreOutlined /> }
                            ]}
                        />
                    </div>

                    {sourceType === 'POLICY' ? (
                        <Form.Item name="policy_id" rules={[{ required: true, message: 'Select a policy' }]}>
                            <Select showSearch placeholder="Select a specific policy..." optionLabelProp="label">
                                {activePolicies.map(p => (
                                    <Option key={p.id} value={p.id} label={p.name}>
                                        <Space direction="vertical" size={0}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Text strong>{p.name}</Text>
                                            </div>
                                            <Text type="secondary" style={{ fontSize: 11 }}>{p.description}</Text>
                                        </Space>
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    ) : (
                        <Form.Item name="policy_group_id" rules={[{ required: true, message: 'Select a bundle' }]}>
                            <Select showSearch placeholder="Select a policy bundle..." optionLabelProp="label">
                                {activeGroups.map(g => (
                                    <Option key={g.id} value={g.id} label={g.name}>
                                        <Space direction="vertical" size={0}>
                                            <Text strong>{g.name}</Text>
                                            <Text type="secondary" style={{ fontSize: 11 }}>
                                                Contains {g.policy_keys.length} policies
                                            </Text>
                                        </Space>
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    )}
                </div>

                {/* === SECTION 2: THE TARGET (Where) === */}
                <div style={{ padding: '0 24px' }}>
                    <Divider orientation="left" style={{ fontSize: 12, color: token.colorTextSecondary }}>TARGET (Where)</Divider>
                    
                    <div style={{ display: 'flex', gap: 16 }}>
                        <Form.Item name="target_domain" label="Domain" style={{ flex: 1 }} rules={[{ required: true }]}>
                            <Select placeholder="Select Domain..." showSearch onChange={setSelectedDomain}>
                                {domainList.map(d => (
                                    <Option key={d.key} value={d.key}><DatabaseOutlined /> {d.label}</Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item name="target_scope" label="Scope" style={{ flex: 1 }}>
                            <Select onChange={setScope}>
                                <Option value="DOMAIN">Domain Wide</Option>
                                <Option value="PROCESS">Process</Option>
                                <Option value="TRANSITION">Transition</Option>
                            </Select>
                        </Form.Item>
                    </div>

                    {(scope === 'PROCESS' || scope === 'TRANSITION') && (
                        <Form.Item name="target_context" label="Context" rules={[{ required: true }]}>
                            {scope === 'PROCESS' && contextOptions.length > 0 ? (
                                <Select options={contextOptions} placeholder="Select Process..." />
                            ) : (
                                <Input placeholder={scope === 'TRANSITION' ? "e.g. APPROVED" : "Context Key"} />
                            )}
                        </Form.Item>
                    )}

                    <Form.Item name="priority" label="Priority (Higher wins)">
                        <InputNumber style={{ width: '100%' }} />
                    </Form.Item>
                </div>
            </Form>
        </Modal>
    );
};

