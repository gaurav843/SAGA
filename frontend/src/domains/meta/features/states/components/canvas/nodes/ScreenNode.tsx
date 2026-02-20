/* FILEPATH: frontend/src/domains/meta/features/states/components/canvas/nodes/ScreenNode.tsx */
/* @file Screen Node (Wizard Visual) */
/* @author The Engineer */
/* @description A ReactFlow node that represents a UI Screen in a Wizard.
 * FIX: 'NodeProps' is a type, must use 'import type'.
 */

import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow'; // ⚡ FIX: Added 'type'
import { Card, Typography, theme } from 'antd';
import { 
    TabletOutlined,
    FieldStringOutlined,
    CalendarOutlined,
    CheckSquareOutlined,
    NumberOutlined
} from '@ant-design/icons';

const { Text } = Typography;

const FIELD_ICONS: Record<string, React.ReactNode> = {
    'ProFormText': <FieldStringOutlined />,
    'ProFormText.Password': <FieldStringOutlined />,
    'ProFormTextArea': <FieldStringOutlined />,
    'ProFormDatePicker': <CalendarOutlined />,
    'ProFormCheckbox': <CheckSquareOutlined />,
    'ProFormDigit': <NumberOutlined />,
    'default': <FieldStringOutlined />
};

export const ScreenNode = memo(({ data, selected }: NodeProps) => {
    const { token } = theme.useToken();
    
    // Extract Metadata
    const meta = data.meta || {};
    const schema = meta.form_schema || [];
    const isFinal = data.type === 'final';

    return (
        <div style={{ position: 'relative' }}>
            {/* INPUT PORT (Top) */}
            <Handle 
                type="target" 
                position={Position.Top} 
                style={{ background: token.colorTextSecondary, width: 8, height: 8 }} 
            />

            <Card
                size="small"
                hoverable
                style={{ 
                    width: 220, 
                    borderColor: selected ? token.colorPurple : token.colorBorderSecondary,
                    borderTop: `4px solid ${isFinal ? token.colorSuccess : token.colorPurple}`,
                    boxShadow: selected ? `0 0 0 4px ${token.colorPurple}20` : token.boxShadowSmall
                }}
                bodyStyle={{ padding: '8px 12px' }}
            >
                {/* HEADER */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ 
                        width: 24, height: 24, 
                        background: token.colorPurpleBg, 
                        borderRadius: 4,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: token.colorPurple,
                        marginRight: 8
                    }}>
                        <TabletOutlined />
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <Text strong style={{ fontSize: 13, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {data.label}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 10 }}>
                            {isFinal ? 'Submission' : 'User Input'}
                        </Text>
                    </div>
                </div>

                {/* FIELDS LIST (Preview) */}
                <div style={{ background: token.colorFillAlter, borderRadius: 4, padding: '4px 8px' }}>
                    {schema.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {schema.slice(0, 4).map((field: any, idx: number) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', fontSize: 10, color: token.colorTextSecondary }}>
                                    <span style={{ marginRight: 6 }}>
                                        {FIELD_ICONS[field.component] || FIELD_ICONS['default']}
                                    </span>
                                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {field.label}
                                    </span>
                                    {field.required && <span style={{ color: token.colorError, marginLeft: 4 }}>*</span>}
                                </div>
                            ))}
                            {schema.length > 4 && (
                                <Text type="secondary" style={{ fontSize: 9, textAlign: 'center', display: 'block' }}>
                                    + {schema.length - 4} more fields
                                </Text>
                            )}
                        </div>
                    ) : (
                        <Text type="secondary" style={{ fontSize: 10, fontStyle: 'italic' }}>
                            No fields defined
                        </Text>
                    )}
                </div>

            </Card>

            {/* OUTPUT PORT (Bottom) */}
            <Handle 
                type="source" 
                position={Position.Bottom} 
                style={{ background: token.colorPurple, width: 8, height: 8 }} 
            />
        </div>
    );
});

