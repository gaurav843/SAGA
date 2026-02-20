/* FILEPATH: frontend/src/domains/meta/features/states/components/CodeEditorDrawer.tsx */
/* @file JSON Code Editor */
/* @author The Engineer */
/* @description Raw XState JSON Editor.
 * FEATURES:
 * - Syntax Validation (JSON.parse check).
 * - "Prettify" Button.
 * - Live Synchronization with the Graph.
 * UPDATED: Added 'readOnly' prop to lock the editor when not in Edit Mode.
 */

import React, { useEffect, useState } from 'react';
import { Drawer, Button, Input, Space, Typography, theme, Alert, message, Tag } from 'antd';
import { 
    CodeOutlined, 
    FormatPainterOutlined, 
    CheckOutlined, 
    CopyOutlined,
    LockOutlined
} from '@ant-design/icons';

const { Text } = Typography;

interface CodeEditorDrawerProps {
    open: boolean;
    onClose: () => void;
    definition: any;
    onApply: (newDef: any) => void;
    readOnly?: boolean; // ⚡ FIX: Accept Lock
}

export const CodeEditorDrawer: React.FC<CodeEditorDrawerProps> = ({ 
    open, onClose, definition, onApply, readOnly 
}) => {
    const { token } = theme.useToken();
    const [jsonString, setJsonString] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Sync when opening or when definition changes externally
    useEffect(() => {
        if (open && definition) {
            setJsonString(JSON.stringify(definition, null, 2));
            setError(null);
        }
    }, [open, definition]);

    const handleFormat = () => {
        try {
            const parsed = JSON.parse(jsonString);
            setJsonString(JSON.stringify(parsed, null, 2));
            setError(null);
        } catch (e: any) {
            setError(e.message);
        }
    };

    const handleApply = () => {
        if (readOnly) return; // ⚡ SAFETY CHECK
        try {
            const parsed = JSON.parse(jsonString);
            // Basic Schema Check to prevent graph crashes
            if (!parsed.states || !parsed.initial) {
                throw new Error("Invalid XState: Must contain 'states' and 'initial' property.");
            }
            onApply(parsed);
            message.success('Graph Updated from Code');
            onClose();
        } catch (e: any) {
            setError(e.message);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(jsonString);
        message.info('JSON copied to clipboard');
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
                        disabled={readOnly} // ⚡ FIX: Disable Apply
                    >
                        Apply
                    </Button>
                </Space>
            }
            styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column' } }}
        >
            {error && (
                <Alert 
                    message="Syntax Error" 
                    description={error} 
                    type="error" 
                    banner 
                    showIcon 
                />
            )}
            
            {readOnly && (
                <Alert 
                    message="View Only Mode" 
                    description="You must enter 'Edit Workflow' mode to modify the source JSON." 
                    type="info" 
                    banner 
                    showIcon 
                />
            )}

            <Input.TextArea 
                value={jsonString}
                onChange={(e) => {
                    setJsonString(e.target.value);
                    setError(null);
                }}
                disabled={readOnly} // ⚡ FIX: Lock Input
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
            
            {!readOnly && (
                <div style={{ 
                    padding: '8px 16px', 
                    borderTop: `1px solid ${token.colorSplit}`, 
                    background: token.colorBgContainer,
                    fontSize: 12
                }}>
                    <Text type="secondary">
                        Editing this JSON will directly modify the Workflow Graph. Ensure IDs match.
                    </Text>
                </div>
            )}
        </Drawer>
    );
};

