// FILEPATH: frontend/src/domains/meta_v2/components/UniversalTree.tsx
// @file: Universal Tree (The Navigator)
// @role: 🎨 UI Presentation */
// @author: The Engineer
// @description: Renders the System Hierarchy.
// @security-level: LEVEL 9 (UI Safe) */
// @updated: Injected Auto-Collapse UX on selection to maximize focus area. */

import React from 'react';
import { Tree, Empty, Typography, theme, Tooltip, Button } from 'antd';
import { useKernel } from '../_kernel/KernelContext';
import { useDomainTree, type KernelTreeNode } from './useDomainTree';
import { IconFactory } from '../../../platform/ui/icons/IconFactory'; 
import { useMetaUI } from '../_shell/MetaUIContext';
import { logger } from '../../../platform/logging'; // ⚡ NEW

import { 
    FolderOutlined,
    LockOutlined,
    DatabaseOutlined
} from '@ant-design/icons';

const { Text } = Typography;

export const UniversalTree: React.FC = () => {
    const { token } = theme.useToken();
    const { activeContext, selectContext, isLoading, registry } = useKernel();
    const { treeData } = useDomainTree(registry || []);
    
    // ⚡ CONNECT TO SHELL STATE
    const { leftSidebarCollapsed, toggleLeftSidebar } = useMetaUI();

    // 3. HANDLERS
    const handleSelect = (keys: React.Key[]) => {
        if (keys.length > 0) {
            const selectedKey = keys[0] as string;
            logger.tell('UI', `🌳 Main Tree Selection: ${selectedKey}`);
            selectContext(selectedKey);

            // ⚡ UX AUTOFOCUS: Collapse the main sidebar to maximize screen real estate
            if (!leftSidebarCollapsed) {
                logger.whisper('UI', '📐 Auto-collapsing Main Menu for focus mode');
                toggleLeftSidebar();
            }
        }
    };

    // 4. RENDERER (Custom Node)
    const renderNode = (node: KernelTreeNode) => {
        const isActive = activeContext?.key === node.key;
        
        return (
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '4px 0',
                width: '100%',
                background: 'transparent'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                    <span style={{ 
                        color: isActive ? token.colorPrimary : token.colorTextSecondary, 
                        fontSize: 16 
                    }}>
                        {/* ⚡ STRICT UI: Use Backend Icon or generic folder. No magic strings. */}
                        {node.icon ? <IconFactory icon={node.icon} /> : <FolderOutlined />}
                    </span>
                    
                    <Text 
                        ellipsis 
                        strong={isActive}
                        style={{ 
                            color: isActive ? token.colorText : token.colorText,
                            opacity: isActive ? 1 : 0.85
                        }}
                    >
                        {node.label}
                    </Text>
                </div>

                <div style={{ display: 'flex', gap: 6, paddingLeft: 8 }}>
                    {!node.capabilities.canGovern && (
                        <LockOutlined style={{ fontSize: 12, color: token.colorTextQuaternary }} />
                    )}
                    {node.capabilities.canBrowseData && (
                        <DatabaseOutlined style={{ fontSize: 12, color: token.colorTextTertiary }} />
                    )}
                </div>
            </div>
        );
    };

    if (!isLoading && treeData.length === 0) {
        return <Empty description="No Domains" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    }

    // ⚡ RESPONSIVE MODE: ICON ONLY
    if (leftSidebarCollapsed) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, paddingTop: 16 }}>
                {treeData.map((node: any) => {
                    const isActive = activeContext?.key === node.key;
                    return (
                        <Tooltip key={node.key} title={node.titleRender ? node.label : node.title} placement="right">
                            <Button 
                                type={isActive ? 'primary' : 'text'}
                                shape="circle"
                                size="large"
                                onClick={() => {
                                    handleSelect([node.key]);
                                }}
                                icon={
                                    node.icon ? (
                                        <IconFactory icon={node.icon} style={{ fontSize: 18 }} />
                                    ) : (
                                        <FolderOutlined />
                                    )
                                }
                                style={{
                                    color: isActive ? token.colorWhite : token.colorTextSecondary,
                                    background: isActive ? token.colorPrimary : 'transparent'
                                }}
                            />
                        </Tooltip>
                    );
                })}
            </div>
        );
    }

    // ⚡ FULL MODE: TREE
    return (
        <div className="universal-tree" style={{ height: '100%', overflowY: 'auto' }}>
            <Tree
                blockNode
                showIcon={false}
                selectedKeys={activeContext ? [activeContext.key] : []}
                onSelect={handleSelect}
                treeData={treeData as any[]}
                titleRender={(node: any) => renderNode(node as KernelTreeNode)}
                style={{ 
                    background: 'transparent',
                    fontFamily: token.fontFamily
                }}
            />
        </div>
    );
};

