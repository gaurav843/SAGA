/* FILEPATH: frontend/src/domains/meta/components/RuleBuilder.tsx */
/* @file The Rule Construction Kit */
/* @author The Engineer (ansav8@gmail.com) */
/* @description A "No-Code" Wizard for defining Logic, Effects, and Triggers. */
/* MIGRATION: Swapped Material UI for Ant Design v5. */

import React, { useState, useMemo } from 'react';
import { 
  Card, 
  Input, 
  Select, 
  Button, 
  Space, 
  Tag, 
  Divider, 
  Alert,
  Form,
  Row,
  Col,
  Typography
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  SaveOutlined,
} from '@ant-design/icons';

import type { RuleDefinition } from '../../../platform/meta/types/contracts';
import { useContextSchema } from '../../../platform/meta/hooks/useContextSchema';
// 🔌 KERNEL INJECTION
import { useCapabilities } from '../../../_kernel/CapabilitiesContext';

const { TextArea } = Input;
const { Option } = Select;

// --- TYPES ---

interface RuleBuilderProps {
  domain: string;
  initialRule?: RuleDefinition;
  onSave: (rule: Partial<RuleDefinition>) => void;
  onCancel: () => void;
}

interface LogicCondition {
  id: string;
  path: string;
  operator: string;
  value: string;
}

const OPERATORS = [
  { label: 'Equals (==)', value: '==' },
  { label: 'Not Equals (!=)', value: '!=' },
  { label: 'Greater Than (>)', value: '>' },
  { label: 'Less Than (<)', value: '<' },
  { label: 'Contains', value: 'contains' },
  { label: 'Starts With', value: 'starts_with' }
];

// --- COMPONENT ---

export const RuleBuilder: React.FC<RuleBuilderProps> = ({ 
  domain, 
  initialRule, 
  onSave, 
  onCancel 
}) => {
  // 1. Context Intelligence
  const { variables } = useContextSchema(domain);
  
  // 2. Kernel Capabilities (Dynamic Introspection)
  const { actions, triggers, events } = useCapabilities();

  // 3. Form State
  const [name, setName] = useState(initialRule?.name || '');
  const [eventType, setEventType] = useState<string>(initialRule?.event_type || 'SAVE');
  const [priority, setPriority] = useState(initialRule?.priority || 10);
  const [isActive] = useState(initialRule?.is_active ?? true);

  // 4. Logic State (Simplified Builder)
  const [conditions, setConditions] = useState<LogicCondition[]>([
    { id: '1', path: '', operator: '==', value: '' }
  ]);
  const [advancedMode] = useState(false);
  const [rawLogic, setRawLogic] = useState(
    typeof initialRule?.logic === 'string' ? initialRule.logic : ''
  );

  // 5. Effect State
  const [actionType, setActionType] = useState<string>(initialRule?.effect?.type || 'BLOCK');
  const [effectTarget, setEffectTarget] = useState(initialRule?.effect?.target || '');
  const [effectMessage, setEffectMessage] = useState(initialRule?.effect?.message || '');
  const [effectValue, setEffectValue] = useState<any>(initialRule?.effect?.value || '');

  // --- HELPERS ---

  // Compile Visual Conditions to JMESPath String
  const compiledLogic = useMemo(() => {
    if (advancedMode) return rawLogic;
    
    const parts = conditions
      .filter(c => c.path && c.operator && c.value)
      .map(c => {
        const isNum = !isNaN(Number(c.value)) && c.value.trim() !== '';
        const valStr = isNum ? c.value : `'${c.value}'`;

        if (c.operator === 'contains') {
          return `contains(${c.path}, ${valStr})`;
        }
        if (c.operator === 'starts_with') {
          return `starts_with(${c.path}, ${valStr})`;
        }
        return `${c.path} ${c.operator} ${valStr}`;
      });

    return parts.join(' && ');
  }, [conditions, advancedMode, rawLogic]);

  const handleSave = () => {
    if (!name || !compiledLogic) return;

    const rule: Partial<RuleDefinition> = {
      id: initialRule?.id,
      target_domain: domain,
      name,
      event_type: eventType as any, 
      priority,
      is_active: isActive,
      logic: compiledLogic,
      effect: {
        type: actionType as any,
        target: effectTarget || undefined,
        message: effectMessage || undefined,
        value: effectValue || undefined
      }
    };

    onSave(rule);
  };

  return (
    <Card 
        title={initialRule ? 'Edit Rule' : 'New Logic Rule'}
        bordered={false}
        style={{ maxWidth: 800, margin: '0 auto' }}
        actions={[
            <Button key="cancel" onClick={onCancel}>Cancel</Button>,
            <Button 
                key="save" 
                type="primary" 
                icon={<SaveOutlined />} 
                onClick={handleSave}
                disabled={!name || !compiledLogic}
            >
                Save Rule
            </Button>
        ]}
    >
      <Form layout="vertical">
        
        {/* SECTION A: META */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Rule Name" required>
                <Input 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="e.g. Validate User Age" 
                />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Trigger">
                <Select value={eventType} onChange={setEventType}>
                    {triggers.map(t => (
                        <Option key={t.key} value={t.value}>
                            {t.label} <span style={{ opacity: 0.5, fontSize: 10 }}>({t.key})</span>
                        </Option>
                    ))}
                </Select>
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item label="Priority">
                <Input type="number" value={priority} onChange={e => setPriority(Number(e.target.value))} />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left"><Tag color="blue">IF (Conditions)</Tag></Divider>

        {/* SECTION B: LOGIC */}
        {advancedMode ? (
          <Form.Item label="JMESPath Expression" help="Advanced Mode: Write raw JMESPath.">
            <TextArea
                rows={3}
                value={rawLogic}
                onChange={e => setRawLogic(e.target.value)}
                style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }}>
            {conditions.map((cond, idx) => (
              <Row key={cond.id} gutter={8} align="middle">
                <Col span={8}>
                    <Select
                        value={cond.path}
                        onChange={val => {
                            const newConds = [...conditions];
                            newConds[idx].path = val;
                            setConditions(newConds);
                        }}
                        style={{ width: '100%' }}
                        placeholder="Variable"
                        showSearch
                    >
                        {variables.map(v => (
                            <Option key={v.path} value={v.path}>
                                {v.label} <span style={{ opacity: 0.5 }}>({v.path})</span>
                            </Option>
                        ))}
                    </Select>
                </Col>
                <Col span={6}>
                    <Select
                        value={cond.operator}
                        onChange={val => {
                            const newConds = [...conditions];
                            newConds[idx].operator = val;
                            setConditions(newConds);
                        }}
                        style={{ width: '100%' }}
                    >
                        {OPERATORS.map(op => <Option key={op.value} value={op.value}>{op.label}</Option>)}
                    </Select>
                </Col>
                <Col span={8}>
                    <Input
                        placeholder="Value"
                        value={cond.value}
                        onChange={e => {
                            const newConds = [...conditions];
                            newConds[idx].value = e.target.value;
                            setConditions(newConds);
                        }}
                    />
                </Col>
                <Col span={2}>
                    <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />} 
                        disabled={conditions.length === 1}
                        onClick={() => setConditions(conditions.filter(c => c.id !== cond.id))}
                    />
                </Col>
              </Row>
            ))}
            <Button 
                type="dashed" 
                icon={<PlusOutlined />} 
                onClick={() => setConditions([...conditions, { id: Date.now().toString(), path: '', operator: '==', value: '' }])}
            >
                Add Condition
            </Button>
          </Space>
        )}

        {/* LOGIC PREVIEW */}
        <Alert 
            message="Generated Logic" 
            description={<code style={{ fontFamily: 'monospace' }}>{compiledLogic || '(Empty)'}</code>} 
            type="info" 
            style={{ marginTop: 16 }}
        />

        <Divider orientation="left"><Tag color="orange">THEN (Consequence)</Tag></Divider>

        {/* SECTION C: ACTION */}
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Action">
                <Select value={actionType} onChange={setActionType}>
                    {actions.map(a => (
                        <Option key={a.key} value={a.value}>{a.label}</Option>
                    ))}
                </Select>
            </Form.Item>
          </Col>

          <Col span={16}>
            {/* 1. Message Actions (BLOCK, WARN) */}
            {(actionType === 'BLOCK' || actionType === 'WARN') && (
                <Form.Item label="Error Message">
                    <Input 
                        value={effectMessage} 
                        onChange={e => setEffectMessage(e.target.value)} 
                        placeholder="e.g. Value must be greater than 18."
                    />
                </Form.Item>
            )}

            {/* 2. UI Actions (SHOW, HIDE, REQUIRE) */}
            {['SHOW', 'HIDE', 'ENABLE', 'DISABLE', 'REQUIRE'].includes(actionType) && (
                <Form.Item label="Target Field">
                    <Select value={effectTarget} onChange={setEffectTarget}>
                        {variables.filter(v => v.group === 'HOST').map(v => (
                            <Option key={v.path} value={v.path.replace('host.', '')}>
                                {v.label}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>
            )}

            {/* 3. Mutation Actions (SET_VALUE) */}
            {actionType === 'SET_VALUE' && (
              <>
                <Form.Item label="Target Field">
                    <Select value={effectTarget} onChange={setEffectTarget}>
                        {variables.filter(v => v.group === 'HOST').map(v => (
                            <Option key={v.path} value={v.path.replace('host.', '')}>
                                {v.label}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item label="Value to Set">
                    <Input value={effectValue} onChange={e => setEffectValue(e.target.value)} />
                </Form.Item>
              </>
            )}

            {/* 4. Event Actions (TRIGGER_EVENT) */}
            {actionType === 'TRIGGER_EVENT' && (
              <>
                 <Form.Item label="Select System Event" help="Select a registered Signal from the Event Bus.">
                    <Select
                        value={typeof effectValue === 'object' ? effectValue.event : effectValue}
                        onChange={val => setEffectValue({ ...effectValue, event: val })}
                    >
                        {events.length > 0 ? (
                            events.map(ev => (
                                <Option key={ev.key} value={ev.key}>
                                    <strong>{ev.label}</strong> <span style={{ opacity: 0.6 }}>({ev.description || ev.key})</span>
                                </Option>
                            ))
                        ) : (
                            <Option disabled>No System Events Registered</Option>
                        )}
                    </Select>
                 </Form.Item>

                 <Form.Item label="Payload (JSON)" help="Events are queued to the System Outbox and processed asynchronously.">
                    <TextArea
                        rows={2}
                        placeholder='{ "risk": "high" }'
                    />
                 </Form.Item>
              </>
            )}

             {/* 5. Transition Actions */}
             {actionType === 'TRANSITION' && (
               <Form.Item label="Target State">
                   <Input 
                       placeholder="e.g. APPROVED"
                       value={effectValue}
                       onChange={e => setEffectValue(e.target.value)}
                   />
               </Form.Item>
             )}
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

