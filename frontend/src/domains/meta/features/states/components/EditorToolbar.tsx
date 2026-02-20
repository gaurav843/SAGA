// FILEPATH: frontend/src/domains/meta/features/states/components/EditorToolbar.tsx
// @file: Editor Toolbar
// @author: The Engineer
// @description: The Control Deck for the Workflow Editor.
// @security-level: LEVEL 9 (UI Safe Guards)
// @invariant: Delete button only visible in VIEW mode.
// @fix: Changed Edit icon to 'EditOutlined'. Added z-index.

import React from 'react';
import { Button, Space, Tag, Typography, theme, Popconfirm, Tooltip } from 'antd';
import { 
    EditOutlined, // ⚡ UX FIX: Correct Icon
    CloudUploadOutlined, 
    CodeOutlined, 
    RollbackOutlined,
    DeleteOutlined
} from '@ant-design/icons';

const { Text } = Typography;

interface EditorToolbarProps {
    workflowName: string;
    version: number;
    mode: 'VIEW' | 'EDIT';
    hasChanges: boolean;
    isPublishing: boolean;
    onEdit: () => void;
    onDiscard: () => void;
    onPublish: () => void;
    onViewJson: () => void;
    onDelete?: () => void;
    isDeleting?: boolean;
}

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
            zIndex: 20 // ⚡ LAYOUT FIX: Ensure above canvas
        }}>
            {/* LEFT: Identity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Text strong style={{ fontSize: 16 }}>{workflowName}</Text>
                <Tag color="blue">v{version}</Tag>
                {hasChanges && <Tag color="warning">Unsaved Draft</Tag>}
                {mode === 'EDIT' && <Tag color="purple">EDITING</Tag>}
            </div>

            {/* RIGHT: Actions */}
            <Space>
                <Button 
                    icon={<CodeOutlined />} 
                    onClick={onViewJson}
                >
                    JSON
                </Button>

                {mode === 'VIEW' ? (
                    <>
                        {onDelete && (
                            <Popconfirm
                                title="Delete Workflow"
                                description="Are you sure? This cannot be undone."
                                onConfirm={onDelete}
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
                            icon={<EditOutlined />} // ⚡ UX FIX
                            onClick={onEdit}
                        >
                            Edit Workflow
                        </Button>
                    </>
                ) : (
                    <>
                        <Button 
                            icon={<RollbackOutlined />} 
                            onClick={onDiscard}
                            disabled={isPublishing}
                        >
                            Discard
                        </Button>
                        <Button 
                            type="primary" 
                            icon={<CloudUploadOutlined />} 
                            onClick={onPublish}
                            loading={isPublishing}
                            disabled={!hasChanges}
                        >
                            Publish Version {version + 1}
                        </Button>
                    </>
                )}
            </Space>
        </div>
    );
};

