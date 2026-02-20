// FILEPATH: frontend/src/domains/meta_v2/features/workflows/components/canvas/CanvasNodes.tsx
// @file: Canvas Nodes Collection
// @role: 🎨 UI Presentation */
// @author: The Engineer
// @description: Renders ReactFlow Custom Nodes (Screen, Task, Standard) representing workflow states.
// @security-level: LEVEL 9 (UI Safe) */

import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { Card, Typography, theme, Badge, Space } from 'antd';
import { 
    TabletOutlined, FieldStringOutlined, CalendarOutlined, CheckSquareOutlined, NumberOutlined,
    BuildOutlined, RobotOutlined, CloudServerOutlined, ReloadOutlined, ClockCircleOutlined
} from '@ant-design/icons';

const { Text } = Typography;

// --- SHARED DOMAIN TYPES ---
export interface CanvasNodeData {
  label: string;
  isInitial?: boolean;
  description?: string;
  color?: string;
  meta?: any;
  type?: string;
}

// ============================================================================
// 1. SCREEN NODE (WIZARD VISUAL)
// ============================================================================
const FIELD_ICONS: Record<string, React.ReactNode> = {
    'ProFormText': <FieldStringOutlined />,
    'ProFormText.Password': <FieldStringOutlined />,
    'ProFormTextArea': <FieldStringOutlined />,
    'ProFormDatePicker': <CalendarOutlined />,
    'ProFormCheckbox': <CheckSquareOutlined />,
    'ProFormDigit': <NumberOutlined />,
    'default': <FieldStringOutlined />
};

export const ScreenNode = memo(({ data, selected }: NodeProps<CanvasNodeData>) => {
    const { token } = theme.useToken();
    const meta = data.meta || {};
    const schema = meta.form_schema || [];
    const isFinal = data.type === 'final';

    return (
        <div style={{ position: 'relative' }}>
            <Handle type="target" position={Position.Top} style={{ background: token.colorTextSecondary, width: 8, height: 8 }} />
            <Card
                size="small"
                hoverable
                style={{ 
                    width: 220, 
                    borderColor: selected ? token.colorPurple : token.colorBorderSecondary,
                    borderTop: `4px solid ${isFinal ? token.colorSuccess : token.colorPurple}`,
                    boxShadow: selected ? `0 0 0 4px ${token.colorPurple}20` : token.boxShadowSmall
                }}
                styles={{ body: { padding: '8px 12px' } }}
            >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ 
                        width: 24, height: 24, background: token.colorPurpleBg, borderRadius: 4,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: token.colorPurple, marginRight: 8
                    }}>
                        <TabletOutlined />
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <Text strong style={{ fontSize: 13, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {data.label}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 10 }}>{isFinal ? 'Submission' : 'User Input'}</Text>
                    </div>
                </div>
                <div style={{ background: token.colorFillAlter, borderRadius: 4, padding: '4px 8px' }}>
                    {schema.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {schema.slice(0, 4).map((field: any, idx: number) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', fontSize: 10, color: token.colorTextSecondary }}>
                                    <span style={{ marginRight: 6 }}>{FIELD_ICONS[field.component] || FIELD_ICONS['default']}</span>
                                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{field.label}</span>
                                    {field.required && <span style={{ color: token.colorError, marginLeft: 4 }}>*</span>}
                                </div>
                            ))}
                            {schema.length > 4 && <Text type="secondary" style={{ fontSize: 9, textAlign: 'center', display: 'block' }}>+ {schema.length - 4} more</Text>}
                        </div>
                    ) : <Text type="secondary" style={{ fontSize: 10, fontStyle: 'italic' }}>No fields</Text>}
                </div>
            </Card>
            <Handle type="source" position={Position.Bottom} style={{ background: token.colorPurple, width: 8, height: 8 }} />
        </div>
    );
});

// ============================================================================
// 2. STANDARD NODE (GOVERNANCE VISUAL)
// ============================================================================
export const StandardNode = memo(({ data, selected }: NodeProps<CanvasNodeData>) => {
    const { token } = theme.useToken();
    const meta = data.meta || {};
    const color = meta.color || token.colorPrimary;
    const isFinal = data.type === 'final';

    return (
        <div style={{ position: 'relative' }}>
            <Handle type="target" position={Position.Top} style={{ background: token.colorTextSecondary, width: 8, height: 8 }} />
            <Card
                size="small" hoverable
                style={{ 
                    width: 180, borderColor: selected ? color : token.colorBorderSecondary,
                    borderLeft: `4px solid ${color}`, boxShadow: selected ? `0 0 0 4px ${color}20` : token.boxShadowSmall, borderRadius: 6
                }}
                styles={{ body: { padding: '8px 12px' } }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <BuildOutlined style={{ color }} />
                        <Text strong style={{ fontSize: 13 }}>{data.label}</Text>
                    </div>
                    {isFinal && <Badge status="success" />}
                </div>
                {meta.description && <Text type="secondary" style={{ fontSize: 10, lineHeight: 1.2, display: 'block' }}>{meta.description}</Text>}
            </Card>
            <Handle type="source" position={Position.Bottom} style={{ background: color, width: 8, height: 8 }} />
        </div>
    );
});

// ============================================================================
// 3. TASK NODE (JOB VISUAL)
// ============================================================================
export const TaskNode = memo(({ data, selected }: NodeProps<CanvasNodeData>) => {
    const { token } = theme.useToken();
    const meta = data.meta || {};
    const jobConfig = meta.job_config || {};
    const isFinal = data.type === 'final';

    return (
        <div style={{ position: 'relative' }}>
            <Handle type="target" position={Position.Top} style={{ background: token.colorTextSecondary, borderRadius: 0, width: 10, height: 6 }} />
            <Card
                size="small" hoverable
                style={{ 
                    width: 200, borderColor: selected ? token.colorSuccess : token.colorBorderSecondary,
                    borderTop: `4px solid ${token.colorSuccess}`, background: token.colorBgContainer,
                    boxShadow: selected ? `0 0 0 4px ${token.colorSuccess}20` : token.boxShadowSmall
                }}
                styles={{ body: { padding: 0 } }}
            >
                <div style={{ padding: '8px 12px', borderBottom: `1px solid ${token.colorSplit}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Space><RobotOutlined style={{ color: token.colorSuccess }} /><Text strong style={{ fontSize: 13 }}>{data.label}</Text></Space>
                        {isFinal && <Badge status="success" />}
                    </div>
                    <Text type="secondary" style={{ fontSize: 10, display: 'block', marginTop: 2 }}>{jobConfig.handler || 'System Task'}</Text>
                </div>
                <div style={{ display: 'flex', fontSize: 10, color: token.colorTextSecondary, background: token.colorFillQuaternary }}>
                    <div style={{ flex: 1, padding: '4px 8px', borderRight: `1px solid ${token.colorSplit}`, textAlign: 'center' }}>
                        <Space size={4}><CloudServerOutlined /><span>{jobConfig.queue || 'default'}</span></Space>
                    </div>
                    <div style={{ flex: 1, padding: '4px 8px', textAlign: 'center' }}>
                        <Space size={4}><ReloadOutlined /><span>{jobConfig.retries || 0}</span></Space>
                    </div>
                </div>
                {jobConfig.timeout && (
                    <div style={{ padding: '4px 12px', fontSize: 10, color: token.colorTextTertiary, textAlign: 'center', borderTop: `1px solid ${token.colorSplit}` }}>
                        <Space size={4}><ClockCircleOutlined /><span>Timeout: {jobConfig.timeout}s</span></Space>
                    </div>
                )}
            </Card>
            <Handle type="source" position={Position.Bottom} style={{ background: token.colorSuccess, borderRadius: 0, width: 10, height: 6 }} />
        </div>
    );
});

