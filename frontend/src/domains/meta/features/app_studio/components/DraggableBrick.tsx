// FILEPATH: frontend/src/domains/meta/features/app_studio/components/DraggableBrick.tsx
// @file: Draggable Brick Component
// @role: 🎨 UI Atom */
// @author: The Engineer
// @description: A palette item that uses @dnd-kit to be compatible with the Screen Canvas.
// @security-level: LEVEL 9 (DND-Kit Integrated) */
// @invariant: Must pass 'brick' data to the drag context. */

import React from 'react';
import { Card, Tooltip, theme } from 'antd';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

import { IconFactory } from './IconFactory';
import { type SystemBrick } from '../types';

interface DraggableBrickProps {
  brick: SystemBrick;
}

export const DraggableBrick: React.FC<DraggableBrickProps> = ({ brick }) => {
  const { token } = theme.useToken();

  // ⚡ DND-KIT HOOK
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `brick_source_${brick.id}`,
    data: {
      type: 'BRICK', // Discriminator
      brick          // Payload
    }
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    cursor: isDragging ? 'grabbing' : 'grab',
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 9999 : 'auto',
    touchAction: 'none', // Required for Pointer sensors
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
    >
      <Tooltip title={brick.description} placement="right" mouseEnterDelay={0.5}>
        <Card 
          size="small" 
          hoverable 
          bodyStyle={{ padding: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}
          style={{ 
            border: `1px solid ${token.colorBorderSecondary}`,
            background: token.colorBgContainer,
            transition: 'all 0.2s',
            userSelect: 'none'
          }}
        >
          {/* 1. ICON */}
          <div style={{ 
            color: token.colorPrimary, 
            fontSize: '16px', 
            background: token.colorFillSecondary, 
            padding: '6px', 
            borderRadius: '4px',
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <IconFactory icon={brick.config?.icon || 'antd:AppstoreOutlined'} />
          </div>

          {/* 2. LABEL */}
          <div style={{ overflow: 'hidden' }}>
            <div style={{ 
              fontWeight: 500, 
              fontSize: '12px', 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              color: token.colorText
            }}>
              {brick.label}
            </div>
            <div style={{ 
              fontSize: '10px', 
              color: token.colorTextTertiary, 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis' 
            }}>
              {brick.type}
            </div>
          </div>
        </Card>
      </Tooltip>
    </div>
  );
};
