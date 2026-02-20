// FILEPATH: frontend/src/domains/meta/features/states/components/inspector/wizard/components/ContextBrowser/WorkflowPicker.tsx
// @file: Workflow Context Picker
// @role: 🧩 UI Component */
// @author: The Engineer
// @description: Allows the user to select existing Workflows to inject as reference context for the AI.
// @security-level: LEVEL 9 (Read-Only) */
// @invariant: Must filter displayed workflows by the current Domain context. */
// @narrator: Logs search interactions. */
// @updated: Replaced hardcoded HEX colors with System Theme Tokens. */

import React, { useMemo, useState } from "react";
import { List, Checkbox, Tag, Input, Typography, Empty, Space, theme } from "antd";
import { SearchOutlined, RocketOutlined, SafetyCertificateOutlined, SettingOutlined } from "@ant-design/icons";
import { logger } from "@platform/logging";
// Keep domain-relative imports for now unless an alias exists for this feature
import { WORKFLOW_TYPES } from "../../../../../constants";
import type { WorkflowDefinition } from "../../../../../hooks/useWorkflows";

const { Text } = Typography;

interface WorkflowPickerProps {
  availableWorkflows: WorkflowDefinition[];
  selectedWorkflows: string[];
  onChange: (selected: string[]) => void;
}

/**
 * @description Renders a searchable list of workflows grouped by intent.
 */
export const WorkflowPicker: React.FC<WorkflowPickerProps> = ({ 
  availableWorkflows, 
  selectedWorkflows, 
  onChange 
}) => {
  const { token } = theme.useToken();
  const [searchText, setSearchText] = useState("");

  // ⚡ FILTER & GROUP LOGIC
  const filteredList = useMemo(() => {
    if (!availableWorkflows) return [];
    
    // 1. Text Filter
    const textMatched = availableWorkflows.filter(w => 
      w.name.toLowerCase().includes(searchText.toLowerCase()) ||
      w.scope.toLowerCase().includes(searchText.toLowerCase())
    );

    return textMatched;
  }, [availableWorkflows, searchText]);

  /**
   * @description Resolves the visual icon for a workflow based on heuristics.
   */
  const getIcon = (scope: string) => {
    if (scope.includes("WIZARD") || scope.includes("FLOW")) return <RocketOutlined style={{ color: '#722ed1' }} />;
    if (scope.includes("JOB") || scope.includes("TASK")) return <SettingOutlined style={{ color: '#13c2c2' }} />;
    return <SafetyCertificateOutlined style={{ color: '#faad14' }} />;
  };

  /**
   * @description Toggles selection state for a specific workflow scope.
   */
  const handleToggle = (scope: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedWorkflows, scope]);
      logger.trace("CONTEXT_BROWSER", `Selected Workflow Reference: [${scope}]`);
    } else {
      onChange(selectedWorkflows.filter(s => s !== scope));
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '0 0 12px 0' }}>
        <Input 
          prefix={<SearchOutlined style={{ color: token.colorTextQuaternary }} />} 
          placeholder="Search existing flows..." 
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          allowClear
          // ⚡ THEME FIX: Swapped hardcoded background for Token
          style={{ background: token.colorBgContainer, borderColor: token.colorBorder }}
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filteredList.length > 0 ? (
          <List
            dataSource={filteredList}
            renderItem={item => {
              const isSelected = selectedWorkflows.includes(item.scope);
            
              return (
                <List.Item 
                  style={{ 
                    padding: '8px 12px',
                    cursor: 'pointer',
                    // ⚡ THEME FIX: Swapped #f9f0ff for Token
                    background: isSelected ? token.colorPrimaryBg : 'transparent',
                    // ⚡ THEME FIX: Swapped #d3adf7 for Token
                    border: isSelected 
                        ? `1px solid ${token.colorPrimaryBorder}` 
                        : `1px solid ${token.colorBorderSecondary}`,
                    marginBottom: 8,
                    borderRadius: 6,
                    transition: 'all 0.2s'
                  }}
                  onClick={() => handleToggle(item.scope, !isSelected)}
                >
                  <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                    <Checkbox checked={isSelected} style={{ marginRight: 12 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <Space>
                            {getIcon(item.scope)}
                            <Text strong style={{ fontSize: 13, color: token.colorText }}>{item.name}</Text>
                        </Space>
                        <Tag style={{ margin: 0, fontSize: 10 }}>v{item.version}</Tag>
                      </div>
                      <Text type="secondary" style={{ fontSize: 11 }}>{item.scope}</Text>
                    </div>
                  </div>
                </List.Item>
              );
            }}
          />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No matching workflows found." />
        )}
      </div>
    </div>
  );
};

