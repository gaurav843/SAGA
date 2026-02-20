// FILEPATH: frontend/src/domains/meta/features/states/components/InspectorPanel.tsx
// @file: Inspector Panel (The Switchboard)
// @role: 🎛️ Control Panel */
// @author: The Engineer
// @description: The Right-Hand Panel that decides WHICH tools to show.
// UPDATED: Fixed '0 Widgets' bug by correctly accessing 'allWidgets' from registry hook.
// UPDATED: Added Deep Telemetry for AI Merge operations.
// UPDATED: Implemented 'useUrlState' for Tab Persistence.

// @security-level: LEVEL 9 (UI Safe) */
// @invariant: Must always display the Close button. */

import React, { useState, useMemo } from 'react';
import { Tabs, Typography, Empty, theme, Tag, Space, Select, Button, Tooltip } from 'antd';
import { 
    SettingOutlined, 
    RocketOutlined, 
    SafetyCertificateOutlined,
    AppstoreOutlined,
    CodeOutlined,
    SwapOutlined,
    ThunderboltFilled // ⚡ AI Icon
} from '@ant-design/icons';

import { NodeInspector } from './inspector/NodeInspector';
import { useDomainSchema } from '../hooks/useDomainSchema';
// ⚡ AI COMPOSER
import { AIComposer } from './inspector/wizard/AIComposer';
import { logger } from '../../../../../platform/logging';
// ⚡ WIDGET REGISTRY
import { useWidgetRegistry } from '../../../../../platform/workflow/wizard-engine/hooks/useWidgetRegistry';
// ⚡ UNIVERSAL STATE
import { useUrlState } from '../../../../../platform/hooks/useUrlState'; 

import type { StateMachineRead } from '../../../../api/models/StateMachineRead';

/** @description Destructure Typography. */
const { Text } = Typography;

interface InspectorPanelProps {
    domain: string;
    workflowType: string;
    activeMachine: StateMachineRead;
    selectedNodeId: string | null;
    onUpdate: (def: any) => void;
    readOnly?: boolean;
}

/**
 * @description The Inspector Panel handles the contextual editing of Nodes, Edges, and Workflow Properties.
 * It now hosts the AI Composer trigger to ensure it's always accessible.
 */
export const InspectorPanel: React.FC<InspectorPanelProps> = ({
    domain,
    workflowType,
    activeMachine,
    selectedNodeId,
    onUpdate,
    readOnly
}) => {
    const { token } = theme.useToken();
    
    /** @description Controls the visibility of the AI Composer Modal. */
    const [showAI, setShowAI] = useState(false);

    // ⚡ PERSISTENT TAB STATE
    // "config" or "json"
    const [activeTab, setActiveTab] = useUrlState('tab', 'config');

    // ⚡ FETCH REAL DB CONTEXT
    const { schemaFields, isLoading: isSchemaLoading } = useDomainSchema(domain);

    // ⚡ FETCH WIDGET REGISTRY (Safe Access)
    // ⚡ FIX: Use 'allWidgets' directly. The hook returns an array, not a Map 'registry'.
    const { allWidgets } = useWidgetRegistry();

    if (!selectedNodeId) {
        return (
            <div style={{ padding: 24, textAlign: 'center', marginTop: 40 }}>
                <Empty description="Select a node to inspect" />
            </div>
        );
    }

    // Resolve Node Data
    const nodeData = activeMachine.transitions.states[selectedNodeId];
    if (!nodeData) return <Empty description="Node data not found" />;

    // ⚡ POLYMORPHIC RESOLUTION
    const currentNodeType = nodeData.meta?.nodeType;
    
    const effectiveEngine = (() => {
        if (currentNodeType === 'screen') return 'WIZARD';
        if (currentNodeType === 'task') return 'JOB';
        if (currentNodeType === 'standard') return 'GOVERNANCE';
        return workflowType; // Fallback
    })();

    /** * @description Maps engine types to UI metadata (Icons, Colors).
     */
    const getTypeMeta = (type: string) => {
        switch (type) {
            case 'WIZARD': return { icon: <RocketOutlined />, color: 'purple', label: 'Wizard Architect' };
            case 'JOB': return { icon: <SettingOutlined />, color: 'cyan', label: 'Job Configurator' };
            case 'GOVERNANCE': return { icon: <SafetyCertificateOutlined />, color: 'gold', label: 'Governance Engine' };
            default: return { icon: <AppstoreOutlined />, color: 'blue', label: 'Workflow Editor' };
        }
    };

    const meta = getTypeMeta(effectiveEngine);

    /**
     * @description Handles switching the Node Type (e.g. from Standard to Wizard).
     */
    const handleTypeChange = (newType: string) => {
        const newNodeType = newType === 'WIZARD' ? 'screen' : newType === 'JOB' ? 'task' : 'standard';
        
        // Deep update the node data
        const newNodeData = {
            ...nodeData,
            meta: {
                ...nodeData.meta,
                nodeType: newNodeType
            }
        };
        
        // Update parent
        const newDef = { ...activeMachine.transitions };
        newDef.states[selectedNodeId] = newNodeData;
        onUpdate(newNodeData);
    };

    /**
     * @description Handles the result from the AI Cortex.
     * Appends generated fields to the current node configuration.
     */
    const handleAIGenerated = (results: any[]) => {
        if (!results || results.length === 0) return;

        logger.story("INSPECTOR", `🤖 AI Merge Initiated for [${selectedNodeId}]`, { new_fields: results.length });

        if (effectiveEngine === 'WIZARD') {
            // ⚡ APPEND FIELDS (Don't Overwrite)
            const currentSchema = nodeData.meta?.form_schema || [];
            
            logger.tell("INSPECTOR", `📝 Merging ${results.length} new fields into ${currentSchema.length} existing fields.`, {
                existing: currentSchema.map((f: any) => f.name),
                new: results.map((f: any) => f.name)
            });
            
            const newSchema = [...currentSchema, ...results];
            
            // Persist Update
            const newNodeData = { 
                ...nodeData, 
                meta: { ...nodeData.meta, form_schema: newSchema } 
            };
            
            // Deep update parent structure to ensure React Flow sees the change
            const newDef = { ...activeMachine.transitions };
            newDef.states[selectedNodeId] = newNodeData;
            
            onUpdate(newNodeData); 
        } else {
             // For Generic/Governance, maybe append to description?
             // Implementation for future expansion
             logger.warn("INSPECTOR", "AI Generation for non-wizard types not fully implemented yet.");
        }
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* HEADER */}
            <div style={{ 
                padding: '12px 16px', 
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
                background: token.colorFillQuaternary
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space direction="vertical" size={0}>
                        <Text strong style={{ fontSize: 16 }}>{selectedNodeId}</Text>
                        <Space size={4}>
                            <Tag bordered={false} style={{ margin: 0 }}>State</Tag>
                            {/* ⚡ ENGINE SWITCHER */}
                            <Select
                                size="small"
                                variant="borderless"
                                value={effectiveEngine}
                                onChange={handleTypeChange}
                                suffixIcon={<SwapOutlined />}
                                style={{ width: 140, marginLeft: -8 }}
                                disabled={readOnly}
                                options={[
                                    { value: 'GOVERNANCE', label: 'Governance' },
                                    { value: 'WIZARD', label: 'Wizard Screen' },
                                    { value: 'JOB', label: 'Async Job' },
                                ]}
                            />
                        </Space>
                    </Space>

                    <Space>
                        {/* ⚡ AI TRIGGER (Guaranteed Visibility) */}
                         {!readOnly && (
                             <Tooltip title="AI Cortex Composer">
                                 <Button 
                                     type="primary"
                                     shape="circle"
                                     icon={<ThunderboltFilled />} 
                                     onClick={() => {
                                         logger.tell("INSPECTOR", "⚡ Opening AI Composer...");
                                         setShowAI(true);
                                     }}
                                     style={{ 
                                         backgroundColor: '#722ed1', 
                                         borderColor: '#722ed1',
                                         boxShadow: '0 0 10px rgba(114, 46, 209, 0.5)',
                                     }}
                                 />
                             </Tooltip>
                         )}

                        <Tag color={meta.color} style={{ fontSize: 18, padding: 8, borderRadius: 6 }}>
                            {meta.icon}
                        </Tag>
                    </Space>
                </div>
            </div>

            {/* BODY */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 0 }}>
                <Tabs 
                    activeKey={activeTab} // ⚡ CONTROLLED STATE
                    onChange={setActiveTab} // ⚡ DEEP LINK UPDATE
                    tabBarStyle={{ padding: '0 16px', marginBottom: 0 }}
                    items={[
                        {
                            key: 'config',
                            label: 'Configuration',
                            children: (
                                <div style={{ padding: 16 }}>
                                    <NodeInspector 
                                        domain={domain}
                                        workflowType={effectiveEngine}
                                        nodeId={selectedNodeId}
                                        nodeData={nodeData}
                                        hostFields={schemaFields} 
                                        readOnly={readOnly}
                                        onUpdate={(newData) => {
                                            const newDef = { ...activeMachine.transitions };
                                            newDef.states[selectedNodeId] = newData;
                                            onUpdate(newData); 
                                        }}
                                    />
                                    {isSchemaLoading && <Text type="secondary" style={{ fontSize: 10 }}>Loading DB Context...</Text>}
                                    {allWidgets.length === 0 && <Text type="secondary" style={{ fontSize: 10 }}>Loading UI Registry...</Text>}
                                </div>
                            )
                        },
                        {
                            key: 'json',
                            label: 'Raw JSON',
                            icon: <CodeOutlined />,
                            children: (
                                <div style={{ padding: 16 }}>
                                    <div style={{ 
                                        background: token.colorFillAlter, 
                                        padding: 12, 
                                        borderRadius: 6, 
                                        border: `1px solid ${token.colorBorderSecondary}`
                                    }}>
                                        <pre style={{ 
                                            fontSize: 11, 
                                            color: token.colorTextSecondary, 
                                            margin: 0, 
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-all' 
                                        }}>
                                            {JSON.stringify(nodeData, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )
                        }
                    ]}
                />
            </div>

            {/* ⚡ AI MODAL */}
            {showAI && (
                <AIComposer 
                    visible={showAI}
                    onClose={() => setShowAI(false)}
                    onGenerate={handleAIGenerated}
                    domain={domain}
                    widgets={allWidgets} // ⚡ PASS FIXED ARRAY (Renamed from registry)
                />
            )}
        </div>
    );
};

