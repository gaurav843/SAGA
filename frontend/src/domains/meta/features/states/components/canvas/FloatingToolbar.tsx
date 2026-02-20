/* FILEPATH: frontend/src/domains/meta/features/states/components/canvas/FloatingToolbar.tsx */
/* @file Floating Toolbar (The Palette) */
/* @author The Engineer */
/* @description A floating dock containing the workflow building blocks.
 * UPDATED: Fixed deprecated 'bodyStyle' -> 'styles.body'.
 */

import React, { useState } from 'react';
import { Card, Typography, theme, Space, Tooltip, Button, Divider } from 'antd';
import { 
    TabletOutlined, 
    RobotOutlined, 
    BuildOutlined, 
    ThunderboltOutlined,
    GatewayOutlined,
    ToolOutlined,
    CloseOutlined
} from '@ant-design/icons';

const { Text } = Typography;

export const FloatingToolbar: React.FC = () => {
    const { token } = theme.useToken();
    const [isOpen, setIsOpen] = useState(true);

    const onDragStart = (event: React.DragEvent, nodeType: string, payload?: any) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        if (payload) {
            event.dataTransfer.setData('application/flodock-payload', JSON.stringify(payload));
        }
        event.dataTransfer.effectAllowed = 'move';
    };

    const PaletteItem = ({ type, label, icon, color, payload }: any) => (
        <div 
            onDragStart={(event) => onDragStart(event, type, payload)} 
            draggable 
            style={{ 
                marginBottom: 8, 
                cursor: 'grab', 
                padding: '8px 12px',
                background: token.colorBgContainer,
                border: `1px solid ${token.colorBorderSecondary}`,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                boxShadow: token.boxShadowSmall,
                transition: 'all 0.2s',
            }}
            className="palette-item"
        >
            <div style={{ color, fontSize: 16 }}>{icon}</div>
            <Text style={{ fontSize: 12, fontWeight: 500 }}>{label}</Text>
        </div>
    );

    if (!isOpen) {
        return (
            <div style={{ position: 'absolute', top: 24, left: 24, zIndex: 100 }}>
                <Tooltip title="Open Toolkit" placement="right">
                    <Button 
                        type="primary" 
                        shape="circle" 
                        icon={<ToolOutlined />} 
                        size="large" 
                        onClick={() => setIsOpen(true)}
                        style={{ boxShadow: token.boxShadowSecondary }}
                    />
                </Tooltip>
            </div>
        );
    }

    return (
        <Card 
            size="small" 
            title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space><ToolOutlined /><span>Toolkit</span></Space>
                    <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => setIsOpen(false)} />
                </div>
            }
            style={{ 
                position: 'absolute', 
                top: 24, 
                left: 24, 
                width: 260, 
                zIndex: 100,
                borderRadius: 12,
                border: `1px solid ${token.colorBorderSecondary}`,
                boxShadow: token.boxShadowSecondary,
                backdropFilter: 'blur(10px)',
                background: `${token.colorBgContainer}E6` // 90% opacity
            }}
            styles={{ 
                body: { padding: 16, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' } 
            }}
        >
            <div style={{ marginBottom: 16 }}>
                <Text type="secondary" style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>
                    User Interface
                </Text>
                <div style={{ marginTop: 8 }}>
                    <PaletteItem 
                        type="screen" 
                        label="Wizard Screen" 
                        icon={<TabletOutlined />} 
                        color={token.colorPurple} 
                        payload={{ form_schema: [] }}
                    />
                </div>
            </div>

            <div style={{ marginBottom: 16 }}>
                <Text type="secondary" style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>
                    Backend Ops
                </Text>
                <div style={{ marginTop: 8 }}>
                    <PaletteItem 
                        type="task" 
                        label="Async Job" 
                        icon={<RobotOutlined />} 
                        color={token.colorSuccess} 
                        payload={{ job_config: { queue: 'default' } }}
                    />
                    <PaletteItem 
                        type="task" 
                        label="System Action" 
                        icon={<ThunderboltOutlined />} 
                        color={token.colorWarning} 
                        payload={{ job_config: { handler: 'system.noop' } }}
                    />
                </div>
            </div>

            <div>
                <Text type="secondary" style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>
                    Flow Logic
                </Text>
                <div style={{ marginTop: 8 }}>
                    <PaletteItem 
                        type="standard" 
                        label="Status State" 
                        icon={<BuildOutlined />} 
                        color={token.colorPrimary} 
                    />
                    <PaletteItem 
                        type="standard" 
                        label="Gate / Choice" 
                        icon={<GatewayOutlined />} 
                        color={token.colorTextSecondary} 
                        payload={{ type: 'parallel' }} 
                    />
                </div>
            </div>
        </Card>
    );
};

