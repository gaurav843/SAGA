/* FILEPATH: frontend/src/platform/workflow/WorkflowPlayer.tsx */
/* @file Universal Workflow Player */
/* @author The Engineer */
/* @description A drop-in component that manages the State Lifecycle of any entity.
 * Fetches valid moves -> Renders Buttons -> Captures Payload -> Executes.
 * UPDATED: Uses Centralized Kernel Config via Alias.
 */

import React, { useState, useEffect } from 'react';
import { Button, Space, Modal, Form, message, Card, Typography } from 'antd';
import { RocketOutlined, CheckCircleOutlined, ArrowRightOutlined } from '@ant-design/icons';
import axios from 'axios';

// ⚡ KERNEL CAPABILITIES
import { useCapabilities } from '../../domains/meta/_kernel/CapabilitiesContext';
// ⚡ FRACTAL IMPORT
import { API_BASE_URL } from '@kernel/config';

const { Text } = Typography;

interface WorkflowPlayerProps {
    domain: string;
    id: number | string;
    currentStatus?: string; // Optional: Passing it in saves a fetch, but we fetch options anyway
    onTransitionComplete?: () => void;
}

interface TransitionOption {
    event: string;
    target: string;
}

export const WorkflowPlayer: React.FC<WorkflowPlayerProps> = ({ domain, id, currentStatus, onTransitionComplete }) => {
    const [options, setOptions] = useState<TransitionOption[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Interaction State
    const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();

    const { events: eventCatalog } = useCapabilities();

    // 1. Fetch Options on Mount or Status Change
    const fetchOptions = async () => {
        try {
            // ⚡ GATEWAY: Use standardized base
            const res = await axios.get(`${API_BASE_URL}/api/v1/transition/${domain}/${id}/options`);
            setOptions(res.data);
        } catch (err) {
            console.error("Failed to load transitions", err);
        }
    };

    useEffect(() => {
        fetchOptions();
    }, [domain, id, currentStatus]);

    // 2. Handle Click
    const handleInitiate = (event: string) => {
        // Check if this event requires a payload (Schema check)
        const eventDef = eventCatalog.find(e => e.key === event);
        const hasSchema = eventDef && eventDef.payload_schema && Object.keys(eventDef.payload_schema).length > 0;

        if (hasSchema) {
            setSelectedEvent(event);
            setIsModalOpen(true);
            form.resetFields();
        } else {
            // Instant Execution
            executeTransition(event, {});
        }
    };

    // 3. Execute
    const executeTransition = async (event: string, payload: any) => {
        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/api/v1/transition/${domain}/${id}`, {
                event,
                payload
            });
            message.success(`Transition ${event} successful!`);
            setIsModalOpen(false);
            onTransitionComplete?.();
            fetchOptions(); // Refresh options
        } catch (err: any) {
            message.error(err.response?.data?.detail || "Transition failed");
        } finally {
            setLoading(false);
        }
    };

    // 4. Render Form Fields (Dynamic)
    const renderFormFields = () => {
        if (!selectedEvent) return null;
        const eventDef = eventCatalog.find(e => e.key === selectedEvent);
        if (!eventDef?.payload_schema) return <p>No details required.</p>;

        return Object.entries(eventDef.payload_schema).map(([key, type]: [string, any]) => (
            <Form.Item 
                key={key} 
                name={key} 
                label={key.replace('_', ' ').toUpperCase()}
                rules={[{ required: true }]} // Assume required for now
            >
                {/* Simple Type Mapping */}
                {type === 'int' || type === 'float' ? (
                    <input type="number" className="ant-input" />
                ) : (
                    <input type="text" className="ant-input" />
                )}
            </Form.Item>
        ));
    };

    if (options.length === 0) {
        return (
            <Card size="small" style={{ background: '#f5f5f5' }}>
                <Space>
                    <CheckCircleOutlined style={{ color: 'green' }} />
                    <Text type="secondary">No actions available (Terminal State)</Text>
                </Space>
            </Card>
        );
    }

    return (
        <div className="workflow-player">
            <Space wrap>
                {options.map(opt => (
                    <Button 
                        key={opt.event} 
                        type="primary" 
                        icon={<RocketOutlined />}
                        onClick={() => handleInitiate(opt.event)}
                        loading={loading}
                    >
                        {opt.event.replace(/_/g, ' ')} <ArrowRightOutlined /> {opt.target}
                    </Button>
                ))}
            </Space>

            <Modal
                title={`Execute: ${selectedEvent}`}
                open={isModalOpen}
                onOk={form.submit}
                onCancel={() => setIsModalOpen(false)}
                confirmLoading={loading}
            >
                <Form form={form} layout="vertical" onFinish={(values) => executeTransition(selectedEvent!, values)}>
                    {renderFormFields()}
                </Form>
            </Modal>
        </div>
    );
};

