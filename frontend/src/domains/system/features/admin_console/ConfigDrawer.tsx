// FILEPATH: frontend/src/domains/system/features/admin_console/ConfigDrawer.tsx
// @file: System Configuration Editor (Safe Edition)
// @author: ansav8@gmail.com
// @description: A dynamic form for editing SystemConfig values.
// ⚡ FIX: Replaced direct icon imports with IconFactory.

import React, { useState, useEffect } from 'react';
import { Drawer, Form, Input, Switch, Button, Space, Typography, Tag, InputNumber, theme } from 'antd';
import type { SystemConfig } from '../../types';
import { logger } from '../../../../platform/logging';
import { IconFactory } from '../../../../platform/ui/icons/IconFactory';

const { Text, Paragraph } = Typography;

interface ConfigDrawerProps {
    open: boolean;
    onClose: () => void;
    config: SystemConfig | null;
    onSave: (key: string, value: any) => void;
    loading: boolean;
}

export const ConfigDrawer: React.FC<ConfigDrawerProps> = ({ open, onClose, config, onSave, loading }) => {
    const { token } = theme.useToken();
    const [form] = Form.useForm();
    const [localValue, setLocalValue] = useState<any>(null);

    // ⚡ TELEMETRY: Log Access
    useEffect(() => {
        if (open && config) {
            logger.trace("SYSTEM", "🔧 Opened Config Editor", { key: config.key });
        }
    }, [open, config]);

    // Sync form with config prop
    useEffect(() => {
        if (config) {
            let initial = config.value_raw;
            if (config.value_type === 'BOOLEAN') initial = config.value_raw === 'true' || config.value_raw === '1';
            if (config.value_type === 'NUMBER') initial = Number(config.value_raw);
            
            setLocalValue(initial);
            form.setFieldsValue({ value: initial });
        }
    }, [config, form]);

    const handleFinish = (values: any) => {
        if (config) {
            logger.tell("SYSTEM", "📝 Submitting Configuration Change", { 
                key: config.key, 
                old_value: config.value_raw,
                new_value: values.value 
            });
            onSave(config.key, values.value);
            onClose();
        }
    };

    if (!config) return null;

    return (
        <Drawer
            title={
                <Space>
                    <IconFactory icon="antd:SettingOutlined" style={{ color: token.colorPrimary }} />
                    <span>Edit Configuration</span>
                </Space>
            }
            open={open}
            onClose={() => {
                logger.trace("SYSTEM", "✖️ Closed Config Editor (No Save)");
                onClose();
            }}
            width={420}
            styles={{ body: { paddingBottom: 80 } }}
            extra={
                <Space>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button type="primary" onClick={() => form.submit()} loading={loading}>
                        Save Changes
                    </Button>
                </Space>
            }
        >
            <div style={{ marginBottom: 24, padding: 16, background: token.colorFillAlter, borderRadius: token.borderRadius }}>
                <Text type="secondary" style={{ fontSize: 10, fontWeight: 'bold', letterSpacing: 1 }}>CONFIGURATION KEY</Text>
                <Paragraph copyable={{ text: config.key }} style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 'bold', margin: '4px 0 0' }}>
                    {config.key}
                </Paragraph>
            </div>

            <Space style={{ marginBottom: 24 }} size="large">
                <div>
                    <Text type="secondary" style={{ fontSize: 10, display: 'block', marginBottom: 4 }}>CATEGORY</Text>
                    <Tag color="blue">{config.category}</Tag>
                </div>
                <div>
                    <Text type="secondary" style={{ fontSize: 10, display: 'block', marginBottom: 4 }}>DATA TYPE</Text>
                    <Tag>{config.value_type}</Tag>
                </div>
            </Space>

            <div style={{ marginBottom: 24 }}>
                <Text type="secondary" style={{ fontSize: 10, display: 'block', marginBottom: 4 }}>DESCRIPTION</Text>
                <Text style={{ color: token.colorTextSecondary }}>{config.description || "No description provided."}</Text>
            </div>

            <Form form={form} layout="vertical" onFinish={handleFinish}>
                <Form.Item 
                    label={<span style={{ fontWeight: 600 }}>Value</span>}
                    name="value" 
                    help="Changes apply immediately upon save."
                >
                    {config.value_type === 'BOOLEAN' ? (
                        <Switch 
                            checked={localValue} 
                            onChange={(v) => { 
                                setLocalValue(v); 
                                form.setFieldValue('value', v); 
                                logger.whisper("SYSTEM", `Toggled Switch: ${v}`);
                            }} 
                            checkedChildren="TRUE"
                            unCheckedChildren="FALSE"
                        />
                    ) : config.value_type === 'NUMBER' ? (
                        <InputNumber style={{ width: '100%' }} />
                    ) : config.value_type === 'JSON' ? (
                        <Input.TextArea rows={8} style={{ fontFamily: 'monospace' }} />
                    ) : (
                        <Input />
                    )}
                </Form.Item>
            </Form>
        </Drawer>
    );
};
