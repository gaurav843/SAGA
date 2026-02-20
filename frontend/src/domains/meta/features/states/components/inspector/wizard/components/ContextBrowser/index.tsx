// FILEPATH: frontend/src/domains/meta/features/states/components/inspector/wizard/components/ContextBrowser/index.tsx
// @file: Context Browser (The "Right Screen")
// @role: 🎛️ Orchestrator */
// @author: The Engineer
// @description: Tabbed interface for browsing and selecting AI Context sources.
// @security-level: LEVEL 9 (UI Safe) */
// @invariant: Must retain selection state across tab switches. */

import React from "react";
import { Tabs, Badge, theme } from "antd";
import { 
  DatabaseOutlined, 
  SafetyCertificateOutlined, 
  PartitionOutlined, 
  ToolOutlined 
} from "@ant-design/icons";

// Sub-Components
import { WorkflowPicker } from "./WorkflowPicker";
import { GovernancePicker } from "./GovernancePicker";
import { DataPicker } from "./DataPicker";
import { ComponentGallery } from "./ComponentGallery";

// Types
import type { WorkflowDefinition } from "../../../../../hooks/useWorkflows";
import type { WidgetDefinition } from "@platform/workflow/wizard-engine/hooks/useWidgetRegistry";
import type { DomainSummary } from "@platform/kernel/types";

interface ContextBrowserProps {
  // --- WORKFLOWS ---
  availableWorkflows: WorkflowDefinition[];
  selectedWorkflows: string[];
  onWorkflowChange: (selected: string[]) => void;

  // --- GOVERNANCE ---
  policyGroups: any[];
  adHocPolicies: any[];
  selectedPolicyKeys: string[];
  onPolicyChange: (selected: string[]) => void;

  // --- UI COMPONENTS ---
  widgets: WidgetDefinition[];
  selectedWidgetKeys: string[];
  onWidgetChange: (selected: string[]) => void;

  // --- DATA ---
  currentDomain: string;
  availableDomains: DomainSummary[];
  selectedDomains: string[];
  onDomainChange: (selected: string[]) => void;
  isSchemaLoading?: boolean;

  // --- UI STATE ---
  isStudioMode?: boolean; 
}

/**
 * @description The main container for the Context Selection Interface.
 */
export const ContextBrowser: React.FC<ContextBrowserProps> = ({
  availableWorkflows,
  selectedWorkflows,
  onWorkflowChange,
  
  policyGroups,
  adHocPolicies,
  selectedPolicyKeys,
  onPolicyChange,

  widgets,
  selectedWidgetKeys,
  onWidgetChange,

  currentDomain,
  availableDomains,
  selectedDomains,
  onDomainChange,
  isSchemaLoading,

  isStudioMode = false
}) => {
  const { token } = theme.useToken();

  // ⚡ DYNAMIC STYLING (Semantic)
  // We rely on the parent ConfigProvider (Dark Algorithm) to set token values correctly.
  const containerStyle = { 
      height: '100%', 
      borderRight: `1px solid ${token.colorBorderSecondary}`, 
      background: token.colorBgContainer, // ⚡ This will be dark in Studio Mode
      color: token.colorText
  };

  const items = [
    {
      key: 'workflows',
      label: (
        <span>
          <PartitionOutlined /> Flows
          {selectedWorkflows.length > 0 && (
            <Badge count={selectedWorkflows.length} style={{ marginLeft: 8, backgroundColor: '#722ed1', boxShadow: 'none' }} />
          )}
        </span>
      ),
      children: (
        <WorkflowPicker 
          availableWorkflows={availableWorkflows}
          selectedWorkflows={selectedWorkflows}
          onChange={onWorkflowChange}
        />
      )
    },
    {
      key: 'data',
      label: (
        <span>
            <DatabaseOutlined /> Data
            {selectedDomains.length > 0 && (
                <Badge count={selectedDomains.length} style={{ marginLeft: 8, backgroundColor: '#52c41a', boxShadow: 'none' }} />
            )}
        </span>
      ),
      children: (
        <DataPicker 
            currentDomain={currentDomain}
            availableDomains={availableDomains}
            selectedDomains={selectedDomains}
            onChange={onDomainChange}
            isLoading={isSchemaLoading}
        />
      )
    },
    {
      key: 'rules',
      label: (
        <span>
            <SafetyCertificateOutlined /> Rules
            {selectedPolicyKeys.length > 0 && (
                <Badge count={selectedPolicyKeys.length} style={{ marginLeft: 8, backgroundColor: '#faad14', boxShadow: 'none' }} />
            )}
        </span>
      ),
      children: (
        <GovernancePicker 
            policyGroups={policyGroups}
            adHocPolicies={adHocPolicies}
            selectedKeys={selectedPolicyKeys}
            onChange={onPolicyChange}
        />
      )
    },
    {
      key: 'ui',
      label: (
        <span>
            <ToolOutlined /> UI
            {selectedWidgetKeys.length > 0 && (
                <Badge count={selectedWidgetKeys.length} style={{ marginLeft: 8, backgroundColor: '#1890ff', boxShadow: 'none' }} />
            )}
        </span>
      ),
      children: (
        <ComponentGallery 
            widgets={widgets}
            selectedKeys={selectedWidgetKeys}
            onChange={onWidgetChange}
        />
      )
    }
  ];

  return (
    <div style={containerStyle}>
      <Tabs 
        defaultActiveKey="workflows" 
        tabPosition="left"
        items={items}
        style={{ height: '100%' }}
        tabBarStyle={{ width: 140, paddingTop: 16 }}
      />
    </div>
  );
};
