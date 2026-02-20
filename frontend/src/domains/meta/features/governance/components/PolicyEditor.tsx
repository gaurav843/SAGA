// FILEPATH: frontend/src/domains/meta/features/governance/components/PolicyEditor.tsx
// @file: Policy Editor (Enterprise Edition)
// @author: The Engineer
// @description: Advanced Policy Editor with Multi-Vector Consequence Stacks.
// @security-level: LEVEL 9 (UI Validation) */

import React, { useState, useEffect } from 'react';
import { 
    Form, Input, Button, Card, Row, Col, Select, Typography, 
    theme, Space, Divider, Switch, Tag, Tooltip, Empty 
} from 'antd';
import { 
    SaveOutlined, DeleteOutlined, SafetyCertificateOutlined, 
    ThunderboltOutlined, StopOutlined, EyeInvisibleOutlined,
    EditOutlined, HistoryOutlined, CloudUploadOutlined, FileTextOutlined,
    PlusOutlined, AppstoreOutlined, FunctionOutlined
} from '@ant-design/icons';

import { useGovernance } from '../hooks/useGovernance';
import { type PolicyDraft, type Rule, type Consequence } from '../types';
import { LogicBuilder } from './editor/LogicBuilder';
import { TestPanel } from './editor/TestPanel';
import { HistoryDrawer } from './editor/HistoryDrawer';
import { RuleActionType } from '../../../types/constants';
import { logger } from '@/platform/logging/Narrator';

const { TextArea } = Input;
const { Title, Text } = Typography;

// ⚡ FULL ENTERPRISE ACTION SUITE
const ACTION_OPTIONS = [
    { 
        label: 'Integrity (Gatekeepers)', 
        options: [
            { value: RuleActionType.BLOCK, label: 'Block Transaction', icon: <StopOutlined style={{ color: '#ff4d4f' }} />, desc: 'Stops the save completely.' },
            { value: RuleActionType.WARN, label: 'Warning Toast', icon: <SafetyCertificateOutlined style={{ color: '#faad14' }} />, desc: 'Shows a warning but allows save.' },
            { value: RuleActionType.REQUIRE, label: 'Mark Required', icon: <EditOutlined />, desc: 'Field becomes mandatory.' }
        ]
    },
    { 
        label: 'Interface (Shapeshifters)', 
        options: [
            { value: RuleActionType.HIDE, label: 'Hide Field', icon: <EyeInvisibleOutlined />, desc: 'Removes field from the form.' },
            { value: RuleActionType.SHOW, label: 'Show Field', icon: <AppstoreOutlined />, desc: 'Reveals a hidden field.' },
            { value: RuleActionType.DISABLE, label: 'Disable Input', icon: <StopOutlined />, desc: 'Makes field read-only.' },
            { value: RuleActionType.ENABLE, label: 'Enable Input', icon: <EditOutlined />, desc: 'Unlocks a read-only field.' }
        ]
    },
    { 
        label: 'Automation (Robots)', 
        options: [
            { value: RuleActionType.SET_VALUE, label: 'Set Value', icon: <EditOutlined style={{ color: '#1890ff' }} />, desc: 'Overwrites field value.' },
            { value: RuleActionType.TRIGGER_EVENT, label: 'Trigger Event', icon: <ThunderboltOutlined style={{ color: '#52c41a' }} />, desc: 'Fires a system webhook/event.' },
            { value: RuleActionType.CALCULATE, label: 'Calculate', icon: <FunctionOutlined />, desc: 'Applies a formula.' }
        ]
    }
];

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
  const { schemaFields, isLoading } = useGovernance(domain);

  const [localDraft, setLocalDraft] = useState<PolicyDraft>(initialDraft);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    setLocalDraft(initialDraft);
    form.setFieldsValue(initialDraft);
  }, [initialDraft.key, initialDraft.id]);

  // --- HANDLERS ---

  // ⚡ AUTO-KEY GENERATION
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newName = e.target.value;
      setLocalDraft(prev => {
          const updates: Partial<PolicyDraft> = { name: newName };
          // Only auto-generate key if it's a NEW policy (no ID) to avoid breaking existing bindings
          if (!prev.id) {
              updates.key = newName.toLowerCase()
                  .replace(/[^a-z0-9]+/g, '_') // Slugify
                  .replace(/^_+|_+$/g, '');    // Trim
          }
          return { ...prev, ...updates } as PolicyDraft;
      });
  };

  const handleLogicChange = (idx: number, val: string) => {
      const rules = [...localDraft.rules];
      if (rules[idx]) {
          rules[idx] = { ...rules[idx], logic: val };
          setLocalDraft(p => ({ ...p, rules }));
      }
  };

  // ⚡ MULTI-CONSEQUENCE MANAGEMENT
  const addConsequence = (ruleIdx: number) => {
      const rules = [...localDraft.rules];
      const newConsequence: Consequence = {
          id: `cons_${Date.now()}`,
          type: RuleActionType.BLOCK,
          params: { message: "Validation Failed" }
      };
      rules[ruleIdx].consequences = [...(rules[ruleIdx].consequences || []), newConsequence];
      setLocalDraft(p => ({ ...p, rules }));
  };

  const removeConsequence = (ruleIdx: number, consIdx: number) => {
      const rules = [...localDraft.rules];
      const cons = [...(rules[ruleIdx].consequences || [])];
      cons.splice(consIdx, 1);
      rules[ruleIdx].consequences = cons;
      setLocalDraft(p => ({ ...p, rules }));
  };

  const updateConsequence = (ruleIdx: number, consIdx: number, field: string, val: any) => {
      const rules = [...localDraft.rules];
      const cons = [...rules[ruleIdx].consequences];
      
      if (field === 'type') {
          cons[consIdx] = { ...cons[consIdx], type: val, params: {} }; // Reset params on type change
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
      const rules = localDraft.rules.filter((_, i) => i !== idx);
      setLocalDraft(p => ({ ...p, rules }));
  };

  const handleDualSave = (asActive: boolean) => {
      onSave({ ...localDraft, is_active: asActive });
  };

  const versionDisplay = localDraft.id 
    ? `v${localDraft.version_major || 1}.${(localDraft.version_minor || 0).toString().padStart(2, '0')}`
    : 'New';

  // --- RENDER HELPERS ---

  const renderTargetOptions = () => {
      const hostFields = schemaFields.filter(f => f.group === 'HOST');
      return hostFields.map(f => (
          <Select.Option key={f.key} value={f.key.replace('host.', '')}>
              {f.label}
          </Select.Option>
      ));
  };

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
                {localDraft.id && <Button icon={<HistoryOutlined />} onClick={() => setHistoryOpen(true)}>History</Button>}
                <Tooltip title="Save Draft"><Button icon={<FileTextOutlined />} loading={isSaving} onClick={() => handleDualSave(false)}>Draft</Button></Tooltip>
                <Tooltip title="Publish"><Button type="primary" icon={<CloudUploadOutlined />} loading={isSaving} onClick={() => handleDualSave(true)}>Publish</Button></Tooltip>
            </Space>
        </div>

        <Form form={form} layout="vertical">
            <Card style={{ marginBottom: 24 }}>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item label="Policy Name">
                            {/* ⚡ UPDATED: Now triggers auto-key generation */}
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
                <Row justify="space-between"><Col><Space><Text type="secondary">Status:</Text><Switch checked={localDraft.is_active} onChange={c => setLocalDraft(p => ({ ...p, is_active: c }))} /></Space></Col><Col>{onDelete && <Button danger type="text" icon={<DeleteOutlined />} onClick={onDelete}>Deactivate</Button>}</Col></Row>
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
                        schemaFields={schemaFields} 
                        domain={domain}
                        readOnly={isLoading} 
                    />
                 
                    {/* 2. THE CONSEQUENCE STACK (The "THEN") */}
                    <div style={{ background: token.colorFillAlter, padding: 12, borderRadius: '0 0 8px 8px', border: `1px solid ${token.colorBorderSecondary}`, borderTop: 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text strong style={{ fontSize: 12, color: token.colorTextSecondary }}>CONSEQUENCES (EXECUTED IN ORDER)</Text>
                            <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => addConsequence(idx)}>Add Effect</Button>
                        </div>

                        {(rule.consequences || []).length === 0 ? (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No consequences defined. This rule does nothing." style={{ margin: '8px 0' }} />
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {rule.consequences.map((cons, cIdx) => (
                                    <div key={cons.id} style={{ display: 'flex', gap: 8, alignItems: 'center', background: token.colorBgContainer, padding: 8, borderRadius: 4, border: `1px solid ${token.colorBorder}` }}>
                                        
                                        {/* TYPE SELECTOR */}
                                        <Select 
                                            value={cons.type} 
                                            style={{ width: 180 }} 
                                            onChange={v => updateConsequence(idx, cIdx, 'type', v)}
                                            options={ACTION_OPTIONS.flatMap(g => g.options)}
                                        />

                                        {/* DYNAMIC PARAMS */}
                                        <div style={{ flex: 1, display: 'flex', gap: 8 }}>
                                            {/* MESSAGE (Block/Warn) */}
                                            {[RuleActionType.BLOCK, RuleActionType.WARN, RuleActionType.REQUIRE].includes(cons.type) && (
                                                <Input 
                                                    placeholder="Message to user..." 
                                                    value={cons.params.message} 
                                                    onChange={e => updateConsequence(idx, cIdx, 'params.message', e.target.value)} 
                                                />
                                            )}

                                            {/* TARGET FIELD (Set/Hide/Disable) */}
                                            {[RuleActionType.SET_VALUE, RuleActionType.HIDE, RuleActionType.SHOW, RuleActionType.DISABLE, RuleActionType.ENABLE, RuleActionType.REQUIRE].includes(cons.type) && (
                                                <Select 
                                                    placeholder="Target Field"
                                                    style={{ minWidth: 150 }}
                                                    showSearch
                                                    value={cons.params.target_field}
                                                    onChange={v => updateConsequence(idx, cIdx, 'params.target_field', v)}
                                                >
                                                    {renderTargetOptions()}
                                                </Select>
                                            )}

                                            {/* VALUE (Set Value) */}
                                            {cons.type === RuleActionType.SET_VALUE && (
                                                <Input 
                                                    placeholder="Value" 
                                                    value={cons.params.value} 
                                                    onChange={e => updateConsequence(idx, cIdx, 'params.value', e.target.value)} 
                                                />
                                            )}

                                            {/* EVENT (Trigger) */}
                                            {cons.type === RuleActionType.TRIGGER_EVENT && (
                                                <Input 
                                                    placeholder="Event Key (e.g. USER:RISK)" 
                                                    value={cons.params.event_key} 
                                                    onChange={e => updateConsequence(idx, cIdx, 'params.event_key', e.target.value)} 
                                                />
                                            )}
                                        </div>

                                        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeConsequence(idx, cIdx)} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ))}

            <Button type="dashed" block icon={<PlusOutlined />} onClick={addRule} style={{ marginBottom: 32 }}>
                Add Governance Rule
            </Button>

            <Divider />
            <TestPanel policy={localDraft} domain={domain} />
        </Form>

        <HistoryDrawer 
            open={historyOpen}
            onClose={() => setHistoryOpen(false)}
            policyKey={localDraft.key}
            currentVersionId={localDraft.id}
            onRestore={() => { setHistoryOpen(false); window.location.reload(); }}
        />
    </div>
  );
};

