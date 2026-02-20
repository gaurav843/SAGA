// FILEPATH: frontend/src/domains/meta_v2/features/governance/components/editor/TestPanel.tsx
// @file: Policy Simulator (Dry Run) - V
// @role: 🎨 UI Presentation / 🧠 Logic Container */
// @author: The Engineer
// @description: A sandbox to test logic before deploying it to production.
// UPDATED: Wired to V2 useGovernance hook and injected Semantic Telemetry.

// @security-level: LEVEL 9 (Sandboxed Evaluation) */

import React, { useState } from 'react';
import { Card, Button, Row, Col, Typography, Input, Alert, Tag, Space, theme } from 'antd';
import { ExperimentOutlined, ThunderboltOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

import { logger } from '@/platform/logging/Narrator';
import { useGovernance } from '../../hooks/useGovernance';
import type { PolicyDraft, DryRunResult } from '../../../../../meta/features/governance/types';

const { Text } = Typography;
const { TextArea } = Input;

interface TestPanelProps {
  policy: PolicyDraft;
  domain: string;
}

export const TestPanel: React.FC<TestPanelProps> = ({ policy, domain }) => {
  const { token } = theme.useToken();
  const { dryRunPolicy, isSimulating } = useGovernance(domain); // ⚡ V2 HOOK

  // Default mock data based on standard "host" envelope
  const [contextJson, setContextJson] = useState<string>(
    JSON.stringify({ 
        host: { 
            role: 'operator', 
            email: 'test@example.com',
            is_active: true
        },
        meta: {} 
    }, null, 2)
  );

  const [result, setResult] = useState<DryRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    setResult(null);
    setError(null);
    logger.whisper("GOVERNANCE", `Initiating Sandbox Simulation for policy: ${policy.key}`);

    try {
        const context = JSON.parse(contextJson);
        const res = await dryRunPolicy({
            policy: { ...policy, rules: policy.rules } as any, // Alignment with SDK
            context
        });
        
        setResult(res);
        logger.trace("GOVERNANCE", `Simulation Complete: ${res.is_valid ? 'PASSED' : 'FAILED'}`, { res });
    } catch (err: any) {
        const errMsg = err.message || 'Invalid JSON format';
        setError(errMsg);
        logger.scream("GOVERNANCE", `Sandbox Simulation Failed`, err);
    }
  };

  return (
    <Card 
        size="small"
        style={{ 
            marginTop: 24, 
            borderColor: token.colorWarning,
            background: token.colorBgLayout 
        }}
        title={
            <Space>
                <ExperimentOutlined style={{ color: token.colorWarning }} />
                <span>Simulation Lab</span>
                <Tag color="orange">Safe Mode</Tag>
            </Space>
        }
    >
        <Row gutter={24}>
            {/* INPUT: Mock Context */}
            <Col span={12}>
                <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong style={{ fontSize: 12 }}>Input Context (JSON)</Text>
                    <Button 
                        size="small" 
                        type="primary" 
                        ghost 
                        icon={<ThunderboltOutlined />} 
                        onClick={handleRun}
                        loading={isSimulating}
                    >
                        Test Logic
                    </Button>
                </div>
                <TextArea 
                    rows={8} 
                    value={contextJson}
                    onChange={e => setContextJson(e.target.value)}
                    style={{ fontFamily: 'monospace', fontSize: 12, backgroundColor: token.colorBgContainer }}
                />
            </Col>

            {/* OUTPUT: Results */}
            <Col span={12}>
                <div style={{ marginBottom: 8 }}>
                    <Text strong style={{ fontSize: 12 }}>Simulation Result</Text>
                </div>
                
                <div style={{ 
                    height: 186, 
                    padding: 12, 
                    background: token.colorBgContainer, 
                    border: `1px solid ${token.colorBorder}`, 
                    borderRadius: token.borderRadius,
                    overflowY: 'auto'
                }}>
                    {!result && !error && (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                            <Text>Ready to simulate</Text>
                        </div>
                    )}

                    {error && (
                        <Alert type="error" message="Syntax Error" description={error} showIcon />
                    )}

                    {result && (
                        <Space direction="vertical" style={{ width: '100%' }}>
                            {/* Verdict */}
                            <Alert 
                                message={result.is_valid ? "Allowed" : "Blocked"} 
                                type={result.is_valid ? "success" : "error"} 
                                showIcon 
                                icon={result.is_valid ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                            />

                            {/* Details */}
                            {result.blocking_errors.length > 0 && (
                                <div>
                                    <Text type="danger" strong>Blocking Errors:</Text>
                                    <ul>
                                        {result.blocking_errors.map((e, i) => <li key={i}><Text type="danger">{e}</Text></li>)}
                                    </ul>
                                </div>
                            )}

                            {result.warnings.length > 0 && (
                                <div>
                                    <Text type="warning" strong>Warnings:</Text>
                                    <ul>
                                        {result.warnings.map((e, i) => <li key={i}><Text type="warning">{e}</Text></li>)}
                                    </ul>
                                </div>
                            )}

                            {result.mutations.length > 0 && (
                                <div>
                                    <Text type="success" strong>Mutations:</Text>
                                    <ul style={{ fontSize: 11, fontFamily: 'monospace' }}>
                                        {result.mutations.map((m, i) => (
                                            <li key={i}>{m.target} ➔ {String(m.value)}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </Space>
                    )}
                </div>
            </Col>
        </Row>
    </Card>
  );
};

