/* FILEPATH: frontend/src/domains/meta/features/states/components/inspector/governance/GovernanceEngine.tsx */
/* @file Governance Engine (Rule Builder) */
/* @author The Engineer */
/* @description Visual Logic Builder for Transitions and Guards.
 * UPDATED: Uses 'hostFields' to populate dropdowns for Guard Conditions.
 */

import React from 'react';
import { Card, Collapse, Space, Typography, Tag, Button, theme, Select, Input } from 'antd';
import { 
    ApartmentOutlined, 
    ThunderboltOutlined, 
    LockOutlined,
    LoginOutlined,
    PlusOutlined
} from '@ant-design/icons';
import type { SchemaField } from '../../../../../governance/types';

const { Text } = Typography;

interface GovernanceEngineProps {
    domain: string;
    nodeData: any;
    hostFields: SchemaField[]; // ⚡ CONTEXT
    onUpdate: (data: any) => void;
}

export const GovernanceEngine: React.FC<GovernanceEngineProps> = ({ domain, nodeData, hostFields, onUpdate }) => {
    const { token } = theme.useToken();
    const transitions = nodeData.on || {};

    const collapseItems = Object.entries(transitions).map(([event, target]: [string, any]) => {
        const targetState = typeof target === 'string' ? target : target.target;
        const guards = typeof target === 'string' ? [] : (target.cond || []);

        return {
            key: event,
            label: (
                <Space>
                    <Tag color="blue"><ThunderboltOutlined /> {event}</Tag>
                    <LoginOutlined style={{ color: token.colorTextTertiary }} />
                    <Tag color="green">{targetState}</Tag>
                </Space>
            ),
            children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>Guard Conditions (AND)</Text>
                    </div>
                    
                    {/* ⚡ LOGIC BUILDER (Simplified Read Mode for now) */}
                    {guards.length === 0 ? (
                        <div style={{ 
                            padding: 8, 
                            background: token.colorSuccessBg, 
                            border: `1px dashed ${token.colorSuccessBorder}`,
                            borderRadius: 4, 
                            fontSize: 12,
                            color: token.colorSuccess
                        }}>
                            Always Allowed (No restrictions)
                        </div>
                    ) : (
                        guards.map((guard: any, idx: number) => (
                            <div key={idx} style={{ 
                                padding: 8, 
                                background: token.colorFillQuaternary, 
                                borderRadius: 4,
                                borderLeft: `3px solid ${token.colorWarning}`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8
                            }}>
                                {/* Field */}
                                <Select 
                                    size="small" 
                                    value={guard.field} 
                                    style={{ width: 120 }}
                                    options={hostFields.map(f => ({ label: f.label, value: f.path }))}
                                />
                                {/* Op */}
                                <Select 
                                    size="small"
                                    value={guard.op}
                                    style={{ width: 60 }}
                                    options={[
                                        { label: '=', value: 'eq' },
                                        { label: '!=', value: 'neq' },
                                        { label: '>', value: 'gt' },
                                        { label: '<', value: 'lt' }
                                    ]}
                                />
                                {/* Value */}
                                <Input 
                                    size="small" 
                                    value={guard.value} 
                                    style={{ flex: 1 }} 
                                />
                            </div>
                        ))
                    )}
                    
                    <Button type="dashed" size="small" icon={<PlusOutlined />}>Add Rule</Button>
                </div>
            )
        };
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card 
                size="small" 
                style={{ background: token.colorFillAlter, borderColor: token.colorWarningBorder }}
            >
                <div style={{ display: 'flex', gap: 12 }}>
                    <LockOutlined style={{ fontSize: 24, color: token.colorWarning }} />
                    <div>
                        <Text strong>Governance Node</Text>
                        <div style={{ fontSize: 12, color: token.colorTextSecondary }}>
                            Rules defined here enforce business policy.
                        </div>
                    </div>
                </div>
            </Card>

            <Collapse 
                items={collapseItems} 
                size="small"
                expandIconPosition="end"
                defaultActiveKey={Object.keys(transitions)}
            />

            <Button type="dashed" block icon={<PlusOutlined />}>
                Add Transition
            </Button>
        </div>
    );
};

