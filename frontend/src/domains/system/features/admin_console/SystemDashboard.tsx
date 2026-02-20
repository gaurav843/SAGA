// FILEPATH: frontend/src/domains/system/features/admin_console/SystemDashboard.tsx
// @file: System Admin Console (Live Control Edition)
// @role: 🎨 UI Presentation / 🧠 Logic Container */
// @author: ansav8@gmail.com
// @description: Master Control Plane for System Administrators to toggle Modules, Circuits, and Global Settings.
// @security-level: LEVEL 9 (Admin Control) */
// @invariant: 'safety.isOn' must be strictly enforced before allowing any toggles. */
// @narrator: Logs intent and outcome for all system-level mutations. */
// @updated: Re-wired IconFactory to read from Database SSOT (module_icon) instead of hardcoded fallbacks. */

import React, { useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Row, Col, Statistic, Table, Tag, Button, Space, Switch, Tooltip, theme, Typography, Badge } from 'antd';

import { useSystemPulse } from '../../hooks/useSystemPulse';
import { useSystemControl } from '../../hooks/useSystemControl';
import { ConfigDrawer } from './ConfigDrawer';
import type { KernelDomain, KernelScope, SystemConfig } from '../../types';
import { IconFactory } from '../../../../platform/ui/icons/IconFactory';

const { Text } = Typography;

const SystemDashboard: React.FC = () => {
    const { token } = theme.useToken();
    const { pulse, isLoading: isPulseLoading, refresh: refreshPulse } = useSystemPulse();
    const { domains, screens, config, isLoading: isGovLoading, toggleFeature, updateConfig, isMutating, safety } = useSystemControl();

    const [selectedConfig, setSelectedConfig] = useState<SystemConfig | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // ⚡ UNIFIED SWITCH RENDERER
    const renderSwitches = (record: any, type: 'DOMAIN' | 'SCOPE' | 'SCREEN') => {
        let key = record.key;
        let uiActive = false;
        let apiActive = false;

        if (type === 'DOMAIN') {
            uiActive = record.config?.ui_enabled !== false;
            apiActive = record.config?.api_enabled !== false;
        } else if (type === 'SCOPE') {
            key = record._computedKey || record.key;
            
            // ⚡ FIX: Read from injected circuit_state
            // If backend hasn't injected it yet (race condition), default to True (Fail Open)
            const circuit = record.circuit_state || {};
            uiActive = circuit.ui !== 'HALTED';
            apiActive = circuit.api !== 'HALTED';
            
        } else if (type === 'SCREEN') {
            key = record.target;
            uiActive = record.status === 'NOMINAL';
            apiActive = true; 
        }

        const isCore = key === 'SYS' || (type === 'DOMAIN' && record.key === 'SYS');
        const canToggle = !safety.isOn && !isMutating && !isCore;

        return (
            <Space size="large">
                <Space>
                    <IconFactory icon="antd:DesktopOutlined" style={{ color: uiActive ? token.colorPrimary : token.colorTextDisabled }} />
                    <Switch 
                        size="small" 
                        checked={uiActive} 
                        disabled={!canToggle} 
                        onChange={(checked) => toggleFeature({ key, feature: 'ui_enabled', state: checked })} 
                    />
                    <Text style={{ fontSize: 11 }}>UI</Text>
                </Space>
                {type !== 'SCREEN' && (
                    <Space>
                        <IconFactory icon="antd:CloudOutlined" style={{ color: apiActive ? token.colorInfo : token.colorTextDisabled }} />
                        <Switch 
                            size="small" 
                            checked={apiActive} 
                            disabled={!canToggle} 
                            onChange={(checked) => toggleFeature({ key, feature: 'api_enabled', state: checked })} 
                        />
                        <Text style={{ fontSize: 11 }}>API</Text>
                    </Space>
                )}
            </Space>
        );
    };

    const domainColumns = [
        { 
            title: 'Module Identity', 
            dataIndex: 'label', 
            key: 'label',
            render: (text: string, r: KernelDomain) => (
                <Space>
                    <div style={{ 
                        width: 32, height: 32, borderRadius: 6, 
                        background: token.colorFillAlter, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18
                    }}>
                        {/* ⚡ THE FIX: Read from physical module_icon column first */}
                        <IconFactory icon={r.module_icon || r.config?.icon || 'antd:AppstoreOutlined'} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, color: token.colorTextHeading }}>{text}</div>
                        <Tag style={{ fontFamily: 'monospace', fontSize: 10, margin: 0 }}>{r.key}</Tag>
                    </div>
                </Space>
            )
        },
        { 
            title: 'Control Plane', 
            key: 'switches', 
            width: 300,
            render: (_: any, r: KernelDomain) => renderSwitches(r, 'DOMAIN')
        },
        { 
            title: 'State', 
            dataIndex: 'is_active', 
            width: 120, 
            render: (isActive: boolean) => (
                <Badge 
                    status={isActive ? 'success' : 'error'} 
                    text={isActive ? <span style={{ color: token.colorSuccess }}>NOMINAL</span> : <span style={{ color: token.colorError }}>HALTED</span>} 
                />
            ) 
        }
    ];

    const expandedRowRender = (domain: KernelDomain) => {
        if (!domain.scopes || domain.scopes.length === 0) return null;

        const scopeColumns = [
            { 
                title: 'Feature Scope', 
                dataIndex: 'key', 
                key: 'key', 
                render: (text: string, r: KernelScope) => (
                    <Space>
                        {/* ⚡ THE FIX: Read scope config icon, fallback to Deployment */}
                        <IconFactory icon={r.config?.icon || "antd:DeploymentUnitOutlined"} style={{ color: token.colorTextSecondary }} />
                        <Text strong style={{ fontSize: 12 }}>{r.label}</Text>
                        <Text type="secondary" style={{ fontSize: 10 }}>({text})</Text>
                    </Space>
                )
            },
            { title: 'Type', dataIndex: 'type', width: 150, render: (t: string) => <Tag color="blue">{t}</Tag> },
            {
                title: 'Granular Control',
                key: 'switches',
                width: 300,
                render: (_: any, r: KernelScope) => {
                    const scopeWithKey = { ...r, _computedKey: `scope:${domain.key}:${r.key}` };
                    return renderSwitches(scopeWithKey, 'SCOPE');
                }
            }
        ];

        return (
            <Table 
                columns={scopeColumns} 
                dataSource={domain.scopes} 
                pagination={false} 
                size="small"
                showHeader={false}
                style={{ margin: '0 0 0 40px', borderLeft: `2px solid ${token.colorSplit}` }}
            />
        );
    };

    const screenColumns = [
        { 
            title: 'Screen Target', 
            dataIndex: 'target', 
            render: (t: string) => <Tag color="purple" style={{ fontFamily: 'monospace' }}>{t}</Tag> 
        },
        { 
            title: 'Control Plane', 
            key: 'switches', 
            align: 'right' as const,
            render: (_: any, r: any) => renderSwitches(r, 'SCREEN')
        }
    ];

    const configColumns = [
        { title: 'Key', dataIndex: 'key', width: 250, render: (t: string) => <Text code copyable>{t}</Text> },
        { title: 'Value', dataIndex: 'value_raw', render: (t: string, r: SystemConfig) => (
            r.value_type === 'BOOLEAN' ? <Tag color={t === 'true' || t === '1' ? 'green' : 'red'}>{t === 'true' || t === '1' ? 'ON' : 'OFF'}</Tag> : <Text style={{ color: token.colorTextSecondary }}>{t}</Text>
        )},
        { title: 'Action', key: 'action', align: 'right' as const, width: 100, render: (_: any, r: SystemConfig) => (
            <Button size="small" icon={<IconFactory icon="antd:SettingOutlined" />} onClick={() => { setSelectedConfig(r); setDrawerOpen(true); }}>Edit</Button>
        )}
    ];

    const stats = [
        { title: 'Engine Version', value: pulse?.versioning.engine || '---' },
        { title: 'Schema Hash', value: pulse?.versioning.schema.substring(0,8) || '---' },
        { title: 'Active Modules', value: pulse?.health.modules_active || 0 },
    ];

    return (
        <PageContainer title="System Control" style={{ background: token.colorBgLayout }}>
            <div style={{ paddingBottom: 100 }}>
                <Row justify="end" style={{ marginBottom: 16 }}>
                    <Space size="middle">
                        <Tooltip title={safety.isOn ? "Safety Lock Engaged" : "Safety Disengaged"}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 20, background: safety.isOn ? token.colorSuccessBg : token.colorErrorBg, border: `1px solid ${safety.isOn ? token.colorSuccessBorder : token.colorErrorBorder}` }}>
                                <Switch 
                                    checkedChildren={<IconFactory icon="antd:LockOutlined" />} 
                                    unCheckedChildren={<IconFactory icon="antd:UnlockOutlined" />} 
                                    checked={safety.isOn} 
                                    onChange={safety.toggle} 
                                    style={{ backgroundColor: safety.isOn ? token.colorSuccess : token.colorError }} 
                                />
                                <Text style={{ fontSize: 12, color: safety.isOn ? token.colorSuccessText : token.colorErrorText }}>{safety.isOn ? 'SAFE' : 'ARMED'}</Text>
                            </div>
                        </Tooltip>
                        <Button icon={<IconFactory icon="antd:ReloadOutlined" />} onClick={() => refreshPulse()}>Pulse Check</Button>
                    </Space>
                </Row>

                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    {stats.map((stat, i) => (
                        <Col span={8} key={i}><Card loading={isPulseLoading} bordered={false} style={{ borderRadius: token.borderRadiusLG }}><Statistic title={stat.title} value={stat.value} /></Card></Col>
                    ))}
                </Row>

                <Row gutter={24}>
                    <Col span={16}>
                        <Card 
                            title={<span><IconFactory icon="antd:SafetyCertificateOutlined" style={{ color: token.colorPrimary, marginRight: 8 }} /> Domain Governance</span>} 
                            bordered={false} 
                            loading={isGovLoading} 
                            style={{ borderRadius: token.borderRadiusLG, marginBottom: 24 }}
                        >
                            <Table 
                                dataSource={domains} 
                                columns={domainColumns} 
                                rowKey="key" 
                                pagination={false} 
                                size="small" 
                                expandable={{
                                    expandedRowRender,
                                    rowExpandable: (record) => (record.scopes?.length || 0) > 0
                                }}
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card 
                            title={<span><IconFactory icon="antd:LayoutOutlined" style={{ color: 'purple', marginRight: 8 }} /> Workspace Screens</span>} 
                            bordered={false} 
                            loading={isGovLoading} 
                            style={{ borderRadius: token.borderRadiusLG, marginBottom: 24 }}
                        >
                            <Table 
                                dataSource={screens} 
                                columns={screenColumns} 
                                rowKey="id" 
                                pagination={false} 
                                size="small" 
                            />
                        </Card>
                    </Col>
                </Row>

                <Card title={<span><IconFactory icon="antd:SettingOutlined" style={{ color: token.colorWarning, marginRight: 8 }} /> System Configuration</span>} bordered={false} loading={isGovLoading} style={{ borderRadius: token.borderRadiusLG }}>
                    <Table dataSource={config} columns={configColumns} rowKey="id" pagination={false} size="small" />
                </Card>
            </div>
            <ConfigDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} config={selectedConfig} onSave={updateConfig} loading={isMutating} />
        </PageContainer>
    );
};

export default SystemDashboard;

