// FILEPATH: frontend/src/domains/meta_v2/features/governance/components/editor/PolicyEditor.tsx
// @file: Policy Editor (V2 Dumb UI Edition)
// @role: 🎨 UI Presentation / 🧠 Logic Container */
// @author: The Engineer
// @description: Advanced Policy Editor utilizing isolated Fractal Components and URL state.
// @security-level: LEVEL 9 (UI Validation) */
// @narrator: Traces all rule and consequence mutations deeply. */

import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Row, Col, Typography, theme, Space, Divider, Switch, Tag, Tooltip } from 'antd';
import { DeleteOutlined, SafetyCertificateOutlined, HistoryOutlined, CloudUploadOutlined, FileTextOutlined, PlusOutlined } from '@ant-design/icons';

import { logger } from '@/platform/logging/Narrator';
import { useUrlState } from '@/platform/hooks/useUrlState';

// ⚡ V2 HOOKS & COMPONENTS (Strictly V2 Paths)
import { useGovernance } from '../../hooks/useGovernance';
import { ConsequenceStack } from './ConsequenceStack';
import { LogicBuilder } from './logic/LogicBuilder';
import { TestPanel } from './TestPanel';
import { HistoryDrawer } from './HistoryDrawer';

// Types are shared from Kernel/Meta
import type { PolicyDraft, Rule, Consequence } from '../../../../../meta/features/governance/types';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface PolicyEditorProps {
    draft: PolicyDraft;
    domain: string;
    onSave: (policy: PolicyDraft) => void;
    onDelete?: () => void;
    isSaving: boolean;
}

export const PolicyEditor: React.FC<PolicyEditorProps> = ({
    draft: initialDraft,
    domain,
    onSave,
    onDelete,
    isSaving
}) => {
    const { token } = theme.useToken();
    const [form] = Form.useForm();
    
    // ⚡ HYDRATED DATA SOURCE
    const { schemaContext, loadingSchema } = useGovernance(domain);
    const schemaFields = schemaContext?.fields || [];

    const [localDraft, setLocalDraft] = useState<PolicyDraft>(initialDraft);
    
    // ⚡ DEEP LINKING BY DEFAULT (Cures History Drawer Amnesia)
    const [historyMode, setHistoryMode] = useUrlState('history', '');

    useEffect(() => {
        setLocalDraft(initialDraft);
        form.setFieldsValue(initialDraft);
    }, [initialDraft.key, initialDraft.id, form]);

    // --- HANDLERS ---

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setLocalDraft(prev => {
            const updates: Partial<PolicyDraft> = { name: newName };
            if (!prev.id) {
                updates.key = newName.toLowerCase()
                    .replace(/[^a-z0-9]+/g, '_')
                    .replace(/^_+|_+$/g, '');
            }
            return { ...prev, ...updates } as PolicyDraft;
        });
    };

    const handleLogicChange = (idx: number, val: string) => {
        logger.trace("LOGIC", `Updating AST Logic for Rule ${idx}`, { compiledLogic: val });
        const rules = [...localDraft.rules];
        if (rules[idx]) {
            rules[idx] = { ...rules[idx], logic: val };
            setLocalDraft(p => ({ ...p, rules }));
        }
    };

    const addConsequence = (ruleIdx: number) => {
        logger.trace("LOGIC", `Adding new Consequence to Rule ${ruleIdx}`, {});
        const rules = [...localDraft.rules];
        const newConsequence: Consequence = {
            id: `cons_${Date.now()}`,
            type: 'BLOCK' as any, // Default fallback
            params: { message: "Validation Failed" }
        };
        rules[ruleIdx].consequences = [...(rules[ruleIdx].consequences || []), newConsequence];
        setLocalDraft(p => ({ ...p, rules }));
    };

    const removeConsequence = (ruleIdx: number, consIdx: number) => {
        logger.trace("LOGIC", `Removing Consequence ${consIdx} from Rule ${ruleIdx}`, {});
        const rules = [...localDraft.rules];
        const cons = [...(rules[ruleIdx].consequences || [])];
        cons.splice(consIdx, 1);
        rules[ruleIdx].consequences = cons;
        setLocalDraft(p => ({ ...p, rules }));
    };

    const updateConsequence = (ruleIdx: number, consIdx: number, field: string, val: any) => {
        logger.trace("LOGIC", `Updating Consequence [Rule ${ruleIdx}, Cons ${consIdx}]`, { field, val });
        const rules = [...localDraft.rules];
        const cons = [...rules[ruleIdx].consequences];
        
        if (field === 'type') {
            cons[consIdx] = { ...cons[consIdx], type: val, params: {} };
        } else if (field.startsWith('params.')) {
            const paramKey = field.split('.')[1];
            cons[consIdx] = { 
                ...cons[consIdx], 
                params: { ...cons[consIdx].params, [paramKey]: val } 
            };
        }
        rules[ruleIdx].consequences = cons;
        setLocalDraft(p => ({ ...p, rules }));
    };

    const addRule = () => {
        const newRule: Rule = {
            id: `rule_${Date.now()}`,
            logic: "",
            consequences: [],
            is_active: true
        };
        setLocalDraft(p => ({ ...p, rules: [...p.rules, newRule] }));
        logger.tell("UI", "➕ Added new Logic Rule block");
    };

    const deleteRule = (idx: number) => {
        logger.trace("LOGIC", `Deleted Rule ${idx}`, {});
        const rules = localDraft.rules.filter((_, i) => i !== idx);
        setLocalDraft(p => ({ ...p, rules }));
    };

    const handleDualSave = (asActive: boolean) => {
        logger.tell("UI", `💾 Saving Policy Draft (Active: ${asActive})`, { key: localDraft.key });
        onSave({ ...localDraft, is_active: asActive });
    };

    const versionDisplay = localDraft.id 
        // @ts-ignore
        ? `v${localDraft.version_major || 1}.${(localDraft.version_minor || 0).toString().padStart(2, '0')}`
        : 'New';

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 48 }}>
            {/* HEADER & METADATA CARD */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Space align="start">
                    <SafetyCertificateOutlined style={{ fontSize: 24, color: token.colorPrimary, marginTop: 4 }} />
                    <div>
                        <Space>
                            <Title level={3} style={{ margin: 0 }}>{localDraft.name || 'New Policy'}</Title>
                            {localDraft.id && (
                                <Tag color={localDraft.is_active ? "green" : "gold"}>
                                    {localDraft.is_active ? versionDisplay : `${versionDisplay} (DRAFT)`}
                                </Tag>
                            )}
                        </Space>
                        <div style={{ marginTop: 4 }}>
                            <Text type="secondary">{localDraft.key || 'System Key: <Auto-Generated>'}</Text>
                            {domain === 'GLOBAL' && <Tag color="purple" style={{ marginLeft: 8 }}>GLOBAL SCOPE</Tag>}
                        </div>
                    </div>
                </Space>
                <Space>
                    {localDraft.id && <Button icon={<HistoryOutlined />} onClick={() => setHistoryMode('open')}>History</Button>}
                    <Tooltip title="Save Draft"><Button icon={<FileTextOutlined />} loading={isSaving} onClick={() => handleDualSave(false)}>Draft</Button></Tooltip>
                    <Tooltip title="Publish"><Button type="primary" icon={<CloudUploadOutlined />} loading={isSaving} onClick={() => handleDualSave(true)}>Publish</Button></Tooltip>
                </Space>
            </div>

            <Form form={form} layout="vertical">
                <Card style={{ marginBottom: 24 }}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Policy Name">
                                <Input value={localDraft.name} onChange={handleNameChange} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="System Key">
                                <Input value={localDraft.key} disabled style={{ fontFamily: 'monospace' }} placeholder="Auto-generated..." />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item label="Description"><TextArea rows={2} value={localDraft.description} onChange={e => setLocalDraft(p => ({ ...p, description: e.target.value }))} /></Form.Item>
                    <Row justify="space-between">
                        <Col>
                            <Space>
                                <Text type="secondary">Status:</Text>
                                <Switch checked={localDraft.is_active} onChange={c => {
                                    logger.trace("UI", `Toggled policy status to ${c}`, {});
                                    setLocalDraft(p => ({ ...p, is_active: c }));
                                }} />
                            </Space>
                        </Col>
                        <Col>{onDelete && <Button danger type="text" icon={<DeleteOutlined />} onClick={() => {
                            logger.trace("UI", "Clicked Deactivate Policy", {});
                            onDelete();
                        }}>Deactivate</Button>}</Col>
                    </Row>
                </Card>

                <Divider orientation="left">Governance Rules & Verdicts</Divider>
                
                {localDraft.rules.map((rule, idx) => (
                    <div key={idx} style={{ marginBottom: 32, position: 'relative' }}>
                        <div style={{ position: 'absolute', right: 0, top: -32 }}>
                            <Button size="small" danger type="text" icon={<DeleteOutlined />} onClick={() => deleteRule(idx)}>Remove Rule</Button>
                        </div>

                        {/* 1. THE LOGIC (The "IF") */}
                        <LogicBuilder 
                            value={rule.logic} 
                            onChange={(val) => handleLogicChange(idx, val as any)} 
                            schemaFields={schemaFields as any[]} 
                            domain={domain}
                            readOnly={loadingSchema} 
                        />
                    
                        {/* 2. THE CONSEQUENCE STACK (The "THEN") */}
                        <ConsequenceStack
                            ruleIdx={idx}
                            consequences={rule.consequences}
                            schemaFields={schemaFields as any[]}
                            onAdd={addConsequence}
                            onRemove={removeConsequence}
                            onUpdate={updateConsequence}
                        />
                    </div>
                ))}

                <Button type="dashed" block icon={<PlusOutlined />} onClick={addRule} style={{ marginBottom: 32 }}>
                    Add Governance Rule
                </Button>

                <Divider />
                <TestPanel policy={localDraft} domain={domain} />
            </Form>

            <HistoryDrawer 
                open={historyMode === 'open'}
                onClose={() => setHistoryMode(null)}
                policyKey={localDraft.key}
                currentVersionId={localDraft.id}
                onRestore={() => { setHistoryMode(null); window.location.reload(); }}
            />
        </div>
    );
};
