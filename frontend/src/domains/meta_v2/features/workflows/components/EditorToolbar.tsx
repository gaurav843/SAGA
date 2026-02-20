// FILEPATH: frontend/src/domains/meta_v2/features/workflows/components/EditorToolbar.tsx
// @file: Editor Toolbar
// @role: 🎨 UI Presentation */
// @author: The Engineer
// @description: The Control Deck for the Workflow Editor. Restored the Back Button for navigation.
// @security-level: LEVEL 9 (UI Safe Guards) */

import React from 'react';
import { Button, Space, Tag, Typography, theme, Popconfirm } from 'antd';
import { 
    ArrowLeftOutlined, // ⚡ RESTORED: Back Button Icon
    EditOutlined, 
    CloudUploadOutlined, 
    CodeOutlined, 
    RollbackOutlined,
    DeleteOutlined
} from '@ant-design/icons';

import { logger } from '@/platform/logging';

const { Text } = Typography;

interface EditorToolbarProps {
    workflowName: string;
    version: number | string;
    mode: 'VIEW' | 'EDIT';
    hasChanges: boolean;
    isPublishing: boolean;
    onEdit: () => void;
    onDiscard: () => void;
    onPublish: () => void;
    onViewJson: () => void;
    onBack: () => void; // ⚡ RESTORED: Back Handler
    onDelete?: () => void;
    isDeleting?: boolean;
}

/**
 * @description The top navigation bar for the workflow editor.
 */
export const EditorToolbar: React.FC<EditorToolbarProps> = ({
    workflowName,
    version,
    mode,
    hasChanges,
    isPublishing,
    onEdit,
    onDiscard,
    onPublish,
    onViewJson,
    onBack,
    onDelete,
    isDeleting = false
}) => {
    const { token } = theme.useToken();

    return (
        <div style={{
            height: 60,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            background: token.colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            flexShrink: 0,
            position: 'relative',
            zIndex: 20
        }}>
            {/* LEFT: Identity & Navigation */}
            <Space size="middle">
                {/* ⚡ RESTORED BACK BUTTON */}
                <Button 
                    icon={<ArrowLeftOutlined />} 
                    onClick={() => {
                        logger.tell("UI", "User clicked Back to return to Explorer");
                        onBack();
                    }} 
                />
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Text strong style={{ fontSize: 16 }}>{workflowName}</Text>
                    <Tag color="blue">v{version}</Tag>
                    {hasChanges && <Tag color="warning">Unsaved Draft</Tag>}
                    {mode === 'EDIT' && <Tag color="purple">EDITING</Tag>}
                </div>
            </Space>

            {/* RIGHT: Actions */}
            <Space>
                <Button 
                    icon={<CodeOutlined />} 
                    onClick={() => {
                        logger.whisper("UI", "User toggled Source JSON view");
                        onViewJson();
                    }}
                >
                    JSON
                </Button>

                {mode === 'VIEW' ? (
                    <>
                        {onDelete && (
                            <Popconfirm
                                title="Delete Workflow"
                                description="Are you sure? This cannot be undone."
                                onConfirm={() => {
                                    logger.tell("UI", "User confirmed workflow deletion");
                                    onDelete();
                                }}
                                okText="Yes, Delete"
                                okType="danger"
                                cancelText="Cancel"
                                disabled={isDeleting}
                            >
                                <Button 
                                    danger 
                                    icon={<DeleteOutlined />} 
                                    loading={isDeleting}
                                >
                                    Delete
                                </Button>
                            </Popconfirm>
                        )}
                        <Button 
                            type="primary" 
                            icon={<EditOutlined />}
                            onClick={() => {
                                logger.tell("UI", "User entered Workflow Edit Mode");
                                onEdit();
                            }}
                        >
                            Edit Workflow
                        </Button>
                    </>
                ) : (
                    <>
                        <Button 
                            icon={<RollbackOutlined />} 
                            onClick={() => {
                                logger.whisper("UI", "User discarded workflow draft");
                                onDiscard();
                            }}
                            disabled={isPublishing}
                        >
                            Discard
                        </Button>
                        <Button 
                            type="primary" 
                            icon={<CloudUploadOutlined />} 
                            onClick={() => {
                                logger.tell("UI", "User initiated workflow publish");
                                onPublish();
                            }}
                            loading={isPublishing}
                            disabled={!hasChanges}
                        >
                            Publish Version
                        </Button>
                    </>
                )}
            </Space>
        </div>
    );
};

