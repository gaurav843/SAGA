// FILEPATH: frontend/src/domains/meta_v2/features/workflows/components/inspector/InspectorShell.tsx
// @file: Inspector Shell (Structural Frame)
// @role: 🐚 Layout Container */
// @author: The Engineer
// @description: Standardized outer frame for inspector panels. Preserves pixel-perfect legacy appearance.
// @security-level: LEVEL 9 */

import React from "react";
import { Card, Typography, Space, Button, Tag, theme } from "antd";
import { 
  CloseOutlined, 
  ThunderboltFilled 
} from "@ant-design/icons";

import { logger } from '@/platform/logging';

const { Title } = Typography;

export type SelectionType = "NODE" | "EDGE" | "CANVAS" | "NONE";

interface InspectorShellProps {
  title: string;
  type: SelectionType;
  subTitle?: string;
  icon?: React.ReactNode;
  onClose: () => void;
  onAI?: () => void;
  children: React.ReactNode;
}

/**
 * @description Renders the high-density container for node editing. [cite: 2855-2884]
 */
export const InspectorShell: React.FC<InspectorShellProps> = ({
  title,
  type,
  subTitle,
  icon,
  onClose,
  onAI,
  children
}) => {
  const { token } = theme.useToken();

  // ⚡ SIGNAL TELEMETRY: Render tracking
  React.useEffect(() => {
    logger.trace("UI", `🐚 Inspector Shell mounted: ${title}`);
  }, [title]);

  const renderHeader = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
      <div style={{ flex: 1 }}>
        <Space align="center" style={{ marginBottom: 4 }}>
          {icon && <span style={{ fontSize: 18, color: token.colorPrimary }}>{icon}</span>}
          <Title level={5} style={{ margin: 0, fontSize: 16 }}>
            {title}
          </Title>
        </Space>
        {subTitle && (
          <div style={{ fontSize: 12, color: token.colorTextDescription, lineHeight: 1.2 }}>
            {subTitle}
          </div>
        )}
      </div>
      
      <Space>
        {onAI && (
          <Button 
            type="text" 
            size="small"
            icon={<ThunderboltFilled style={{ color: '#722ed1' }} />} 
            onClick={(e) => {
                e.stopPropagation();
                logger.tell("AI", "Manual AI Assistant trigger engaged");
                onAI();
            }}
          >
            AI
          </Button>
        )}
        
        <Tag color={type === "NODE" ? "blue" : type === "EDGE" ? "orange" : "default"}>
          {type}
        </Tag>
        <Button 
            type="text" 
            size="small" 
            icon={<CloseOutlined />} 
            onClick={() => {
                logger.whisper("UI", "Closing Inspector panel");
                onClose();
            }} 
        />
      </Space>
    </div>
  );

  return (
    <Card 
      bordered={false} 
      title={renderHeader()}
      styles={{ 
        header: { 
          padding: '12px 16px', 
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          minHeight: 56
        },
        body: { 
          padding: 0, 
          height: 'calc(100vh - 110px)', 
          overflowY: 'auto' 
        }
      }}
      className="inspector-shell"
      style={{ background: token.colorBgContainer }}
    >
      <div style={{ padding: 16 }}>
        {children}
      </div>
    </Card>
  );
};

