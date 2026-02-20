// FILEPATH: frontend/src/platform/shell/Sidebar.tsx
// @file: Navigation Sidebar
// @role: 🎨 UI Presentation */
// @author: The Engineer
// @description: Renders a collapsible data-driven sidebar with integrated branding toggle.
// @security-level: LEVEL 5 (Presentation) */

import React from 'react';
import { Layout, Menu, theme, Typography, Tooltip } from 'antd';
import { IconFactory } from '../ui/icons/IconFactory';
import type { NavigationNode } from '../kernel/types';

const { Sider } = Layout;
const { Text } = Typography;

export interface SidebarProps {
  collapsed: boolean;
  onCollapse: (value: boolean) => void;
  items: NavigationNode[]; 
  activePath: string;
  onNavigate: (key: string, path: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  collapsed, 
  onCollapse, 
  items, 
  activePath,
  onNavigate 
}) => {
  const { token } = theme.useToken();

  // ⚡ HELPER: Recursive Menu Item Builder
  const buildMenuItems = (nodes: NavigationNode[]): any[] => {
    return nodes.map(node => {
      const icon = <IconFactory icon={node.icon} />;
      
      if (node.children && node.children.length > 0) {
        return {
          key: node.key,
          label: node.label,
          icon: icon,
          children: buildMenuItems(node.children)
        };
      }
      
      return {
        key: node.key,
        label: collapsed ? <Tooltip title={node.label} placement="right">{node.label}</Tooltip> : node.label,
        icon: icon,
        onClick: () => onNavigate(node.key, node.path || '')
      };
    });
  };

  const menuItems = buildMenuItems(items);

  // ⚡ ACTIVE STATE RESOLUTION
  const selectedKeys = items
    .filter(node => activePath === node.path || (node.path !== '/' && activePath.startsWith(node.path)))
    .map(node => node.key);

  return (
    <Sider 
      collapsible 
      collapsed={collapsed} 
      onCollapse={onCollapse}
      width={260}
      collapsedWidth={80}
      trigger={null} // Controlled by branding header toggle
      style={{
        background: token.colorBgContainer,
        borderRight: `1px solid ${token.colorBorderSecondary}`,
        height: '100vh',
        position: 'sticky',
        top: 0,
        left: 0,
        zIndex: 100,
        transition: 'all 0.2s'
      }}
    >
      {/* ⚡ CENTRALIZED COLLAPSIBLE HEADER (The Rule) */}
      <div 
        onClick={() => onCollapse(!collapsed)}
        style={{ 
          height: 64, 
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? 0 : '0 24px',
          cursor: 'pointer',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          transition: 'all 0.2s',
          background: token.colorBgContainer
      }}>
        <div style={{
            width: 32,
            height: 32,
            background: token.colorPrimary,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: collapsed ? 0 : 12,
            flexShrink: 0
        }}>
            <Text strong style={{ color: '#fff', fontSize: 18 }}>F</Text>
        </div>
        {!collapsed && (
            <Text strong style={{ 
                color: token.colorText, 
                fontSize: 16, 
                letterSpacing: 1,
                whiteSpace: 'nowrap',
                opacity: 1
            }}>
                FLODOCK
            </Text>
        )}
      </div>

      {/* ⚡ NAVIGATION MENU */}
      <Menu 
        mode="inline" 
        selectedKeys={selectedKeys}
        items={menuItems} 
        inlineCollapsed={collapsed}
        style={{ 
            borderRight: 0, 
            marginTop: 8,
            background: 'transparent'
        }}
      />
    </Sider>
  );
};

