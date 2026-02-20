// FILEPATH: frontend/src/domains/meta/features/states/components/inspector/WizardNode.tsx
// @file: Wizard Step Editor
// @author: The Engineer
// @description: Specialized editor for UI Workflows with Space-Optimized Field Cards.
// @security-level: LEVEL 9 (UI Safe) */
// @invariant: Must write to 'meta' key to persist in XState. */

import React, { useEffect } from 'react';
import { Form, Input, Select, Switch, Button, Divider, Typography, theme, ColorPicker, Card, Space, Tooltip } from 'antd';
import { 
    PlusOutlined, 
    DeleteOutlined,
    FontSizeOutlined, 
    LockOutlined, 
    CheckSquareOutlined, 
    CalendarOutlined, 
    FileTextOutlined,
    MenuOutlined,
    ThunderboltOutlined,
    UnorderedListOutlined,
    TagOutlined
} from '@ant-design/icons';

const { Text } = Typography;

interface WizardNodeProps {
    id: string;
    data: any; // Backend State Definition
    onChange: (newData: any) => void;
    readOnly?: boolean;
}

// ⚡ RICH COMPONENT REGISTRY
const WIZARD_COMPONENTS = [
    { label: 'Text Input', value: 'ProFormText', icon: <FontSizeOutlined /> },
    { label: 'Password', value: 'ProFormText.Password', icon: <LockOutlined /> },
    { label: 'Text Area', value: 'ProFormTextArea', icon: <FileTextOutlined /> },
    { label: 'Checkbox', value: 'ProFormCheckbox', icon: <CheckSquareOutlined /> },
    { label: 'Date Picker', value: 'ProFormDatePicker', icon: <CalendarOutlined /> },
    { label: 'Select (Dropdown)', value: 'ProFormSelect', icon: <MenuOutlined /> },
    { label: 'Description List', value: 'DESCRIPTION_LIST', icon: <UnorderedListOutlined /> },
    { label: 'Action Button', value: 'ACTION_BUTTON', icon: <ThunderboltOutlined /> },
    { label: 'Tags', value: 'TAG_LIST', icon: <TagOutlined /> },
];

export const WizardNode: React.FC<WizardNodeProps> = ({ id, data, onChange, readOnly }) => {
    const { token } = theme.useToken();
    const [form] = Form.useForm();

    // ⚡ DEEP EXTRACTION (Backend XState Structure)
    const meta = data.meta || {};
    const formSchema = meta.form_schema || [];

    // ⚡ REACTIVE HYDRATION
    useEffect(() => {
        form.setFieldsValue({
            description: meta.description,
            color: meta.color || token.colorPrimary,
        });
    }, [id, meta, form, token.colorPrimary]);

    const handleFormChange = (_: any, allValues: any) => {
        onChange({ 
            ...data,
            meta: {
                ...meta,
                description: allValues.description,
                color: typeof allValues.color === 'string' ? allValues.color : allValues.color?.toHexString(),
                form_schema: formSchema
            }
        });
    };

    // ⚡ FIELD HANDLERS
    const handleFieldUpdate = (index: number, key: string, value: any) => {
        const newFields = [...formSchema];
        newFields[index] = { ...newFields[index], [key]: value };
        
        onChange({ 
            ...data, 
            meta: {
                ...meta,
                form_schema: newFields
            }
        });
    };

    const handleAddField = () => {
        const newField = { name: `field_${Date.now()}`, label: 'New Field', component: 'ProFormText', required: true };
        
        onChange({ 
            ...data, 
            meta: {
                ...meta,
                form_schema: [...formSchema, newField]
            }
        });
    };

    const handleDeleteField = (index: number) => {
        const newFields = formSchema.filter((_: any, i: number) => i !== index);
        onChange({ 
            ...data, 
            meta: {
                ...meta,
                form_schema: newFields
            }
        });
    };

    return (
        <Form 
            form={form} 
            layout="vertical" 
            onValuesChange={handleFormChange}
            disabled={readOnly}
        >
            <Form.Item label="Step Description" name="description">
                <Input.TextArea rows={2} placeholder="Instructions for the user..." style={{ fontSize: 13 }} />
            </Form.Item>

            <Form.Item label="Step Color" name="color">
                <ColorPicker showText />
            </Form.Item>

            <Divider orientation="left" style={{ fontSize: 12, color: token.colorTextSecondary, marginTop: 8, marginBottom: 12 }}>
                Fields ({formSchema.length})
            </Divider>

            {/* ⚡ VERTICAL CARD STACK (Space Optimized) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {formSchema.map((field: any, idx: number) => (
                    <Card 
                        key={idx}
                        size="small"
                        styles={{ body: { padding: '10px' } }}
                        style={{ 
                            background: token.colorFillAlter, 
                            border: `1px solid ${token.colorBorderSecondary}`,
                            position: 'relative'
                        }}
                    >
                        {/* DELETE ACTION (Absolute Top-Right) */}
                        <div style={{ position: 'absolute', top: 6, right: 6, zIndex: 1 }}>
                            <Button 
                                type="text" 
                                size="small" 
                                danger 
                                icon={<DeleteOutlined />} 
                                onClick={() => handleDeleteField(idx)} 
                            />
                        </div>

                        {/* ROW 1: KEY (System ID) */}
                        <div style={{ marginBottom: 8, paddingRight: 24 }}>
                            <Text type="secondary" style={{ fontSize: 10, display: 'block', marginBottom: 2 }}>SYSTEM ID (KEY)</Text>
                            <Input 
                                value={field.name} 
                                onChange={e => handleFieldUpdate(idx, 'name', e.target.value)} 
                                variant="borderless" 
                                placeholder="key_name"
                                style={{ 
                                    fontFamily: 'monospace', 
                                    fontSize: 12, 
                                    padding: 0, 
                                    color: token.colorTextSecondary 
                                }}
                            />
                        </div>

                        {/* ROW 2: LABEL (User Facing) */}
                        <div style={{ marginBottom: 8 }}>
                            <Input 
                                value={field.label} 
                                onChange={e => handleFieldUpdate(idx, 'label', e.target.value)} 
                                placeholder="Field Label"
                                style={{ fontWeight: 500 }}
                            />
                        </div>

                        {/* ROW 3: COMPONENT & CONFIG */}
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                                <Select 
                                    value={field.component} 
                                    onChange={v => handleFieldUpdate(idx, 'component', v)}
                                    style={{ width: '100%' }}
                                    size="small"
                                    options={WIZARD_COMPONENTS.map(c => ({ value: c.value, label: c.label, icon: c.icon }))}
                                    optionRender={(option) => (
                                        <Space>
                                            {option.data.icon}
                                            <span>{option.data.label}</span>
                                        </Space>
                                    )}
                                />
                            </div>
                            
                            <Tooltip title="Required Field">
                                <div style={{ display: 'flex', alignItems: 'center', background: token.colorBgContainer, padding: '2px 6px', borderRadius: 4, border: `1px solid ${token.colorBorder}` }}>
                                    <Text style={{ fontSize: 10, marginRight: 6 }}>Req</Text>
                                    <Switch 
                                        size="small" 
                                        checked={field.required} 
                                        onChange={c => handleFieldUpdate(idx, 'required', c)} 
                                    />
                                </div>
                            </Tooltip>
                        </div>
                    </Card>
                ))}

                {formSchema.length === 0 && (
                    <div style={{ padding: 16, textAlign: 'center', color: token.colorTextQuaternary, border: `1px dashed ${token.colorBorder}`, borderRadius: 6 }}>
                        No fields defined.
                    </div>
                )}

                <Button 
                    type="dashed" 
                    block 
                    icon={<PlusOutlined />} 
                    onClick={handleAddField}
                    style={{ marginTop: 4 }}
                >
                    Add Field
                </Button>
            </div>
        </Form>
    );
};
