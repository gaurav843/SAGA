// FILEPATH: frontend/src/domains/meta/features/states/components/inspector/wizard/components/ContextBrowser/DataPicker.tsx
// @file: Data Context Picker
// @role: 🧩 UI Component */
// @author: The Engineer
// @description: Allows selection of Data Domains to inject Schema Context.
// @security-level: LEVEL 9 (Read-Only) */
// @invariant: Must clearly indicate the 'Current' domain. */
// @updated: Tokenized colors for Dark Mode compatibility. */

import React, { useMemo, useState } from "react";
import { List, Checkbox, Input, Typography, Empty, Tag, Spin, theme } from "antd";
import { DatabaseOutlined, SearchOutlined } from "@ant-design/icons";
import { logger } from "@platform/logging";
import type { DomainSummary } from "@platform/kernel/types";

const { Text } = Typography;

interface DataPickerProps {
  currentDomain: string;
  availableDomains: DomainSummary[];
  selectedDomains: string[];
  onChange: (selected: string[]) => void;
  isLoading?: boolean;
}

/**
 * @description Renders a list of available Data Domains.
 */
export const DataPicker: React.FC<DataPickerProps> = ({
  currentDomain,
  availableDomains,
  selectedDomains,
  onChange,
  isLoading
}) => {
  const { token } = theme.useToken();
  const [searchText, setSearchText] = useState("");

  const filteredList = useMemo(() => {
    return availableDomains.filter(d => 
      d.label.toLowerCase().includes(searchText.toLowerCase()) || 
      d.key.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [availableDomains, searchText]);

  const handleToggle = (key: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedDomains, key]);
      logger.trace("CONTEXT_BROWSER", `Selected Data Domain: [${key}]`);
    } else {
      onChange(selectedDomains.filter(d => d !== key));
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 0 12px 0' }}>
            <Input 
                prefix={<SearchOutlined style={{ color: token.colorTextQuaternary }} />} 
                placeholder="Search domains..." 
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                allowClear
                style={{ background: token.colorBgContainer, borderColor: token.colorBorder }}
            />
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredList.length > 0 ? (
                <List
                    dataSource={filteredList}
                    renderItem={item => {
                        const isSelected = selectedDomains.includes(item.key);
                        const isCurrent = item.key === currentDomain;
                        return (
                            <List.Item
                                style={{ 
                                    padding: '8px 12px',
                                    cursor: 'pointer',
                                    // ⚡ THEME FIX: Use Tokens instead of Hardcoded Hex
                                    background: isSelected ? token.colorSuccessBg : 'transparent',
                                    border: isSelected ? `1px solid ${token.colorSuccessBorder}` : `1px solid ${token.colorBorderSecondary}`,
                                    marginBottom: 8,
                                    borderRadius: 6,
                                    transition: 'all 0.2s'
                                }}
                                onClick={() => handleToggle(item.key, !isSelected)}
                            >
                                <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                                    <Checkbox checked={isSelected} style={{ marginRight: 12 }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <DatabaseOutlined style={{ color: isCurrent ? token.colorSuccess : token.colorTextTertiary }} />
                                                <Text strong style={{ fontSize: 13, color: token.colorText }}>{item.label}</Text>
                                            </div>
                                            {isCurrent && <Tag color="green" style={{ margin: 0, fontSize: 10 }}>CURRENT</Tag>}
                                        </div>
                                        <Text type="secondary" style={{ fontSize: 11 }}>{item.key}</Text>
                                    </div>
                                </div>
                            </List.Item>
                        );
                    }}
                />
            ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No domains found." />
            )}
        </div>

        {isLoading && (
            <div style={{ paddingTop: 8, textAlign: 'center', borderTop: `1px solid ${token.colorBorderSecondary}` }}>
                <Spin size="small" /> <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>Fetching Schemas...</Text>
            </div>
        )}
    </div>
  );
};

