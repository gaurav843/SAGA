// FILEPATH: frontend/src/domains/meta/features/states/components/inspector/wizard/components/ContextBrowser/GovernancePicker.tsx
// @file: Governance Context Picker
// @role: 🧩 UI Component */
// @author: The Engineer
// @description: Provides granular selection of Policy Groups and specific Domain Policies.
// @security-level: LEVEL 9 (Read-Only) */
// @invariant: Must distinguishing between 'GROUP:' and 'POLICY:' prefixes for the assembler. */

import React, { useMemo, useState } from "react";
import { List, Checkbox, Tabs, Typography, Empty, Input, Tag, theme } from "antd";
import { SafetyCertificateOutlined, TeamOutlined, SearchOutlined } from "@ant-design/icons";
import { logger } from "@platform/logging";

const { Text } = Typography;

interface GovernancePickerProps {
  policyGroups: any[]; // Typed as PolicyGroup[]
  adHocPolicies: any[]; // Typed as PolicyDefinition[]
  selectedKeys: string[];
  onChange: (keys: string[]) => void;
}

/**
 * @description Renders a dual-view picker for Governance constraints.
 */
export const GovernancePicker: React.FC<GovernancePickerProps> = ({
  policyGroups,
  adHocPolicies,
  selectedKeys,
  onChange
}) => {
  const { token } = theme.useToken();
  const [searchText, setSearchText] = useState("");

  // ⚡ FILTER LOGIC
  const filteredGroups = useMemo(() => 
    policyGroups.filter(g => g.name.toLowerCase().includes(searchText.toLowerCase())),
  [policyGroups, searchText]);

  const filteredPolicies = useMemo(() => 
    adHocPolicies.filter(p => p.name.toLowerCase().includes(searchText.toLowerCase())),
  [adHocPolicies, searchText]);

  const handleToggle = (key: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedKeys, key]);
      logger.trace("CONTEXT_BROWSER", `Selected Rule: [${key}]`);
    } else {
      onChange(selectedKeys.filter(k => k !== key));
    }
  };

  const renderList = (items: any[], type: 'GROUP' | 'POLICY') => {
    if (items.length === 0) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No rules found" />;

    return (
      <List
        dataSource={items}
        renderItem={item => {
            const key = `${type}:${item.key}`;
            const isSelected = selectedKeys.includes(key);
            
            // ⚡ THEME MAPPING: Use semantic tokens instead of hardcoded hex
            const isGroup = type === 'GROUP';
            const selectedBg = isGroup ? token.colorInfoBg : token.colorWarningBg;
            const selectedBorder = isGroup ? token.colorInfoBorder : token.colorWarningBorder;

            return (
                <List.Item
                    style={{ 
                        padding: '8px 12px',
                        cursor: 'pointer',
                        // ⚡ THEME FIX: Dynamic Background
                        background: isSelected ? selectedBg : 'transparent',
                        // ⚡ THEME FIX: Dynamic Border
                        border: isSelected 
                            ? `1px solid ${selectedBorder}` 
                            : `1px solid ${token.colorBorderSecondary}`,
                        marginBottom: 8,
                        borderRadius: 6,
                        transition: 'all 0.2s'
                    }}
                    onClick={() => handleToggle(key, !isSelected)}
                >
                    <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                        <Checkbox checked={isSelected} style={{ marginRight: 12 }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                                <Text strong style={{ fontSize: 13 }}>{item.name}</Text>
                                {type === 'GROUP' && <Tag color="blue">BUNDLE</Tag>}
                            </div>
                            <Text type="secondary" style={{ fontSize: 11 }}>{item.description || "No description"}</Text>
                        </div>
                    </div>
                </List.Item>
            );
        }}
      />
    );
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 0 12px 0' }}>
            <Input 
                prefix={<SearchOutlined style={{ color: token.colorTextQuaternary }} />} 
                placeholder="Search rules..." 
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                allowClear
                // ⚡ THEME FIX: Input Background
                style={{ background: token.colorBgContainer, borderColor: token.colorBorder }}
            />
        </div>
        
        <Tabs 
            defaultActiveKey="groups"
            size="small"
            items={[
                {
                    key: 'groups',
                    label: <span><TeamOutlined /> Bundles ({filteredGroups.length})</span>,
                    children: <div style={{ height: '100%', overflowY: 'auto' }}>{renderList(filteredGroups, 'GROUP')}</div>
                },
                {
                    key: 'policies',
                    label: <span><SafetyCertificateOutlined /> Ad-Hoc ({filteredPolicies.length})</span>,
                    children: <div style={{ height: '100%', overflowY: 'auto' }}>{renderList(filteredPolicies, 'POLICY')}</div>
                }
            ]}
            style={{ flex: 1, overflow: 'hidden' }} 
        />
    </div>
  );
};

