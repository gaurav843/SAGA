// FILEPATH: frontend/src/domains/meta_v2/features/workflows/components/inspector/_atoms/FieldCard.tsx
// @file: Wizard Field Card
// @role: 🎨 UI Presentation */
// @author: The Engineer
// @description: Renders the draggable, space-optimized cards for individual form fields.
// @security-level: LEVEL 9 */

import React from 'react';
import { Input, Select, Switch, Button, Typography, theme, Card, Space, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { WIZARD_COMPONENTS } from '../WizardNode';

const { Text } = Typography;

interface FieldCardProps {
    fields: any[];
    onUpdate: (index: number, key: string, value: any) => void;
    onDelete: (index: number) => void;
    onAdd: () => void;
    readOnly?: boolean;
}

/**
 * @description Atomic component for managing the list of fields within a Wizard step. [cite: 3069-3101]
 */
export const FieldCard: React.FC<FieldCardProps> = ({ fields, onUpdate, onDelete, onAdd, readOnly }) => {
    const { token } = theme.useToken();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {fields.map((field: any, idx: number) => (
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
                    <div style={{ position: 'absolute', top: 6, right: 6, zIndex: 1 }}>
                        <Button 
                            type="text" 
                            size="small" 
                            danger 
                            icon={<DeleteOutlined />} 
                            onClick={() => onDelete(idx)} 
                            disabled={readOnly}
                        />
                    </div>

                    <div style={{ marginBottom: 8, paddingRight: 24 }}>
                        <Text type="secondary" style={{ fontSize: 10, display: 'block', marginBottom: 2 }}>SYSTEM ID (KEY)</Text>
                        <Input 
                            value={field.name} 
                            onChange={e => onUpdate(idx, 'name', e.target.value)} 
                            variant="borderless" 
                            placeholder="key_name"
                            style={{ fontFamily: 'monospace', fontSize: 12, padding: 0, color: token.colorTextSecondary }}
                        />
                    </div>

                    <div style={{ marginBottom: 8 }}>
                        <Input 
                            value={field.label} 
                            onChange={e => onUpdate(idx, 'label', e.target.value)} 
                            placeholder="Field Label"
                            style={{ fontWeight: 500 }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                            <Select 
                                value={field.component} 
                                onChange={v => onUpdate(idx, 'component', v)}
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
                                    onChange={c => onUpdate(idx, 'required', c)} 
                                />
                            </div>
                        </Tooltip>
                    </div>
                </Card>
            ))}

            <Button 
                type="dashed" 
                block 
                icon={<PlusOutlined />} 
                onClick={onAdd}
                disabled={readOnly}
                style={{ marginTop: 4 }}
            >
                Add Field
            </Button>
        </div>
    );
};

