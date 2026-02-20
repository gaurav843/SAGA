/* FILEPATH: frontend/src/domains/meta/features/states/components/inspector/JobNode.tsx */
/* @file Job Node Inspector */
/* @author The Engineer */
/* @description Configuration for Async Background Tasks.
 * FEATURES:
 * - "Explainer UX" via Tooltips.
 * - Queue & Retry Configuration.
 * - Visual "Handlers" placeholder (mocked for now).
 */

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

import type { FlowNodeData } from '../../types';

const { Text } = Typography;

interface JobNodeProps {
    id: string;
    data: FlowNodeData;
    onChange: (newData: any) => void;
    readOnly?: boolean;
}

export const JobNode: React.FC<JobNodeProps> = ({ id, data, onChange, readOnly }) => {
    const { token } = theme.useToken();
    const [form] = Form.useForm();

    const jobConfig = data.job_config || {};

    useEffect(() => {
        form.setFieldsValue({
            description: data.description,
            ...jobConfig
        });
    }, [data, form]);

    const handleValuesChange = (_: any, allValues: any) => {
        const { description, ...config } = allValues;
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
                    Define the task that the backend worker will execute asynchronously.
                </div>
            </div>

            <ProFormText
                name="description"
                label="Task Description"
                placeholder="e.g. Generate Monthly PDF Report"
                tooltip="Human-readable note for developers/admins."
            />

            <Divider orientation="left" style={{ fontSize: 12 }}>
                <CloudServerOutlined /> Execution Strategy
            </Divider>

            <ProFormText
                name="handler"
                label="System Handler"
                placeholder="e.g. mailer.send_welcome"
                tooltip="The Python function path registered in the System Registry."
                rules={[{ required: true, message: 'Handler is required' }]}
                addonBefore="sys."
            />

            <ProFormSelect
                name="queue"
                label="Priority Queue"
                initialValue="default"
                options={[
                    { label: '🔥 Critical (High)', value: 'critical' },
                    { label: '🚗 Default (Normal)', value: 'default' },
                    { label: '🐢 Background (Low)', value: 'background' },
                ]}
                tooltip="Determines how fast this job is picked up by workers."
            />

            <ProForm.Group title="Resilience">
                <ProFormDigit
                    name="retries"
                    label="Max Retries"
                    min={0}
                    max={10}
                    initialValue={3}
                    fieldProps={{ prefix: <RetweetOutlined /> }}
                    tooltip="How many times to retry if the job crashes."
                    width="xs"
                />
                <ProFormDigit
                    name="timeout"
                    label="Timeout (sec)"
                    min={1}
                    max={3600}
                    initialValue={60}
                    fieldProps={{ prefix: <FieldTimeOutlined /> }}
                    tooltip="Kill the job if it takes longer than this."
                    width="xs"
                />
            </ProForm.Group>

            <Alert
                type="info"
                showIcon
                style={{ fontSize: 12 }}
                message="Async Behavior"
                description="This node will hold the workflow in 'PROCESSING' state until the worker reports SUCCESS or FAILURE."
            />
        </ProForm>
    );
};

