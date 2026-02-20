// FILEPATH: frontend/src/domains/meta/features/states/components/inspector/InspectorShell.tsx
// @file: Inspector Shell
// @role: 🐚 Layout Container */
// @author: The Engineer
// @description: The outer frame of the Inspector Panel. Provides the Header, Close Action, and AI Trigger.
// @security-level: LEVEL 9 (UI Safe) */
// @invariant: Must always provide a Close button. AI button is optional. */

import React from "react";
import { Card, Typography, Space, Button, Tag } from "antd";
import { 
  CloseOutlined, 
  ThunderboltFilled 
} from "@ant-design/icons";

/**
 * @description Destructure Typography for semantic usage.
 */
const { Title } = Typography;

export type SelectionType = "NODE" | "EDGE" | "CANVAS" | "NONE";

interface InspectorShellProps {
  title: string;
  type: SelectionType;
  subTitle?: string;
  icon?: React.ReactNode;
  onClose: () => void;
  onAI?: () => void; // ⚡ NEW: Optional AI Trigger
  children: React.ReactNode;
}

/**
 * @description Standardized container for all Inspector panels.
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

  // 🔍 DEBUG TRACE
  console.log(`🐚 [InspectorShell] Rendering '${title}'. Has AI Handler?`, !!onAI);

  // --- RENDERERS ---

  const renderHeader = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
      <div style={{ flex: 1 }}>
        <Space align="center" style={{ marginBottom: 4 }}>
          {icon && <span style={{ fontSize: 18, color: '#1890ff' }}>{icon}</span>}
          <Title level={5} style={{ margin: 0, fontSize: 16 }}>
            {title}
          </Title>
        </Space>
        {subTitle && (
          <div style={{ fontSize: 12, color: '#8c8c8c', lineHeight: 1.2 }}>
            {subTitle}
          </div>
        )}
      </div>
      
      <Space>
        {/* ⚡ AI TRIGGER (Forced Visibility Mode) */}
        {onAI && (
          <Button 
            type="text" 
            icon={<ThunderboltFilled style={{ color: '#722ed1' }} />} 
            onClick={(e) => {
                console.log("⚡ AI Button Clicked (Direct)");
                e.stopPropagation();
                onAI();
            }}
            className="ai-trigger-btn"
            style={{ border: '2px solid red', backgroundColor: '#f9f0ff' }} // 🔴 DEBUG STYLE
          >
            AI
          </Button>
        )}
        
        <Tag color={type === "NODE" ? "blue" : type === "EDGE" ? "orange" : "default"}>
          {type}
        </Tag>
        <Button type="text" size="small" icon={<CloseOutlined />} onClick={onClose} />
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
          borderBottom: '1px solid #f0f0f0',
          minHeight: 56
        },
        body: { 
          padding: 0, 
          height: 'calc(100vh - 110px)', 
          overflowY: 'auto' 
        }
      }}
      className="inspector-shell"
    >
      <div style={{ padding: 16 }}>
        {children}
      </div>
    </Card>
  );
};

