// FILEPATH: frontend/src/domains/meta_v2/features/workflows/components/inspector/TransitionEdge.tsx
// @file: Transition Edge Inspector
// @role: 🧠 Logic Container / 🎨 UI Presentation */
// @author: The Engineer
// @description: Manages the logic connecting two nodes, including events, guards, and side effects.
// @security-level: LEVEL 9 */

import React, { useEffect, useState } from 'react';
import { Form, Typography, theme, Divider, Button, Input } from 'antd';
import { 
    ProForm, 
    ProFormSelect, 
    ProFormList, 
    ProFormDependency, 
    ProFormText 
} from '@ant-design/pro-components';
import { 
    ThunderboltOutlined, 
    SafetyCertificateOutlined,
    RocketOutlined,
    SearchOutlined
} from '@ant-design/icons';

import { logger } from '@/platform/logging';
import { EventRegistryModal } from '../../../../meta/features/states/components/EventRegistryModal';
import type { SchemaField } from '../../../../meta/features/governance/types';

const { Text } = Typography;

interface TransitionEdgeProps {
    id: string;
    data: any;
    onChange: (newData: any) => void;
    readOnly?: boolean;
    hostFields: SchemaField[];
    eventCatalog: any[];
}

/**
 * @description Decoupled V2 inspector for Workflow Edges. [cite: 2988-3027]
 */
export const TransitionEdge: React.FC<TransitionEdgeProps> = ({ 
    id, data, onChange, readOnly, hostFields, eventCatalog 
}) => {
    const { token } = theme.useToken();
    const [form] = Form.useForm();
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);

    // ⚡ SIGNAL TELEMETRY: Component Init
    useEffect(() => {
        logger.whisper("WORKFLOWS", `Mounting Transition Inspector for edge: ${id}`);
        form.setFieldsValue({
            event: data.label || 'NEXT', 
            guard: data.guard,
            actions: data.actions
        });
    }, [id, data, form]);

    const handleValuesChange = (_: any, allValues: any) => {
        logger.trace("INSPECTOR", `Transition properties mutated for ${id}`, { changed: Object.keys(_) });
        onChange(allValues);
    };

    const handleEventSelect = (eventKey: string) => {
        logger.tell("INSPECTOR", `🎯 Trigger Event mapped: ${eventKey}`);
        form.setFieldValue('event', eventKey);
        onChange({ ...data, event: eventKey });
        setIsEventModalOpen(false);
    };

    return (
        <>
            <ProForm
                form={form}
                submitter={false}
                layout="vertical"
                onValuesChange={handleValuesChange}
                disabled={readOnly}
            >
                <div style={{ marginBottom: 16, padding: 12, background: token.colorFillAlter, borderRadius: 6 }}>
                    <Text strong><ThunderboltOutlined /> Transition Logic</Text>
                    <div style={{ fontSize: 12, color: token.colorTextSecondary, marginTop: 4 }}>
                        Define the rules for moving from <b>Source</b> to <b>Target</b>.
                    </div>
                </div>

                <Form.Item label="Trigger Event" name="event" rules={[{ required: true }]}>
                    <Input 
                        readOnly 
                        onClick={() => !readOnly && setIsEventModalOpen(true)}
                        addonAfter={
                            <Button 
                                type="text" 
                                size="small" 
                                icon={<SearchOutlined />} 
                                onClick={() => !readOnly && setIsEventModalOpen(true)} 
                            />
                        }
                        style={{ fontFamily: 'monospace', fontWeight: 'bold', cursor: readOnly ? 'default' : 'pointer' }}
                        placeholder="Select Trigger..."
                    />
                </Form.Item>

                <Divider orientation="left" style={{ fontSize: 12 }}>
                    <SafetyCertificateOutlined /> Guard Conditions
                </Divider>

                <ProFormList
                    name={['guard', 'conditions']}
                    creatorButtonProps={{ creatorButtonText: 'Add Rule', size: 'small', type: 'dashed' }}
                    copyIconProps={false}
                >
                    <ProForm.Group>
                        <ProFormSelect
                            name="field"
                            placeholder="Field"
                            options={hostFields.map(f => ({ label: f.label, value: f.key }))}
                            width="sm"
                        />
                        <ProFormSelect
                            name="op"
                            initialValue="eq"
                            options={[
                                { label: '=', value: 'eq' },
                                { label: '!=', value: 'neq' },
                                { label: '>', value: 'gt' },
                            ]}
                            width="xs"
                        />
                        <ProFormText name="val" placeholder="Value" width="xs" />
                    </ProForm.Group>
                </ProFormList>

                <Divider orientation="left" style={{ fontSize: 12 }}>
                    <RocketOutlined /> Side Effects
                </Divider>

                <ProFormList
                    name="actions"
                    label="Execute Actions"
                    creatorButtonProps={{ creatorButtonText: 'Add Action', size: 'small' }}
                >
                    <ProForm.Group>
                        <ProFormSelect
                            name="type"
                            initialValue="update"
                            options={[
                                { label: 'Update Data', value: 'update' },
                                { label: 'Send Email', value: 'email' },
                                { label: 'Webhook', value: 'webhook' },
                            ]}
                            width="xs"
                        />
                        <ProFormDependency name={['type']}>
                            {({ type }) => type === 'update' ? (
                                <ProFormSelect
                                    name="target"
                                    placeholder="Target Field"
                                    options={hostFields.map(f => ({ label: f.label, value: f.key }))}
                                    width="sm"
                                />
                            ) : (
                                <ProFormText name="target" placeholder="Config..." width="sm" />
                            )}
                        </ProFormDependency>
                    </ProForm.Group>
                </ProFormList>
            </ProForm>

            <EventRegistryModal 
                open={isEventModalOpen} 
                onCancel={() => setIsEventModalOpen(false)} 
                onSelect={handleEventSelect}
                existingEvents={eventCatalog || []}
            />
        </>
    );
};

