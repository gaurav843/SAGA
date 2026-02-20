// FILEPATH: frontend/src/platform/workflow/WorkflowActions.tsx
// @file: Workflow Action Bar (Dumb UI Pattern)
// @role 🎨 UI Presentation */
// @author: The Engineer
// @description: Renders state transition buttons using Backend-provided metadata and Governance rules.
// @security-level: LEVEL 9 (UI Safe) */
// @invariant: Disabled state must be strictly bound to 'allowed' flag. */
// @narrator: Traces user interactions with transition buttons. */

import React from 'react';
import { Button, Space, theme, Tooltip } from 'antd';
import { IconFactory } from '../ui/icons/IconFactory';
import { useWorkflow } from './useWorkflow';
import { logger } from '../logging';

interface WorkflowActionsProps {
    domain: string;
    entityId: string | number;
    currentState: string;
    scope?: string; // ⚡ DYNAMIC SCOPE SUPPORT
}

export const WorkflowActions: React.FC<WorkflowActionsProps> = ({ domain, entityId, currentState, scope = 'LIFECYCLE' }) => {
    const { token } = theme.useToken();
    const { availableActions, send, isTransitioning, isLoading } = useWorkflow(domain, entityId, currentState, scope);

    if (!isLoading && availableActions.length === 0) {
        logger.whisper("UI", `No workflow actions available for ${domain}:${entityId}`);
        return null;
    }

    const handleActionClick = (actionName: string) => {
        logger.trace("UI", `Transition button clicked`, { action: actionName, domain, entityId });
        send(actionName);
    };

    return (
        <div style={{ 
            padding: '12px 16px', 
            background: token.colorFillAlter, 
            borderTop: `1px solid ${token.colorSplit}`,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 12
        }}>
            <span style={{ fontSize: 12, color: token.colorTextSecondary }}>
                Current Status: <strong>{currentState}</strong>
            </span>
            <Space>
                {availableActions.map(action => {
                    // 1. Backend-Driven Metadata (No more guessing by string names)
                    const iconNode = action.ui_config?.icon ? <IconFactory icon={action.ui_config.icon} /> : undefined;
                    
                    // 2. The "Dumb UI" Base Component
                    const button = (
                        <Button 
                            key={action.name}
                            icon={iconNode}
                            type={action.ui_config?.type || 'default'}
                            danger={action.ui_config?.danger || false}
                            loading={isTransitioning}
                            disabled={!action.allowed} // ⚡ GOVERNANCE LOCK
                            onClick={() => handleActionClick(action.name)}
                        >
                            {action.name}
                        </Button>
                    );

                    // 3. ⚡ UX UPGRADE: Explain WHY it's blocked instead of hiding it
                    if (!action.allowed && action.reason) {
                        return (
                            <Tooltip key={action.name} title={action.reason} color="red">
                                <span>{button}</span>
                            </Tooltip>
                        );
                    }

                    return button;
                })}
            </Space>
        </div>
    );
};
