/* FILEPATH: frontend/src/lab/workflow/TestWorkflow.tsx */
/* @file Laboratory Bench */
/* @author The Engineer */
/* @description A clean environment to test the Wizard Runtime.
 * LOCATION: /src/lab/workflow/ (Isolated from Production)
 * UPDATED: Uses Centralized Kernel Config via Alias.
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Spin, Alert, Layout, theme, Card, Typography, Divider } from 'antd';
import { WizardPlayer } from '../../domains/meta/features/states/components/WizardPlayer';
import { AIComposer } from '../../domains/meta/features/states/components/inspector/wizard/AIComposer';
// ⚡ FRACTAL IMPORT
import { API_BASE_URL } from '@kernel/config';

const { Content } = Layout;
const { Title, Text } = Typography;

export const TestWorkflow: React.FC = () => {
    const { token } = theme.useToken();
    const [currentState, setCurrentState] = useState<string>('credentials');
    const [formData, setFormData] = useState<any>({});
    
    // ⚡ DYNAMIC STATE: Allow AI to overwrite the definition in memory
    const [activeDefinition, setActiveDefinition] = useState<any>(null);

    // 1. Fetch the Seeded Definition (Baseline)
    const { isLoading, error } = useQuery({
        queryKey: ['workflow', 'USER', 'SIGNUP_FLOW'],
        queryFn: async () => {
            // ⚡ GATEWAY: Use standardized base
            const res = await axios.get(`${API_BASE_URL}/api/v1/meta/states/USER/SIGNUP_FLOW`);
            setActiveDefinition(res.data.transitions);
            return res.data;
        }
    });

    // 2. Handle AI Generation (Hot-Swap)
    const handleAIGenerated = (newFields: any[]) => {
        console.log("🤖 AI Generated Fields:", newFields);
        const newDef = JSON.parse(JSON.stringify(activeDefinition));
        if (newDef.states[currentState]) {
            newDef.states[currentState].meta = {
                ...newDef.states[currentState].meta,
                form_schema: newFields
            };
            setActiveDefinition(newDef);
        }
    };

    // 3. Handle Transitions
    const handleTransition = async (event: string, payload: any) => {
        console.log(`🚀 Transition: ${event}`, payload);
        setFormData({ ...formData, ...payload });
        const nextState = activeDefinition?.states[currentState]?.on?.[event]?.target;
        if (nextState) setCurrentState(nextState);
    };

    if (isLoading && !activeDefinition) return <div style={{ padding: 50, textAlign: 'center' }}><Spin size="large" /></div>;
    if (error) return <Alert message="Backend Offline" type="error" showIcon />;

    return (
        <Layout style={{ minHeight: '100vh', background: token.colorBgLayout }}>
            <Content style={{ padding: '40px', display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1, maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ marginBottom: 16 }}>
                        <Title level={4}>🧪 Workflow Lab</Title>
                        <Text type="secondary">Experimental Runtime Environment</Text>
                    </div>
          
                    {activeDefinition && (
                        <WizardPlayer 
                            definition={activeDefinition}
                            currentState={currentState}
                            onTransition={handleTransition}
                            initialValues={formData}
                        />
                    )}
                </div>
                <div style={{ width: '350px' }}>
                    <Card title="🤖 AI Architect" size="small">
                        <Text style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
                            Type a prompt to <b>hot-swap</b> the form schema.
                        </Text>
                        <AIComposer 
                            hostFields={[
                                { path: 'host.email', label: 'Email', type: 'TEXT', group: 'HOST' },
                                { path: 'host.full_name', label: 'Full Name', type: 'TEXT', group: 'HOST' },
                                { path: 'host.role', label: 'Role', type: 'TEXT', group: 'HOST' },
                                { path: 'host.is_active', label: 'Active Status', type: 'BOOLEAN', group: 'HOST' }
                            ]}
                            onGenerate={handleAIGenerated} 
                        />
                        <Divider />
                        <div style={{ fontSize: 10, color: '#666' }}>
                            <strong>Debug State:</strong> {currentState}
                        </div>
                    </Card>
                </div>
            </Content>
        </Layout>
    );
};

