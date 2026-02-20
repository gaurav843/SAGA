/* FILEPATH: frontend/src/domains/meta/features/states/components/inspector/jobs/JobConfigurator.tsx */
/* @file Job Configurator (The Engine) */
/* @author The Engineer */
/* @description Visual Editor for Background Job settings.
 * UPDATED (Level 7): Added 'Input Mapping' section with OSExplorer integration.
 */

import React, { useState } from 'react';
import { Card, Slider, Row, Col, Typography, theme, Radio, InputNumber, Switch, Button, Input, List, Space } from 'antd';
import { 
    FieldTimeOutlined, 
    RetweetOutlined, 
    ThunderboltOutlined,
    ApiOutlined,
    SearchOutlined,
    DeleteOutlined,
    PlusOutlined
} from '@ant-design/icons';
import { ProFormSelect } from '@ant-design/pro-components';

import { OSExplorerModal } from '../../OSExplorerModal'; // ⚡ IMPORT EXPLORER

const { Text } = Typography;

interface JobConfiguratorProps {
    domain: string;
    nodeData: any;
    onUpdate: (data: any) => void;
}

export const JobConfigurator: React.FC<JobConfiguratorProps> = ({ domain, nodeData, onUpdate }) => {
    const { token } = theme.useToken();
    const [explorerOpen, setExplorerOpen] = useState(false);
    const [activeInputKey, setActiveInputKey] = useState<string | null>(null);
    
    // Extract config safely
    const config = nodeData.meta?.job_config || {
        queue: 'default',
        retries: 3,
        backoff: 'exponential',
        timeout: 300,
        inputs: {} // ⚡ NEW: Input Mapping { "param_name": "Ref(USER.email)" }
    };

    const updateConfig = (key: string, value: any) => {
        onUpdate({
            ...nodeData,
            meta: {
                ...nodeData.meta,
                job_config: {
                    ...config,
                    [key]: value
                }
            }
        });
    };

    // ⚡ INPUT MAPPING HANDLERS
    const handleAddInput = () => {
        const newKey = `param_${Object.keys(config.inputs || {}).length + 1}`;
        updateConfig('inputs', { ...config.inputs, [newKey]: '' });
    };

    const handleDeleteInput = (key: string) => {
        const newInputs = { ...config.inputs };
        delete newInputs[key];
        updateConfig('inputs', newInputs);
    };

    const handleInputChange = (oldKey: string, newKey: string, value: string) => {
        // If renaming key
        if (oldKey !== newKey) {
            const newInputs = { ...config.inputs };
            delete newInputs[oldKey];
            newInputs[newKey] = value;
            updateConfig('inputs', newInputs);
        } else {
            // Just updating value
            updateConfig('inputs', { ...config.inputs, [newKey]: value });
        }
    };

    const handleRefSelect = (ref: string) => {
        if (activeInputKey) {
            handleInputChange(activeInputKey, activeInputKey, ref);
            setExplorerOpen(false);
            setActiveInputKey(null);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 1. EXECUTION STRATEGY */}
            <Card size="small" style={{ background: token.colorFillAlter }}>
                <ProFormSelect
                    label="Execution Queue"
                    tooltip="Determines priority and worker pool."
                    options={[
                        { label: '🔥 High Priority (Instant)', value: 'high_priority' },
                        { label: '🐢 Default (Standard)', value: 'default' },
                        { label: '📦 Batch (Overnight)', value: 'batch' },
                        { label: '📧 Mailer (Throttled)', value: 'mailer' }
                    ]}
                    fieldProps={{
                        value: config.queue,
                        onChange: (val) => updateConfig('queue', val),
                        allowClear: false
                    }}
                />
            </Card>

            {/* ⚡ 2. DATA MAPPING (THE CROSS-DOMAIN FEATURE) */}
            <div style={{ padding: 12, border: `1px solid ${token.colorBorderSecondary}`, borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <Space>
                        <ApiOutlined style={{ color: token.colorPurple }} />
                        <Text strong>Input Data</Text>
                    </Space>
                    <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={handleAddInput}>Add</Button>
                </div>

                {Object.keys(config.inputs || {}).length === 0 ? (
                    <Text type="secondary" style={{ fontSize: 11, fontStyle: 'italic', paddingLeft: 8 }}>No inputs defined.</Text>
                ) : (
                    <List
                        size="small"
                        dataSource={Object.entries(config.inputs)}
                        renderItem={([key, value]: [string, any]) => (
                            <List.Item style={{ padding: '8px 0', borderBottom: 'none' }}>
                                <Space style={{ width: '100%' }} align="center">
                                    <Input 
                                        size="small" 
                                        style={{ width: 100, fontSize: 12, fontFamily: 'monospace' }} 
                                        value={key}
                                        onChange={(e) => handleInputChange(key, e.target.value, value)}
                                    />
                                    <span style={{ color: token.colorTextQuaternary }}>=</span>
                                    <Input 
                                        size="small" 
                                        style={{ flex: 1, fontSize: 12, color: value.startsWith('Ref(') ? token.colorLink : undefined }} 
                                        value={value}
                                        placeholder="Static value or Ref..."
                                        onChange={(e) => handleInputChange(key, key, e.target.value)}
                                        addonAfter={
                                            <SearchOutlined 
                                                style={{ cursor: 'pointer', color: token.colorTextSecondary }} 
                                                onClick={() => { setActiveInputKey(key); setExplorerOpen(true); }}
                                            />
                                        }
                                    />
                                    <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteInput(key)} />
                                </Space>
                            </List.Item>
                        )}
                    />
                )}
            </div>

            {/* 3. RESILIENCE CONTROL */}
            <div style={{ padding: 12, border: `1px solid ${token.colorBorderSecondary}`, borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <RetweetOutlined style={{ color: token.colorWarning }} />
                    <Text strong>Resilience Strategy</Text>
                </div>
                
                <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 12 }}>Max Retries</Text>
                        <Text strong style={{ fontSize: 12 }}>{config.retries}</Text>
                    </div>
                    <Slider 
                        min={0} 
                        max={10} 
                        value={config.retries} 
                        onChange={(val) => updateConfig('retries', val)}
                        trackStyle={{ backgroundColor: token.colorWarning }}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 12 }}>Backoff Type</Text>
                    <Radio.Group 
                        size="small" 
                        value={config.backoff} 
                        onChange={(e) => updateConfig('backoff', e.target.value)}
                        options={[
                            { label: 'Linear', value: 'linear' },
                            { label: 'Exponential', value: 'exponential' }
                        ]}
                        optionType="button"
                    />
                </div>
            </div>

            {/* 4. TIMEOUTS */}
            <div style={{ padding: 12, border: `1px solid ${token.colorBorderSecondary}`, borderRadius: 8 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <FieldTimeOutlined style={{ color: token.colorError }} />
                    <Text strong>Constraints</Text>
                </div>
                
                <Row align="middle" gutter={16}>
                    <Col span={14}>
                        <Text style={{ fontSize: 12 }}>Hard Timeout (sec)</Text>
                        <div style={{ fontSize: 10, color: token.colorTextSecondary }}>Kill if exceeds this time</div>
                    </Col>
                    <Col span={10}>
                         <InputNumber 
                            size="small" 
                            min={1} 
                            max={3600} 
                            value={config.timeout}
                            onChange={(val) => updateConfig('timeout', val)}
                            addonAfter="s"
                         />
                    </Col>
                </Row>
            </div>

            {/* ⚡ OS EXPLORER MODAL */}
            <OSExplorerModal 
                open={explorerOpen} 
                onCancel={() => setExplorerOpen(false)} 
                onSelect={handleRefSelect} 
            />
        </div>
    );
};
