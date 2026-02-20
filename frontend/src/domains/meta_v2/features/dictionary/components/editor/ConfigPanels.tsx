// FILEPATH: frontend/src/domains/meta_v2/features/dictionary/components/editor/ConfigPanels.tsx
// @file: Editor Configuration Panels (V2)
// @author: The Engineer
// @description: Fractal sub-component for handling Type-Specific settings. CRASH PROOFED.
// Decoupled from V1, now uses V2 types.

// @security-level: LEVEL 9 (UI Safe) */

import React from 'react';
import { Form, Input, Select, Switch, InputNumber, Row, Col, Alert, Typography } from 'antd';
import { UnorderedListOutlined, NumberOutlined, CodeOutlined, LinkOutlined } from '@ant-design/icons';

import type { DomainSummary } from '../../../../_kernel/types';
import type { AttributeConfig } from '../../types';
import { AttributeType } from '../../types';

const { TextArea } = Input;
const { Option } = Select;
const { Text, Paragraph } = Typography;

interface ConfigPanelProps {
  type: AttributeType;
  config: AttributeConfig;
  onChange: (key: keyof AttributeConfig, value: any) => void;
  domainList: DomainSummary[];
  disabled?: boolean;
}

export const ConfigPanels: React.FC<ConfigPanelProps> = ({ type, config, onChange, domainList, disabled = false }) => {
  
  // ⚡ CRASH GUARD: Ensure we have an object to read from
  const safeConfig = config || {};

  // --- 1. NUMBER CONFIGURATION ---
  if (type === AttributeType.NUMBER) {
    return (
      <>
        <Alert 
          message="Numeric Constraints" 
          description="Define the acceptable range for this number. Leave empty for no limit." 
          type="info" 
          showIcon 
          icon={<NumberOutlined />}
          style={{ marginBottom: 16 }} 
        />
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Minimum Value" help="Lowest number allowed">
              <InputNumber 
                  style={{ width: '100%' }} 
                  value={safeConfig.min} 
                  onChange={v => onChange('min', v)} 
                  disabled={disabled} 
                  placeholder="-∞"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Maximum Value" help="Highest number allowed">
              <InputNumber 
                  style={{ width: '100%' }} 
                  value={safeConfig.max} 
                  onChange={v => onChange('max', v)} 
                  disabled={disabled} 
                  placeholder="+∞"
              />
            </Form.Item>
          </Col>
           <Col span={8}>
             <Form.Item label="Precision" help="Digits after the dot">
               <InputNumber 
                   style={{ width: '100%' }} 
                   value={safeConfig.precision} 
                   min={0} max={6} 
                   onChange={v => onChange('precision', v)} 
                   disabled={disabled} 
                   placeholder="0"
               />
             </Form.Item>
          </Col>
        </Row>
      </>
    );
  }

  // --- 2. TEXT CONFIGURATION ---
  if (type === AttributeType.TEXT) {
    return (
      <>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item label="Placeholder Text" help="Gray text shown inside the empty box.">
              <Input 
                  value={safeConfig.placeholder} 
                  onChange={e => onChange('placeholder', e.target.value)} 
                  disabled={disabled} 
                  placeholder="e.g. 'Enter your full name'"
               />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Regex Pattern (Advanced)" help="Enforce a specific format.">
              <Input 
                style={{ fontFamily: 'monospace' }} 
                value={safeConfig.regex} 
                onChange={e => onChange('regex', e.target.value)} 
                prefix="/" 
                suffix="/g" 
                disabled={disabled}
                placeholder="^[a-zA-Z]+$"
              />
            </Form.Item>
          </Col>
        </Row>
      </>
    );
  }

  // --- 3. SELECTION CONFIGURATION ---
  if ([AttributeType.SELECT, AttributeType.MULTI_SELECT].includes(type)) {
    return (
      <>
        <Alert 
          message="Defining Options" 
          description='Enter the choices as a generic list. Example: ["Draft", "Pending", "Approved"]' 
          type="info" 
          showIcon 
          icon={<UnorderedListOutlined />}
          style={{ marginBottom: 16 }} 
        />
        <Form.Item label="Options List (JSON Array)">
          <TextArea 
            rows={5}
            style={{ fontFamily: 'monospace' }}
            value={JSON.stringify(safeConfig.options || [], null, 2)}
            onChange={(e) => {
              try {
                const opts = JSON.parse(e.target.value);
                onChange('options', opts);
              } catch { /* Allow typing */ }
            }}
            disabled={disabled}
            placeholder='["Option A", "Option B", "Option C"]'
          />
        </Form.Item>
      </>
    );
  }

  // --- 4. DATE / DATETIME ---
  if ([AttributeType.DATE, AttributeType.DATETIME].includes(type)) {
    return (
      <>
        <Alert message="Validation Note" type="info" showIcon description="Date logic is handled in Governance." style={{ marginBottom: 16 }} />
        <Row gutter={16}>
            <Col span={24}>
            <Form.Item label="Display Format">
                <Select 
                    value={safeConfig.date_format} 
                    onChange={v => onChange('date_format', v)}
                    allowClear
                    placeholder="Select how the date looks..."
                    disabled={disabled}
                >
                    <Option value="YYYY-MM-DD">International (2024-12-31)</Option>
                    <Option value="DD/MM/YYYY">European (31/12/2024)</Option>
                    <Option value="MM/DD/YYYY">American (12/31/2024)</Option>
                </Select>
            </Form.Item>
            </Col>
        </Row>
      </>
    );
  }

  // --- 5. REFERENCE (COMPLEX) ---
  if (type === AttributeType.REFERENCE) {
    return (
      <>
        <Alert 
            message="Relational Link" 
            description="Creates a Foreign Key connection to another Data Domain." 
            type="success" 
            showIcon 
            style={{ marginBottom: 16 }} 
        />
        <Form.Item label="Target Domain" required help="Which 'Table' does this point to?">
        <Select 
            value={safeConfig.target_domain}
            onChange={(v) => onChange('target_domain', v)}
            placeholder="Select a Domain..."
            disabled={disabled}
        >
            {domainList.map(d => (
            <Option key={d.key} value={d.key}>
                <Space><LinkOutlined /> {d.label} ({d.key})</Space>
            </Option>
            ))}
        </Select>
        </Form.Item>
      </>
    );
  }

  // --- 6. FILE ---
  if (type === AttributeType.FILE) {
    return (
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Max Size Limit" help="In Megabytes (MB)">
            <InputNumber 
              style={{ width: '100%' }} 
              value={safeConfig.max_size_mb} 
              onChange={v => onChange('max_size_mb', v)} 
              addonAfter="MB"
              disabled={disabled}
              placeholder="10"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Allowed Extensions" help="Restrict file types">
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="Select types..."
              value={safeConfig.allowed_extensions}
              onChange={v => onChange('allowed_extensions', v)}
              disabled={disabled}
              options={[
                { value: '.pdf', label: 'PDF Document' },
                { value: '.jpg', label: 'JPG Image' },
                { value: '.png', label: 'PNG Image' },
                { value: '.csv', label: 'CSV Spreadsheet' },
                { value: '.docx', label: 'Word Document' }
              ]}
            />
          </Form.Item>
        </Col>
      </Row>
    );
  }

  // --- 7. BOOLEAN ---
  if (type === AttributeType.BOOLEAN) {
    return (
      <>
        <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 16 }}>
            Booleans are strictly True/False. Used for flags like "Is Active".
        </Paragraph>
        <Form.Item label="Default State" help="What should be selected initially?">
            <Switch 
            checked={safeConfig.default_value === true}
            onChange={(c) => onChange('default_value', c)}
            checkedChildren="True (On)"
            unCheckedChildren="False (Off)"
            disabled={disabled}
            />
        </Form.Item>
      </>
    );
  }

  // --- 8. JSON (COMPLEX) ---
  if (type === AttributeType.JSON) {
      return (
          <>
            <Alert 
                message="Developer Zone" 
                description="Stores a raw JSON object. Use for complex metadata." 
                type="warning" 
                showIcon 
                icon={<CodeOutlined />}
                style={{ marginBottom: 16 }} 
            />
            <Form.Item label="JSON Schema (Validation)" help="Optional: Paste a JSON Schema.">
                <TextArea 
                    rows={6}
                    style={{ fontFamily: 'monospace', fontSize: 12 }}
                    placeholder='{ "type": "object", "properties": { ... } }'
                    value={JSON.stringify(safeConfig.json_schema || {}, null, 2)}
                    onChange={(e) => {
                        try {
                          const schema = JSON.parse(e.target.value);
                            onChange('json_schema', schema);
                        } catch { /* Typing */ }
                    }}
                    disabled={disabled}
                />
            </Form.Item>
          </>
      );
  }

  return <Alert type="warning" message="No specific configuration available for this type." />;
};

