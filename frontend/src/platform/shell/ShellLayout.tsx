// FILEPATH: frontend/src/platform/shell/ShellLayout.tsx
// @file: Shell Layout (Data-Driven & Command-K)
// @role: 🖼️ UI Shell */
// @author: ansav8@gmail.com
// @description: Master Layout. Connects Backend Navigation to Ant Design Structure.
// @security-level: LEVEL 9 (UI Safe) */
// @invariant: Must gracefully handle empty navigation states (Guest Mode). */

import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { ProConfigProvider } from '@ant-design/pro-components';
import { Dropdown, theme, ConfigProvider, Button, Tooltip, Modal, Empty, Tag, Space, Typography, Avatar, Layout } from 'antd';
import { 
    SearchOutlined, 
    LogoutOutlined, 
    BgColorsOutlined, 
    UserOutlined, 
    ArrowRightOutlined,
    ThunderboltOutlined,
    BellOutlined
} from '@ant-design/icons';
import enUS from 'antd/locale/en_US'; 

import { useAuth } from '../auth/AuthContext';
import { useTheme } from './ThemeContext';
import { ThemePicker } from './ThemePicker';
import { useSystem } from '../kernel/SystemContext';
import { SystemIdentityCard } from '../../domains/system/features/identity/SystemIdentityCard';
import { IconFactory } from '../ui/icons/IconFactory';
import { logger } from '../logging';
import { Sidebar } from './Sidebar';
import type { NavigationNode } from '../kernel/types';
import type { MenuProps } from 'antd';

const { Header, Content } = Layout;
const { Text } = Typography;

export const ShellLayout: React.FC<any> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { authActor } = useAuth();
    const { token } = theme.useToken();
    const { mode } = useTheme();
    const { manifest } = useSystem();
    const user = authActor.getSnapshot().context.user;

    const [collapsed, setCollapsed] = useState(() => localStorage.getItem('shell_sidebar_collapsed') === 'true');
    const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);
    
    // ⚡ COMMAND-K STATE
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');

    // ⚡ DIAGNOSTIC: Log Mount
    useEffect(() => {
        logger.whisper('SHELL', '🐚 Shell Layout Mounted', { path: location.pathname });
    }, [location.pathname]);

    // ⚡ KEYBOARD LISTENER (Discovery Engine)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(true);
                logger.tell("SHELL", "🔍 Command+K Triggered");
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // 1. DATA PREP (Flatten for Search)
    const allNavigationNodes = useMemo(() => {
        if (!manifest?.navigation) return [];
        const { sidebar, user_menu, top_bar } = manifest.navigation;
        
        const flatten = (nodes: NavigationNode[]): NavigationNode[] => {
            return nodes.reduce((acc, node) => {
                acc.push(node);
                if (node.children) acc.push(...flatten(node.children));
                return acc;
            }, [] as NavigationNode[]);
        };

        return [...flatten(sidebar), ...flatten(user_menu), ...flatten(top_bar)];
    }, [manifest]);

    // ⚡ SEARCH FILTER LOGIC
    const filteredNodes = useMemo(() => {
        if (!searchValue) return [];
        const lower = searchValue.toLowerCase();
        
        return allNavigationNodes.filter(node => {
            // Match Label
            if (node.label.toLowerCase().includes(lower)) return true;
            // Match Key
            if (node.key.toLowerCase().includes(lower)) return true;
            // ⚡ MATCH SEARCH TAGS (The "Dark Mode" -> "Appearance" Magic)
            if (node.search_tags?.some(tag => tag.toLowerCase().includes(lower))) return true;
            return false;
        }).slice(0, 10); // Limit results
    }, [searchValue, allNavigationNodes]);

    // 2. NAVIGATION HANDLER
    const handleNavigate = (path?: string) => {
        if (!path) return;

        // A. Intercept Actions
        if (path.startsWith('ACTION:')) {
            const action = path.replace('ACTION:', '');
            logger.tell("SHELL", `⚡ Triggering Action: ${action}`);
            
            if (action === 'LOGOUT') authActor.send({ type: 'LOGOUT' });
            else if (action === 'THEME') setIsThemePickerOpen(true);
            else if (action === 'PROFILE') navigate('/settings/profile');
            
            setIsSearchOpen(false);
            return;
        }

        // B. Standard Navigation
        navigate(path);
        setIsSearchOpen(false);
    };

    // User Menu Items
    const userMenuNodes = manifest?.navigation?.user_menu || [];
    const userMenuItems: MenuProps['items'] = [
        ...userMenuNodes.map((node) => ({
            key: node.key,
            label: node.label,
            icon: <IconFactory icon={node.icon} />,
            onClick: () => handleNavigate(node.path),
            danger: node.config?.danger,
            type: node.config?.divider_before ? 'divider' : undefined
        })),
        // Fallbacks if empty
        ...(userMenuNodes.length === 0 ? [
            { key: 'theme', icon: <BgColorsOutlined />, label: 'Appearance', onClick: () => setIsThemePickerOpen(true) },
            { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true, onClick: () => authActor.send({ type: 'LOGOUT' }) }
        ] : [])
    ];

    // ⚡ BUILD SIDEBAR (From DB)
    const sidebarNodes = manifest?.navigation?.sidebar || [];

    return (
      <ConfigProvider locale={enUS}>
          <ProConfigProvider dark={mode === 'dark'}>
          <div id="flodock-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Layout style={{ minHeight: '100vh' }}>
                {/* ⚡ DATA-DRIVEN SIDEBAR */}
                <Sidebar 
                    collapsed={collapsed} 
                    onCollapse={(val) => {
                        setCollapsed(val);
                        localStorage.setItem('shell_sidebar_collapsed', String(val));
                    }}
                    items={sidebarNodes}
                    activePath={location.pathname}
                    onNavigate={(key, path) => handleNavigate(path)}
                />

                <Layout style={{ background: token.colorBgLayout }}>
                    <Header style={{ 
                        padding: '0 24px', 
                        background: token.colorBgContainer,
                        borderBottom: `1px solid ${token.colorBorderSecondary}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        height: 64,
                        position: 'sticky',
                        top: 0,
                        zIndex: 99
                    }}>
                        {/* LEFT: Context / Search Trigger */}
                        <Space>
                            <Tooltip title="Global Search (Cmd+K)">
                                <Button 
                                    type="text" 
                                    icon={<SearchOutlined />} 
                                    onClick={() => setIsSearchOpen(true)}
                                    style={{ color: token.colorTextSecondary }}
                                >
                                    <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.6 }}>Search...</span>
                                </Button>
                            </Tooltip>
                        </Space>

                        {/* RIGHT: User & System Status */}
                        <Space size="large">
                            <BellOutlined style={{ fontSize: 18, color: token.colorTextSecondary }} />
                            
                            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
                                <Space style={{ cursor: 'pointer' }}>
                                    <Avatar 
                                        style={{ backgroundColor: token.colorPrimary }} 
                                        icon={<UserOutlined />} 
                                        src={user?.avatar_url}
                                    />
                                    <Text>{user?.first_name || user?.email || 'System User'}</Text>
                                </Space>
                            </Dropdown>
                        </Space>
                    </Header>

                    <Content style={{ margin: 24, minHeight: 280, position: 'relative' }}>
                         {children || <Outlet />}
                    </Content>
                </Layout>
            </Layout>

              {/* ⚡ DISCOVERY MODAL (Command+K) */}
              <Modal
                open={isSearchOpen}
                onCancel={() => setIsSearchOpen(false)}
                footer={null}
                closable={false}
                maskClosable={true}
                styles={{ body: { padding: 0 } }}
                width={600}
                style={{ top: 100 }}
              >
                  <div style={{ padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <SearchOutlined style={{ fontSize: 20, color: token.colorPrimary }} />
                        <input 
                            autoFocus
                            placeholder="Where to? (e.g. 'Dashboard', 'Dark Mode')"
                            style={{ 
                                flex: 1, border: 'none', outline: 'none', 
                                fontSize: 18, background: 'transparent',
                                color: token.colorText
                            }}
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                        />
                        <Tag>ESC</Tag>
                    </div>
                    
                    {searchValue && (
                        <div style={{ maxHeight: 400, overflowY: 'auto', borderTop: `1px solid ${token.colorBorderSecondary}` }}>
                            {filteredNodes.length > 0 ? (
                                filteredNodes.map(node => (
                                    <div 
                                        key={node.key}
                                        onClick={() => handleNavigate(node.path)}
                                        style={{ 
                                            padding: '12px 16px', 
                                            cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            borderBottom: `1px solid ${token.colorSplit}`
                                        }}
                                        className="search-result-item"
                                        onMouseEnter={(e) => e.currentTarget.style.background = token.colorFillTertiary}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <Space>
                                            <IconFactory icon={node.icon} style={{ color: token.colorTextSecondary }} />
                                            <div>
                                                <div style={{ fontWeight: 500 }}>{node.label}</div>
                                                <div style={{ fontSize: 11, color: token.colorTextTertiary }}>{node.component_path || node.path}</div>
                                            </div>
                                        </Space>
                                        <ArrowRightOutlined style={{ opacity: 0.5 }} />
                                    </div>
                                ))
                            ) : (
                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No features found" />
                            )}
                        </div>
                    )}
                    
                    {!searchValue && (
                        <div style={{ padding: '24px 0', textAlign: 'center', color: token.colorTextQuaternary }}>
                            <ThunderboltOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                            <div>Type to jump anywhere in Flodock OS</div>
                        </div>
                    )}
                  </div>
              </Modal>

              <ThemePicker open={isThemePickerOpen} onClose={() => setIsThemePickerOpen(false)} />
          </div>
          </ProConfigProvider>
      </ConfigProvider>
    );
};

