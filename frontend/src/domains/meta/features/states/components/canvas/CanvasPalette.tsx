/* FILEPATH: frontend/src/domains/meta/features/states/components/canvas/CanvasPalette.tsx */
/* @file Canvas Palette (Node Toolkit) */
/* @author The Engineer */
/* @description A draggable sidebar containing the available workflow blocks.
 * UPDATED: Fixed deprecated 'bodyStyle' -> 'styles.body'.
 */

import React from 'react';
import { Card, Typography, theme, Space, Divider } from 'antd';
import { 
    TabletOutlined, 
    RobotOutlined, 
    BuildOutlined, 
    ThunderboltOutlined,
    GatewayOutlined
} from '@ant-design/icons';

const { Text } = Typography;

export const CanvasPalette: React.FC = () => {
    const { token } = theme.useToken();

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
                boxShadow: token.boxShadowClasses?.sm || '0 2px 0 rgba(0,0,0,0.02)'
            }}
        >
            <div style={{ color }}>{icon}</div>
            <Text style={{ fontSize: 12 }}>{label}</Text>
        </div>
    );

    return (
        <Card 
            size="small" 
            title={<Space><BuildOutlined /><span>Toolkit</span></Space>}
            style={{ height: '100%', borderRadius: 0, borderRight: `1px solid ${token.colorSplit}` }}
            styles={{ 
                body: { padding: 12, overflowY: 'auto' } 
            }}
        >
            <div style={{ marginBottom: 16 }}>
                <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>
                    User Interface
                </Text>
                <Divider style={{ margin: '8px 0' }} />
                <PaletteItem 
                    type="screen" 
                    label="Wizard Screen" 
                    icon={<TabletOutlined />} 
                    color={token.colorPurple} 
                    payload={{ form_schema: [] }}
                />
            </div>

            <div style={{ marginBottom: 16 }}>
                <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>
                    Backend Ops
                </Text>
                <Divider style={{ margin: '8px 0' }} />
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

            <div>
                <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>
                    Flow Logic
                </Text>
                <Divider style={{ margin: '8px 0' }} />
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
        </Card>
    );
};

