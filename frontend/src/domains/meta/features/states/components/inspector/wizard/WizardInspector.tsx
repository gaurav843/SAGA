/* FILEPATH: frontend/src/domains/meta/features/states/components/inspector/wizard/WizardInspector.tsx */
/* @file Wizard Step Inspector */
/* @author The Engineer */
/* @description The "Command Center" for a Wizard Step.
 * UPDATED: Integrated AI Composer for rapid prototyping.
 */

import React, { useState } from 'react';
import { Form, Input, Button, Divider, Typography, theme, Empty, Space, Tag, message } from 'antd';
import { 
    PlusOutlined, SettingOutlined, DeleteOutlined, 
    ThunderboltOutlined 
} from '@ant-design/icons';
import { ProList } from '@ant-design/pro-components';

import { FieldConfigDrawer } from './FieldConfigDrawer';
import { AIComposer } from './AIComposer'; // ⚡ NEW IMPORT
import type { FlowNodeData } from '../../../types';
import type { SchemaField } from '../../../../governance/types';

const { Text } = Typography;

interface WizardInspectorProps {
    id: string;
    data: FlowNodeData;
    onChange: (newData: any) => void;
    readOnly?: boolean;
    hostFields: SchemaField[];
}

export const WizardInspector: React.FC<WizardInspectorProps> = ({ 
    id, data, onChange, readOnly, hostFields 
}) => {
    const { token } = theme.useToken();
    const [form] = Form.useForm();
    
    // Manage Detail View locally
    const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);

    const formSchema = data.form_schema || [];

    const handleBasicChange = (_: any, allValues: any) => {
        onChange({ ...data, ...allValues });
    };

    const handleAddField = () => {
        const newField = { 
            name: `field_${Date.now()}`, 
            label: 'New Field', 
            component: 'ProFormText', 
            width: 'md',
            required: false 
        };
        const newSchema = [...formSchema, newField];
        onChange({ ...data, form_schema: newSchema });
        setEditingFieldIndex(newSchema.length - 1);
    };

    // ⚡ AI HANDLER: Appends generated fields
    const handleAppendFields = (newFields: any[]) => {
        if (newFields.length === 0) {
            message.warning("I couldn't find any matching fields in the prompt.");
            return;
        }
        
        // Merge strategy: Append to end
        const newSchema = [...formSchema, ...newFields];
        onChange({ ...data, form_schema: newSchema });
        message.success(`✨ Added ${newFields.length} fields from schema.`);
    };

    const handleUpdateField = (index: number, fieldData: any) => {
        const newSchema = [...formSchema];
        newSchema[index] = fieldData;
        onChange({ ...data, form_schema: newSchema });
    };

    const handleDeleteField = (index: number) => {
        const newSchema = formSchema.filter((_: any, i: number) => i !== index);
        onChange({ ...data, form_schema: newSchema });
    };

    return (
        <>
            <Form 
                form={form} 
                layout="vertical" 
                initialValues={{ description: data.description }}
                onValuesChange={handleBasicChange}
                disabled={readOnly}
            >
                <div style={{ marginBottom: 16, padding: 12, background: token.colorFillAlter, borderRadius: 6 }}>
                    <Space align="start">
                        <ThunderboltOutlined style={{ fontSize: 20, color: token.colorPurple, marginTop: 4 }} />
                        <div>
                            <Text strong>Screen Configuration</Text>
                            <div style={{ fontSize: 12, color: token.colorTextSecondary }}>
                                Define the inputs required at this step.
                            </div>
                        </div>
                    </Space>
                </div>

                <Form.Item label="Instructions" name="description">
                    <Input.TextArea 
                        rows={2} 
                        placeholder="Tell the user what to do here..." 
                        style={{ fontSize: 13 }}
                    />
                </Form.Item>

                <Divider style={{ margin: '12px 0' }} />

                {/* ⚡ AI COMPOSER INJECTION */}
                {!readOnly && (
                    <AIComposer 
                        hostFields={hostFields} 
                        onGenerate={handleAppendFields} 
                    />
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text strong style={{ fontSize: 12, textTransform: 'uppercase', color: token.colorTextSecondary }}>
                        Input Fields
                    </Text>
                    <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={handleAddField}>
                        Add Input
                    </Button>
                </div>

                <ProList<any>
                    rowKey="name"
                    dataSource={formSchema}
                    split={false}
                    metas={{
                        title: {
                            render: (_, row) => (
                                <Space>
                                    <Text strong>{row.label}</Text>
                                    <Text type="secondary" style={{ fontSize: 12, fontFamily: 'monospace' }}>
                                        {row.name}
                                    </Text>
                                    {row.required && <Tag color="red" style={{ fontSize: 10, lineHeight: '16px' }}>REQ</Tag>}
                                    {row.name.startsWith('host.') && <Tag color="blue" style={{ fontSize: 10 }}>DB</Tag>}
                                </Space>
                            ),
                        },
                        actions: {
                            render: (_, __, index) => [
                                <Button 
                                    key="edit" type="text" size="small" icon={<SettingOutlined />} 
                                    onClick={() => setEditingFieldIndex(index)}
                                />,
                                <Button 
                                    key="delete" type="text" danger size="small" icon={<DeleteOutlined />} 
                                    onClick={() => handleDeleteField(index)}
                                />
                            ],
                        },
                    }}
                    onRow={(record) => ({
                        style: { 
                            background: token.colorBgContainer, 
                            marginBottom: 8, 
                            borderRadius: 6, 
                            border: `1px solid ${token.colorBorderSecondary}`,
                            padding: '8px 12px'
                        }
                    })}
                />

                {formSchema.length === 0 && (
                    <Empty 
                        image={Empty.PRESENTED_IMAGE_SIMPLE} 
                        description="No inputs on this screen. Use AI or Add Manually." 
                        style={{ margin: '24px 0' }}
                    />
                )}
            </Form>

            <FieldConfigDrawer
                open={editingFieldIndex !== null}
                fieldData={editingFieldIndex !== null ? formSchema[editingFieldIndex] : {}}
                onClose={() => setEditingFieldIndex(null)}
                onSave={(data) => {
                    if (editingFieldIndex !== null) handleUpdateField(editingFieldIndex, data);
                }}
                allFields={formSchema}
                hostFields={hostFields}
            />
        </>
    );
};
