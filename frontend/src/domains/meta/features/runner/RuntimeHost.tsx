// FILEPATH: frontend/src/domains/meta/features/runner/RuntimeHost.tsx
// @file: Runtime Execution Host (Safe Icons Edition)
// @author: ansav8@gmail.com
// @description: The "Focus Mode" container for running a Wizard.
// ⚡ FIX: Replaced direct icon imports with IconFactory to prevent 'Icon3' crashes.
// ⚡ FEATURES: URL State Synchronization, ProLayout integration.

import React from 'react';
import {
PageContainer,
ProCard
} from '@ant-design/pro-components';
import { Button, Result, theme, Typography, Tag, Space } from 'antd';

// ⚡ SAFE IMPORT: No direct @ant-design/icons imports
import { IconFactory } from '../../../../platform/ui/icons/IconFactory';
import { WizardPlayer } from '../../../../platform/workflow/components/WizardPlayer';
import { useMetaContext } from '../../_kernel/MetaContext';

const { Text } = Typography;

interface RuntimeHostProps {
domain: string;
scope: string;
onClose: () => void;
}

export const RuntimeHost: React.FC<RuntimeHostProps> = ({ domain, scope, onClose }) => {
const { token } = theme.useToken();
const { domainList } = useMetaContext();

// 1. RESOLVE CONTEXT (Metadata)
const domainDef = domainList.find(d => d.key === domain);
const scopeDef = domainDef?.scopes.find(s => s.key === scope);

if (!domainDef || !scopeDef) {
    return (
        <Result
            status="404"
            title="Process Not Found"
            subTitle={`The workflow ${domain}/${scope} does not exist in the Registry.`}
            extra={<Button type="primary" onClick={onClose}>Return to Launcher</Button>}
        />
    );
}

return (
    <div style={{ 
        position: 'fixed', 
        top: 0, left: 0, right: 0, bottom: 0, 
        background: token.colorBgLayout, 
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column'
    }}>
        <PageContainer
            title={
                <Space>
                    <Button 
                        icon={<IconFactory icon="antd:ArrowLeftOutlined" />} 
                        type="text" 
                        onClick={onClose} 
                    />
                    <span>{scopeDef.label}</span>
                </Space>
            }
            subTitle={`Executing ${domain} Protocol`}
            tags={<Tag color="purple">WIZARD</Tag>}
            extra={[
                <Button 
                    key="close" 
                    icon={<IconFactory icon="antd:CloseOutlined" />} 
                    onClick={onClose}
                >
                    Cancel Process
                </Button>
            ]}
            contentDesign={false}
            style={{ height: '100%' }}
        >
            <ProCard 
                split="vertical" 
                bordered 
                headerBordered
                style={{ height: 'calc(100vh - 140px)', overflow: 'hidden' }}
            >
                {/* LEFT: CONTEXT / HELP */}
                <ProCard colSpan="300px" title="Process Context" className="hidden-mobile">
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>DOMAIN</Text>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                <div style={{ fontSize: 18 }}>
                                    {/* Use factory for dynamic icon string from domain def */}
                                    <IconFactory icon={domainDef.icon} />
                                </div>
                                <Text strong>{domainDef.label}</Text>
                            </div>
                        </div>
                        
                        <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>SYSTEM ID</Text>
                            <div><Tag style={{ fontFamily: 'monospace', margin: 0 }}>{domain}:{scope}</Tag></div>
                        </div>

                        <div style={{ padding: 12, background: token.colorFillAlter, borderRadius: 6 }}>
                            <Space align="start">
                                <IconFactory 
                                    icon="antd:BuildOutlined" 
                                    style={{ color: token.colorTextSecondary }} 
                                />
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    This process runs in a sandbox. Data is only committed upon final submission.
                                </Text>
                            </Space>
                        </div>
                    </Space>
                </ProCard>

                {/* RIGHT: THE STAGE */}
                <ProCard title="Step Execution" style={{ height: '100%', overflowY: 'auto' }}>
                    <div style={{ padding: 24, height: '100%' }}>
                        <WizardPlayer 
                            domain={domain} 
                            scope={scope} 
                            onClose={onClose} 
                        />
                    </div>
                </ProCard>
            </ProCard>
        </PageContainer>
    </div>
);
};
