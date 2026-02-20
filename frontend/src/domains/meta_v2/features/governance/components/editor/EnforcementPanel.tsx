// FILEPATH: frontend/src/domains/meta_v2/features/governance/components/editor/EnforcementPanel.tsx
// @file: Enforcement Manager (Jurisdiction)
// @role: 🎨 UI Presentation / 🧠 Logic Container */
// @author: The Engineer
// @description: UI for binding a Policy to a Context.
// FEATURES:
// List active bindings.
// Add new binding (Domain/Scope/Event).
// Toggle active state.

// @security-level: LEVEL 9 (UI Safe) */

import React, { useState } from 'react';
import { Card, List, Button, Tag, Select, InputNumber, Switch, Typography, Space, Row, Col, Empty, theme } from 'antd';
import { PlusOutlined, DeleteOutlined, LinkOutlined, GlobalOutlined, ThunderboltOutlined, FieldTimeOutlined } from '@ant-design/icons';

import { logger } from '@/platform/logging/Narrator';
import { usePolicyBindings } from '../../hooks/usePolicyBindings';
import type { Policy } from '../../../../../meta/features/governance/types';
import { BindingType } from '@/api';

const { Text } = Typography;
const { Option } = Select;

interface EnforcementPanelProps {
    policy: Policy;
    domain: string;
}

export const EnforcementPanel: React.FC<EnforcementPanelProps> = ({ policy, domain }) => {
    const { token } = theme.useToken();
    const { bindings, createBinding, updateBinding, deleteBinding, isCreating } = usePolicyBindings(domain);

    // Filter bindings for *this* policy
    const policyBindings = bindings.filter(b => b.policy_id === policy.id);

    // State for New Binding (Transient form state, does not need URL sync)
    const [scope, setScope] = useState<string>('DOMAIN');
    const [context, setContext] = useState<string>(''); // e.g. Event Name
    const [priority, setPriority] = useState<number>(10);

    const handleAdd = async () => {
        if (!policy.id) {
            logger.warn("GOVERNANCE", "Attempted to bind an unsaved policy.");
            return;
        }

        logger.tell("USER", `👉 Adding Enforcement Binding for ${domain}:${scope}`);
        
        await createBinding({
            policy_id: policy.id,
            policy_group_id: null, 
            binding_type: BindingType.ENTITY,
            target_domain: domain,
            target_scope: scope as any, // Alignment with SDK ScopeType
            target_context: context || undefined,
            priority,
            is_active: true
        });
        
        setContext(''); // Reset context on success
    };

    return (
        <Card 
            size="small" 
            title={
                <Space>
                    <LinkOutlined style={{ color: token.colorPrimary }} />
                    <span>Enforcement Jurisdiction</span>
                </Space>
            }
            style={{ marginTop: 24, borderLeft: `4px solid ${token.colorSuccess}` }}
        >
            <div style={{ marginBottom: 16, padding: 12, background: token.colorFillAlter, borderRadius: 6 }}>
                <Row gutter={8} align="middle">
                    <Col span={8}>
                        <Select 
                            value={scope} 
                            onChange={(val) => {
                                setScope(val);
                                logger.trace("UI", `Scope changed to ${val}`, { val });
                            }} 
                            style={{ width: '100%' }}
                        >
                            <Option value="DOMAIN"><Space><GlobalOutlined /> Domain Wide</Space></Option>
                            <Option value="PROCESS"><Space><ThunderboltOutlined /> Specific Process</Space></Option>
                            <Option value="EVENT"><Space><FieldTimeOutlined /> On Event</Space></Option>
                        </Select>
                    </Col>
                    <Col span={10}>
                        <Select
                            style={{ width: '100%' }}
                            value={context}
                            onChange={setContext}
                            placeholder={scope === 'DOMAIN' ? 'Global (All Events)' : 'Select Context...'}
                            disabled={scope === 'DOMAIN'}
                            allowClear
                            mode={scope === 'EVENT' ? 'tags' : undefined}
                        >
                            <Option value="SAVE">On Save</Option>
                            <Option value="DELETE">On Delete</Option>
                            <Option value="LOGIN">Auth: Login</Option>
                            <Option value="REGISTER">Auth: Register</Option>
                        </Select>
                    </Col>
                    <Col span={4}>
                        <InputNumber 
                            placeholder="Pri" 
                            value={priority} 
                            onChange={(v) => setPriority(v || 0)} 
                            style={{ width: '100%' }}
                        />
                    </Col>
                    <Col span={2}>
                        <Button 
                            type="primary" 
                            icon={<PlusOutlined />} 
                            onClick={handleAdd} 
                            loading={isCreating}
                        />
                    </Col>
                </Row>
            </div>

            <List
                dataSource={policyBindings}
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Not enforced anywhere." /> }}
                renderItem={item => (
                    <List.Item
                        actions={[
                            <Switch 
                                key="switch"
                                size="small" 
                                checked={item.is_active} 
                                onChange={(c) => {
                                    logger.whisper("USER", `Toggled binding ${item.id} to ${c ? 'Active' : 'Inactive'}`);
                                    updateBinding({ id: item.id, data: { is_active: c } });
                                }} 
                            />,
                            <Button 
                                key="delete"
                                type="text" 
                                danger 
                                size="small" 
                                icon={<DeleteOutlined />} 
                                onClick={() => {
                                    logger.whisper("USER", `Deleting binding ${item.id}`);
                                    deleteBinding(item.id);
                                }} 
                            />
                        ]}
                    >
                        <List.Item.Meta
                            title={
                                <Space>
                                    <Tag color="blue">{item.target_scope}</Tag>
                                    <Text strong>{item.target_context || 'GLOBAL'}</Text>
                                </Space>
                            }
                            description={
                                <Space size="small" style={{ fontSize: 10 }}>
                                    <Text type="secondary">Priority: {item.priority}</Text>
                                    <Text type="secondary">•</Text>
                                    <Text type="secondary">Domain: {item.target_domain}</Text>
                                </Space>
                            }
                        />
                    </List.Item>
                )}
            />
        </Card>
    );
};

