// FILEPATH: frontend/src/domains/meta_v2/features/workflows/components/inspector/WorkflowInspector.tsx
// @file: Workflow Inspector (Router & State Manager)
// @role: 🧠 Logic Container */
// @author: The Engineer
// @description: Orchestrates the contextual editing of Nodes. Added Editable Raw JSON tab.
// @security-level: LEVEL 9 */

import React, { useEffect, useMemo, useState } from 'react';
import { Tabs, Typography, Empty, theme, Space, Select, Tag, Input, Button, Alert } from 'antd';
import { 
    CodeOutlined, 
    SwapOutlined,
    CheckOutlined
} from '@ant-design/icons';

import { logger } from '@/platform/logging';
import { useUrlState } from '@/platform/hooks/useUrlState';
import { useWidgetRegistry } from '@/platform/workflow/wizard-engine/hooks/useWidgetRegistry';

import { InspectorShell } from './InspectorShell';
import { StandardNode } from './StandardNode';
import { JobNode } from './JobNode';
import { WizardNode } from './WizardNode';
import { useDomainSchema } from '../../hooks/useDomainSchema';

const { Text } = Typography;

interface WorkflowInspectorProps {
    domain: string;
    workflowType: string;
    activeMachine: any;
    selectedNodeId: string | null;
    onUpdate: (def: any) => void;
    readOnly?: boolean;
    onClose: () => void;
}

export const WorkflowInspector: React.FC<WorkflowInspectorProps> = ({
    domain,
    workflowType,
    activeMachine,
    selectedNodeId,
    onUpdate,
    readOnly,
    onClose
}) => {
    const { token } = theme.useToken();
    const { allWidgets } = useWidgetRegistry();
    const { schemaFields, isLoading: isSchemaLoading } = useDomainSchema(domain);

    // ⚡ DEEP LINKING BY DEFAULT
    const [activeTab, setActiveTab] = useUrlState('inspect_tab', 'config');

    // ⚡ LOCAL STATE: JSON Editor Buffer
    const [jsonText, setJsonText] = useState('');
    const [jsonError, setJsonError] = useState<string | null>(null);

    // ⚡ TELEMETRY PROBE: Selection Change
    useEffect(() => {
        if (selectedNodeId) {
            logger.whisper("INSPECTOR", `🔍 Selection Focus: [${selectedNodeId}]`, { domain, type: workflowType });
        }
    }, [selectedNodeId, domain, workflowType]);

    const nodeData = useMemo(() => {
        return activeMachine?.transitions?.states?.[selectedNodeId || ''] || null;
    }, [activeMachine, selectedNodeId]);

    // ⚡ SYNC JSON BUFFER: Keep the text area updated when nodeData changes externally
    useEffect(() => {
        if (nodeData) {
            setJsonText(JSON.stringify(nodeData, null, 2));
            setJsonError(null);
        }
    }, [nodeData]);

    const effectiveEngine = useMemo(() => {
        const type = nodeData?.meta?.nodeType;
        if (type === 'screen') return 'WIZARD';
        if (type === 'task') return 'JOB';
        return workflowType || 'GOVERNANCE';
    }, [nodeData, workflowType]);

    const handleTypeChange = (newType: string) => {
        logger.tell("INSPECTOR", `🔄 Switching Node Engine: ${effectiveEngine} -> ${newType}`);
        const newNodeType = newType === 'WIZARD' ? 'screen' : newType === 'JOB' ? 'task' : 'standard';
        
        onUpdate({
            ...nodeData,
            meta: { ...nodeData?.meta, nodeType: newNodeType }
        });
    };

    // ⚡ HANDLER: Apply JSON Mutations
    const handleApplyJson = () => {
        try {
            const parsed = JSON.parse(jsonText);
            setJsonError(null);
            logger.tell("INSPECTOR", `💾 Applied raw JSON modifications to node: [${selectedNodeId}]`);
            onUpdate(parsed);
        } catch (e: any) {
            setJsonError(e.message);
            logger.scream("INSPECTOR", "Invalid JSON Syntax in Inspector", e);
        }
    };

    if (!selectedNodeId || !nodeData) {
        return (
            <InspectorShell title="Selection" type="NONE" onClose={onClose}>
                <Empty description="Select a node to edit" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </InspectorShell>
        );
    }

    return (
        <InspectorShell 
            title={nodeData.label || selectedNodeId} 
            subTitle={`ID: ${selectedNodeId}`}
            type="NODE"
            onClose={onClose}
            onAI={!readOnly ? () => logger.tell("UI", "Intent: Trigger AI Assistant") : undefined}
        >
            <div style={{ marginBottom: 16 }}>
                <Space size={4}>
                    <Tag bordered={false}>Engine</Tag>
                    <Select
                        size="small"
                        variant="borderless"
                        value={effectiveEngine}
                        onChange={handleTypeChange}
                        suffixIcon={<SwapOutlined />}
                        disabled={readOnly}
                        style={{ width: 140 }}
                        options={[
                            { value: 'GOVERNANCE', label: 'Governance' },
                            { value: 'WIZARD', label: 'Wizard Screen' },
                            { value: 'JOB', label: 'Async Job' },
                        ]}
                    />
                </Space>
            </div>

            <Tabs 
                activeKey={activeTab}
                onChange={(key) => {
                    logger.whisper("UI", `Switching inspector tab to: ${key}`);
                    setActiveTab(key);
                }}
                tabBarStyle={{ marginBottom: 16 }}
                items={[
                    {
                        key: 'config',
                        label: 'Configuration',
                        children: (
                            <div className="engine-router">
                                {effectiveEngine === 'WIZARD' && (
                                    <WizardNode id={selectedNodeId} data={nodeData} onChange={onUpdate} readOnly={readOnly} />
                                )}
                                {effectiveEngine === 'JOB' && (
                                    <JobNode id={selectedNodeId} data={nodeData} onChange={onUpdate} readOnly={readOnly} />
                                )}
                                {effectiveEngine === 'GOVERNANCE' && (
                                    <StandardNode id={selectedNodeId} data={nodeData} onChange={onUpdate} readOnly={readOnly} />
                                )}
                                {isSchemaLoading && <div style={{ marginTop: 8 }}><Text type="secondary" style={{ fontSize: 10 }}>Fusing System Context...</Text></div>}
                            </div>
                        )
                    },
                    {
                        key: 'json',
                        label: 'Raw JSON',
                        icon: <CodeOutlined />,
                        children: (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {jsonError && (
                                    <Alert type="error" message="Syntax Error" description={jsonError} showIcon />
                                )}
                                <Input.TextArea 
                                    value={jsonText}
                                    onChange={(e) => setJsonText(e.target.value)}
                                    disabled={readOnly}
                                    autoSize={{ minRows: 15, maxRows: 25 }}
                                    style={{ 
                                        fontFamily: 'monospace', 
                                        fontSize: 11, 
                                        background: readOnly ? token.colorFillQuaternary : token.colorFillAlter, 
                                        color: token.colorText,
                                        border: `1px solid ${token.colorBorderSecondary}`,
                                        borderRadius: 6,
                                        padding: 12
                                    }}
                                    spellCheck={false}
                                />
                                {!readOnly && (
                                    <Button 
                                        type="primary" 
                                        icon={<CheckOutlined />} 
                                        onClick={handleApplyJson}
                                        block
                                    >
                                        Apply JSON Updates
                                    </Button>
                                )}
                            </div>
                        )
                    }
                ]}
            />
        </InspectorShell>
    );
};

