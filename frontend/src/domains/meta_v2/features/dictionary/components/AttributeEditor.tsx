// FILEPATH: frontend/src/domains/meta_v2/features/dictionary/components/AttributeEditor.tsx
// @file: Attribute Editor (Orchestrator - V2)
// @role: 🎨 UI Presentation / 🧠 Logic Container */
// @author: The Engineer
// @description: The Master Controller for editing Attributes.
// Decoupled from V1 MetaContext. Uses V2 Kernel.

// @security-level: LEVEL 9 (UI Safe) */

import React, { useState, useEffect } from 'react';
import { 
  Form, Input, Select, Switch, Button, Card, 
  Row, Col, Divider, Space, Typography, theme, Tag, Tooltip, Alert // ⚡ FIX: Added Alert
} from 'antd';
import { 
  SaveOutlined, DeleteOutlined, QuestionCircleOutlined,
  LockOutlined 
} from '@ant-design/icons';

// ⚡ V2 KERNEL IMPORTS
// FIX: Adjusted relative path from ../../../../ (4 levels) to ../../../ (3 levels)
import { useKernel } from '../../../_kernel/KernelContext';
import type { DomainSummary } from '../../../_kernel/types';

import { useTrace } from '@/platform/logging/useTrace';
import type { AttributeDraft, AttributeConfig } from '../types';
import { AttributeType, WidgetType, WIDGET_COMPATIBILITY, HELP_TEXT } from '../types';

import { ConfigPanels } from './editor/ConfigPanels';
import { PreviewPanel } from './editor/PreviewPanel';

const { TextArea } = Input;
const { Option } = Select;

interface AttributeEditorProps {
  draft: AttributeDraft;
  isSaving: boolean;
  onSave: (draft: AttributeDraft) => void;
  onDelete?: () => void;
  isNew: boolean;
}

export const AttributeEditor: React.FC<AttributeEditorProps> = ({
  draft: initialDraft,
  isSaving,
  onSave,
  onDelete,
  isNew
}) => {
  useTrace('AttributeEditorV2', { id: initialDraft.id, type: initialDraft.data_type });

  const { token } = theme.useToken();
  const { registry } = useKernel(); // ⚡ V2 CONTEXT REPLACEMENT
  
  const [localDraft, setLocalDraft] = useState<AttributeDraft>(initialDraft);
  
  // ⚡ SYNC: Update local state if parent selection changes
  useEffect(() => {
    setLocalDraft(initialDraft);
  }, [initialDraft.key, initialDraft.id]);

  const isLocked = localDraft.is_system && !isNew;
  const compatibleWidgets = WIDGET_COMPATIBILITY[localDraft.data_type] || [WidgetType.INPUT];

  // ⚡ LOGIC: Auto-switch widget if data type changes
  useEffect(() => {
      if (!compatibleWidgets.includes(localDraft.widget_type)) {
          updateField('widget_type', compatibleWidgets[0]);
      }
  }, [localDraft.data_type]);

  const updateField = (field: keyof AttributeDraft, value: any) => {
      if (isLocked && field !== 'label' && field !== 'description') return; // Allow cosmetic edits
      setLocalDraft(prev => ({ ...prev, [field]: value }));
  };

  // ⚡ CONTRACT FIX: Updates 'configuration', NOT 'config'
  const updateConfig = (key: keyof AttributeConfig, value: any) => {
    // We allow config updates even if locked, generally (e.g. placeholder)
    setLocalDraft(prev => ({
      ...prev,
      configuration: {
        ...(prev.configuration || {}),
        [key]: value
      }
    }));
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const label = e.target.value;
    if (isNew) {
        // ⚡ LOGIC: Auto-Slugify
        const key = label.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
        setLocalDraft(prev => ({ ...prev, label, key }));
    } else {
        updateField('label', label);
    }
  };

  return (
    <div style={{ paddingBottom: 48 }}>
        
        {/* 1. HEADER */}
        <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 24
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Typography.Title level={3} style={{ margin: 0, color: token.colorText }}>
                  {isNew ? 'New Attribute' : localDraft.label}
                </Typography.Title>
                {isLocked && <Tag icon={<LockOutlined />} color="warning">System Field</Tag>}
            </div>

            <Space>
               {onDelete && !isLocked && (
                    <Button danger icon={<DeleteOutlined />} onClick={onDelete}>Delete</Button>
                )}
                
                <Button 
                    type="primary" 
                    icon={<SaveOutlined />} 
                    loading={isSaving}
                    onClick={() => onSave(localDraft)}
                >
                    Save Changes
                </Button>
            </Space>
        </div>

        <Row gutter={24}>
            {/* 2. CONFIGURATION */}
            <Col span={14}>
                <Form layout="vertical">
                    
                    {/* A. DEFINITION */}
                    <Card title="Definition" size="small" style={{ marginBottom: 24 }}>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item label="Label" required tooltip="The human-readable name shown in forms.">
                                    <Input 
                                        value={localDraft.label} 
                                        onChange={handleLabelChange} 
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Machine Key" required tooltip="The database column name. Must be unique within the domain.">
                                    <Input 
                                        value={localDraft.key} 
                                        disabled={!isNew} // ⚡ LOCK if not new
                                        style={{ fontFamily: 'monospace' }}
                                        prefix={!isNew ? <LockOutlined style={{ color: token.colorTextQuaternary }} /> : undefined}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item label="Description">
                            <TextArea 
                                rows={2} 
                                value={localDraft.description} 
                                onChange={e => updateField('description', e.target.value)}
                                placeholder="Explain what this field is used for..."
                            />
                        </Form.Item>
                    </Card>

                    {/* B. LOGIC */}
                    <Card 
                        title={
                            <Space>
                                <span>Data Logic</span>
                                <Tooltip title={HELP_TEXT.DATA_TYPE.desc}>
                                    <QuestionCircleOutlined style={{ color: token.colorTextSecondary }} />
                                </Tooltip>
                            </Space>
                        } 
                        size="small" 
                        style={{ marginBottom: 24 }}
                    >
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item label="Data Type" help={HELP_TEXT.TYPES[localDraft.data_type as keyof typeof HELP_TEXT.TYPES]}>
                                    <Select 
                                        value={localDraft.data_type}
                                        onChange={v => updateField('data_type', v)}
                                        disabled={!isNew} // ⚡ LOCK if not new
                                    >
                                        {Object.values(AttributeType).map(t => (
                                            <Option key={t} value={t}>{t}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Interface Widget" tooltip={HELP_TEXT.WIDGET_TYPE.desc}>
                                    <Select 
                                        value={localDraft.widget_type}
                                        onChange={v => updateField('widget_type', v)}
                                    >
                                        {compatibleWidgets.map(t => (
                                            <Option key={t} value={t}>{t}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>
                        
                        <Divider orientation="left" style={{ fontSize: 12, color: token.colorTextSecondary }}>Type Configuration</Divider>
                        
                        <ConfigPanels 
                            type={localDraft.data_type}
                            config={localDraft.configuration} 
                            onChange={updateConfig}
                            domainList={registry as DomainSummary[]} 
                            disabled={false}
                        />
                    </Card>

                    {/* C. RULES */}
                    <Card title="Rules & Constraints" size="small">
                        <Row>
                            <Col span={8}>
                                <Form.Item label="Required" tooltip={HELP_TEXT.CONSTRAINTS.REQUIRED} style={{ marginBottom: 0 }}>
                                    <Switch 
                                        checked={localDraft.is_required} 
                                        onChange={c => updateField('is_required', c)} 
                                        disabled={isLocked} 
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="Unique" tooltip={HELP_TEXT.CONSTRAINTS.UNIQUE} style={{ marginBottom: 0 }}>
                                    <Switch 
                                        checked={localDraft.is_unique} 
                                        onChange={c => updateField('is_unique', c)} 
                                        disabled={isLocked} 
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item label="Active" tooltip={HELP_TEXT.CONSTRAINTS.ACTIVE} style={{ marginBottom: 0 }}>
                                    <Switch 
                                        checked={localDraft.is_active} 
                                        onChange={c => updateField('is_active', c)} 
                                        disabled={isLocked} 
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>
                </Form>
            </Col>

            {/* 3. SIMULATOR */}
            <Col span={10}>
                <div style={{ position: 'sticky', top: 88 }}>
                    <PreviewPanel draft={localDraft} />
                    
                    {isLocked && (
                        <Alert 
                            message="System Field" 
                            description={HELP_TEXT.SYSTEM_LOCKED} 
                            type="warning" 
                            showIcon 
                            style={{ marginTop: 16 }} 
                        />
                    )}
                </div>
            </Col>
        </Row>
    </div>
  );
};

