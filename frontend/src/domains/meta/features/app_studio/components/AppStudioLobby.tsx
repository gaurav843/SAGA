// FILEPATH: frontend/src/domains/meta/features/app_studio/components/AppStudioLobby.tsx
// @file: App Studio Lobby
// @role: 🎨 UI Presentation */
// @author: The Engineer
// @description: The "Welcome Screen" for the App Studio. Lists existing apps and allows creation.
// @security-level: LEVEL 9 (Read-Only List) */
// @invariant: Must display all available screens from the registry. */

import React from 'react';
import { Card, Typography, Button, Empty, Tag, Space, theme, Row, Col, Statistic } from 'antd';
import { 
    PlusOutlined, 
    AppstoreOutlined, 
    EditOutlined, 
    DeleteOutlined 
} from '@ant-design/icons';

import { type Screen } from '../types';
import { IconFactory } from './IconFactory';

const { Title, Text, Paragraph } = Typography;

interface AppStudioLobbyProps {
    screens: Screen[];
    onSelect: (screenId: number) => void;
    onCreate: () => void;
    onDelete: (screenId: number) => void;
    isLoading: boolean;
}

export const AppStudioLobby: React.FC<AppStudioLobbyProps> = ({ 
    screens, 
    onSelect, 
    onCreate, 
    onDelete, 
    isLoading 
}) => {
    const { token } = theme.useToken();

    // ⚡ GOVERNANCE FILTER: Hide screens locked by backend policy (mode='strict')
    // We strictly filter out any screen that claims to be "strict" in its security policy.
    const visibleScreens = screens.filter(screen => {
        // @ts-ignore: security_policy is JSONB from backend
        return screen.security_policy?.mode !== 'strict';
    });

    return (
        <div style={{ 
            padding: '48px 24px', 
            maxWidth: 1200, 
            margin: '0 auto',
            height: '100%',
            overflowY: 'auto'
        }}>
            {/* HEADER */}
            <div style={{ marginBottom: 48, textAlign: 'center' }}>
                <div style={{ marginBottom: 16 }}>
                    <AppstoreOutlined style={{ fontSize: 48, color: token.colorPrimary }} />
                </div>
                <Title level={2} style={{ marginBottom: 8 }}>Cortex App Studio</Title>
                <Paragraph type="secondary" style={{ fontSize: 16, maxWidth: 600, margin: '0 auto' }}>
                    Design, configure, and publish enterprise capabilities. 
                    Select an application below to enter the visual editor.
                </Paragraph>
                <div style={{ marginTop: 32 }}>
                    <Button 
                        type="primary" 
                        size="large" 
                        icon={<PlusOutlined />} 
                        onClick={onCreate}
                        loading={isLoading}
                    >
                        Create New App
                    </Button>
                </div>
            </div>

            {/* STATS ROW (Optional Polish) */}
            {visibleScreens.length > 0 && (
                <Row gutter={24} style={{ marginBottom: 48, justifyContent: 'center' }}>
                    <Col>
                        <Statistic title="Total Apps" value={visibleScreens.length} />
                    </Col>
                    <Col>
                        <Statistic title="Active" value={visibleScreens.filter(s => s.is_active).length} />
                    </Col>
                </Row>
            )}

            {/* APP GRID */}
            {visibleScreens.length === 0 ? (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No applications found. Initialize your first workspace."
                />
            ) : (
                <Row gutter={[24, 24]}>
                    {visibleScreens.map(screen => (
                        <Col key={screen.id} xs={24} sm={12} md={8} lg={6}>
                            <Card
                                hoverable
                                style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                                bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                                actions={[
                                    <Button type="text" icon={<EditOutlined />} onClick={() => onSelect(screen.id)}>Edit</Button>,
                                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => onDelete(screen.id)}>Delete</Button>
                                ]}
                            >
                                <Card.Meta
                                    avatar={
                                        <div style={{ 
                                            background: token.colorFillSecondary, 
                                            padding: 12, 
                                            borderRadius: 8 
                                        }}>
                                            <IconFactory icon="antd:AppstoreOutlined" style={{ fontSize: 24, color: token.colorPrimary }} />
                                        </div>
                                    }
                                    title={screen.title}
                                    description={
                                        <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                                            <Tag color="blue" style={{ margin: 0 }}>/{screen.route_slug}</Tag>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                Last updated: {new Date(screen.created_at).toLocaleDateString()}
                                            </Text>
                                        </Space>
                                    }
                                />
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </div>
    );
};

