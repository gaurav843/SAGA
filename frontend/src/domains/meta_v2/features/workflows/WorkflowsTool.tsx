// FILEPATH: frontend/src/domains/meta_v2/features/workflows/WorkflowsTool.tsx
// @file: Workflows Tool (V2 Adapter)
// @role: 🧩 Feature Container / 🧠 Telemetry Probe */
// @author: The Engineer
// @description: The V2-Native wrapper for the Workflow Engine. Injected with P1-DIAG-02 probes.
// @security-level: LEVEL 9 (UI Safe) */

import React, { useEffect } from 'react';
import { Layout, Typography, theme, Button, Space, Empty } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';

import { logger } from '@/platform/logging';
import { useKernel } from '../../_kernel/KernelContext';
import { FadeIn } from '@/platform/ui/animation/FadeIn';

import { WorkflowExplorer } from './components/WorkflowExplorer';
import { WorkflowEditor } from './components/WorkflowEditor';

const { Content } = Layout;
const { Title } = Typography;

export const WorkflowsTool: React.FC = () => {
    const { token } = theme.useToken();
    const navigate = useNavigate();
    
    const { domain, scope } = useParams<{ domain: string; scope?: string }>();
    const [searchParams] = useSearchParams();
    const { activeContext, selectContext, isLoading: kernelLoading, registry } = useKernel();
    
    const targetDomain = domain || searchParams.get('domain') || activeContext?.key;

    // 🔬 BLACK BOX PROBE: P1-DIAG-02 (WorkflowsTool) 
    useEffect(() => {
        logger.tell("PROBE", "WorkflowsTool Hook State Check", { 
            url_param_domain: domain, 
            url_param_scope: scope, 
            kernel_is_loading: kernelLoading,
            has_active_context: !!activeContext,
            registry_count: registry?.length || 0,
            computed_target: targetDomain
        });
    }, [domain, scope, activeContext, kernelLoading, registry, targetDomain]);

    // ⚡ SYNC ENGINE: Ensure Kernel is aware of Router URL changes
    useEffect(() => {
        if (targetDomain && activeContext?.key !== targetDomain) {
            logger.trace("WORKFLOWS", `🔄 Syncing Kernel Context with Route: ${targetDomain}`);
            selectContext(targetDomain);
        }
    }, [targetDomain, activeContext?.key, selectContext]);

    const handleBack = () => {
        logger.whisper("WORKFLOWS", "Navigating back...");
        if (scope) {
            navigate(`/meta-v2/workflows/${targetDomain}`);
        } else {
            navigate('/meta-v2');
        }
    };

    if (!targetDomain) {
        return (
            <FadeIn>
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Empty description="No Domain Selected" />
                </div>
            </FadeIn>
        );
    }

    return (
        <FadeIn triggerKey={`${targetDomain}-${scope}`}>
            <Layout style={{ height: '100%', background: 'transparent' }}>
                {!scope && (
                    <div style={{ 
                        padding: '16px 24px', 
                        borderBottom: `1px solid ${token.colorBorderSecondary}`,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: token.colorBgContainer
                    }}>
                        <Space>
                            <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>Back</Button>
                            <Title level={4} style={{ margin: 0 }}>
                                Process Workflows: {targetDomain}
                            </Title>
                        </Space>
                    </div>
                )}

                <Content style={{ height: scope ? '100%' : 'calc(100% - 64px)', overflow: 'hidden' }}>
                    {scope ? (
                        <WorkflowEditor domain={targetDomain} scope={scope} onBack={handleBack} />
                    ) : (
                        <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>
                            <WorkflowExplorer domain={targetDomain} />
                        </div>
                    )}
                </Content>
            </Layout>
        </FadeIn>
    );
};

