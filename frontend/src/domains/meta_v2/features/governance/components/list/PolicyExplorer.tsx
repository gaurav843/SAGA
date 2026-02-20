// FILEPATH: frontend/src/domains/meta_v2/features/governance/components/list/PolicyExplorer.tsx
// @file: Policy Explorer (V2 Edition)
// @role: 🎨 UI Presentation */
// @author: The Engineer
// @description: Navigable list of Governance Policies.
// UPDATED: Replaced local useState with useUrlState for search persistence. Injected Telemetry.

// @security-level: LEVEL 9 (Read-Only) */

import React, { useMemo } from 'react';
import { Input, Button, List, theme, Empty, Space, Tooltip, Typography } from 'antd';
import { 
  PlusOutlined, SearchOutlined, SafetyCertificateOutlined, 
  MenuFoldOutlined, MenuUnfoldOutlined, StopOutlined 
} from '@ant-design/icons';

import { useUrlState } from '@/platform/hooks/useUrlState';
import { logger } from '@/platform/logging/Narrator';
import { useTrace } from '@/platform/logging/useTrace';
import { SmartListItem } from '@/platform/ui/list/SmartListItem';

import type { Policy } from '../../../../../meta/features/governance/types';

interface PolicyExplorerProps {
  policies: Policy[];
  selectedKey: string | 'NEW' | null;
  onSelect: (policy: Policy) => void;
  onCreate: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const PolicyExplorer: React.FC<PolicyExplorerProps> = ({
  policies,
  selectedKey,
  onSelect,
  onCreate,
  collapsed,
  onToggleCollapse
}) => {
  const { token } = theme.useToken();
  
  // ⚡ DEEP LINKING: Replaced useState with useUrlState
  const [searchTerm, setSearchTerm] = useUrlState('q', '');

  // ⚡ TELEMETRY: Trace Component Lifecycle
  useTrace('PolicyExplorer', { collapsed, policyCount: policies.length });

  const processedPolicies = useMemo(() => {
    let result = policies;
    if (searchTerm && !collapsed) {
        const lower = searchTerm.toLowerCase();
        result = result.filter(p => 
            p.name.toLowerCase().includes(lower) || 
            p.key.toLowerCase().includes(lower)
        );
        logger.trace("UI", `Filtered policies`, { query: searchTerm, matches: result.length });
    }
    return result.sort((a, b) => {
        if (a.is_active && !b.is_active) return -1;
        if (!a.is_active && b.is_active) return 1;
        return a.name.localeCompare(b.name);
    });
  }, [policies, searchTerm, collapsed]);

  // Helper to format v1.05
  const getVersionTag = (p: Policy) => {
      // Default to v1.00 if missing (legacy data)
      const major = p.version_major || 1;
      const minor = p.version_minor || 0;
      return `v${major}.${minor < 10 ? '0' : ''}${minor}`;
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. TOOLBAR */}
      <div style={{ padding: collapsed ? '12px 8px' : '16px 16px 12px', borderBottom: `1px solid ${token.colorSplit}` }}>
        {collapsed ? (
            <Space direction="vertical" style={{ width: '100%', alignItems: 'center' }}>
                 <Button type="text" icon={<MenuUnfoldOutlined />} onClick={onToggleCollapse} />
                 <Tooltip title="New Policy" placement="right">
                    <Button type="primary" shape="circle" icon={<PlusOutlined />} onClick={() => {
                        logger.whisper("UI", "Clicked Create Policy (Collapsed)");
                        onCreate();
                    }} />
                 </Tooltip>
            </Space>
        ) : (
            <div style={{ display: 'flex', gap: 8 }}>
                <Input 
                    prefix={<SearchOutlined style={{ color: token.colorTextDisabled }} />}
                    placeholder="Search Policies..." 
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (e.target.value) logger.whisper("UI", `Searching policies for: "${e.target.value}"`);
                    }}
                    allowClear
                    style={{ flex: 1 }}
                />
                <Tooltip title="Collapse List">
                    <Button icon={<MenuFoldOutlined />} onClick={onToggleCollapse} />
                </Tooltip>
                <Tooltip title="Create Policy">
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                        logger.whisper("UI", "Clicked Create Policy (Expanded)");
                        onCreate();
                    }} />
                </Tooltip>
            </div>
        )}
      </div>

      {/* 2. LIST */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {processedPolicies.length === 0 && !collapsed ? (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No active policies" />
          </div>
        ) : (
          <List
            dataSource={processedPolicies}
            renderItem={(item) => (
               <SmartListItem
                  key={item.key}
                  label={item.name}
                  secondaryLabel={item.key}
                  icon={item.is_active ? 
                      <SafetyCertificateOutlined style={{ color: token.colorSuccess }} /> : 
                      <StopOutlined style={{ color: token.colorTextDisabled }} />
                  }
                  // ⚡ SHOW VERSION
                  tag={getVersionTag(item)}
                  tagColor="blue"
                  isActive={selectedKey === item.key}
                  isCompact={collapsed}
                  onClick={() => {
                      logger.whisper("UI", `Selected Policy in Explorer: ${item.key}`);
                      onSelect(item);
                  }}
               />
            )}
          />
        )}
      </div>

      {/* 3. FOOTER */}
      {!collapsed && (
          <div style={{ padding: 8, borderTop: `1px solid ${token.colorSplit}`, textAlign: 'center' }}>
            <Typography.Text type="secondary" style={{ fontSize: 10 }}>
                {processedPolicies.length} Active Policies
            </Typography.Text>
          </div>
      )}
    </div>
  );
};

