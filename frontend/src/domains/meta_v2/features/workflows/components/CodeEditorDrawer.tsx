// FILEPATH: frontend/src/domains/meta_v2/features/workflows/components/CodeEditorDrawer.tsx
// @file: JSON Code Editor (Workflow Source)
// @role: 🛠️ Diagnostic Tool / 🧠 Logic Container */
// @author: The Engineer
// @description: Raw XState JSON Editor with syntax validation and live graph sync.
// @security-level: LEVEL 9 */

import React, { useEffect, useState } from 'react';
import { Drawer, Button, Input, Space, Typography, theme, Alert, message, Tag } from 'antd';
import { 
    CodeOutlined, 
    FormatPainterOutlined, 
    CheckOutlined, 
    CopyOutlined,
    LockOutlined
} from '@ant-design/icons';

import { logger } from '@/platform/logging';

const { Text } = Typography;

interface CodeEditorDrawerProps {
    open: boolean;
    onClose: () => void;
    definition: any;
    onApply: (newDef: any) => void;
    readOnly?: boolean;
}

/**
 * @description The low-level interface for direct XState manipulation.
 */
export const CodeEditorDrawer: React.FC<CodeEditorDrawerProps> = ({ 
    open, onClose, definition, onApply, readOnly 
}) => {
    const { token } = theme.useToken();
    const [jsonString, setJsonString] = useState('');
    const [error, setError] = useState<string | null>(null);

    // ⚡ SIGNAL TELEMETRY: Source Sync
    useEffect(() => {
        if (open && definition) {
            logger.whisper("INSPECTOR", "Synchronizing editor with current graph state");
            setJsonString(JSON.stringify(definition, null, 2));
            setError(null);
        }
    }, [open, definition]);

    const handleFormat = () => {
        try {
            const parsed = JSON.parse(jsonString);
            setJsonString(JSON.stringify(parsed, null, 2));
            setError(null);
            logger.trace("UI", "JSON source prettified successfully");
        } catch (e: any) {
            setError(e.message);
            logger.scream("VALIDATOR", "JSON Format Error", e);
        }
    };

    const handleApply = () => {
        if (readOnly) return;
        try {
            const parsed = JSON.parse(jsonString);
            // Basic Schema Check
            if (!parsed.states || !parsed.initial) {
                throw new Error("Invalid XState: Must contain 'states' and 'initial' properties.");
            }
            logger.tell("WORKFLOWS", "⚙️ Applying direct source modification to graph");
            onApply(parsed);
            message.success('Graph Updated from Code');
            onClose();
        } catch (e: any) {
            setError(e.message);
            logger.scream("VALIDATOR", "Source Apply Failed", e);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(jsonString);
        message.info('JSON copied to clipboard');
        logger.whisper("UI", "Source code copied to clipboard");
    };

    return (
        <Drawer
            title={
                <Space>
                    <CodeOutlined style={{ color: token.colorWarning }} />
                    <span>Source Definition</span>
                    {readOnly && <Tag icon={<LockOutlined />} color="warning">Read Only</Tag>}
                </Space>
            }
            width={600}
            onClose={onClose}
            open={open}
            extra={
                <Space>
                    <Button icon={<CopyOutlined />} onClick={handleCopy}>Copy</Button>
                    {!readOnly && <Button icon={<FormatPainterOutlined />} onClick={handleFormat}>Format</Button>}
                    <Button 
                        type="primary" 
                        icon={<CheckOutlined />} 
                        onClick={handleApply}
                        disabled={readOnly}
                    >
                        Apply
                    </Button>
                </Space>
            }
            styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column' } }}
        >
            {error && <Alert message="Syntax Error" description={error} type="error" banner showIcon />}
            {readOnly && (
                <Alert 
                    message="View Only Mode" 
                    description="Enter 'Edit Workflow' mode to modify the source JSON." 
                    type="info" banner showIcon 
                />
            )}

            <Input.TextArea 
                value={jsonString}
                onChange={(e) => {
                    setJsonString(e.target.value);
                    setError(null);
                }}
                disabled={readOnly}
                style={{ 
                    flex: 1, 
                    resize: 'none', 
                    border: 'none', 
                    fontFamily: 'monospace',
                    fontSize: 13,
                    padding: 24,
                    background: readOnly ? token.colorFillQuaternary : token.colorFillAlter,
                    color: token.colorText,
                    outline: 'none',
                    cursor: readOnly ? 'text' : 'auto'
                }}
                spellCheck={false}
                placeholder="{ ... Paste XState JSON here ... }"
            />
        </Drawer> /* ⚡ FIX: Correctly closed the Drawer component */
    );
};

