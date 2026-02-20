/* FILEPATH: frontend/src/domains/meta/features/states/components/inspector/StandardNode.tsx */
/* @file Standard Node Editor */
/* @author The Engineer */
/* @description Basic configuration for Governance States.
 * FEATURES:
 * - Visual Marker (Color).
 * - Documentation (Description).
 * - System ID (Read-only).
 */

import React from 'react';
import { Form, Input, ColorPicker, Alert, Typography, theme } from 'antd';
import { FontSizeOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { FlowNodeData } from '../../types';

const { TextArea } = Input;

interface StandardNodeProps {
    id: string;
    data: FlowNodeData;
    onChange: (newData: any) => void;
    readOnly?: boolean;
}

export const StandardNode: React.FC<StandardNodeProps> = ({ id, data, onChange, readOnly }) => {
    const { token } = theme.useToken();
    const [form] = Form.useForm();

    const handleFormChange = (_: any, allValues: any) => {
        onChange({ 
            ...data, 
            description: allValues.description,
            // Convert AntD Color object to Hex string
            color: typeof allValues.color === 'string' ? allValues.color : allValues.color?.toHexString()
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
            <Form.Item label="System Key (ID)" tooltip="This is the value stored in the database column.">
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
                    description="New records will start here by default."
                    type="info" 
                    showIcon 
                    icon={<InfoCircleOutlined />}
                    style={{ marginTop: 24 }}
                />
            )}
        </Form>
    );
};

