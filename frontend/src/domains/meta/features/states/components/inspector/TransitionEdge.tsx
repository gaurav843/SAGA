/* FILEPATH: frontend/src/domains/meta/features/states/components/inspector/TransitionEdge.tsx */
/* @file Edge Inspector (Transition Logic) */
/* @author The Engineer */
/* @description Configuration for the connection between two nodes.
 * UPDATED: Integrated EventRegistryModal for "Smart Event Selection".
 */

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

import type { SchemaField } from '../../../governance/types';
import { EventRegistryModal } from '../EventRegistryModal'; // ⚡ NEW IMPORT

const { Text } = Typography;

interface TransitionEdgeProps {
    id: string;
    data: any;
    onChange: (newData: any) => void;
    readOnly?: boolean;
    hostFields: SchemaField[];
    eventCatalog: any[];
}

export const TransitionEdge: React.FC<TransitionEdgeProps> = ({ 
    id, data, onChange, readOnly, hostFields, eventCatalog 
}) => {
    const { token } = theme.useToken();
    const [form] = Form.useForm();
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);

    useEffect(() => {
        form.setFieldsValue({
            event: data.label || 'NEXT', 
            guard: data.guard,
            actions: data.actions
        });
    }, [data, form]);

    const handleValuesChange = (_: any, allValues: any) => {
        onChange(allValues);
    };

    const handleEventSelect = (eventKey: string) => {
        form.setFieldValue('event', eventKey);
        onChange({ ...data, event: eventKey }); // Trigger immediate update
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

                {/* ⚡ SMART EVENT SELECTOR */}
                <Form.Item label="Trigger Event" name="event" rules={[{ required: true }]}>
                    <Input 
                        readOnly 
                        onClick={() => setIsEventModalOpen(true)}
                        addonAfter={
                            <Button 
                                type="text" 
                                size="small" 
                                icon={<SearchOutlined />} 
                                onClick={() => setIsEventModalOpen(true)} 
                            />
                        }
                        style={{ fontFamily: 'monospace', fontWeight: 'bold', cursor: 'pointer' }}
                        placeholder="Select Trigger..."
                    />
                </Form.Item>

                <Divider orientation="left" style={{ fontSize: 12 }}>
                    <SafetyCertificateOutlined /> Guard Conditions
                </Divider>

                <div style={{ background: token.colorFillQuaternary, padding: 8, borderRadius: 4, marginBottom: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Only allow this transition if...
                    </Text>
                </div>

                <ProFormList
                    name={['guard', 'conditions']}
                    creatorButtonProps={{ creatorButtonText: 'Add Rule', size: 'small', type: 'dashed' }}
                    copyIconProps={false}
                >
                    <ProForm.Group>
                        <ProFormSelect
                            name="field"
                            placeholder="Field"
                            options={hostFields.map(f => ({ label: f.label, value: f.path }))}
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
                    tooltip="Updates to perform when this transition happens successfully."
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
                                    options={hostFields.map(f => ({ label: f.label, value: f.path }))}
                                    width="sm"
                                />
                            ) : (
                                <ProFormText name="target" placeholder="Config..." width="sm" />
                            )}
                        </ProFormDependency>
                    </ProForm.Group>
                </ProFormList>

            </ProForm>

            {/* ⚡ MODAL INJECTION */}
            <EventRegistryModal 
                open={isEventModalOpen} 
                onCancel={() => setIsEventModalOpen(false)} 
                onSelect={handleEventSelect}
                existingEvents={eventCatalog || []}
            />
        </>
    );
};

