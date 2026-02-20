/* FILEPATH: frontend/src/domains/meta/features/states/components/NodeCard.tsx */
/* @file Custom Node Renderer */
/* @author The Engineer */
/* @description Renders a State Machine Node using Ant Design components.
 * UPDATED: Prominent "Start Node" visibility (Green Play Badge + Border).
 */

import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { Card, Typography, theme, Tag, Space, Badge } from 'antd';
import { 
  LoginOutlined, 
  LogoutOutlined, 
  PlayCircleFilled // ⚡ NEW ICON
} from '@ant-design/icons';
import type { FlowNodeData } from '../types';

const { Text } = Typography;

export const NodeCard = memo(({ data, selected }: NodeProps<FlowNodeData>) => {
  const { token } = theme.useToken();

  // ⚡ START NODE STYLING
  const isStartNode = data.isInitial;
  
  // 🎨 Dynamic Styling based on Selection
  const borderStyle = selected 
    ? `2px solid ${token.colorPrimary}` 
    : isStartNode 
        ? `2px solid ${token.colorSuccess}` // Green border for Start
        : `1px solid ${token.colorBorder}`;

  const boxShadow = selected 
    ? `0 4px 12px ${token.colorPrimary}40`
    : isStartNode 
        ? `0 4px 12px ${token.colorSuccess}20` // Subtle green glow for Start
        : token.boxShadowSmall;

  return (
    <div style={{ position: 'relative' }}>
      
      {/* 1. INPUT HANDLE (Target) */}
      <Handle 
        type="target" 
        position={Position.Left} 
        style={{ 
          background: token.colorTextSecondary,
          width: 8, height: 8,
          left: -4 
        }} 
      />

      {/* 2. THE CARD CONTENT */}
      <Card 
        size="small" 
        style={{ 
          width: 240,
          border: borderStyle,
          boxShadow: boxShadow,
          background: token.colorBgContainer,
          transition: 'all 0.2s ease',
          cursor: 'grab',
          position: 'relative', // For absolute positioning of badge
          overflow: 'hidden'
        }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        {/* ⚡ START BADGE (LOUD VISUAL) */}
        {isStartNode && (
            <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                background: token.colorSuccess,
                color: '#fff',
                padding: '2px 8px',
                borderBottomLeftRadius: 8,
                fontSize: 10,
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: 4
            }}>
                <PlayCircleFilled /> START
            </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <Space>
            <div style={{ 
                width: 8, height: 8, borderRadius: '50%', 
                background: data.color || token.colorTextSecondary 
            }} />
            <Text strong style={{ fontSize: 14 }}>{data.label}</Text>
          </Space>
        </div>

        {data.description && (
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
            {data.description}
          </Text>
        )}

        <div style={{ 
            marginTop: 8, 
            paddingTop: 8, 
            borderTop: `1px solid ${token.colorSplit}`,
            display: 'flex', 
            justifyContent: 'space-between',
            fontSize: 10,
            color: token.colorTextQuaternary
        }}>
           <Space size={4}>
               <LoginOutlined /> Input
           </Space>
           <Space size={4}>
               Output <LogoutOutlined />
           </Space>
        </div>
      </Card>

      {/* 3. OUTPUT HANDLE (Source) */}
      <Handle 
        type="source" 
        position={Position.Right} 
        style={{ 
          background: token.colorPrimary,
          width: 10, height: 10,
          right: -5
        }} 
      />
    </div>
  );
});

