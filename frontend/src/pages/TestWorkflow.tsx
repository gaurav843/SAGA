/* FILEPATH: frontend/src/pages/TestWorkflow.tsx */
/* @file Workflow Lab Bench */
/* @author The Engineer */
/* @description A standalone harness to test the WorkflowPlayer fractal module.
 * UPDATED: Uses Centralized Kernel Config via Alias.
 */

import React, { useState, useEffect } from 'react';
import { Card, Typography, Descriptions, Tag, Button, message, Divider, Alert, theme } from 'antd';
import { ReloadOutlined, UserAddOutlined, ExperimentOutlined, ThunderboltOutlined } from '@ant-design/icons';
import axios from 'axios';

import { WorkflowPlayer } from '../platform/workflow';
// ⚡ FRACTAL IMPORT
import { API_BASE_URL } from '@kernel/config';

const { Title, Text } = Typography;

const TEST_DOMAIN = "USER";
const TEST_ID = 1;

export const TestWorkflow: React.FC = () => {
    // 🎨 THEME ENGINE HOOK
    const { token } = theme.useToken();
    
    const [entity, setEntity] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(new Date());

    const fetchSubject = async () => {
        setLoading(true);
        try {
            // ⚡ GATEWAY: Use standardized base
            const res = await axios.get(`${API_BASE_URL}/api/v1/resource/${TEST_DOMAIN}/${TEST_ID}`);
            setEntity(res.data);
        } catch (err: any) {
            if (err.response?.status === 404) {
                setEntity(null);
            } else {
                message.error("Failed to load test subject");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubject();
    }, [lastUpdate]);

    const spawnSubject = async () => {
        try {
            await axios.post(`${API_BASE_URL}/api/v1/resource/${TEST_DOMAIN}`, {
                email: `test_user_${Date.now()}@example.com`,
                role: "user",
                status: "DRAFT",
                is_active: true
            });
            message.success("Spawned new Test Subject!");
            fetchSubject();
        } catch (err) {
            message.error("Failed to spawn subject.");
        }
    };

    const handleWorkflowComplete = () => {
        message.success("Workflow Action Completed. State Updated.");
        setLastUpdate(new Date());
    };

    // --- STYLES (Dynamic based on Theme) ---
    const pageStyle: React.CSSProperties = {
        padding: 40,
        maxWidth: 900,
        margin: '0 auto',
        minHeight: '100vh',
        background: token.colorBgLayout, // ⚡ Adapts to Dark/Light mode
        color: token.colorText
    };

    const headerStyle: React.CSSProperties = {
        marginBottom: 24,
        paddingBottom: 24,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        display: 'flex',
        alignItems: 'center',
        gap: 16
    };

    return (
        <div style={pageStyle}>
            {/* HEADER */}
            <div style={headerStyle}>
                <div style={{ 
                    background: token.colorPrimaryBg, 
                    padding: 12, 
                    borderRadius: token.borderRadiusLG,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center'
                }}>
                    <ExperimentOutlined style={{ fontSize: 32, color: token.colorPrimary }} />
                </div>
                <div>
                    <Title level={2} style={{ margin: 0 }}>Workflow Lab Bench</Title>
                    <Text type="secondary">Runtime Verification Environment for <b>{TEST_DOMAIN}</b> Domain</Text>
                </div>
            </div>

            {/* 1. SUBJECT MONITOR */}
            <Card 
                title={<span><ThunderboltOutlined /> Subject Monitor</span>}
                extra={<Button icon={<ReloadOutlined />} onClick={fetchSubject} loading={loading} type="text">Refresh</Button>}
                style={{ marginBottom: 24, boxShadow: token.boxShadowTertiary }}
                bordered={false}
            >
                {entity ? (
                    <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
                        <Descriptions.Item label="Entity ID">{entity.id}</Descriptions.Item>
                        <Descriptions.Item label="Domain">{TEST_DOMAIN}</Descriptions.Item>
                        <Descriptions.Item label="Email">{entity.email}</Descriptions.Item>
                        <Descriptions.Item label="Current Status">
                            <Tag bordered={false} color={getStatusColor(entity.status)}>
                                {entity.status || "UNKNOWN"}
                            </Tag>
                        </Descriptions.Item>
                        
                        {/* Show the sidecar context if it was persisted (debug only) */}
                        <Descriptions.Item label="Last Event Payload" span={2}>
                            <Text code style={{ fontSize: 12 }}>
                                {JSON.stringify(entity._runtime_context || {}, null, 2)}
                            </Text>
                        </Descriptions.Item>
                    </Descriptions>
                ) : (
                    <div style={{ textAlign: 'center', padding: 32, background: token.colorFillAlter, borderRadius: token.borderRadius }}>
                        <Alert 
                            type="info" 
                            message="Lab Bench Empty" 
                            description="No active subject found to run experiments on."
                            style={{ marginBottom: 16, background: 'transparent', border: 'none' }}
                        />
                        <Button type="primary" icon={<UserAddOutlined />} onClick={spawnSubject}>
                            Spawn Test Subject
                        </Button>
                    </div>
                )}
            </Card>

            {/* 2. WORKFLOW CONTROLLER */}
            {entity && (
                <Card 
                    title="2. Workflow Controller" 
                    bordered={false}
                    style={{ 
                        boxShadow: token.boxShadow, 
                        border: `1px solid ${token.colorBorder}` 
                    }}
                >
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ marginBottom: 8 }}>
                            <Text strong>Available Actions</Text>
                        </div>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            The buttons below are rendered dynamically based on the current state 
                            <Tag style={{ marginLeft: 8 }}>{entity.status}</Tag>
                        </Text>
                    </div>

                    <div style={{ 
                        padding: 24, 
                        background: token.colorFillAlter, 
                        borderRadius: token.borderRadiusLG,
                        border: `1px dashed ${token.colorBorder}`
                    }}>
                        {/* 👇 FRACTAL COMPONENT */}
                        <WorkflowPlayer 
                            domain={TEST_DOMAIN} 
                            id={entity.id} 
                            onComplete={handleWorkflowComplete}
                        />
                    </div>
                    
                    <Divider plain style={{ fontSize: 12, color: token.colorTextQuaternary }}>
                        Fractal Architecture v2.0
                    </Divider>
                </Card>
            )}
        </div>
    );
};

function getStatusColor(status: string) {
    const map: Record<string, string> = {
        'DRAFT': 'orange',
        'REVIEW': 'processing',
        'ACTIVE': 'success',
        'ARCHIVED': 'default',
        'REJECTED': 'error'
    };
    return map[status] || 'default';
}
