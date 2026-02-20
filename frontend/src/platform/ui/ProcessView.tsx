// FILEPATH: frontend/src/platform/ui/ProcessView.tsx
// @file: Process View (Fluid Transition)
// @role: 🎨 UI Presentation */
// @author: The Engineer
// @description: A standalone view for executing a specific process instance.
// VISUAL: Added <FadeIn> wrapper for standard transitions.


import React, { useState } from 'react';
import { Layout, Steps, theme, Button, message, Result } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';

import { WorkflowPlayer } from '../workflow/components/WorkflowPlayer';
import { FadeIn } from './animation/FadeIn'; // ⚡ ANIMATION

const { Content, Header } = Layout;

export const ProcessView: React.FC = () => {
    const { token } = theme.useToken();
    const navigate = useNavigate();
    const { domain, id } = useParams();

    const [currentStep, setCurrentStep] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    // Hardcoded flow for now, will be dynamic in Level 5
    const steps = [
        { title: 'Initiation', description: 'Start the process' },
        { title: 'Execution', description: 'Perform actions' },
        { title: 'Completion', description: 'Review and finalize' },
    ];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            setIsComplete(true);
            message.success('Process Completed!');
        }
    };

    if (!domain || !id) {
        return (
            <FadeIn>
                <Result
                    status="404"
                    title="404"
                    subTitle="Process Context Not Found."
                    extra={<Button type="primary" onClick={() => navigate('/')}>Back Home</Button>}
                />
            </FadeIn>
        );
    }

    return (
        <FadeIn>
            <Layout style={{ minHeight: '100vh', background: token.colorBgLayout }}>
                <Header style={{ background: token.colorBgContainer, padding: '0 24px', borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                        <span style={{ fontSize: 18, fontWeight: 600 }}>Executing {domain} #{id}</span>
                    </div>
                </Header>
                
                <Content style={{ padding: '40px', maxWidth: 1000, margin: '0 auto', width: '100%' }}>
                    <Steps 
                        current={currentStep} 
                        items={steps} 
                        style={{ marginBottom: 40 }}
                    />

                    <div style={{ 
                        background: token.colorBgContainer, 
                        padding: 32, 
                        borderRadius: 8, 
                        minHeight: 400,
                        border: `1px solid ${token.colorBorderSecondary}`
                    }}>
                        {isComplete ? (
                            <Result
                                status="success"
                                title="Process Successfully Completed"
                                subTitle={`Entity ${domain}:${id} has been processed.`}
                                extra={[
                                    <Button type="primary" key="console" onClick={() => navigate('/')}>
                                        Return to Console
                                    </Button>,
                                    <Button key="again" onClick={() => { setIsComplete(false); setCurrentStep(0); }}>
                                        Run Again
                                    </Button>,
                                ]}
                            />
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <WorkflowPlayer 
                                        domain={domain} 
                                        id={id} 
                                        onComplete={handleNext} 
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </Content>
            </Layout>
        </FadeIn>
    );
};

