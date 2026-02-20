// FILEPATH: frontend/src/domains/meta/_shell/MetaLayout.tsx
// @file: Meta Studio Visual Shell
// @role: 🐚 Layout Container */
// @author: The Engineer
// @description: The structural frame for the System Configuration module.
// REFACTOR: Removed MetaHeader. Layout is now Sidebar + Content only (Full Height).

// @security-level: LEVEL 5 (Presentation) */

import React, { useEffect } from 'react';
import { Layout, theme } from 'antd';
import { Outlet } from 'react-router-dom';

import { MetaSidebar } from './MetaSidebar';
import { logger } from '../../../platform/logging/Narrator';

const { Content } = Layout;

export const MetaLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { token } = theme.useToken();

  useEffect(() => {
      logger.trace('SHELL', 'MetaLayout Mounted. Structuring viewport.');
  }, []);

  return (
    <Layout style={{ 
        height: '100%', 
        overflow: 'hidden',
        background: token.colorBgContainer
    }}>
      
      {/* 1. MAIN WORKSPACE (Sidebar + Outlet) */}
      <Layout hasSider style={{ height: '100%' }}>
        
        {/* LEFT: NAVIGATION & DOMAIN CONTEXT */}
        <MetaSidebar />
        
        {/* RIGHT: DYNAMIC VIEWPORT */}
        <Content style={{ 
            height: '100%',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
        }}>
           {/* The scrollable area for the page content */}
            <div style={{ 
                flex: 1, 
                overflowY: 'auto', 
                overflowX: 'hidden',
                background: token.colorBgLayout 
            }}>
                {/* ⚡ LOGICAL FIX: Support both explicit children wrapping and Router Outlets */}
                {children || <Outlet />}
            </div>
        </Content>

      </Layout>
    </Layout>
  );
};
