// FILEPATH: frontend/src/domains/meta_v2/features/workflows/components/inspector/WizardNode.tsx
// @file: Wizard Step Editor
// @role: 🧠 Logic Container */
// @author: The Engineer
// @description: Orchestrates Wizard Step configuration. Manages step metadata and the field collection.
// @security-level: LEVEL 9 */

import React, { useEffect } from 'react';
import { Form, Input, Divider, Typography, theme, ColorPicker } from 'antd';
import { 
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

import { logger } from '@/platform/logging';
import { FieldCard } from './_atoms/FieldCard';
import type { FlowNodeData } from '../../types';

const { Text } = Typography;

/** @description Rich component registry for user-facing selection [cite: 3034-3048] */
export const WIZARD_COMPONENTS = [
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

interface WizardNodeProps {
    id: string;
    data: any;
    onChange: (newData: any) => void;
    readOnly?: boolean;
}

export const WizardNode: React.FC<WizardNodeProps> = ({ id, data, onChange, readOnly }) => {
    const { token } = theme.useToken();
    const [form] = Form.useForm();
    const meta = data.meta || {};
    const formSchema = meta.form_schema || [];

    // ⚡ SIGNAL TELEMETRY: Component Lifecycle
    useEffect(() => {
        logger.whisper("WORKFLOWS", `Mounting Wizard Engine for node: ${id}`);
        form.setFieldsValue({
            description: meta.description,
            color: meta.color || token.colorPrimary,
        });
    }, [id, meta, form, token.colorPrimary]);

    const handleFormChange = (_: any, allValues: any) => {
        logger.trace("INSPECTOR", "Wizard step metadata updated", { nodeId: id });
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

    const handleFieldUpdate = (index: number, key: string, value: any) => {
        const newFields = [...formSchema];
        newFields[index] = { ...newFields[index], [key]: value };
        logger.trace("INSPECTOR", `Field property [${key}] updated for index ${index}`);
        onChange({ ...data, meta: { ...meta, form_schema: newFields } });
    };

    const handleAddField = () => {
        const newField = { name: `field_${Date.now()}`, label: 'New Field', component: 'ProFormText', required: true };
        logger.tell("INSPECTOR", "Added new field to Wizard Step", { fieldName: newField.name });
        onChange({ ...data, meta: { ...meta, form_schema: [...formSchema, newField] } });
    };

    const handleDeleteField = (index: number) => {
        logger.tell("INSPECTOR", "Removed field from Wizard Step", { index });
        const newFields = formSchema.filter((_: any, i: number) => i !== index);
        onChange({ ...data, meta: { ...meta, form_schema: newFields } });
    };

    return (
        <Form form={form} layout="vertical" onValuesChange={handleFormChange} disabled={readOnly}>
            <Form.Item label="Step Description" name="description">
                <Input.TextArea rows={2} placeholder="Instructions for the user..." style={{ fontSize: 13 }} />
            </Form.Item>

            <Form.Item label="Step Color" name="color">
                <ColorPicker showText />
            </Form.Item>

            <Divider orientation="left" style={{ fontSize: 12, color: token.colorTextSecondary, marginTop: 8, marginBottom: 12 }}>
                Fields ({formSchema.length})
            </Divider>

            <FieldCard 
                fields={formSchema}
                onUpdate={handleFieldUpdate}
                onDelete={handleDeleteField}
                onAdd={handleAddField}
                readOnly={readOnly}
            />
        </Form>
    );
};

