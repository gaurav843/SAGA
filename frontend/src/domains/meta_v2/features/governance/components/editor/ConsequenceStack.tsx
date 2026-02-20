// /* FILEPATH: frontend/src/domains/meta_v2/features/governance/components/editor/ConsequenceStack.tsx */
// @file: Consequence Stack Manager
// @role: 🎨 UI Presentation / 🧠 Logic Container */
// @author: The Engineer
// @description: Renders the action stack for a rule. Driven by dynamic Backend Capabilities (Dumb UI Pattern).
// @security-level: LEVEL 9 (UI Safe) */
// @invariant: Avoids <Option> elements to prevent AntD click interception bugs. */

import React, { useMemo } from 'react';
import { Button, Select, Input, Typography, Space, theme, Empty } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

import { logger } from '@/platform/logging/Narrator';
import { IconFactory } from '@/platform/ui/icons/IconFactory';
import { useCapabilities } from '@/_kernel/CapabilitiesContext';

import type { Consequence, SchemaField } from '../../../../../meta/features/governance/types';

const { Text } = Typography;

interface ConsequenceStackProps {
    ruleIdx: number;
    consequences: Consequence[];
    schemaFields: SchemaField[];
    onAdd: (ruleIdx: number) => void;
    onRemove: (ruleIdx: number, consIdx: number) => void;
    onUpdate: (ruleIdx: number, consIdx: number, field: string, val: any) => void;
}

export const ConsequenceStack: React.FC<ConsequenceStackProps> = ({
    ruleIdx, consequences, schemaFields, onAdd, onRemove, onUpdate
}) => {
    const { token } = theme.useToken();
    
    // ⚡ THE DUMB UI LINK: Read Actions directly from the Kernel's Context Schema
    const capabilities = useCapabilities().getCapabilities();
    const actions = capabilities?.actions || [];

    // Derived options for target fields
    const hostFields = schemaFields.filter(f => f.group === 'HOST');

    // ⚡ FIX: Use options array to prevent AntD click interception on complex DOM nodes
    const actionOptions = useMemo(() => {
        return actions.map((group: any) => ({
            label: group.label,
            options: group.options.map((opt: any) => ({
                label: (
                    <Space style={{ pointerEvents: 'none' }}> {/* pointerEvents: 'none' prevents interception */}
                        <IconFactory icon={opt.icon} style={{ color: opt.color }} />
                        {opt.label}
                    </Space>
                ),
                value: opt.value
            }))
        }));
    }, [actions]);

    const targetFieldOptions = useMemo(() => {
        return hostFields.map(f => ({
            label: f.label,
            value: f.key.replace('host.', '')
        }));
    }, [hostFields]);

    return (
        <div style={{ background: token.colorFillAlter, padding: 12, borderRadius: '0 0 8px 8px', border: `1px solid ${token.colorBorderSecondary}`, borderTop: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text strong style={{ fontSize: 12, color: token.colorTextSecondary }}>CONSEQUENCES (EXECUTED IN ORDER)</Text>
                <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => onAdd(ruleIdx)}>Add Effect</Button>
            </div>

            {(!consequences || consequences.length === 0) ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No consequences defined. This rule does nothing." style={{ margin: '8px 0' }} />
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {consequences.map((cons, cIdx) => (
                        <div key={cons.id} style={{ display: 'flex', gap: 8, alignItems: 'center', background: token.colorBgContainer, padding: 8, borderRadius: 4, border: `1px solid ${token.colorBorder}` }}>
                            
                            {/* ⚡ DYNAMIC CAPABILITIES SELECTOR */}
                            <Select 
                                value={cons.type} 
                                style={{ width: 220 }} 
                                options={actionOptions}
                                onChange={v => {
                                    logger.trace("UI", `Changed consequence type to ${v}`, { ruleIdx, cIdx });
                                    onUpdate(ruleIdx, cIdx, 'type', v);
                                }}
                                dropdownMatchSelectWidth={false}
                            />

                            {/* DYNAMIC PARAMS */}
                            <div style={{ flex: 1, display: 'flex', gap: 8 }}>
                                {/* MESSAGE */}
                                {['BLOCK', 'WARN', 'REQUIRE'].includes(cons.type) && (
                                    <Input 
                                        placeholder="Message to user..." 
                                        value={cons.params?.message} 
                                        onChange={e => onUpdate(ruleIdx, cIdx, 'params.message', e.target.value)} 
                                    />
                                )}

                                {/* TARGET FIELD */}
                                {['SET_VALUE', 'HIDE', 'SHOW', 'DISABLE', 'ENABLE', 'REQUIRE'].includes(cons.type) && (
                                    <Select 
                                        placeholder="Target Field"
                                        style={{ minWidth: 150 }}
                                        showSearch
                                        options={targetFieldOptions}
                                        value={cons.params?.target_field}
                                        onChange={v => {
                                            logger.trace("UI", `Selected target field for consequence`, { field: v });
                                            onUpdate(ruleIdx, cIdx, 'params.target_field', v);
                                        }}
                                    />
                                )}

                                {/* VALUE */}
                                {cons.type === 'SET_VALUE' && (
                                    <Input 
                                        placeholder="Value" 
                                        value={cons.params?.value} 
                                        onChange={e => onUpdate(ruleIdx, cIdx, 'params.value', e.target.value)} 
                                    />
                                )}

                                {/* EVENT */}
                                {cons.type === 'TRIGGER_EVENT' && (
                                    <Input 
                                        placeholder="Event Key (e.g. USER:RISK)" 
                                        value={cons.params?.event_key} 
                                        onChange={e => onUpdate(ruleIdx, cIdx, 'params.event_key', e.target.value)} 
                                    />
                                )}
                            </div>

                            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => onRemove(ruleIdx, cIdx)} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
