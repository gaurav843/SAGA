// FILEPATH: frontend/src/domains/meta/_shell/MetaSidebar.tsx
// @file: Meta Studio Navigation (System Linked)
// @role: 🖥️ Screen (View) */
// @author: The Engineer
// @description: High-density navigation for the System Configuration module.
// @security-level: LEVEL 5 (Presentation) */

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, theme, Button, Typography } from 'antd';
import {
  BookOutlined,
  SafetyCertificateOutlined,
  NodeIndexOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  SolutionOutlined,
  PartitionOutlined,
  RocketOutlined,
  LockOutlined,
  ThunderboltOutlined,
  AppstoreAddOutlined
} from '@ant-design/icons';
import { logger } from '../../../platform/logging/Narrator';

const { Sider } = Layout;

export const MetaSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();

  // ⚡ PERSISTENCE
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem('meta_sidebar_collapsed');
    return stored === null ? true : stored === 'true';
  });

  useEffect(() => {
     logger.whisper('SHELL', `MetaSidebar Initialized. Collapsed: ${collapsed}`);
  }, []);

  const handleCollapse = (value: boolean) => {
    logger.trace('SHELL', `Toggling Sidebar`, { collapsed: value });
    setCollapsed(value);
    localStorage.setItem('meta_sidebar_collapsed', String(value));
    setTimeout(() => window.dispatchEvent(new Event('resize')), 300);
  };

  const items = [
    {
      key: '/meta',
      icon: <DashboardOutlined />,
      label: 'Overview',
    },
    // ⚡ SYSTEM LINK
    {
      key: '/system',
      icon: <LockOutlined style={{ color: token.colorError }} />,
      label: 'System Control',
      style: { color: token.colorErrorText }
    },
    {
      type: 'divider',
    },
    // ⚡ THE APP STORE
    {
      key: '/meta/runner',
      icon: <RocketOutlined />,
      label: 'Process Runner',
      style: { color: token.colorPrimaryText }
    },
    {
      type: 'divider',
    },
    {
      key: '/meta/cortex',
      icon: <ThunderboltOutlined style={{ color: '#722ed1' }} />,
      label: 'Cortex Studio',
      style: { color: '#722ed1' }
    },
    {
      key: '/meta/dictionary',
      icon: <BookOutlined />,
      label: 'Dictionary',
    },
    {
      key: '/meta/governance',
      icon: <SafetyCertificateOutlined />,
      label: 'Governance',
    },
    {
      key: '/meta/groups',
      icon: <SolutionOutlined />,
      label: 'Policy Groups',
    },
    {
      key: '/meta/states',
      icon: <PartitionOutlined />,
      label: 'Workflows',
    },
    {
      key: '/meta/switchboard',
      icon: <NodeIndexOutlined />,
      label: 'Switchboard',
    },
    {
      key: '/meta/studio',
      icon: <AppstoreAddOutlined />,
      label: 'App Studio',
    }
  ];

  return (
    <Sider
      width={240}
      collapsible
      collapsed={collapsed}
      onCollapse={handleCollapse}
      trigger={null}
      style={{
        background: token.colorBgContainer,
        borderRight: `1px solid ${token.colorSplit}`,
        height: '100%',
        zIndex: 10
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* LOGO AREA / HEADER */}
        {!collapsed && (
             <div style={{ padding: '24px 24px 12px' }}>
                <Typography.Text strong style={{ fontSize: 13, letterSpacing: '1px', color: token.colorTextSecondary }}>
                    SYSTEM KERNEL
                </Typography.Text>
           </div>
        )}

        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          style={{ borderRight: 0, flex: 1, paddingTop: 8 }}
          items={items}
          onClick={(e) => {
              logger.tell('USER', `Navigating to: ${e.key}`);
              navigate(e.key);
          }}
        />

        {/* COLLAPSE TRIGGER */}
        <div style={{
            padding: 12,
            borderTop: `1px solid ${token.colorSplit}`,
            textAlign: 'center'
        }}>
            <Button
                type="text"
                block
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => handleCollapse(!collapsed)}
            />
        </div>
      </div>
    </Sider>
  );
};
