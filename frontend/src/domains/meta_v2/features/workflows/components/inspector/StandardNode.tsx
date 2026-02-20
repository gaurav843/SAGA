// FILEPATH: frontend/src/domains/meta_v2/features/workflows/components/inspector/StandardNode.tsx
// @file: Standard Node Editor
// @role: 🎨 UI Presentation / 🧠 Logic Container */
// @author: The Engineer
// @description: Basic configuration for Lifecycle/Governance States (Color, Documentation).
// @security-level: LEVEL 9 */

import React, { useEffect } from 'react';

import { Form, Input, ColorPicker, Alert, Typography, theme } from 'antd';
import { FontSizeOutlined, InfoCircleOutlined } from '@ant-design/icons';

import { logger } from '@/platform/logging';

import type { FlowNodeData } from '../../types';

const { TextArea } = Input;
const { Text } = Typography;

interface StandardNodeProps {
    id: string;
    data: FlowNodeData;
    onChange: (newData: any) => void;
    readOnly?: boolean;
}

/**
 * @description Decoupled V2 editor for basic state nodes. [cite: 2954-2981]
 */
export const StandardNode: React.FC<StandardNodeProps> = ({ id, data, onChange, readOnly }) => {
    const { token } = theme.useToken();
    const [form] = Form.useForm();

    // ⚡ SIGNAL TELEMETRY: Init
    useEffect(() => {
        logger.whisper("WORKFLOWS", `Mounting Standard Inspector for node: ${id}`);
    }, [id]);

    /**
     * @description Syncs form state with parent data object and logs mutation.
     */
    const handleFormChange = (_: any, allValues: any) => {
        const colorHex = typeof allValues.color === 'string' 
            ? allValues.color 
            : allValues.color?.toHexString();

        logger.trace("INSPECTOR", "Standard node property mutation detected", { 
            nodeId: id, 
            changed: Object.keys(_) 
        });

        onChange({ 
            ...data, 
            description: allValues.description,
            color: colorHex
        });
    };

    return (
        <Form 
            form={form} 
            layout="vertical" 
            initialValues={{ 
                description: data.description,
                color: data.color || token.colorPrimary
            }}
            onValuesChange={handleFormChange}
            disabled={readOnly}
        >
            <Form.Item label="System Key (ID)" tooltip="Immutable database identifier.">
                <Input 
                    value={id} 
                    disabled 
                    prefix={<FontSizeOutlined style={{ color: token.colorTextQuaternary }} />} 
                    style={{ fontFamily: 'monospace', background: token.colorFillAlter }} 
                />
            </Form.Item>

            <Form.Item label="Description" name="description">
                <TextArea 
                    rows={4} 
                    placeholder="Describe what this state represents (e.g. 'Waiting for Manager Approval')." 
                />
            </Form.Item>

            <Form.Item label="Visual Marker" name="color">
                <ColorPicker showText />
            </Form.Item>

            {data.isInitial && (
                <Alert 
                    message="Initial State" 
                    description="This is the entry point for new records."
                    type="info" 
                    showIcon 
                    icon={<InfoCircleOutlined />}
                    style={{ marginTop: 24 }}
                />
            )}
        </Form>
    );
};
