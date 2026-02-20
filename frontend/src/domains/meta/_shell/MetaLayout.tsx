/* FILEPATH: frontend/src/domains/meta/_shell/MetaLayout.tsx */
/* @file Meta Studio Visual Shell */
/* @author The Engineer */
/* @description The structural frame for the System Configuration module.
 * REFACTOR: Removed MetaHeader. Layout is now Sidebar + Content only (Full Height).
 */

import React from 'react';
import { Layout, theme } from 'antd';
import { Outlet } from 'react-router-dom';

import { MetaSidebar } from './MetaSidebar';

const { Content } = Layout;

export const MetaLayout: React.FC = () => {
  const { token } = theme.useToken();

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
                <Outlet />
            </div>
        </Content>

      </Layout>
    </Layout>
  );
};

