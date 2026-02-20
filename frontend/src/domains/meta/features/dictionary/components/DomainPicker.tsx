// FILEPATH: frontend/src/domains/meta/features/dictionary/components/DomainPicker.tsx
// @file: Domain Selection Lobby (Governance Edition)
// @author: The Engineer
// @description: A visual grid to select which Domain Schema to edit.
// @updated: Fixed visual overlap by switching to Vertical Layout. Increased Card Size. */

import React, { useState, useMemo } from 'react';
import { Card, Row, Col, Typography, Input, theme, Tag, Space, Spin, Empty, Divider, Popover } from 'antd';
import { 
    DatabaseOutlined, SearchOutlined, 
    ArrowRightOutlined, CodeOutlined, InfoCircleOutlined,
    HddOutlined, ApiOutlined, CheckCircleOutlined, CloseCircleOutlined,
    TagOutlined, LockOutlined
} from '@ant-design/icons';

import type { DomainSummary, DomainTypeDefinition } from '../../../_kernel/types';
import { useTrace } from '../../../../../platform/logging/useTrace';
import { logger } from '../../../../../platform/logging';
import { IconFactory } from '../../../../../platform/ui/icons/IconFactory';

const { Title, Text, Paragraph } = Typography;

interface DomainPickerProps {
    domains: DomainSummary[];
    onSelect: (domainKey: string) => void;
    isLoading: boolean;
}

export const DomainPicker: React.FC<DomainPickerProps> = ({ domains, onSelect, isLoading }) => {
    const { token } = theme.useToken();
    const [searchText, setSearchText] = useState('');

    useTrace('DomainPicker', { available: domains.length, isLoading });

    const handleSelect = (key: string, isLocked: boolean) => {
        if (isLocked) {
            logger.whisper('USER', `🚫 Interaction blocked: ${key} is Schema-Locked.`);
            return;
        }
        logger.tell('USER', `👉 Selected Domain: ${key}`);
        onSelect(key);
    };

    const groupedDomains = useMemo(() => {
        const filtered = domains.filter(d => 
            d.label.toLowerCase().includes(searchText.toLowerCase()) || 
            d.key.toLowerCase().includes(searchText.toLowerCase())
        );

        const groups: Record<string, { label: string, icon: string, items: DomainSummary[] }> = {};

        filtered.forEach(domain => {
            const moduleKey = domain.system_module || 'GENERAL';
            if (!groups[moduleKey]) {
                groups[moduleKey] = {
                    label: domain.module_label || 'General Modules',
                    icon: domain.module_icon || 'antd:AppstoreOutlined',
                    items: []
                };
            }
            groups[moduleKey].items.push(domain);
        });

        return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
    }, [domains, searchText]);

    // ⚡ RENDERER: Capability Popover Content
    const renderTypePopover = (def: DomainTypeDefinition) => {
        const props = def.properties;
        return (
            <div style={{ maxWidth: 240 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Space size={4} style={{ fontSize: 12, color: token.colorTextSecondary }}>
                        <TagOutlined /> Type ID:
                    </Space>
                    <Text code strong>{def.key}</Text>
                </div>
                
                <Text style={{ fontSize: 13, lineHeight: 1.4, display: 'block', color: token.colorText }}>
                    {def.description || "No description available."}
                </Text>
                
                <Divider style={{ margin: '12px 0' }} />
                
                <Space direction="vertical" size={6} style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <Space><HddOutlined style={{ color: token.colorTextSecondary }} /> Storage:</Space>
                        <Tag style={{ margin: 0 }}>{props?.storage_strategy || 'N/A'}</Tag>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <Space><ApiOutlined style={{ color: token.colorTextSecondary }} /> API Strategy:</Space>
                        <Tag style={{ margin: 0 }}>{props?.api_strategy || 'N/A'}</Tag>
                    </div>
                </Space>

                <Divider style={{ margin: '12px 0' }} />
                
                <Space direction="vertical" size={4} style={{ fontSize: 12, width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                         <Text type="secondary">Custom Attributes</Text>
                         {props?.supports_meta ? <CheckCircleOutlined style={{ color: token.colorSuccess }} /> : <CloseCircleOutlined style={{ color: token.colorTextDisabled }} />}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                         <Text type="secondary">Audit Logging</Text>
                         {props?.supports_activity ? <CheckCircleOutlined style={{ color: token.colorSuccess }} /> : <CloseCircleOutlined style={{ color: token.colorTextDisabled }} />}
                    </div>
                </Space>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Spin size="large" tip="Loading Registry..." />
            </div>
        );
    }

    return (
        <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
            
            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>
                        <DatabaseOutlined style={{ marginRight: 12, color: token.colorPrimary }} />
                        Data Dictionary
                    </Title>
                    <Text type="secondary">Manage Schema Definitions and Field Attributes.</Text>
                </div>
                <Input 
                    style={{ width: 300 }}
                    prefix={<SearchOutlined style={{ color: token.colorTextDisabled }} />} 
                    placeholder="Search domains..." 
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    allowClear
                />
            </div>

            {/* EMPTY STATE */}
            {groupedDomains.length === 0 && (
                 <Empty 
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={searchText ? "No matches found" : "No Domains Registered"} 
                />
            )}

            {/* COMPACT GRID */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
                {groupedDomains.map(([groupKey, group]) => (
                    <div key={groupKey}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, opacity: 0.8 }}>
                            <IconFactory icon={group.icon} style={{ marginRight: 8, fontSize: 18 }} />
                            <Text strong style={{ textTransform: 'uppercase', fontSize: 13, letterSpacing: 0.5 }}>{group.label}</Text>
                            <Divider type="vertical" />
                            <Text type="secondary" style={{ fontSize: 12 }}>{group.items.length}</Text>
                        </div>

                        {/* ⚡ GRID: Wider Cards (lg={12} = 50% width) */}
                        <Row gutter={[24, 24]}>
                            {group.items.map(domain => {
                                // Governance Check
                                const supportsMeta = domain.type_def?.properties?.supports_meta !== false;
                                
                                // Visual States
                                const isLocked = !supportsMeta;
                                const typeColor = isLocked ? token.colorTextDisabled : (domain.type_def?.color || token.colorInfo);
                                const cardOpacity = isLocked ? 0.7 : 1;
                                const cursor = isLocked ? 'not-allowed' : 'pointer';
                                
                                return (
                                    <Col xs={24} sm={12} lg={12} xl={8} key={domain.key}>
                                        <Card
                                            hoverable={!isLocked}
                                            size="default"
                                            onClick={() => handleSelect(domain.key, isLocked)}
                                            style={{ 
                                                cursor,
                                                opacity: cardOpacity,
                                                borderTop: `3px solid ${typeColor}`,
                                                overflow: 'hidden',
                                                background: isLocked ? token.colorBgContainerDisabled : undefined,
                                                minHeight: 220, // ⚡ TWEAK: Taller
                                                height: '100%',
                                                transition: 'all 0.2s ease-in-out'
                                            }}
                                            styles={{ body: { padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' } }}
                                        >
                                            {/* ⚡ LAYOUT: Vertical Stack for Clarity */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                                {/* ICON BOX */}
                                                <div style={{ 
                                                    width: 56, height: 56, 
                                                    borderRadius: 12, 
                                                    background: isLocked ? 'transparent' : token.colorFillAlter, 
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: typeColor,
                                                    fontSize: 28,
                                                    border: isLocked ? `1px solid ${token.colorBorderSecondary}` : 'none'
                                                }}>
                                                    {isLocked ? <LockOutlined /> : <IconFactory icon={domain.icon || domain.module_icon} />}
                                                </div>

                                                {/* TOP RIGHT: TYPE BADGE */}
                                                {domain.type_def && (
                                                    <Popover 
                                                        title={<Space><InfoCircleOutlined style={{ color: typeColor }} /> {domain.type_def.label}</Space>} 
                                                        content={renderTypePopover(domain.type_def)}
                                                        placement="bottomRight"
                                                        overlayStyle={{ width: 260 }}
                                                    >
                                                        <Tag 
                                                            color={isLocked ? undefined : typeColor} 
                                                            style={{ margin: 0, opacity: 0.9, cursor: 'help' }}
                                                        >
                                                            {domain.type_def.label}
                                                        </Tag>
                                                    </Popover>
                                                )}
                                            </div>

                                            {/* CONTENT: Vertical Flow */}
                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                <Text strong style={{ fontSize: 18, color: isLocked ? token.colorTextDisabled : undefined }}>
                                                    {domain.label}
                                                </Text>
                                                
                                                <Paragraph 
                                                    type="secondary" 
                                                    ellipsis={{ rows: 2 }} 
                                                    style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 0, flex: 1 }}
                                                >
                                                    {domain.type_def?.description || "Standard Business Domain."}
                                                </Paragraph>
                                            </div>

                                            {/* FOOTER: ID & Parent */}
                                            <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${token.colorSplit}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Space size={6} style={{ fontSize: 12, color: token.colorTextTertiary }}>
                                                    <CodeOutlined />
                                                    <Text code style={{ fontSize: 12, color: 'inherit' }}>{domain.key}</Text>
                                                </Space>

                                                {!isLocked && (
                                                    <ArrowRightOutlined style={{ color: token.colorTextQuaternary }} />
                                                )}
                                            </div>
                                        </Card>
                                    </Col>
                                );
                            })}
                        </Row>
                    </div>
                ))}
            </div>
        </div>
    );
};

