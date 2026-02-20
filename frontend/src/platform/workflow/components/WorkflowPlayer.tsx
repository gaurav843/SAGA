/* FILEPATH: frontend/src/platform/workflow/components/WorkflowPlayer.tsx */
/* @file Workflow Player UI */
/* @author The Engineer */

import React, { useState } from 'react';
import { Button, Space, Modal, Form, Card, Typography, Input, InputNumber } from 'antd';
import { RocketOutlined, CheckCircleOutlined, ArrowRightOutlined } from '@ant-design/icons';

import { useWorkflow } from '../logic/useWorkflow';
import { useCapabilities } from '../../../domains/meta/_kernel/CapabilitiesContext';

const { Text } = Typography;

export interface WorkflowPlayerProps {
    domain: string;
    id: string | number;
    onComplete?: () => void;
}

export const WorkflowPlayer: React.FC<WorkflowPlayerProps> = ({ domain, id, onComplete }) => {
    const { options, loading, transition } = useWorkflow(domain, id, onComplete);
    const { events: eventCatalog } = useCapabilities();

    // UI State
    const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();

    const handleInitiate = (event: string) => {
        // Check Schema
        const eventDef = eventCatalog.find(e => e.key === event);
        const hasSchema = eventDef && eventDef.payload_schema && Object.keys(eventDef.payload_schema).length > 0;

        if (hasSchema) {
            setSelectedEvent(event);
            setIsModalOpen(true);
            form.resetFields();
        } else {
            transition(event, {});
        }
    };

    const handleFormSubmit = async (values: any) => {
        if (!selectedEvent) return;
        const success = await transition(selectedEvent, values);
        if (success) setIsModalOpen(false);
    };

    // --- RENDERERS ---

    const renderFields = () => {
        if (!selectedEvent) return null;
        const eventDef = eventCatalog.find(e => e.key === selectedEvent);
        if (!eventDef?.payload_schema) return <p>Confirm transition?</p>;

        return Object.entries(eventDef.payload_schema).map(([key, type]: [string, any]) => {
            const label = key.replace(/_/g, ' ').toUpperCase();
            
            // Simple Widget Mapping (Expandable)
            let inputNode = <Input />;
            if (type === 'int' || type === 'float' || type === 'number') {
                inputNode = <InputNumber style={{ width: '100%' }} />;
            }

            return (
                <Form.Item key={key} name={key} label={label} rules={[{ required: true }]}>
                    {inputNode}
                </Form.Item>
            );
        });
    };

    if (options.length === 0) {
        return (
            <Card size="small" style={{ background: '#fafafa', borderColor: '#f0f0f0' }}>
                <Space>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>Terminal State</Text>
                </Space>
            </Card>
        );
    }

    return (
        <div className="workflow-player-fractal">
            <Space wrap>
                {options.map(opt => (
                    <Button 
                        key={opt.event} 
                        type="primary" 
                        ghost
                        icon={<RocketOutlined />}
                        onClick={() => handleInitiate(opt.event)}
                        loading={loading}
                    >
                        {opt.event.replace(/_/g, ' ')} <ArrowRightOutlined style={{ fontSize: 10 }} /> {opt.target}
                    </Button>
                ))}
            </Space>

            <Modal
                title={`Execute: ${selectedEvent}`}
                open={isModalOpen}
                onOk={form.submit}
                onCancel={() => setIsModalOpen(false)}
                confirmLoading={loading}
                destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
                    {renderFields()}
                </Form>
            </Modal>
        </div>
    );
};

