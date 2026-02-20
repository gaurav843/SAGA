// FILEPATH: frontend/src/domains/meta/features/states/components/inspector/NodeInspector.tsx
// @file: Node Inspector Router
// @role: 🔀 Router */
// @author: The Engineer
// @description: Determines which specific Inspector to render based on the passed Workflow Type.
// @security-level: LEVEL 9 (Data Integrity) */
// @invariant: Must handle null data gracefully. */

import React, { useEffect } from "react";
import { Empty } from "antd";

// ⚡ FIXED IMPORT: Using Relative Path to guarantee resolution
import { logger } from "../../../../../../platform/logging";

// Shell & Components
import { InspectorShell } from "./InspectorShell";
import { StandardNode } from "./StandardNode";
import { WizardNode } from "./WizardNode";
import { JobNode } from "./JobNode";

import { AppstoreOutlined, RobotOutlined, NodeIndexOutlined } from "@ant-design/icons";

interface NodeInspectorProps {
  nodeId: string | null;
  nodeData: any; // Backend State Definition
  domain: string; 
  workflowType: string; // 'WIZARD' | 'JOB' | 'GOVERNANCE'
  hostFields?: any[];
  readOnly?: boolean;
  onChange: (data: any) => void;
  onClose?: () => void;
}

/**
 * @description The Brain of the Inspector. Routes to the correct editor.
 */
export const NodeInspector: React.FC<NodeInspectorProps> = ({
  nodeId,
  nodeData,
  domain,
  workflowType,
  hostFields,
  readOnly,
  onChange,
  onClose = () => {}
}) => {
  // 🔊 LOUD NARRATOR: Inspect Selection Context
  useEffect(() => {
    if (nodeId) {
      logger.tell("INSPECTOR", `🔍 Selection Changed: [${nodeId}]`, {
        type: workflowType,
        meta_keys: nodeData?.meta ? Object.keys(nodeData.meta) : "NONE"
      });
    }
  }, [nodeId, workflowType]);

  if (!nodeId || !nodeData) {
    return (
      <InspectorShell title="Selection" type="NONE" onClose={onClose}>
        <Empty description="Select a node to edit" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </InspectorShell>
    );
  }

  // ⚡ ROUTER LOGIC: Trust the Panel's decision (workflowType)
  
  // 1. WIZARD SCOPE (Form Builder 2.0)
  if (workflowType === "WIZARD") {
    return (
      <InspectorShell 
        title={nodeData.label || nodeId || "Wizard Step"} 
        subTitle={`ID: ${nodeId}`}
        icon={<AppstoreOutlined />}
        type="NODE" 
        onClose={onClose}
      >
        <WizardNode 
            id={nodeId} 
            data={nodeData} 
            onChange={onChange} 
            readOnly={readOnly} 
        />
      </InspectorShell>
    );
  }

  // 2. JOB SCOPE (DevOps Config)
  if (workflowType === "JOB") {
    return (
      <InspectorShell 
        title={nodeData.label || nodeId || "Async Job"} 
        subTitle="Background Process"
        icon={<RobotOutlined />}
        type="NODE" 
        onClose={onClose}
      >
        <JobNode 
            id={nodeId} 
            data={nodeData} 
            onChange={onChange} 
            readOnly={readOnly}
        />
      </InspectorShell>
    );
  }

  // 3. DEFAULT / GOVERNANCE (Standard Config)
  return (
    <InspectorShell 
      title={nodeData.label || nodeId || "State Node"} 
      subTitle="Lifecycle State"
      icon={<NodeIndexOutlined />}
      type="NODE" 
      onClose={onClose}
    >
      <StandardNode 
        id={nodeId} 
        data={nodeData} 
        onChange={onChange} 
        readOnly={readOnly}
      />
    </InspectorShell>
  );
};
