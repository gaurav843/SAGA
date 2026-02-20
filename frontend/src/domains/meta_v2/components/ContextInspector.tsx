// FILEPATH: frontend/src/domains/meta_v2/components/ContextInspector.tsx
// @file: Context Inspector (The X-Ray)
// @role: 🛠️ Diagnostic Tool */
// @author: The Engineer
// @description: Visualizes the Active Kernel Context.
// FIX: Replaced hardcoded colors with Semantic Tokens for Dark Mode support.

// @security-level: LEVEL 9 (UI Safe) */

import React from 'react';
import { Card, Typography, Empty, Tag, Descriptions, Divider, theme } from 'antd';
import { useKernel } from '../_kernel/useKernel';
import { 
    CheckCircleOutlined, 
    CloseCircleOutlined, 
    ExperimentOutlined 
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export const ContextInspector: React.FC = () => {
    const { activeContext } = useKernel();
    // ⚡ FIX: Access Global Theme Tokens
    const { token } = theme.useToken();

    if (!activeContext) {
        return (
            <div style={{ padding: 48, textAlign: 'center', opacity: 0.5 }}>
                <Empty description="Select an Object from the Universal Tree to inspect its DNA." />
            </div>
        );
    }

    const { key, label, type, capabilities } = activeContext;

    // Helper to render boolean capabilities visually
    const renderCap = (val: boolean) => (
        val ? <Tag color="success" icon={<CheckCircleOutlined />}>Enabled</Tag> 
            : <Tag color="default" icon={<CloseCircleOutlined />}>Disabled</Tag>
    );

    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <Card 
                title={<><ExperimentOutlined /> Kernel X-Ray</>} 
                bordered={false}
                style={{ 
                    boxShadow: token.boxShadowSecondary,
                    background: token.colorBgContainer 
                }}
            >
                <div style={{ marginBottom: 24 }}>
                    <Title level={2} style={{ margin: 0 }}>{label}</Title>
                    <Text type="secondary" code>{key}</Text>
                    <Divider type="vertical" />
                    <Tag color={type === 'SYSTEM' ? 'purple' : 'blue'}>{type}</Tag>
                </div>

                <Descriptions title="Computed Capabilities (Genetic Code)" bordered column={1} size="small">
                    <Descriptions.Item label="Schema Editing (Dictionary)">
                        {renderCap(capabilities.canEditSchema)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Process Automation (Workflows)">
                        {renderCap(capabilities.canEditWorkflows)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Access Control (Governance)">
                        {renderCap(capabilities.canGovern)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Data Browser (CRUD)">
                        {renderCap(capabilities.canBrowseData)}
                    </Descriptions.Item>
                </Descriptions>

                <Divider orientation="left">Raw Context Payload</Divider>
                
                <Paragraph>
                    <pre style={{ 
                        fontSize: 12, 
                        // ⚡ FIX: Use Semantic Tokens for Background/Border
                        background: token.colorFillAlter, 
                        padding: 12, 
                        borderRadius: 6,
                        border: `1px solid ${token.colorBorderSecondary}`,
                        overflowX: 'auto',
                        color: token.colorText
                    }}>
{JSON.stringify(activeContext, null, 2)}
                    </pre>
                </Paragraph>
            </Card>
        </div>
    );
};

