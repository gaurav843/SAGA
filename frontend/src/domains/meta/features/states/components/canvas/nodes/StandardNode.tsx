/* FILEPATH: frontend/src/domains/meta/features/states/components/canvas/nodes/StandardNode.tsx */
/* @file Standard Node (Governance Visual) */
/* @author The Engineer */
/* @description The default node for Governance and Generic State Machines.
 * FIX: 'NodeProps' is a type, must use 'import type'.
 */

import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow'; // ⚡ FIX: Added 'type'
import { Card, Typography, theme, Badge } from 'antd';
import { BuildOutlined } from '@ant-design/icons';

const { Text } = Typography;

export const StandardNode = memo(({ data, selected }: NodeProps) => {
    const { token } = theme.useToken();
    
    const meta = data.meta || {};
    const color = meta.color || token.colorPrimary;
    const isFinal = data.type === 'final';

    return (
        <div style={{ position: 'relative' }}>
            <Handle 
                type="target" 
                position={Position.Top} 
                style={{ background: token.colorTextSecondary, width: 8, height: 8 }} 
            />

            <Card
                size="small"
                hoverable
                style={{ 
                    width: 180, 
                    borderColor: selected ? color : token.colorBorderSecondary,
                    borderLeft: `4px solid ${color}`,
                    boxShadow: selected ? `0 0 0 4px ${color}20` : token.boxShadowSmall,
                    borderRadius: 6
                }}
                bodyStyle={{ padding: '8px 12px' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <BuildOutlined style={{ color }} />
                        <Text strong style={{ fontSize: 13 }}>{data.label}</Text>
                    </div>
                    {isFinal && <Badge status="success" />}
                </div>
                
                {meta.description && (
                    <Text type="secondary" style={{ fontSize: 10, lineHeight: 1.2, display: 'block' }}>
                        {meta.description}
                    </Text>
                )}
            </Card>

            <Handle 
                type="source" 
                position={Position.Bottom} 
                style={{ background: color, width: 8, height: 8 }} 
            />
        </div>
    );
});
