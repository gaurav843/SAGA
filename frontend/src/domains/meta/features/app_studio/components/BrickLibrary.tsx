// FILEPATH: frontend/src/domains/meta/features/app_studio/components/BrickLibrary.tsx
// @file: Brick Library (Palette)
// @role: 🎨 UI Presentation */
// @author: The Engineer
// @description: The "Smart" Palette with Context Menu for instant placement.
// @security-level: LEVEL 9 (Safe Return) */
// @invariant: Must filter by text and type. Must handle empty data gracefully. */
// @updated: Fixed missing 'Space' import to prevent ReferenceError. */

import React, { useState, useMemo } from 'react';
import { Input, Collapse, Empty, theme, Typography, Dropdown, MenuProps, Tag, Space } from 'antd';
import { 
    SearchOutlined, 
    AppstoreOutlined, 
    LayoutOutlined,
    VerticalAlignTopOutlined,
    VerticalAlignBottomOutlined,
    BorderOuterOutlined
} from '@ant-design/icons';

import { useAppStudio } from '../hooks/useAppStudio';
import { DraggableBrick } from './DraggableBrick';
import { SystemBrick } from '../types';

const { Panel } = Collapse;
const { Text } = Typography;

interface BrickLibraryProps {
    onInstall?: (brick: SystemBrick, zone: string) => void;
}

export const BrickLibrary: React.FC<BrickLibraryProps> = ({ onInstall }) => {
    const { token } = theme.useToken();
    const { library } = useAppStudio();
    const [searchTerm, setSearchText] = useState('');

    // ⚡ FILTER LOGIC
    const filteredBricks = useMemo(() => {
        if (!library) return [];
        const lower = searchTerm.toLowerCase();
        return library.filter((b: SystemBrick) => 
            b.label.toLowerCase().includes(lower) || 
            b.key.toLowerCase().includes(lower) ||
            b.type.toLowerCase().includes(lower)
        );
    }, [library, searchTerm]);

    // ⚡ GROUPING LOGIC
    const groupedBricks = useMemo(() => {
        const groups: Record<string, SystemBrick[]> = {};
        filteredBricks.forEach((b: SystemBrick) => {
            const domain = b.domain || 'GENERAL';
            if (!groups[domain]) groups[domain] = [];
            groups[domain].push(b);
        });
        return groups;
    }, [filteredBricks]);

    // ⚡ CONTEXT MENU FACTORY
    const getMenu = (brick: SystemBrick): MenuProps => ({
        items: [
            {
                key: 'header',
                label: <Text type="secondary" style={{ fontSize: 10 }}>QUICK ADD TO...</Text>,
                disabled: true
            },
            { type: 'divider' },
            {
                key: 'SIDEBAR',
                label: 'Sidebar (Left)',
                icon: <LayoutOutlined />,
                onClick: () => onInstall?.(brick, 'SIDEBAR')
            },
            {
                key: 'TOP_BAR',
                label: 'Header (Top)',
                icon: <VerticalAlignTopOutlined />,
                onClick: () => onInstall?.(brick, 'TOP_BAR')
            },
            {
                key: 'MAIN',
                label: 'Main Dashboard',
                icon: <BorderOuterOutlined />,
                onClick: () => onInstall?.(brick, 'MAIN')
            },
            {
                key: 'BOTTOM_BAR',
                label: 'Footer (Bottom)',
                icon: <VerticalAlignBottomOutlined />,
                onClick: () => onInstall?.(brick, 'BOTTOM_BAR')
            }
        ]
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* 1. HEADER & SEARCH */}
            <div style={{ padding: 16, borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
                <Text strong style={{ display: 'block', marginBottom: 12 }}>Component Library</Text>
                <Input 
                    prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
                    placeholder="Search bricks..." 
                    allowClear
                    value={searchTerm}
                    onChange={e => setSearchText(e.target.value)}
                    style={{ background: token.colorFillTertiary, border: 'none' }}
                />
            </div>

            {/* 2. SCROLLABLE LIST */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
                {Object.keys(groupedBricks).length === 0 ? (
                    <div style={{ padding: 32, textAlign: 'center' }}>
                         <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No bricks found" />
                    </div>
                ) : (
                    <Collapse 
                        ghost 
                        defaultActiveKey={Object.keys(groupedBricks)}
                        expandIconPosition="end"
                    >
                        {Object.entries(groupedBricks).map(([domain, bricks]) => (
                            <Panel 
                                header={
                                    <Space>
                                        <AppstoreOutlined />
                                        <Text strong>{domain}</Text>
                                        <Tag style={{ marginLeft: 8 }}>{bricks.length}</Tag>
                                    </Space>
                                } 
                                key={domain}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {bricks.map(brick => (
                                        <Dropdown 
                                            key={brick.id} 
                                            menu={getMenu(brick)} 
                                            trigger={['contextMenu']}
                                        >
                                            <div> {/* Wrapper for Ref */}
                                                <DraggableBrick brick={brick} />
                                            </div>
                                        </Dropdown>
                                    ))}
                                </div>
                            </Panel>
                        ))}
                    </Collapse>
                )}
            </div>

            {/* 3. FOOTER HINT */}
            <div style={{ 
                padding: '8px 16px', 
                borderTop: `1px solid ${token.colorBorderSecondary}`,
                background: token.colorFillQuaternary,
                fontSize: 11,
                color: token.colorTextTertiary,
                textAlign: 'center'
            }}>
                Right-click for quick placement
            </div>
        </div>
    );
};

