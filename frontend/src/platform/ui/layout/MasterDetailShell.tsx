/* FILEPATH: frontend/src/platform/ui/layout/MasterDetailShell.tsx */
/* @file Master-Detail Shell (System Standard) */
/* @author The Engineer */
/* @description The Canonical Layout for List-Detail views (Dictionary, Governance, etc.).
 * FEATURES:
 * - Automatic Sidebar Persistence (localStorage).
 * - "Keyed Fade" Content Transitions.
 * - Standardized Split-Pane Geometry.
 */

import React, { useState, useEffect } from 'react';
import { Layout, theme, Button, Tooltip, Space } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';

const { Sider, Content } = Layout;

export interface MasterDetailShellProps {
  /** Unique ID for saving sidebar state (e.g., "meta.dictionary.sidebar") */
  persistenceKey: string;
  
  /** The Data ID that triggers the fade transition (e.g., selectedAttribute.id) */
  contentKey?: string | number | null;

  /** Render Prop: Returns the Sidebar content based on collapse state */
  renderSidebar: (collapsed: boolean, toggle: () => void) => React.ReactNode;

  /** The Main Content (Right Pane) */
  children: React.ReactNode;
}

export const MasterDetailShell: React.FC<MasterDetailShellProps> = ({
  persistenceKey,
  contentKey,
  renderSidebar,
  children
}) => {
  const { token } = theme.useToken();

  // 1. STATE: Sidebar Collapse (with Persistence)
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem(`flodock_ui_${persistenceKey}`);
    return stored === 'true';
  });

  const handleToggle = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem(`flodock_ui_${persistenceKey}`, String(newState));
    // Trigger resize event for charts/grids to adjust
    setTimeout(() => window.dispatchEvent(new Event('resize')), 300);
  };

  return (
    <Layout style={{ height: '100%', background: 'transparent' }}>
      
      {/* ⚡ CENTRALIZED MOTION TOKENS */}
      <style>{`
        @keyframes systemFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .system-fade-enter {
          animation: systemFadeIn ${token.motionDurationMid} ${token.motionEaseInOut};
          height: 100%;
        }
      `}</style>

      {/* 2. THE SIDEBAR (Master) */}
      <Sider
        width={320}
        collapsedWidth={72} // Wide enough for icons + tooltips
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null} // We assume the renderSidebar handles the trigger, or we inject it
        theme="light"
        style={{ 
            borderRight: `1px solid ${token.colorSplit}`, 
            background: token.colorBgContainer, 
            transition: 'all 0.2s',
            zIndex: 2
        }}
      >
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* We pass the toggle handler down so the child can render the button */}
            {renderSidebar(collapsed, handleToggle)}
        </div>
      </Sider>

      {/* 3. THE CONTENT (Detail) */}
      <Content style={{ 
          background: token.colorBgLayout, 
          padding: 24, 
          overflowY: 'auto',
          position: 'relative' 
      }}>
         {/* ⚡ TRANSITION WRAPPER */}
         <div key={contentKey ?? 'empty'} className="system-fade-enter">
             {children}
         </div>
      </Content>

    </Layout>
  );
};

