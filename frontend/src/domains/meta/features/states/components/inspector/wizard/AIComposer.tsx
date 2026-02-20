// FILEPATH: frontend/src/domains/meta/features/states/components/inspector/wizard/AIComposer.tsx
// @file: AI Composer (Orchestrator)
// @role: 🎼 Main Container */
// @author: The Engineer
// @description: Orchestrates the Context Browser and Prompt Interface with Isolated Theme Support.
// @security-level: LEVEL 9 (UI Safe) */
// @invariant: State must be lifted here to persist across tabs. */
// @updated: Connected 'selectedDomains' to Assembler for Multi-Domain Sync. */

import React, { useState, useMemo } from "react";
import { Modal, Row, Col, Space, Button, Tag, Tooltip, ConfigProvider, theme, Segmented, Card, Divider } from "antd";
import { RobotOutlined, FullscreenOutlined, FullscreenExitOutlined, CheckCircleOutlined, CopyOutlined } from "@ant-design/icons";

// Sub-Components
import { ContextBrowser } from "./components/ContextBrowser";
import { PromptInterface } from "./components/PromptInterface";
import { useContextAssembler, type CommandMode } from "./hooks/useContextAssembler";

// Hooks - Domain Specific (Fallback for Connected Mode)
import { useDomainSchema } from "../../../hooks/useDomainSchema"; 
import { useDomains } from "../../../hooks/useDomains"; 
import { useWorkflows } from "../../../hooks/useWorkflows"; 
import { usePolicyGroups } from "../../../../policy_groups/hooks/usePolicyGroups";
import { useGovernance } from "../../../../governance/hooks/useGovernance";

// Types
import type { WidgetDefinition } from "@/platform/workflow/wizard-engine/hooks/useWidgetRegistry";

interface AIComposerProps {
  visible: boolean;
  onClose: () => void;
  onGenerate: (schema: any[]) => void;
  domain: string; 
  widgets: WidgetDefinition[];
  
  // ⚡ DEPENDENCY INJECTION
  policyGroups?: any[];
  adHocPolicies?: any[];
  availableWorkflows?: any[];
  availableDomains?: any[];
}

/**
 * @description The centralized orchestrator for AI-assisted form generation.
 */
export const AIComposer: React.FC<AIComposerProps> = ({ 
  visible, 
  onClose, 
  onGenerate, 
  domain, 
  widgets,
  
  // Optional Injections
  policyGroups: injectedGroups,
  adHocPolicies: injectedPolicies,
  availableWorkflows: injectedWorkflows,
  availableDomains: injectedDomains
}) => {
  // --- 1. UI STATE ---
  const [isStudioMode, setIsStudioMode] = useState(true);
  const [commandMode, setCommandMode] = useState<CommandMode>('WIZARD');
  const [prompt, setPrompt] = useState("");
  const [previewResult, setPreviewResult] = useState<any | null>(null);

  // --- 2. SELECTION STATE & DYNAMIC DOMAIN ---
  const [selectedDomains, setSelectedDomains] = useState<string[]>([domain]);
  
  // ⚡ DYNAMIC PIVOT: Active Domain determines what the LEFT PANEL shows
  const activeDomain = useMemo(() => {
      return selectedDomains.length > 0 ? selectedDomains[0] : domain;
  }, [selectedDomains, domain]);

  const [selectedPolicies, setSelectedPolicies] = useState<string[]>([]);
  const [selectedWorkflows, setSelectedWorkflows] = useState<string[]>([]);
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>([]); 
  
  // --- 3. DATA RESOLUTION (For Left Panel Display Only) ---
  const connectedDomains = useDomains();
  const connectedWorkflows = useWorkflows(activeDomain); 
  const connectedGroups = usePolicyGroups();
  const connectedPolicies = useGovernance(activeDomain);
  
  // We still fetch the active schema to detect loading state for the UI
  const connectedSchema = useDomainSchema(activeDomain);

  const resolvedDomains = injectedDomains || connectedDomains.domains;
  const resolvedWorkflows = injectedWorkflows || connectedWorkflows.workflows;
  const resolvedGroups = injectedGroups || connectedGroups.groups;
  const resolvedPolicies = injectedPolicies || connectedPolicies.policies;

  // --- 4. LOGIC HOOK (The Omniscient Assembler) ---
  const assembler = useContextAssembler({
      currentDomain: activeDomain, 
      currentDraft: null, 
      commandMode,
      
      // ⚡ INJECTED DATA
      widgets: widgets,
      // domainFields & schemaDomain REMOVED -> Assembler fetches on its own
      
      policies: resolvedPolicies,
      groups: resolvedGroups,
      workflows: resolvedWorkflows || [],

      // ⚡ SELECTION STATE
      selectedWidgets,
      selectedGovernance: selectedPolicies,
      selectedWorkflows: selectedWorkflows,
      selectedDomains: selectedDomains // ⚡ PASSING PLURAL DOMAINS
  });

  // --- 5. HANDLERS ---
  const handleDomainChange = (values: string[]) => {
      setSelectedDomains(values);
  };

  const handleGenerateClick = async () => {
      const result = await assembler.generate(prompt);
      if (result) {
          setPreviewResult(result);
      }
  };

  const handleApplyPreview = () => {
      if (previewResult) {
          onGenerate(previewResult);
          onClose();
      }
  };

  // --- 6. RENDER ---
  const modalWidth = isStudioMode ? "100vw" : 1000; 
  const modalStyle = isStudioMode ? { top: 0, margin: 0, padding: 0, height: '100vh' } : { top: 50 };

  return (
    <ConfigProvider theme={isStudioMode ? { algorithm: theme.darkAlgorithm } : undefined}>
        <Modal
            title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 24 }}>
                  <Space size={16}>
                    <Space>
                        <RobotOutlined style={{ color: '#1890ff', fontSize: 20 }} />
                        <span style={{ fontSize: 16, fontWeight: 600 }}>Cortex Composer</span>
                    </Space>
      
                    <Segmented 
                        value={commandMode}
                        onChange={(val) => setCommandMode(val as CommandMode)}
                        options={[
                            { label: 'Wizard', value: 'WIZARD' },
                            { label: 'Job', value: 'JOB' },
                            { label: 'Rules', value: 'GOVERNANCE' },
                            { label: 'Free Chat', value: 'FREE_CHAT' }
                        ]}
                    />
                  </Space>

                  <Tooltip title={isStudioMode ? "Exit Studio" : "Enter Studio Mode"}>
                    <Button 
                    type="text" 
                    icon={isStudioMode ? <FullscreenExitOutlined /> : <FullscreenOutlined />} 
                    onClick={() => setIsStudioMode(!isStudioMode)}
                    />
                  </Tooltip>
                </div>
            }
            open={visible}
            onCancel={onClose}
            footer={null}
            width={modalWidth}
            style={modalStyle}
            styles={{ body: { height: isStudioMode ? 'calc(100vh - 55px)' : '600px', overflow: 'hidden', padding: 0 } }}
            destroyOnClose
        >
            <Row style={{ height: '100%' }}>
                <Col span={9} style={{ height: '100%', borderRight: '1px solid #303030' }}>
                    <ContextBrowser 
                        availableWorkflows={resolvedWorkflows || []}
                        selectedWorkflows={selectedWorkflows}
                        onWorkflowChange={setSelectedWorkflows}
                        
                        widgets={widgets}
                        selectedWidgetKeys={selectedWidgets}
                        onWidgetChange={setSelectedWidgets}
                        
                        policyGroups={resolvedGroups}
                        adHocPolicies={resolvedPolicies}
                        selectedPolicyKeys={selectedPolicies}
                        onPolicyChange={setSelectedPolicies}

                        currentDomain={activeDomain}
                        availableDomains={resolvedDomains || []}
                        selectedDomains={selectedDomains}
                        onDomainChange={handleDomainChange}
                        
                        isSchemaLoading={connectedSchema.isLoading} 
                        isStudioMode={isStudioMode}
                    />
                </Col>

                <Col span={15} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
                        {previewResult && (
                            <div style={{ marginBottom: 24, animation: 'fadeIn 0.3s ease' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Tag color="cyan">Cortex Response</Tag>
                                    <Space>
                                        <Button 
                                            size="small" 
                                            icon={<CopyOutlined />} 
                                            onClick={() => navigator.clipboard.writeText(JSON.stringify(previewResult, null, 2))}
                                        >
                                            Copy
                                        </Button>
                                    </Space>
                                </div>
                                <Card size="small" style={{ background: '#1f1f1f', border: '1px solid #303030' }}>
                                    <pre style={{ 
                                        margin: 0, 
                                        fontSize: 12, 
                                        fontFamily: 'monospace', 
                                        color: '#a6adb4', 
                                        whiteSpace: 'pre-wrap', 
                                        wordBreak: 'break-all', 
                                        maxHeight: '40vh',
                                        overflow: 'auto'
                                    }}>
                                        {JSON.stringify(previewResult, null, 2)}
                                    </pre>
                                </Card>
                                {Array.isArray(previewResult) && (
                                    <div style={{ textAlign: 'right', marginTop: 12 }}>
                                        <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleApplyPreview}>
                                            Apply to Workflow
                                        </Button>
                                    </div>
                                )}
                                <Divider />
                            </div>
                        )}

                        <PromptInterface 
                            prompt={prompt}
                            onPromptChange={setPrompt}
                            onGenerate={handleGenerateClick}
                            onCopyPayload={() => assembler.copyToClipboard(prompt)}
                            onCancel={onClose}
                            
                            onSync={assembler.sync}
                            isSyncing={assembler.isSyncing}
                            isStale={assembler.isStale}
                            
                            loading={assembler.loading}
                            contextLoading={connectedSchema.isLoading}
                            
                            error={null}
                            isStudioMode={isStudioMode}
                            commandMode={commandMode}
                            // @ts-ignore
                            aiContext={assembler.aiContext}
                        />
                    </div>
                </Col>
            </Row>
        </Modal>
    </ConfigProvider>
  );
};

