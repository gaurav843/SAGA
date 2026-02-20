// FILEPATH: frontend/src/domains/meta/features/cortex/CortexView.tsx
// @file: AI Cortex Studio View
// @role: 🎨 UI Presentation */
// @author: The Engineer
// @description: Standalone view for the AI Architect.
// @updated: Added Domain Picker and Back Navigation to the Active Toolbar. */

import React, { useState } from 'react';
import { Layout, Typography, theme, Empty, Button, Card, Space, message, Select, Divider } from 'antd';
import { ThunderboltFilled, CopyOutlined, ArrowLeftOutlined, DatabaseOutlined } from '@ant-design/icons';

// ⚡ Ensure this path is correct relative to this file
import { AIComposer } from '../states/components/inspector/wizard/AIComposer';
import { useWidgetRegistry } from '../../../../platform/workflow/wizard-engine/hooks/useWidgetRegistry';
import { useMetaContext } from '../../_kernel/MetaContext';
import { FadeIn } from '../../../../platform/ui/animation/FadeIn';

const { Content } = Layout;
const { Title, Text } = Typography;

export const CortexView: React.FC = () => {
    const { token } = theme.useToken();
    const { selectedDomainKey, setSelectedDomainKey, domainList } = useMetaContext();
    
    const [isComposerOpen, setIsComposerOpen] = useState(false);
    const [lastResult, setLastResult] = useState<any[] | null>(null);

    const { allWidgets: widgets } = useWidgetRegistry();

    const handleGenerate = (schema: any[]) => {
        setLastResult(schema);
        message.success("Schema Generated Successfully");
    };

    const handleCopy = () => {
        if (!lastResult) return;
        navigator.clipboard.writeText(JSON.stringify(lastResult, null, 2));
        message.success("Copied to Clipboard");
    };

    return (
        <FadeIn>
            <Layout style={{ height: 'calc(100vh - 60px)', background: token.colorBgLayout, padding: 40 }}>
                <Content style={{ maxWidth: 1000, margin: '0 auto', width: '100%' }}>
                    
                    <div style={{ textAlign: 'center', marginBottom: 60 }}>
                        <Title level={1} style={{ marginBottom: 16 }}>
                            <Space>
                                <ThunderboltFilled style={{ color: '#722ed1' }} />
                                AI Cortex Studio
                            </Space>
                        </Title>
                        <Text type="secondary" style={{ fontSize: 18 }}>
                            Design, Prototype, and Architect Systems with Neural Intelligence.
                        </Text>
                    </div>

                    {!selectedDomainKey ? (
                        <Card 
                            style={{ textAlign: 'center', padding: 40, border: `2px dashed ${token.colorBorder}` }}
                            styles={{ body: { display: 'flex', flexDirection: 'column', alignItems: 'center' } }}
                        >
                            <Empty 
                                image={Empty.PRESENTED_IMAGE_SIMPLE} 
                                description={
                                    <Text style={{ fontSize: 16 }}>Select a Domain to Initialize Context</Text>
                                }
                            />
                            <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                                {domainList.map(d => (
                                    <Button key={d.key} onClick={() => setSelectedDomainKey(d.key)}>
                                        {d.label}
                                    </Button>
                                ))}
                            </div>
                        </Card>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {/* ⚡ ACTIVE CONTEXT TOOLBAR */}
                            <Card bodyStyle={{ padding: '16px 24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Space size={16}>
                                        <Button 
                                            icon={<ArrowLeftOutlined />} 
                                            onClick={() => setSelectedDomainKey('')} 
                                            type="text"
                                        >
                                            Back
                                        </Button>
                                        <Divider type="vertical" style={{ height: 24 }} />
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <Text type="secondary" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                Active Context
                                            </Text>
                                            <Select
                                                value={selectedDomainKey}
                                                onChange={setSelectedDomainKey}
                                                style={{ width: 240, fontWeight: 600 }}
                                                bordered={false}
                                                suffixIcon={<DatabaseOutlined />}
                                                options={domainList.map(d => ({ label: d.label, value: d.key }))}
                                                dropdownStyle={{ minWidth: 240 }}
                                            />
                                        </div>
                                    </Space>

                                    <Button 
                                        type="primary" 
                                        size="large" 
                                        icon={<ThunderboltFilled />} 
                                        onClick={() => setIsComposerOpen(true)}
                                        style={{ backgroundColor: '#722ed1', borderColor: '#722ed1' }}
                                    >
                                        Open Architect
                                    </Button>
                                </div>
                            </Card>

                            {lastResult && (
                                <Card title="Generated Schema Output" extra={
                                    <Button icon={<CopyOutlined />} onClick={handleCopy}>Copy JSON</Button>
                                }>
                                    <div style={{ 
                                        background: token.colorFillAlter, 
                                        padding: 16, 
                                        borderRadius: 8, 
                                        maxHeight: 400, 
                                        overflow: 'auto', 
                                        fontFamily: 'monospace',
                                        fontSize: 12
                                    }}>
                                        <pre>{JSON.stringify(lastResult, null, 2)}</pre>
                                    </div>
                                </Card>
                            )}
                        </div>
                    )}

                    {selectedDomainKey && (
                        <AIComposer 
                            visible={isComposerOpen}
                            onClose={() => setIsComposerOpen(false)}
                            onGenerate={handleGenerate}
                            domain={selectedDomainKey}
                            widgets={widgets}
                        />
                    )}
                </Content>
            </Layout>
        </FadeIn>
    );
};

