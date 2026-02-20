// FILEPATH: frontend/src/domains/meta/features/app_studio/components/IconPicker.tsx
// @file: Icon Picker Component (v3.0 - Enterprise)
// @author: The Engineer
// @description: Visual grid for selecting icons. Dynamically loads entire Ant Design library.

import React, { useState, useMemo } from 'react';
import { Popover, Button, Input, Empty, theme, Tooltip } from 'antd';
import * as AntdIcons from '@ant-design/icons';
import { IconFactory } from './IconFactory';

// ⚡ DYNAMIC REFLECTION: Load all Outlined icons from the library
const ALL_ICONS = Object.keys(AntdIcons)
    .filter(key => key.endsWith('Outlined'))
    .map(key => `antd:${key}`);

// ⚡ OPTIMIZATION: Default set to show before searching
const POPULAR_ICONS = [
    'antd:AppstoreOutlined', 'antd:UserOutlined', 'antd:TeamOutlined', 
    'antd:SettingOutlined', 'antd:RocketOutlined', 'antd:ShopOutlined',
    'antd:BarChartOutlined', 'antd:CalendarOutlined', 'antd:FileTextOutlined', 
    'antd:FolderOpenOutlined', 'antd:GlobalOutlined', 'antd:LockOutlined', 
    'antd:MailOutlined', 'antd:MessageOutlined', 'antd:NotificationOutlined', 
    'antd:SearchOutlined', 'antd:ThunderboltOutlined', 'antd:ToolOutlined', 
    'antd:CloudServerOutlined', 'antd:DatabaseOutlined'
];

interface IconPickerProps {
    value?: string;
    onChange?: (value: string) => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({ value, onChange }) => {
    const { token } = theme.useToken();
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);

    // ⚡ SEARCH ENGINE: Filters 800+ icons instantly
    const displayedIcons = useMemo(() => {
        if (!search) return POPULAR_ICONS;
        
        const lower = search.toLowerCase();
        return ALL_ICONS
            .filter(icon => icon.toLowerCase().includes(lower))
            .slice(0, 100); // Limit results for performance
    }, [search]);

    const content = (
        <div style={{ width: 320 }}>
            <Input 
                prefix={<AntdIcons.SearchOutlined />} 
                placeholder={`Search ${ALL_ICONS.length} icons...`} 
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ marginBottom: 12 }}
                allowClear
            />
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(6, 1fr)', 
                gap: 8, 
                maxHeight: 240, 
                overflowY: 'auto',
                paddingRight: 4
            }}>
                {displayedIcons.map(icon => (
                    <Tooltip key={icon} title={icon.replace('antd:', '')}>
                        <Button 
                            type={value === icon ? 'primary' : 'text'}
                            icon={<IconFactory icon={icon} style={{ fontSize: 18 }} />}
                            onClick={() => {
                                onChange?.(icon);
                                setOpen(false);
                            }}
                            style={{ 
                                height: 40, 
                                width: 40, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                border: value === icon ? `1px solid ${token.colorPrimary}` : undefined
                            }}
                        />
                    </Tooltip>
                ))}
            </div>
            
            {displayedIcons.length === 0 && (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No icons found" />
            )}
            
            <div style={{ 
                marginTop: 8, 
                paddingTop: 8, 
                borderTop: `1px solid ${token.colorBorderSecondary}`,
                fontSize: 10, 
                color: token.colorTextTertiary, 
                textAlign: 'right' 
            }}>
                {search ? `${displayedIcons.length} results` : 'Popular Icons'}
            </div>
        </div>
    );

    return (
        <Popover 
            content={content} 
            title={null} 
            trigger="click"
            open={open}
            onOpenChange={setOpen}
            placement="bottomLeft"
            arrow={false}
        >
            <Button block style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 8, textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IconFactory icon={value || 'antd:QuestionOutlined'} style={{ color: token.colorPrimary, fontSize: 16 }} />
                    <span style={{ color: value ? token.colorText : token.colorTextPlaceholder }}>
                        {value ? value.replace('antd:', '') : 'Select Icon...'}
                    </span>
                </div>
                <AntdIcons.DownOutlined style={{ fontSize: 10, color: token.colorTextQuaternary }} />
            </Button>
        </Popover>
    );
};

