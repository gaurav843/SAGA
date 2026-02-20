// FILEPATH: frontend/src/domains/meta/features/states/components/inspector/wizard/components/PromptInterface.tsx
// @file: Prompt Interface
// @role: 🧩 UI Component */
// @author: The Engineer
// @description: The text input and control deck for sending instructions to the Cortex.
// @security-level: LEVEL 9 (UI Safe) */
// @invariant: Handles DATABASE_SCHEMA rendering. */
// @updated: Added 'DATABASE_SCHEMA' case to fix 'Unknown' label. */

import React from "react";
import { Alert, Input, Space, Tag, Button, Spin, Typography, theme, Tooltip, Skeleton, Badge } from "antd";
import { 
    RobotOutlined, 
    CopyOutlined, 
    ThunderboltFilled, 
    SendOutlined,
    DatabaseOutlined,
    SafetyCertificateOutlined,
    PartitionOutlined,
    ToolOutlined,
    FileTextOutlined,
    SyncOutlined
} from "@ant-design/icons";
import type { CommandMode } from "../hooks/useContextAssembler";

interface PromptInterfaceProps {
    prompt: string;
    onPromptChange: (value: string) => void;
    onGenerate: () => void;
    onCopyPayload: () => void;
    onCancel: () => void;
    onSync: () => void; 
    loading: boolean;
    contextLoading?: boolean;
    isSyncing?: boolean;
    isStale: boolean; 
    error: string | null;
    isStudioMode?: boolean;
    commandMode?: CommandMode;
    aiContext?: any[]; 
}

const { TextArea } = Input;
const { Text } = Typography;

const QUICK_STARTS = [
    "Create a signup form with email, password, and terms.",
    "Build an approval review form with comments.",
    "Create a detailed profile editor with avatar upload."
];

export const PromptInterface: React.FC<PromptInterfaceProps> = ({
    prompt,
    onPromptChange,
    onGenerate,
    onCopyPayload,
    onCancel,
    onSync,
    loading,
    contextLoading = false,
    isSyncing = false,
    isStale,
    error,
    isStudioMode,
    commandMode = 'WIZARD',
    aiContext = []
}) => {
    const { token } = theme.useToken();

    const getActionMeta = () => {
        if (loading) return { label: "Processing...", icon: <Spin size="small" /> };
        
        switch (commandMode) {
            case 'FREE_CHAT': return { label: "Send Request", icon: <SendOutlined /> };
            case 'JOB': return { label: "Configure Worker", icon: <ThunderboltFilled /> };
            case 'GOVERNANCE': return { label: "Draft Policy", icon: <ThunderboltFilled /> };
            default: return { label: "Generate Schema", icon: <ThunderboltFilled /> };
        }
    };

    const action = getActionMeta();

    const renderContextChip = (item: any, idx: number) => {
        let icon = <FileTextOutlined />;
        let color = "default";
        let label = "Unknown";
        
        switch (item.kind) {
            case 'DATABASE_SCHEMA': // ⚡ FIX: Added Handler for Schema Object
                icon = <DatabaseOutlined />;
                color = "geekblue"; 
                label = `Schema: ${item.domain} (${item.field_count} fields)`;
                break;
            case 'DATABASE_FIELD': // Keep legacy support just in case
                icon = <DatabaseOutlined />;
                color = "green"; 
                label = `Field: ${item.path}`;
                break;
            case 'GOVERNANCE_MANIFEST':
            case 'GOVERNANCE_GROUP':
                icon = <SafetyCertificateOutlined />;
                color = "gold"; 
                label = `Policy: ${item.name || item.key}`;
                break;
            case 'REFERENCE_WORKFLOW':
                icon = <PartitionOutlined />;
                color = "purple"; 
                label = `Flow: ${item.name}`;
                break;
            case 'UI_COMPONENT':
                icon = <ToolOutlined />;
                color = "blue"; 
                label = `Widget: ${item.key}`;
                break;
            case 'CURRENT_DRAFT':
                icon = <FileTextOutlined />;
                color = "cyan"; 
                label = "Current Draft State";
                break;
            case 'SYSTEM_INSTRUCTION':
                return null;
        }

        return (
            <Tooltip key={idx} title={JSON.stringify(item, null, 2)} mouseEnterDelay={0.5}>
                <Tag 
                    icon={icon} 
                    color={color} 
                    style={{ 
                        margin: 0, 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 8px',
                        border: `1px solid ${token.colorBorderSecondary}`,
                        background: token.colorBgContainer 
                    }}
                >
                    {label}
                </Tag>
            </Tooltip>
        );
    };

    const isLoading = contextLoading || isSyncing;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Alert 
                message={commandMode === 'FREE_CHAT' ? "Cortex Chat" : "AI Architect Mode"}
                description="Describe your intent. The Cortex will select the best widgets based on your Governance constraints."
                type="info" 
                showIcon 
                icon={<RobotOutlined />}
                style={{ marginBottom: 16 }}
            />
            
            <div style={{ 
                marginBottom: 12, 
                padding: 12, 
                background: isStale ? token.colorWarningBg : token.colorFillAlter, 
                borderRadius: 8, 
                border: isStale ? `1px dashed ${token.colorWarning}` : `1px dashed ${token.colorBorder}`,
                maxHeight: 120,
                overflowY: 'auto',
                position: 'relative',
                transition: 'all 0.3s'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Space>
                        <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>
                            Active Context Payload ({aiContext.length - 1 > 0 ? aiContext.length - 1 : 0} items)
                        </Text>
                        {isStale && !isLoading && (
                            <Badge status="warning" text={<Text type="warning" style={{ fontSize: 11 }}>Unsynced Changes</Text>} />
                        )}
                    </Space>

                    <Space>
                        {isLoading && (
                            <Tag icon={<SyncOutlined spin />} color="processing" style={{ border: 0, margin: 0 }}>
                                {contextLoading ? "Fetching..." : "Building..."}
                            </Tag>
                        )}
                        <Button 
                            size="small" 
                            type={isStale ? "primary" : "default"} 
                            icon={<SyncOutlined spin={isSyncing} />} 
                            onClick={onSync}
                            disabled={isLoading}
                            style={{ fontSize: 11 }}
                        >
                            Sync Payload
                        </Button>
                    </Space>
                </div>
                
                <div style={{ opacity: isStale ? 0.5 : 1, filter: isStale ? 'grayscale(100%)' : 'none', transition: 'all 0.3s' }}>
                    {isLoading && aiContext.length <= 1 ? (
                        <Space>
                            <Skeleton.Button active size="small" style={{ width: 120 }} />
                            <Skeleton.Button active size="small" style={{ width: 100 }} />
                        </Space>
                    ) : (
                        <>
                            {aiContext.length <= 1 ? ( 
                                <Text type="secondary" style={{ fontSize: 12, fontStyle: 'italic' }}>
                                    Select items from the left, then click 'Sync Payload'...
                                </Text>
                            ) : (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {aiContext.map(renderContextChip)}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <TextArea 
                value={prompt}
                onChange={(e) => onPromptChange(e.target.value)}
                placeholder="e.g. Create a secure registration form..."
                autoSize={isStudioMode ? false : { minRows: 4, maxRows: 8 }}
                style={{ 
                    flex: 1, 
                    resize: 'none', 
                    fontSize: 16, 
                    padding: 16, 
                    marginBottom: 16,
                    backgroundColor: isStudioMode ? token.colorFillAlter : undefined,
                    color: token.colorText,
                    border: `1px solid ${token.colorBorder}`
                }}
            />

            {!isStudioMode && commandMode === 'WIZARD' && (
                <div style={{ marginBottom: 16 }}>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>Quick Starts:</Text>
                    <Space wrap>
                        {QUICK_STARTS.map(qs => (
                            <Tag 
                                key={qs} 
                                style={{ cursor: 'pointer' }} 
                                onClick={() => onPromptChange(qs)}
                            >
                                {qs}
                            </Tag>
                        ))}
                    </Space>
                </div>
            )}

            {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16, borderTop: `1px solid ${token.colorBorderSecondary}` }}>
                <Button icon={<CopyOutlined />} onClick={onCopyPayload} disabled={isStale || !prompt.trim()}>
                    Copy Payload
                </Button>
                <Button onClick={onCancel} disabled={loading}>
                    Cancel
                </Button>
                <Button 
                    type="primary" 
                    icon={action.icon} 
                    onClick={onGenerate}
                    disabled={isStale || !prompt.trim() || loading || isLoading}
                    size="large"
                >
                    {action.label}
                </Button>
            </div>
        </div>
    );
};

