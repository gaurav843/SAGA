/* FILEPATH: frontend/src/domains/meta/features/states/components/canvas/nodes/TaskNode.tsx */
/* @file Task Node (Job Visual) */
/* @author The Engineer */
/* @description A ReactFlow node that represents a Backend Job.
 * FIX: 'NodeProps' is a type, must use 'import type'.
 */

import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow'; // ⚡ FIX: Added 'type'
import { Card, Typography, theme, Badge, Space } from 'antd';
import { 
    RobotOutlined, 
    CloudServerOutlined,
    ReloadOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';

const { Text } = Typography;

export const TaskNode = memo(({ data, selected }: NodeProps) => {
    const { token } = theme.useToken();
    
    // Extract Metadata
    const meta = data.meta || {};
    const jobConfig = meta.job_config || {};
    const isFinal = data.type === 'final';

    return (
        <div style={{ position: 'relative' }}>
            {/* TARGET HANDLE */}
            <Handle 
                type="target" 
                position={Position.Top} 
                style={{ background: token.colorTextSecondary, borderRadius: 0, width: 10, height: 6 }} 
            />

            <Card
                size="small"
                hoverable
                style={{ 
                    width: 200, 
                    borderColor: selected ? token.colorSuccess : token.colorBorderSecondary,
                    borderTop: `4px solid ${token.colorSuccess}`,
                    background: token.colorBgContainer,
                    boxShadow: selected ? `0 0 0 4px ${token.colorSuccess}20` : token.boxShadowSmall
                }}
                bodyStyle={{ padding: 0 }}
            >
                {/* HEADER */}
                <div style={{ padding: '8px 12px', borderBottom: `1px solid ${token.colorSplit}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Space>
                            <RobotOutlined style={{ color: token.colorSuccess }} />
                            <Text strong style={{ fontSize: 13 }}>{data.label}</Text>
                        </Space>
                        {isFinal && <Badge status="success" />}
                    </div>
                    <Text type="secondary" style={{ fontSize: 10, display: 'block', marginTop: 2 }}>
                        {jobConfig.handler || 'System Task'}
                    </Text>
                </div>

                {/* STATS ROW */}
                <div style={{ 
                    display: 'flex', 
                    fontSize: 10, 
                    color: token.colorTextSecondary,
                    background: token.colorFillQuaternary 
                }}>
                    <div style={{ flex: 1, padding: '4px 8px', borderRight: `1px solid ${token.colorSplit}`, textAlign: 'center' }}>
                        <Space size={4}>
                            <CloudServerOutlined />
                            <span>{jobConfig.queue || 'default'}</span>
                        </Space>
                    </div>
                    <div style={{ flex: 1, padding: '4px 8px', textAlign: 'center' }}>
                        <Space size={4}>
                            <ReloadOutlined />
                            <span>{jobConfig.retries || 0}</span>
                        </Space>
                    </div>
                </div>

                {/* TIMEOUT ROW */}
                {jobConfig.timeout && (
                    <div style={{ padding: '4px 12px', fontSize: 10, color: token.colorTextTertiary, textAlign: 'center', borderTop: `1px solid ${token.colorSplit}` }}>
                        <Space size={4}>
                            <ClockCircleOutlined />
                            <span>Timeout: {jobConfig.timeout}s</span>
                        </Space>
                    </div>
                )}
            </Card>

            {/* SOURCE HANDLE */}
            <Handle 
                type="source" 
                position={Position.Bottom} 
                style={{ background: token.colorSuccess, borderRadius: 0, width: 10, height: 6 }} 
            />
        </div>
    );
});

