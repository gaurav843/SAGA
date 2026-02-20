// FILEPATH: frontend/src/platform/workflow/wizard-engine/renderers/TableRenderer.tsx
// @file: Table Renderer (Safe Icons Edition)
// @author: ansav8@gmail.com
// @description: Recursive component for rendering arrays of objects.
// ⚡ FIX: Replaced direct icon imports with IconFactory.
// ⚡ FIX: Created wrapper components for ProFormList 'Icon' props.

import React from 'react';
import { ProFormList } from '@ant-design/pro-components';
import { Card, Space, theme, Typography } from 'antd';

// ⚡ RECURSION: The Table must be able to render fields, which might be tables...
// We import the Factory directly. Circular dependency is handled by React's execution model.
import { FieldFactory } from '../FieldFactory';
import type { WizardFieldSchema, RenderContext } from '../types';
import { logger } from '../../../logging';

// ⚡ SAFE IMPORT
import { IconFactory } from '../../../ui/icons/IconFactory';

const { Text } = Typography;

interface TableRendererProps {
field: WizardFieldSchema;
context: RenderContext;
}

// ⚡ ICON WRAPPERS: ProFormList expects a Component Type for icons, not an Element
const CopyIconWrapper = (props: any) => <IconFactory icon="antd:CopyOutlined" {...props} />;
const DeleteIconWrapper = (props: any) => <IconFactory icon="antd:DeleteOutlined" {...props} />;

export const TableRenderer: React.FC<TableRendererProps> = ({ field, context }) => {
const { token } = theme.useToken();

// Safety Check: Table must have columns
if (!field.columns || field.columns.length === 0) {
    return (
        <Card size="small" style={{ border: `1px dashed ${token.colorErrorBorder}` }}>
            <Text type="danger">Configuration Error: Table '{field.name}' has no columns defined.</Text>
        </Card>
    );
}

return (
    <div style={{ 
        marginBottom: 24, 
        background: token.colorFillAlter, 
        borderRadius: 8, 
        border: `1px solid ${token.colorBorderSecondary}`,
        padding: 16 
    }}>
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconFactory icon="antd:TableOutlined" style={{ color: token.colorPrimary }} />
            <Text strong>{field.label}</Text>
            {field.tooltip && <Text type="secondary" style={{ fontSize: 12 }}>({field.tooltip})</Text>}
        </div>

        <ProFormList
            name={field.name}
            initialValue={[{}]} // Start with 1 empty row for UX
            creatorButtonProps={{
                creatorButtonText: 'Add Row',
                icon: <IconFactory icon="antd:PlusOutlined" />,
                type: 'dashed',
                style: { width: '100%' },
                onClick: () => logger.tell("USER", `➕ Added Row to table [${field.name}]`)
            }}
            copyIconProps={{
                Icon: CopyIconWrapper,
                tooltipText: 'Clone Row',
                onClick: () => logger.tell("USER", `📄 Cloned Row in table [${field.name}]`)
            }}
            deleteIconProps={{
                Icon: DeleteIconWrapper,
                tooltipText: 'Delete Row',
                onClick: () => logger.tell("USER", `🗑️ Deleted Row from table [${field.name}]`)
            }}
            itemRender={({ listDom, action }, { index }) => (
                <Card 
                    size="small"
                    bordered
                    style={{ marginBottom: 8, borderColor: token.colorBorderSecondary }}
                    styles={{ body: { padding: '12px 12px 0 12px' } }}
                    extra={action}
                    title={<Text type="secondary" style={{ fontSize: 12 }}>#{index + 1}</Text>}
                >
                    {listDom}
                </Card>
            )}
        >
            {/* ⚡ FRACTAL RECURSION: Render Columns */}
            <Space align="start" wrap size={16} style={{ width: '100%' }}>
                {field.columns.map((column) => (
                    <FieldFactory 
                        key={column.name} 
                        field={{
                            ...column,
                            // Force smaller width inside tables if not specified
                            width: column.width || 'sm' 
                        }} 
                        context={context} 
                    />
                ))}
            </Space>
        </ProFormList>
    </div>
);
};

