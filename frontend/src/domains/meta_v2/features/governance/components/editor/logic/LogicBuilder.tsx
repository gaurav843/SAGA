// FILEPATH: frontend/src/domains/meta_v2/features/governance/components/editor/logic/LogicBuilder.tsx
// @file: Logic Builder (SVO Component - V2)
// @role: 🧠 Logic Container */
// @author: The Engineer
// @description: Recursive Subject-Verb-Object Composer for Governance Rules.
// @security-level: LEVEL 9 (Functional State Safety) */
// @invariant: The AST (root) is the absolute source of truth for the Visual Mode. */
// @narrator: Traces AST mutations and compilations. */

import React, { useState, useEffect } from 'react';
import { Card, Space, Button, Input, Select, Typography, Switch } from 'antd';
import { PlusOutlined, DeleteOutlined, CodeOutlined, BuildOutlined } from '@ant-design/icons';

import { logger } from '@/platform/logging/Narrator';
import { SubjectPicker } from './SubjectPicker'; 

const { Text } = Typography;

// --- TYPES ---
interface LogicNode {
    id: string;
    type: 'GROUP' | 'RULE';
    operator?: '&&' | '||';
    children?: LogicNode[]; 
    subject?: string;
    verb?: string;
    objectType?: 'LITERAL' | 'REFERENCE';
    object?: string;
}

interface SchemaField {
    key: string;
    label: string;
    [key: string]: any;
}

interface LogicBuilderProps {
    value: string;
    onChange: (val: string) => void;
    schemaFields: SchemaField[];
    domain: string; 
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
    const [mode, setMode] = useState<'VISUAL' | 'CODE'>('VISUAL');
    const [root, setRoot] = useState<LogicNode>({ 
        id: 'root', type: 'GROUP', operator: '&&', children: [] 
    });

    // ⚡ SAFEGUARD: Switch to CODE mode if there's an existing complex value we can't visually parse yet
    useEffect(() => {
        if (value && root.children?.length === 0) {
            setMode('CODE');
        }
    }, []); // Only run on mount

    // COMPILER
    const compile = (node: LogicNode): string => {
        if (node.type === 'GROUP') {
            if (!node.children || node.children.length === 0) return "";
            const childLogic = node.children.map(compile).filter(s => s !== "");
            if (childLogic.length === 0) return "";
            if (childLogic.length === 1) return childLogic[0];
            return `(${childLogic.join(` ${node.operator} `)})`;
        } else {
            // ⚡ FIX: Gracefully ignore incomplete rules without destroying the string
            if (!node.subject || !node.verb || node.object === undefined) return "";
            
            const rhs = node.objectType === 'REFERENCE' 
                ? node.object 
                : (typeof node.object === 'number' || node.object === 'true' || node.object === 'false')
                    ? node.object
                    : `'${node.object}'`;

            if (node.verb === 'contains' || node.verb === 'starts_with') {
                return `${node.verb}(${node.subject}, ${rhs})`;
            }
            return `${node.subject} ${node.verb} ${rhs}`;
        }
    };

    // HANDLERS
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
        logger.trace("LOGIC", `AST Update Triggered [${id}]`, patch);
        
        // ⚡ FIX: Functional State Update ensures we never drop intermediate keystrokes
        setRoot(prevRoot => {
            const clone = JSON.parse(JSON.stringify(prevRoot));
            const node = findNode(clone, id);
            if (node) {
                Object.assign(node, patch);
                const code = compile(clone);
                logger.whisper("LOGIC", `Compiled AST: ${code || '<empty>'}`);
                onChange(code); // Inform parent of the new string
            }
            return clone; // Commit the AST change visually regardless of output string
        });
    };

    const addRule = (parentId: string) => {
        logger.trace("LOGIC", `Adding Node to [${parentId}]`, {});
        setRoot(prevRoot => {
            const clone = JSON.parse(JSON.stringify(prevRoot));
            const parent = findNode(clone, parentId);
            if (parent && parent.children) {
                parent.children.push({
                    id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                    type: 'RULE',
                    subject: '', // Strict string init
                    verb: '==',
                    objectType: 'LITERAL',
                    object: ''
                });
                onChange(compile(clone));
            }
            return clone;
        });
    };

    const removeNode = (parentId: string, nodeId: string) => {
        logger.trace("LOGIC", `Removing Node [${nodeId}]`, {});
        setRoot(prevRoot => {
            const clone = JSON.parse(JSON.stringify(prevRoot));
            const parent = findNode(clone, parentId);
            if (parent && parent.children) {
                parent.children = parent.children.filter((c: LogicNode) => c.id !== nodeId);
                onChange(compile(clone));
            }
            return clone;
        });
    };

    // RENDERERS
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
                        <Button size="small" type="text" icon={<PlusOutlined />} onClick={() => addRule(node.id)}>Add Rule</Button>
                    </div>
                    {node.children?.map(child => renderNode(child, node.id, depth + 1))}
                    {(!node.children || node.children.length === 0) && <Text type="secondary" style={{ fontSize: 11 }}>Empty Group</Text>}
                </Card>
            );
        } else {
            return (
                <div key={node.id} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'start' }}>
                    <div style={{ flex: 4 }}>
                        <SubjectPicker 
                            value={node.subject}
                            onChange={(val) => updateNode(node.id, { subject: val })}
                            hostFields={schemaFields}
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
                         <Space.Compact style={{ width: '100%' }}>
                             <Select 
                                style={{ width: '30%' }}
                                value={node.objectType}
                                onChange={v => updateNode(node.id, { objectType: v, object: '' })}
                                options={[
                                    { label: 'Value', value: 'LITERAL' },
                                    { label: 'Ref', value: 'REFERENCE' }
                                ]}
                             />
                             {node.objectType === 'LITERAL' ? (
                                 <Input 
                                    style={{ width: '70%' }} 
                                    value={node.object}
                                    placeholder="Value..."
                                    onChange={e => updateNode(node.id, { object: e.target.value })}
                                 />
                             ) : (
                                 <div style={{ width: '70%' }}>
                                     <SubjectPicker 
                                        value={node.object}
                                        onChange={(val) => updateNode(node.id, { object: val })}
                                        hostFields={schemaFields}
                                        currentDomain={domain}
                                     />
                                 </div>
                             )}
                         </Space.Compact>
                    </div>
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeNode(parentId, node.id)} />
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
                    readOnly={readOnly}
                />
            )}
        </div>
    );
};
