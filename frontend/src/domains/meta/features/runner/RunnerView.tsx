// FILEPATH: frontend/src/domains/meta/features/runner/RunnerView.tsx
// @file: Process Runner Dashboard (Deep Linked + Smooth)
// @author: The Engineer
// @description: The "Launchpad" for Business Processes.
// REFACTOR: Implemented 'useUrlState' for Search Persistence.
// VISUAL: Added <FadeIn> wrapper for standard transitions.
// FEATURES:
// Discovery: Finds all 'WIZARD' scopes in the Registry.
// Filtering: Search by name or domain.
// Routing: Updates URL to launch RuntimeHost.


import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProList } from '@ant-design/pro-components';
import { theme, Typography, Tag, Button, Space, Card, Empty } from 'antd';
import { 
    RocketOutlined, 
    AppstoreOutlined,
    RightOutlined
} from '@ant-design/icons';

import { useMetaContext } from '../../_kernel/MetaContext';
import { RuntimeHost } from './RuntimeHost';
import { useUrlState } from '../../../../platform/hooks/useUrlState'; // ⚡ UNIVERSAL STATE
import { FadeIn } from '../../../../platform/ui/animation/FadeIn'; // ⚡ ANIMATION

const { Title, Text } = Typography;

export const RunnerView: React.FC = () => {
    const { token } = theme.useToken();
    const { domainList } = useMetaContext();
    const [searchParams, setSearchParams] = useSearchParams();
    
    // 1. UNIVERSAL URL STATE (Search Persistence)
    const [searchText, setSearchText] = useUrlState('q', '');

    // 2. DISCOVERY ENGINE
    // Flatten the Domain->Scope hierarchy into a list of "Apps"
    const availableApps = useMemo(() => {
        const apps: any[] = [];
        domainList.forEach(domain => {
            domain.scopes.forEach(scope => {
                // ⚡ FILTER: Only show Wizards (Interactive Processes)
                if (scope.type === 'WIZARD') {
                    apps.push({
                        id: `${domain.key}:${scope.key}`,
                        domain: domain.key,
                        scope: scope.key,
                        title: scope.label, // e.g. "New Employee Onboarding"
                        description: `Domain: ${domain.label}`,
                        avatar: domain.icon || '📦',
                        type: scope.type
                    });
                }
            });
        });
        return apps.filter(app => 
            app.title.toLowerCase().includes(searchText.toLowerCase()) ||
            app.domain.toLowerCase().includes(searchText.toLowerCase())
        );
    }, [domainList, searchText]);

    // 3. ROUTING LOGIC
    const activeDomain = searchParams.get('domain');
    const activeScope = searchParams.get('scope');
    const isRunning = !!(activeDomain && activeScope);

    const handleLaunch = (domain: string, scope: string) => {
        setSearchParams({ domain, scope });
    };

    const handleClose = () => {
        setSearchParams({});
    };

    // 4. RENDER: RUNTIME HOST (The Overlay)
    if (isRunning) {
        return (
            <RuntimeHost 
                domain={activeDomain!} 
                scope={activeScope!} 
                onClose={handleClose} 
            />
        );
    }

    // 5. RENDER: DASHBOARD (The Grid)
    return (
        <FadeIn>
            <div style={{ padding: '24px 40px', maxWidth: 1400, margin: '0 auto' }}>
                
                <div style={{ marginBottom: 40, textAlign: 'center' }}>
                    <Title level={2}>
                        <Space>
                            <RocketOutlined style={{ color: token.colorPrimary }} />
                            Process Runner
                        </Space>
                    </Title>
                    <Text type="secondary" style={{ fontSize: 16 }}>
                        Select a workflow to initiate a new business process.
                    </Text>
                </div>

                <ProList<any>
                    grid={{ gutter: 24, column: 3, xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 4 }}
                    dataSource={availableApps}
                    renderItem={(item) => (
                        <Card
                            hoverable
                            onClick={() => handleLaunch(item.domain, item.scope)}
                            style={{ 
                                height: '100%', 
                                borderRadius: token.borderRadiusLG,
                                borderTop: `4px solid ${token.colorInfo}`
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                                <div style={{ 
                                    width: 48, height: 48, 
                                    background: token.colorFillAlter, 
                                    borderRadius: 12, 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 24
                                }}>
                                    {item.avatar}
                                </div>
                                <Tag color="purple">{item.type}</Tag>
                            </div>
                            
                            <Title level={5} style={{ marginBottom: 4 }}>{item.title}</Title>
                            <Text type="secondary" style={{ fontSize: 12 }}>{item.description}</Text>
                            
                            <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${token.colorSplit}`, textAlign: 'right' }}>
                                <Button type="primary" shape="round" icon={<RightOutlined />} size="small">
                                    Launch
                                </Button>
                            </div>
                        </Card>
                    )}
                    toolbar={{
                        search: {
                            onSearch: (value) => setSearchText(value),
                            placeholder: 'Search processes...',
                            style: { width: 400 },
                            defaultValue: searchText // Ensure input syncs with URL on reload
                        },
                        actions: [
                            <Button key="refresh" type="text" icon={<AppstoreOutlined />}>
                                Refresh Catalog
                            </Button>
                        ]
                    }}
                />
                
                {availableApps.length === 0 && (
                    <Empty description="No Wizard processes defined in the Registry." style={{ marginTop: 60 }} />
                )}
            </div>
        </FadeIn>
    );
};

