// FILEPATH: frontend/src/domains/meta/features/dictionary/components/AttributeExplorer.tsx
// @file: Attribute Explorer (List View)
// @author: The Engineer
// @description: Navigable list of Domain Attributes.
// FIX: Used 'attr.key' instead of 'attr.id' for React keys to prevent duplicate key errors on System Fields (which all have ID 0).


import React, { useState, useMemo } from 'react';
import { List, Input, Button, theme, Empty, Tooltip, Space, Typography } from 'antd';
import { 
  PlusOutlined, SearchOutlined, NumberOutlined, 
  FontSizeOutlined, CalendarOutlined, CheckSquareOutlined, 
  PaperClipOutlined, LinkOutlined, CodeOutlined, UnorderedListOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined
} from '@ant-design/icons';

import { SmartListItem } from '../../../../../platform/ui/list/SmartListItem';
import type { AttributeDefinition } from '../types';
import { AttributeType } from '../types';

interface AttributeExplorerProps {
  attributes: AttributeDefinition[];
  selectedKey: string | 'NEW' | null;
  onSelect: (attr: AttributeDefinition) => void;
  onCreate: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const getTypeIcon = (type: AttributeType) => {
  switch (type) {
    case AttributeType.TEXT: return <FontSizeOutlined />;
    case AttributeType.NUMBER: return <NumberOutlined />;
    case AttributeType.BOOLEAN: return <CheckSquareOutlined />;
    case AttributeType.DATE:
    case AttributeType.DATETIME: return <CalendarOutlined />;
    case AttributeType.FILE: return <PaperClipOutlined />;
    case AttributeType.REFERENCE: return <LinkOutlined />;
    case AttributeType.SELECT:
    case AttributeType.MULTI_SELECT: return <UnorderedListOutlined />;
    case AttributeType.JSON: return <CodeOutlined />;
    default: return <FontSizeOutlined />;
  }
};

export const AttributeExplorer: React.FC<AttributeExplorerProps> = ({
  attributes,
  selectedKey,
  onSelect,
  onCreate,
  collapsed,
  onToggleCollapse
}) => {
  const { token } = theme.useToken();
  const [searchTerm, setSearchTerm] = useState('');

  // 🧠 SMART SORTING
  const processedAttributes = useMemo(() => {
    let result = attributes;
    if (searchTerm && !collapsed) {
        const lower = searchTerm.toLowerCase();
        result = result.filter(a => 
            a.label.toLowerCase().includes(lower) || 
            a.key.toLowerCase().includes(lower)
        );
    }
    return result.sort((a, b) => {
        if (a.key === 'id') return -1;
        if (b.key === 'id') return 1;
        if (a.is_system && !b.is_system) return -1;
        if (!a.is_system && b.is_system) return 1;
        return a.label.localeCompare(b.label);
    });
  }, [attributes, searchTerm, collapsed]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. TOOLBAR */}
      <div style={{ padding: collapsed ? '12px 8px' : '16px 16px 12px', borderBottom: `1px solid ${token.colorSplit}` }}>
        {collapsed ? (
            <Space direction="vertical" style={{ width: '100%', alignItems: 'center' }}>
                 <Button type="text" icon={<MenuUnfoldOutlined />} onClick={onToggleCollapse} />
                 <Tooltip title="New Attribute" placement="right">
                    <Button type="primary" shape="circle" icon={<PlusOutlined />} onClick={onCreate} />
                 </Tooltip>
            </Space>
        ) : (
            <div style={{ display: 'flex', gap: 8 }}>
                <Input 
                    prefix={<SearchOutlined style={{ color: token.colorTextDisabled }} />} 
                    placeholder="Search..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    allowClear
                    style={{ flex: 1 }}
                />
                <Tooltip title="Collapse List">
                    <Button icon={<MenuFoldOutlined />} onClick={onToggleCollapse} />
                </Tooltip>
                <Tooltip title="New Attribute">
                    <Button type="primary" icon={<PlusOutlined />} onClick={onCreate} />
                </Tooltip>
            </div>
        )}
      </div>

      {/* 2. SCROLLABLE LIST */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {processedAttributes.length === 0 && !collapsed ? (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No fields" />
          </div>
        ) : (
          <List
            dataSource={processedAttributes}
            renderItem={(item) => (
               <SmartListItem
                  // ⚡ FIX: Use 'key' (string) instead of 'id' (number) for uniqueness
                  // System fields all have ID 0, which caused Duplicate Key errors.
                  key={item.key} 
                  label={item.label}
                  secondaryLabel={item.key}
                  icon={getTypeIcon(item.data_type)}
                  tag={item.data_type}
                  isActive={selectedKey === item.key}
                  isCompact={collapsed}
                  isSystem={item.is_system}
                  onClick={() => onSelect(item)}
               />
            )}
          />
        )}
      </div>
      
      {/* 3. FOOTER */}
      {!collapsed && (
          <div style={{ padding: 8, borderTop: `1px solid ${token.colorSplit}`, textAlign: 'center' }}>
            <Typography.Text type="secondary" style={{ fontSize: 10 }}>
                {processedAttributes.length} Fields
            </Typography.Text>
          </div>
      )}
    </div>
  );
};

