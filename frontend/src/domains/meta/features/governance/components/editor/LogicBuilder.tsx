// FILEPATH: frontend/src/domains/meta/features/governance/components/editor/LogicBuilder.tsx
// @file: Logic Builder (SVO Edition)
// @author: The Engineer
// @description: Recursive Subject-Verb-Object Composer for Governance Rules.

import React, { useState, useEffect } from 'react';
import { Card, Space, Button, Input, Select, Typography, Switch, Tag, Divider, Row, Col } from 'antd';
import { 
    PlusOutlined, DeleteOutlined, CodeOutlined, 
    AppstoreOutlined, BuildOutlined, LinkOutlined 
} from '@ant-design/icons';

import { logger } from '@/platform/logging/Narrator';
import { type SchemaField } from '@/domains/meta/features/governance/types';
import { SubjectPicker } from './logic/SubjectPicker';

const { Text } = Typography;

// --- TYPES ---
interface LogicNode {
    id: string;
    type: 'GROUP' | 'RULE';
    operator?: '&&' | '||'; // For Groups
    children?: LogicNode[]; // For Groups
    
    // For Rules (SVO)
    subject?: string;
    verb?: string;
    objectType?: 'LITERAL' | 'REFERENCE';
    object?: string;
}

interface LogicBuilderProps {
    value: string; // JMESPath String
    onChange: (val: string) => void;
    schemaFields: SchemaField[]; // Hydrated Host + Context
    domain: string; // Current Domain Key
    readOnly?: boolean;
}

const OPERATORS = [
    { label: 'Equals', value: '==' },
    { label: 'Not Equal', value: '!=' },
    { label: 'Greater Than', value: '>' },
    { label: 'Less Than', value: '<' },
    { label: 'Contains', value: 'contains' },
    { label: 'Starts With', value: 'starts_with' },
];

export const LogicBuilder: React.FC<LogicBuilderProps> = ({ 
    value, onChange, schemaFields, domain, readOnly 
}) => {
    // 1. STATE
    const [mode, setMode] = useState<'VISUAL' | 'CODE'>('VISUAL');
    const [root, setRoot] = useState<LogicNode>({ 
        id: 'root', type: 'GROUP', operator: '&&', children: [] 
    });

    // 2. PARSER (Simulated for this iteration - usually requires AST)
    // We default to Code Mode if we detect complex logic we can't parse yet.
    useEffect(() => {
        if (!value) return;
        // Simple heuristic: If it looks like a flat tree, try to load it. 
        // For Level 100 SVO, we assume new rules start empty or simple.
        // If complex, we stay in code mode.
        if (value.includes('(') || value.includes('|')) {
            setMode('CODE');
        }
    }, []);

    // 3. COMPILER (Tree -> JMESPath)
    const compile = (node: LogicNode): string => {
        if (node.type === 'GROUP') {
            if (!node.children || node.children.length === 0) return "";
            
            const childLogic = node.children
                .map(compile)
                .filter(s => s !== "");
            
            if (childLogic.length === 0) return "";
            if (childLogic.length === 1) return childLogic[0];
            
            return `(${childLogic.join(` ${node.operator} `)})`;
        } else {
            // RULE
            if (!node.subject || !node.verb || node.object === undefined) return "";
            
            const rhs = node.objectType === 'REFERENCE' 
                ? node.object // Use key directly
                : (typeof node.object === 'number' || node.object === 'true' || node.object === 'false')
                    ? node.object
                    : `'${node.object}'`;

            if (node.verb === 'contains' || node.verb === 'starts_with') {
                return `${node.verb}(${node.subject}, ${rhs})`;
            }
            return `${node.subject} ${node.verb} ${rhs}`;
        }
    };

    // 4. HANDLERS
    const handleTreeChange = (newRoot: LogicNode) => {
        setRoot(newRoot);
        const code = compile(newRoot);
        onChange(code);
    };

    const addRule = (parentId: string) => {
        // Find parent and push child
        const clone = JSON.parse(JSON.stringify(root));
        const parent = findNode(clone, parentId);
        if (parent && parent.children) {
            parent.children.push({
                id: `node_${Date.now()}`,
                type: 'RULE',
                subject: '',
                verb: '==',
                objectType: 'LITERAL',
                object: ''
            });
            handleTreeChange(clone);
        }
    };

    const findNode = (node: LogicNode, id: string): LogicNode | null => {
        if (node.id === id) return node;
        if (node.children) {
            for (const child of node.children) {
                const found = findNode(child, id);
                if (found) return found;
            }
        }
        return null;
    };

    const updateNode = (id: string, patch: Partial<LogicNode>) => {
        const clone = JSON.parse(JSON.stringify(root));
        const node = findNode(clone, id);
        if (node) {
            Object.assign(node, patch);
            handleTreeChange(clone);
        }
    };
    
    const removeNode = (parentId: string, nodeId: string) => {
        const clone = JSON.parse(JSON.stringify(root));
        const parent = findNode(clone, parentId);
        if (parent && parent.children) {
            parent.children = parent.children.filter((c: LogicNode) => c.id !== nodeId);
            handleTreeChange(clone);
        }
    };

    // --- RENDERERS ---

    const renderNode = (node: LogicNode, parentId: string, depth: number) => {
        if (node.type === 'GROUP') {
            return (
                <Card 
                    key={node.id} 
                    size="small" 
                    style={{ 
                        marginBottom: 8, 
                        borderLeft: `4px solid ${node.operator === '&&' ? '#1890ff' : '#eb2f96'}`,
                        marginLeft: depth * 16
                    }}
                    styles={{ body: { padding: '8px 12px' } }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Space>
                            <Switch 
                                checkedChildren="AND" 
                                unCheckedChildren="OR" 
                                checked={node.operator === '&&'}
                                onChange={v => updateNode(node.id, { operator: v ? '&&' : '||' })}
                            />
                            <Text strong style={{ fontSize: 12 }}>Logic Group</Text>
                        </Space>
                        <Space>
                            <Button size="small" type="text" icon={<PlusOutlined />} onClick={() => addRule(node.id)}>Add Rule</Button>
                        </Space>
                    </div>
                    {node.children?.map(child => renderNode(child, node.id, depth + 1))}
                    {(!node.children || node.children.length === 0) && <Text type="secondary" style={{ fontSize: 11 }}>Empty Group</Text>}
                </Card>
            );
        } else {
            // RULE (Leaf)
            return (
                <div key={node.id} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'start' }}>
                    <div style={{ flex: 4 }}>
                        <SubjectPicker 
                            value={node.subject}
                            onChange={(val) => updateNode(node.id, { subject: val })}
                            hostFields={schemaFields.filter(f => f.group === 'HOST')}
                            contextFields={schemaFields.filter(f => f.group !== 'HOST')}
                            currentDomain={domain}
                        />
                    </div>
                    
                    <div style={{ flex: 2 }}>
                        <Select 
                            style={{ width: '100%' }} 
                            options={OPERATORS} 
                            value={node.verb}
                            onChange={v => updateNode(node.id, { verb: v })}
                        />
                    </div>

                    <div style={{ flex: 4, display: 'flex' }}>
                         <Input.Group compact>
                             <Select 
                                style={{ width: '30%' }}
                                value={node.objectType}
                                onChange={v => updateNode(node.id, { objectType: v })}
                                options={[
                                    { label: 'Value', value: 'LITERAL' },
                                    { label: 'Ref', value: 'REFERENCE' }
                                ]}
                             />
                             {node.objectType === 'LITERAL' ? (
                                 <Input 
                                    style={{ width: '70%' }} 
                                    value={node.object}
                                    onChange={e => updateNode(node.id, { object: e.target.value })}
                                 />
                             ) : (
                                 <div style={{ width: '70%' }}>
                                     {/* Reuse SubjectPicker for RHS Reference! */}
                                     <SubjectPicker 
                                        value={node.object}
                                        onChange={(val) => updateNode(node.id, { object: val })}
                                        hostFields={schemaFields.filter(f => f.group === 'HOST')}
                                        contextFields={schemaFields.filter(f => f.group !== 'HOST')}
                                        currentDomain={domain}
                                    />
                                 </div>
                             )}
                         </Input.Group>
                    </div>

                    <Button 
                        type="text" danger icon={<DeleteOutlined />} 
                        onClick={() => removeNode(parentId, node.id)} 
                    />
                </div>
            );
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                <Switch 
                    checkedChildren={<CodeOutlined />}
                    unCheckedChildren={<BuildOutlined />}
                    checked={mode === 'CODE'}
                    onChange={v => setMode(v ? 'CODE' : 'VISUAL')}
                />
            </div>

            {mode === 'VISUAL' ? (
                <div style={{ padding: 8, background: '#141414', borderRadius: 8 }}>
                    {renderNode(root, '', 0)}
                </div>
            ) : (
                <Input.TextArea 
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    rows={6}
                    style={{ fontFamily: 'monospace', color: '#a0d911', background: '#000' }}
                />
            )}
        </div>
    );
};
