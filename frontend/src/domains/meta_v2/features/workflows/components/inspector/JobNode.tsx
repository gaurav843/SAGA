// FILEPATH: frontend/src/domains/meta_v2/features/workflows/components/inspector/JobNode.tsx
// @file: Job Node Inspector
// @role: 🎨 UI Presentation / 🧠 Logic Container */
// @author: The Engineer
// @description: Configuration for Async Background Tasks (Queues, Handlers, Retries).
// @security-level: LEVEL 9 */

import React, { useEffect } from 'react';

import { Form, Typography, theme, Divider, Alert } from 'antd';
import { 
    ProForm,
    ProFormText,
    ProFormDigit,
    ProFormSelect
} from '@ant-design/pro-components';
import { 
    RobotOutlined, 
    FieldTimeOutlined,
    RetweetOutlined,
    CloudServerOutlined
} from '@ant-design/icons';

import { logger } from '@/platform/logging';

import type { FlowNodeData } from '../../types';

const { Text } = Typography;

interface JobNodeProps {
    id: string;
    data: FlowNodeData;
    onChange: (newData: any) => void;
    readOnly?: boolean;
}

/**
 * @description Decoupled V2 editor for background task nodes. [cite: 2885-2923]
 */
export const JobNode: React.FC<JobNodeProps> = ({ id, data, onChange, readOnly }) => {
    const { token } = theme.useToken();
    const [form] = Form.useForm();

    const jobConfig = data.job_config || {};

    // ⚡ SIGNAL TELEMETRY: Init
    useEffect(() => {
        logger.whisper("WORKFLOWS", `Mounting Job Inspector for node: ${id}`);
        form.setFieldsValue({
            description: data.description,
            ...jobConfig
        });
    }, [id, data, form, jobConfig]);

    /**
     * @description Propagates task configuration changes with semantic logging.
     */
    const handleValuesChange = (_: any, allValues: any) => {
        const { description, ...config } = allValues;

        logger.trace("INSPECTOR", "Worker task configuration modified", { 
            nodeId: id,
            handler: config.handler,
            queue: config.queue
        });

        onChange({
            ...data,
            description,
            job_config: config
        });
    };

    return (
        <ProForm
            form={form}
            submitter={false}
            layout="vertical"
            onValuesChange={handleValuesChange}
            disabled={readOnly}
        >
            <div style={{ marginBottom: 16, padding: 12, background: token.colorFillAlter, borderRadius: 6 }}>
                <Text strong><RobotOutlined /> Worker Configuration</Text>
                <div style={{ fontSize: 12, color: token.colorTextSecondary, marginTop: 4 }}>
                    Configure the asynchronous task parameters for this node.
                </div>
            </div>

            <ProFormText
                name="description"
                label="Task Description"
                placeholder="e.g. Process Financial Audit"
                tooltip="Internal documentation for this specific job instance."
            />

            <Divider orientation="left" style={{ fontSize: 12 }}>
                <CloudServerOutlined /> Execution Strategy
            </Divider>

            <ProFormText
                name="handler"
                label="System Handler"
                placeholder="e.g. compute.audit_risk"
                tooltip="The backend handler path registered in the System Outbox."
                rules={[{ required: true, message: 'Handler path required' }]}
                addonBefore="sys."
            />

            <ProFormSelect
                name="queue"
                label="Priority Queue"
                initialValue="default"
                options={[
                    { label: '🔥 High Priority', value: 'critical' },
                    { label: '🚗 Default', value: 'default' },
                    { label: '🐢 Background', value: 'background' },
                ]}
            />

            <ProForm.Group title="Resilience">
                <ProFormDigit
                    name="retries"
                    label="Retry Count"
                    min={0}
                    max={10}
                    initialValue={3}
                    fieldProps={{ prefix: <RetweetOutlined /> }}
                    width="xs"
                />
                <ProFormDigit
                    name="timeout"
                    label="Timeout (s)"
                    min={1}
                    max={3600}
                    initialValue={60}
                    fieldProps={{ prefix: <FieldTimeOutlined /> }}
                    width="xs"
                />
            </ProForm.Group>

            <Alert
                type="info"
                showIcon
                style={{ fontSize: 12 }}
                message="Operational Mode"
                description="Workflow progress halts until the worker process returns a Success or Failure signal."
            />
        </ProForm>
    );
};

