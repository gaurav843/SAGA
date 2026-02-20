/* FILEPATH: frontend/src/platform/ui/list/SmartListItem.tsx */
/* @file Smart List Item (Adaptive) */
/* @author The Engineer */
/* @description A List Item that morphs between "Row Mode" and "Dock Mode".
 * FEATURES:
 * - Auto-Handling of Active State styling.
 * - Auto-Handling of Compact Mode (Tooltip injection).
 * - "System Field" Lock visualization.
 */

import React from 'react';
import { Typography, theme, Tag, Tooltip, Badge } from 'antd';
import { LockOutlined } from '@ant-design/icons';

const { Text } = Typography;

export interface SmartListItemProps {
  // Data
  label: string;
  secondaryLabel?: string; // e.g. The Machine Key
  icon?: React.ReactNode;
  
  // Status flags
  isActive: boolean;
  isCompact: boolean;
  isSystem?: boolean;
  isLocked?: boolean; // Visual lock icon
  
  // Optional Tags (Full mode only)
  tag?: string;
  tagColor?: string;

  onClick: () => void;
}

export const SmartListItem: React.FC<SmartListItemProps> = ({
  label,
  secondaryLabel,
  icon,
  isActive,
  isCompact,
  isSystem,
  tag,
  tagColor = 'default',
  onClick
}) => {
  const { token } = theme.useToken();

  // --- MODE A: COMPACT (Dock Style) ---
  if (isCompact) {
    return (
      <Tooltip title={`${label} ${secondaryLabel ? `(${secondaryLabel})` : ''}`} placement="right">
        <div 
            onClick={onClick}
            style={{ 
                padding: '12px 0',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                background: isActive ? token.colorFillAlter : 'transparent',
                borderLeft: isActive ? `3px solid ${token.colorPrimary}` : '3px solid transparent',
                transition: 'all 0.2s',
                position: 'relative'
            }}
        >
            <div style={{ fontSize: 18, color: isActive ? token.colorPrimary : token.colorTextSecondary }}>
                {icon}
            </div>
            {isSystem && (
                <div style={{ position: 'absolute', top: 8, right: 16, fontSize: 8, color: token.colorWarning }}>
                    <LockOutlined />
                </div>
            )}
        </div>
      </Tooltip>
    );
  }

  // --- MODE B: FULL (List Style) ---
  return (
    <div
        onClick={onClick}
        className={isActive ? 'ant-list-item-active' : ''}
        style={{ 
            padding: isActive ? '12px 16px' : '8px 16px',
            cursor: 'pointer',
            borderLeft: isActive ? `3px solid ${token.colorPrimary}` : '3px solid transparent',
            background: isActive ? token.colorFillAlter : 'transparent',
            transition: 'all 0.1s ease',
            borderBottom: `1px solid ${token.colorSplit}`
        }}
    >
        <div style={{ width: '100%' }}>
            
            {/* Row 1: Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text strong={isActive} style={{ 
                        color: token.colorText,
                        fontSize: isActive ? 14 : 13
                    }}>
                        {label}
                    </Text>
                    {/* Show Secondary Label inline if not active, to save vertical space */}
                    {!isActive && secondaryLabel && (
                        <Text type="secondary" style={{ fontSize: 10, fontFamily: 'monospace' }}>
                            {secondaryLabel}
                        </Text>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isSystem && <LockOutlined style={{ fontSize: 12, color: token.colorWarning }} />}
                    {!isActive && (
                        <span style={{ color: token.colorTextSecondary }}>{icon}</span>
                    )}
                </div>
            </div>

            {/* Row 2: Expanded Details (Only when Active) */}
            {isActive && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <Text type="secondary" style={{ fontSize: 10, fontFamily: 'monospace' }}>
                        {secondaryLabel}
                    </Text>
                    {tag && (
                        <Tag bordered={false} color={tagColor} style={{ margin: 0, fontSize: 10, padding: '0 4px' }}>
                            {tag}
                        </Tag>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};

