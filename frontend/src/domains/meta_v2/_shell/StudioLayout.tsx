// FILEPATH: frontend/src/domains/meta_v2/_shell/StudioLayout.tsx
// @file: Studio Layout (The Shell)
// @role: 🎨 Main Container */
// @author: The Engineer
// @description: The Master Layout (3-Pane) powered by MetaUIContext.
// @security-level: LEVEL 9 (UI Safe) */
// @invariant: Must use <Outlet /> for center pane to respect MetaV2Root nested routes. */

import React from 'react';
import { Layout, theme, Typography, Button } from 'antd';
import { 
    MenuFoldOutlined, 
    MenuUnfoldOutlined, 
    CodeOutlined
} from '@ant-design/icons';
import { Outlet } from 'react-router-dom';

// ⚡ PARTS
import { UniversalTree } from '../components/UniversalTree';
import { ContextInspector } from '../components/ContextInspector';
import { MetaUIProvider, useMetaUI } from './MetaUIContext';

const { Sider, Content } = Layout;
const { Title } = Typography;

// Inner Component to consume Context
const StudioLayoutInner: React.FC = () => {
    const { token } = theme.useToken();
    
    // ⚡ CONNECT TO CENTRAL BRAIN
    const { 
        leftSidebarCollapsed, 
        toggleLeftSidebar, 
        rightInspectorCollapsed, 
        toggleRightInspector 
    } = useMetaUI();

    return (
        <Layout style={{ height: '100vh', background: token.colorBgLayout }}>
            {/* 1. LEFT PANEL: The Navigator */}
            <Sider
                width={280}
                collapsible
                collapsed={leftSidebarCollapsed}
                trigger={null}
                style={{
                    borderRight: `1px solid ${token.colorBorderSecondary}`,
                    height: '100vh',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    background: token.colorBgContainer
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {/* Header */}
                    <div style={{ 
                        padding: leftSidebarCollapsed ? '16px 8px' : '16px 24px', 
                        display: 'flex', 
                        justifyContent: leftSidebarCollapsed ? 'center' : 'space-between', 
                        alignItems: 'center',
                        borderBottom: `1px solid ${token.colorBorderSecondary}`,
                        height: 64,
                        transition: 'all 0.2s'
                    }}>
                        {!leftSidebarCollapsed && <Title level={4} style={{ margin: 0 }}>System</Title>}
                        <Button 
                            type="text" 
                            icon={leftSidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={toggleLeftSidebar} 
                        />
                    </div>

                    {/* Tree Container */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: leftSidebarCollapsed ? 4 : 8 }}>
                        {/* ⚡ TREE NOW RECEIVES STATE VIA CONTEXT (Refactor Next) */}
                        <UniversalTree />
                    </div>
                </div>
            </Sider>

            {/* 2. CENTER PANEL: The Structure Map (Topology via Router Outlet) */}
            <Content style={{ 
                height: '100vh', 
                overflowY: 'auto', 
                background: token.colorBgLayout,
                position: 'relative'
            }}>
                <Outlet />
            </Content>

            {/* 3. RIGHT PANEL: The Inspector (Payload) */}
            <Sider
                width={320}
                collapsible
                collapsed={rightInspectorCollapsed}
                collapsedWidth={0} // Hide completely when closed
                trigger={null}
                style={{
                    borderLeft: rightInspectorCollapsed ? 'none' : `1px solid ${token.colorBorderSecondary}`,
                    height: '100vh',
                    background: token.colorBgContainer
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ 
                        padding: '0 12px', 
                        height: 48, 
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: `1px solid ${token.colorBorderSecondary}`
                    }}>
                        <span style={{ fontWeight: 600, color: token.colorTextSecondary }}>Context Payload</span>
                        <Button 
                            type="text" 
                            size="small"
                            icon={<CodeOutlined />} 
                            onClick={toggleRightInspector}
                        />
                    </div>
                    
                    <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                        <ContextInspector />
                    </div>
                </div>
            </Sider>

            {/* ⚡ FLOATING TOGGLE FOR INSPECTOR (If closed) */}
            {rightInspectorCollapsed && (
                <div style={{ 
                    position: 'absolute', 
                    right: 24, 
                    top: 24, 
                    zIndex: 100 
                }}>
                    <Button 
                        type="default" 
                        shape="circle" 
                        icon={<CodeOutlined />} 
                        onClick={toggleRightInspector}
                        style={{ boxShadow: token.boxShadowSecondary }} 
                    />
                </div>
            )}
        </Layout>
    );
};

// ⚡ WRAPPER TO PROVIDE CONTEXT
export const StudioLayout: React.FC = () => (
    <MetaUIProvider>
        <StudioLayoutInner />
    </MetaUIProvider>
);

