// FILEPATH: frontend/src/platform/workflow/wizard-engine/renderers/GroupRenderer.tsx
// @file: Group Renderer (Recursive Layout Engine - Tabbed)
// @author: ansav8@gmail.com
// @security-level: LEVEL 9 (Infinite Recursion Safe)
// @invariant: Must render children via FieldFactory to maintain Logic capabilities.
// @narrator: Logs layout structure.
// @description: Renders ProFormGroup, ProCard (Section), or ProCard (Tabs).

import React, { useState } from 'react';
import { ProFormGroup, ProCard } from '@ant-design/pro-components';
import { Card, Typography, theme } from 'antd';

import { FieldFactory } from '../FieldFactory'; // ⚡ RECURSION
import type { WizardFieldSchema, RenderContext } from '../types';
import { logger } from '../../../logging';
import { IconFactory } from '../../../ui/icons/IconFactory';

const { Text } = Typography;

interface GroupRendererProps {
    field: WizardFieldSchema;
    context: RenderContext;
}

export const GroupRenderer: React.FC<GroupRendererProps> = ({ field, context }) => {
    const { token } = theme.useToken();
    // Default to first tab or a generic key if empty
    const [activeTab, setActiveTab] = useState<string>(field.columns?.[0]?.name || 'tab1');

    // 1. Validate Structure
    if (!field.columns || field.columns.length === 0) {
        logger.warn("LAYOUT", `⚠️ Group [${field.name}] has no columns/children.`);
        return null;
    }

    // 2. Resolve Children (Recursive Render Helper)
    const renderChildren = (children: WizardFieldSchema[]) => (
        <>
            {children.map((childField, idx) => (
                <FieldFactory 
                    key={childField.name || `${field.name}_child_${idx}`}
                    field={{
                        ...childField,
                        // Inherit disabled state if parent is disabled
                        disabled: field.disabled || childField.disabled
                    }}
                    context={context}
                />
            ))}
        </>
    );

    // 3. LAYOUT MODE: TABS
    if (field.component === 'TABS') {
        return (
            <ProCard
                tabs={{
                    type: 'card',
                    activeKey: activeTab,
                    onChange: (key) => {
                        setActiveTab(key);
                        logger.trace("LAYOUT", `📂 Tab Switched: [${key}]`);
                    },
                    tabBarGutter: 16,
                    cardProps: { bodyStyle: { padding: '24px 0 0 0' } }
                }}
                style={{ 
                    marginBottom: 24, 
                    border: `1px solid ${token.colorBorderSecondary}`,
                    borderRadius: token.borderRadiusLG
                }}
                ghost={false} // Force background
            >
                {field.columns.map((childField) => (
                    <ProCard.TabPane 
                        key={childField.name} 
                        tab={
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {childField.fieldProps?.icon && <IconFactory icon={childField.fieldProps.icon} />}
                                {childField.label}
                            </span>
                        }
                    >
                        {/* ⚡ FRACTAL RECURSION: 
                           The content of the tab is itself a Field (usually a GROUP or SMART_GRID).
                           We delegate back to FieldFactory to render it.
                        */}
                        <FieldFactory field={childField} context={context} />
                    </ProCard.TabPane>
                ))}
            </ProCard>
        );
    }

    // 4. LAYOUT MODE: SECTION (Card)
    // If it has a label but no specific component type (or explicitly SECTION), treat as a Section
    const isSection = field.component === 'SECTION' || (field.component === 'GROUP' && field.label);

    if (isSection) {
        return (
            <Card 
                size="small" 
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {field.fieldProps?.icon && <IconFactory icon={field.fieldProps.icon} />}
                        <span>{field.label}</span>
                    </div>
                }
                bordered={false}
                style={{ 
                    marginBottom: 24, 
                    background: token.colorFillQuaternary,
                    border: `1px solid ${token.colorBorderSecondary}`
                }}
                styles={{ body: { paddingTop: 20 } }}
            >
                {field.tooltip && (
                    <div style={{ marginBottom: 16 }}>
                        <Text type="secondary">{field.tooltip}</Text>
                    </div>
                )}
                {/* Sections often need a grid for their children */}
                <ProFormGroup>
                    {renderChildren(field.columns)}
                </ProFormGroup>
            </Card>
        );
    }

    // 5. LAYOUT MODE: INLINE GROUP (Default)
    // ProFormGroup (Visual grouping for alignment, usually horizontal)
    return (
        <ProFormGroup 
            title={field.label} // Optional title
            collapsible={!!field.fieldProps?.collapsible}
            tooltip={field.tooltip}
            direction={field.fieldProps?.direction || 'horizontal'}
        >
            {renderChildren(field.columns)}
        </ProFormGroup>
    );
};

