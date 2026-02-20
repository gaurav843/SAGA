// FILEPATH: frontend/src/domains/system/features/identity/SystemIdentityCard.tsx
// @file: System Identity Card (The Widget)
// @author: ansav8@gmail.com
// @description: A dense information display for the User Avatar Menu.
// Displays Version, Environment, and Health Status.

import React from 'react';
import { Tag, Typography, Divider, Space, Badge, Spin } from 'antd';
import { useSystemPulse } from '../../hooks/useSystemPulse';
import { 
    CloudServerOutlined, 
    DatabaseOutlined, 
    BranchesOutlined 
} from '@ant-design/icons';

const { Text } = Typography;

export const SystemIdentityCard: React.FC = () => {
    const { pulse, isLoading, error } = useSystemPulse();

    if (isLoading) return <div style={{ padding: 16, textAlign: 'center' }}><Spin size="small" /></div>;
    if (error) return <div style={{ padding: 16 }}><Tag color="error">System Offline</Tag></div>;
    if (!pulse) return null;

    const { identity, versioning, health } = pulse;
    const isDev = identity.environment === 'DEV';

    return (
        <div style={{ padding: '12px 16px', minWidth: 240 }}>
            {/* HEADER: Identity */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text strong style={{ fontSize: 14 }}>{identity.name}</Text>
                <Tag color={isDev ? 'orange' : 'green'} style={{ marginRight: 0 }}>
                    {identity.environment}
                </Tag>
            </div>

            {/* BODY: Versioning */}
            <Space direction="vertical" size={2} style={{ width: '100%', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <Space><BranchesOutlined style={{ color: '#8c8c8c' }} /> Content:</Space>
                    <Text code>{versioning.content}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <Space><CloudServerOutlined style={{ color: '#8c8c8c' }} /> Engine:</Space>
                    <Text type="secondary">{versioning.engine}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <Space><DatabaseOutlined style={{ color: '#8c8c8c' }} /> Schema:</Space>
                    <Text type="secondary" style={{ fontSize: 10 }}>{versioning.schema.substring(0, 7)}</Text>
                </div>
            </Space>

            <Divider style={{ margin: '8px 0' }} />

            {/* FOOTER: Health */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                <Badge status={health.database === 'CONNECTED' ? 'success' : 'error'} text={health.database} />
                <Text type="secondary">{health.modules_active} Modules</Text>
            </div>
        </div>
    );
};

