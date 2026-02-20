/* FILEPATH: frontend/src/domains/meta/features/states/components/inspector/wizard/FieldConfigDrawer.tsx */
/* @file Field Configuration Engine */
/* @author The Engineer */
/* @description The "Deep Dive" editor for a single form field.
 * UPDATED: Added 'hostFields' prop and 'Field Source' logic (Custom vs Host Mapping).
 * FEATURES:
 * - Auto-resolves Component Type based on Host Data Type.
 * - Forces 'snake_case' for keys.
 */

import React, { useEffect, useMemo } from 'react';
import { Drawer, Form, Button, Divider, Typography, theme, Alert } from 'antd';
import { 
    ProForm, 
    ProFormText, 
    ProFormSelect, 
    ProFormSwitch, 
    ProFormList,
    ProFormDependency,
    ProFormRadio
} from '@ant-design/pro-components';
import { FilterOutlined, SafetyCertificateOutlined, DatabaseOutlined } from '@ant-design/icons';

import type { SchemaField } from '../../../../governance/types';

const { Text } = Typography;

interface FieldConfigDrawerProps {
    open: boolean;
    fieldData: any;
    onClose: () => void;
    onSave: (data: any) => void;
    allFields: any[];
    hostFields: SchemaField[]; // ⚡ NEW: The Brain Connection
}

export const FieldConfigDrawer: React.FC<FieldConfigDrawerProps> = ({ 
    open, fieldData, onClose, onSave, allFields, hostFields 
}) => {
    const { token } = theme.useToken();
    const [form] = Form.useForm();

    // Reset form when opening
    useEffect(() => {
        if (open) {
            form.resetFields();
            // Determine initial mode based on key naming convention
            const mode = fieldData.name?.startsWith('host.') ? 'host' : 'custom';
            form.setFieldsValue({
                ...fieldData,
                _mode: mode
            });
        }
    }, [open, fieldData, form]);

    const handleFinish = async (values: any) => {
        // Clean up internal flags
        const { _mode, ...finalData } = values;
        onSave(finalData);
        onClose();
        return true;
    };

    // ⚡ LOGIC: Map DB Types to UI Components
    const handleHostFieldSelect = (path: string) => {
        const field = hostFields.find(f => f.path === path);
        if (!field) return;

        let component = 'ProFormText';
        switch (field.type) {
            case 'NUMBER': component = 'ProFormDigit'; break;
            case 'BOOLEAN': component = 'ProFormSwitch'; break;
            case 'DATE': component = 'ProFormDatePicker'; break;
            case 'DATETIME': component = 'ProFormDateTimePicker'; break;
            case 'SELECT': component = 'ProFormSelect'; break;
            case 'TEXTAREA': component = 'ProFormTextArea'; break;
        }

        form.setFieldsValue({
            label: field.label,
            component: component,
            // Disable required if system field implies logic, but let user override
        });
    };

    const COMPONENT_TYPES = [
        { label: 'Text Input', value: 'ProFormText' },
        { label: 'Text Area', value: 'ProFormTextArea' },
        { label: 'Select Box', value: 'ProFormSelect' },
        { label: 'Checkbox', value: 'ProFormCheckbox' },
        { label: 'Switch', value: 'ProFormSwitch' },
        { label: 'Date Picker', value: 'ProFormDatePicker' },
        { label: 'Number', value: 'ProFormDigit' },
        { label: 'Money', value: 'ProFormMoney' },
    ];

    return (
        <Drawer
            title="Field Configuration"
            width={520}
            onClose={onClose}
            open={open}
            styles={{ body: { paddingBottom: 80 } }}
            extra={
                <Button onClick={() => form.submit()} type="primary">
                    Apply Changes
                </Button>
            }
        >
            <ProForm
                form={form}
                submitter={false}
                onFinish={handleFinish}
                layout="vertical"
                initialValues={{ _mode: 'custom', required: false }}
            >
                {/* 1. SOURCE SELECTION */}
                <div style={{ background: token.colorFillAlter, padding: 16, borderRadius: 8, marginBottom: 24 }}>
                    <ProFormRadio.Group
                        name="_mode"
                        label="Data Source"
                        options={[
                            { label: 'Custom Variable', value: 'custom' },
                            { label: 'Host Database', value: 'host' }
                        ]}
                    />
                    
                    <ProFormDependency name={['_mode']}>
                        {({ _mode }) => _mode === 'host' ? (
                            <ProFormSelect
                                name="name"
                                label="Map to Database Column"
                                placeholder="Select a Host Field..."
                                options={hostFields.map(f => ({ 
                                    label: `${f.label} (${f.path})`, 
                                    value: f.path 
                                }))}
                                fieldProps={{
                                    onChange: handleHostFieldSelect,
                                    suffixIcon: <DatabaseOutlined />
                                }}
                                rules={[{ required: true, message: 'Please select a host field' }]}
                            />
                        ) : (
                            <ProFormText
                                name="name"
                                label="Variable Key"
                                placeholder="e.g. confirm_password"
                                rules={[
                                    { required: true },
                                    { pattern: /^[a-z0-9_]+$/, message: 'Must be snake_case (a-z, 0-9, _)' }
                                ]}
                                tooltip="A temporary variable for this form logic."
                            />
                        )}
                    </ProFormDependency>
                </div>

                {/* 2. UI CONFIGURATION */}
                <ProForm.Group>
                    <ProFormText
                        name="label"
                        label="User Label"
                        width="md"
                        rules={[{ required: true }]}
                    />
                    <ProFormSelect
                        name="component"
                        label="Component"
                        width="sm"
                        options={COMPONENT_TYPES}
                        rules={[{ required: true }]}
                    />
                </ProForm.Group>

                {/* 3. COMPONENT SPECIFIC OPTIONS */}
                <ProFormDependency name={['component']}>
                    {({ component }) => {
                        if (['ProFormSelect', 'ProFormRadio.Group'].includes(component)) {
                            return (
                                <ProFormList
                                    name="options"
                                    label="Dropdown Options"
                                    creatorButtonProps={{ position: 'bottom', type: 'dashed' }}
                                    copyIconProps={false}
                                >
                                    <ProForm.Group>
                                        <ProFormText name="label" placeholder="Label" />
                                        <ProFormText name="value" placeholder="Value" />
                                    </ProForm.Group>
                                </ProFormList>
                            );
                        }
                        return null;
                    }}
                </ProFormDependency>

                <Divider>
                    <SafetyCertificateOutlined /> Validation
                </Divider>

                <ProFormSwitch name="required" label="Required Field" />
                <ProFormText name="tooltip" label="Helper Tooltip" />

                <ProForm.Group title="Constraints">
                    <ProFormText name={['validation', 'regex']} label="Regex" placeholder="^...$" />
                    <ProFormText name={['validation', 'message']} label="Error Message" />
                </ProForm.Group>

                <Divider>
                    <FilterOutlined /> Logic & Visibility
                </Divider>

                <ProFormList
                    name="dependencies"
                    label="Show this field when..."
                    creatorButtonProps={{ creatorButtonText: 'Add Condition' }}
                >
                    <ProForm.Group>
                        <ProFormSelect
                            name="field"
                            placeholder="Target"
                            options={allFields.map(f => ({ label: f.label, value: f.name }))}
                            width="sm"
                        />
                        <ProFormSelect
                            name="operator"
                            initialValue="=="
                            options={[
                                { label: 'Is', value: '==' },
                                { label: 'Is Not', value: '!=' },
                                { label: 'Contains', value: 'contains' },
                            ]}
                            width="xs"
                        />
                        <ProFormText name="value" placeholder="Value" width="sm" />
                    </ProForm.Group>
                </ProFormList>

            </ProForm>
        </Drawer>
    );
};

