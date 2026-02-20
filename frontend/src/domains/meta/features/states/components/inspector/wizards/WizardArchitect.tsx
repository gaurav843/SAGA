/* FILEPATH: frontend/src/domains/meta/features/states/components/inspector/wizards/WizardArchitect.tsx */
/* @file Wizard Architect (Form Builder) */
/* @author The Engineer */
/* @description Visual Editor for constructing Form Schemas (Step 1 -> Step 2).
 * Integrates the AI Composer for rapid prototyping.
 * UPDATED: Enforces 'readOnly' lock to prevent schema mutation.
 */

import React, { useState } from 'react';
import { Card, Button, Space, Typography, List, Tag, theme, Empty } from 'antd';
import { 
    PlusOutlined, 
    EditOutlined, 
    DeleteOutlined, 
    BuildOutlined,
    HolderOutlined
} from '@ant-design/icons';

// ⚡ AI INTEGRATION
import { AIComposer } from '../wizard/AIComposer'; 
import { FieldConfigDrawer } from '../wizard/FieldConfigDrawer';
import { logger } from '../../../../../../../platform/logging';
import type { SchemaField } from '../../../../../../governance/types';

const { Text } = Typography;

interface SchemaFieldConfig {
    name: string;
    label: string;
    component: string;
    required?: boolean;
    placeholder?: string;
}

interface WizardArchitectProps {
    domain: string;
    nodeData: any;
    onUpdate: (data: any) => void;
    hostFields: SchemaField[];
    readOnly?: boolean; // ⚡ FIX: Accept Lock
}

export const WizardArchitect: React.FC<WizardArchitectProps> = ({ 
    domain, nodeData, onUpdate, hostFields, readOnly 
}) => {
    const { token } = theme.useToken();
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [editingField, setEditingField] = useState<SchemaFieldConfig | null>(null);

    // 1. Extract Schema safely
    const formSchema: SchemaFieldConfig[] = nodeData.meta?.form_schema || [];

    // 2. Actions
    const handleAddField = (field: SchemaFieldConfig) => {
        const newSchema = editingField 
            ? formSchema.map(f => f.name === editingField.name ? field : f)
            : [...formSchema, field];
        
        updateSchema(newSchema);
        setDrawerVisible(false);
        setEditingField(null);
        
        logger.story("Wizard Architect", editingField ? `Updated field '${field.name}'` : `Added new field '${field.name}'`);
    };

    const handleDelete = (name: string) => {
        updateSchema(formSchema.filter(f => f.name !== name));
        logger.story("Wizard Architect", `Removed field '${name}'`);
    };

    const updateSchema = (newSchema: SchemaFieldConfig[]) => {
        onUpdate({
            ...nodeData,
            meta: {
                ...nodeData.meta,
                form_schema: newSchema
            }
        });
    };

    const handleAIGenerated = (generatedFields: any[]) => {
        const newSchema = [...formSchema, ...generatedFields];
        updateSchema(newSchema);
        logger.story("AI Architect", `Generated and appended ${generatedFields.length} fields`);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 🤖 AI COMPOSER (Hidden in Read-Only) */}
            {!readOnly && (
                <AIComposer 
                    hostFields={hostFields} 
                    onGenerate={handleAIGenerated} 
                />
            )}

            {/* 🛠️ MANUAL BUILDER SECTION */}
            <Card 
                size="small" 
                title={<Space><BuildOutlined /><span>Form Fields</span></Space>}
                extra={
                    <Button 
                        type="dashed" 
                        size="small" 
                        icon={<PlusOutlined />} 
                        onClick={() => { setEditingField(null); setDrawerVisible(true); }}
                        disabled={readOnly} // ⚡ FIX: Lock
                    >
                        Add Field
                    </Button>
                }
            >
                {formSchema.length === 0 ? (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No fields defined." />
                ) : (
                    <List
                        size="small"
                        dataSource={formSchema}
                        renderItem={(item) => (
                            <List.Item
                                actions={!readOnly ? [
                                    <Button key="edit" type="text" size="small" icon={<EditOutlined />} onClick={() => { setEditingField(item); setDrawerVisible(true); }} />,
                                    <Button key="del" type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => handleDelete(item.name)} />
                                ] : []} // ⚡ FIX: Hide Actions in Read-Only
                            >
                                <List.Item.Meta
                                    avatar={<HolderOutlined style={{ cursor: readOnly ? 'default' : 'move', color: token.colorTextTertiary }} />}
                                    title={
                                        <Space>
                                            <Text strong>{item.label}</Text>
                                            {item.required && <Tag color="red" style={{ fontSize: 10, lineHeight: '16px' }}>Req</Tag>}
                                        </Space>
                                    }
                                    description={
                                        <Space size={4}>
                                            <Tag style={{ fontSize: 10 }}>{item.name}</Tag>
                                            <Tag color="blue" style={{ fontSize: 10 }}>{item.component}</Tag>
                                        </Space>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                )}
            </Card>

            {/* ✏️ FIELD EDITOR DRAWER */}
            <FieldConfigDrawer
                open={drawerVisible}
                fieldData={editingField || {}}
                onClose={() => setDrawerVisible(false)}
                onSave={handleAddField}
                allFields={formSchema}
                hostFields={hostFields}
                // FieldConfigDrawer doesn't strictly need readOnly because we prevent opening it,
                // but if we wanted "View Details", we'd pass it here too.
            />
        </div>
    );
};

