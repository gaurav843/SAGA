/* FILEPATH: frontend/src/domains/meta/features/states/components/EventRegistryModal.tsx */
/* @file Event Registry Modal */
/* @author The Engineer */
/* @description A picker interface for System Events (Triggers).
 * FEATURES:
 * - Searchable Catalog.
 * - Distinction between Global (System) and Local (Workflow) events.
 * - Quick Creation of new signals.
 */

import React, { useState, useMemo } from 'react';
import { Modal, Input, List, Tag, Button, Tabs, Empty, Typography, theme, Space } from 'antd';
import { 
    ThunderboltOutlined, 
    SearchOutlined, 
    PlusOutlined, 
    GlobalOutlined, 
    DeploymentUnitOutlined 
} from '@ant-design/icons';

const { Text } = Typography;

interface EventDefinition {
    key: string;
    label: string;
    description?: string;
    scope: 'GLOBAL' | 'LOCAL';
}

interface EventRegistryModalProps {
    open: boolean;
    onCancel: () => void;
    onSelect: (eventKey: string) => void;
    existingEvents: EventDefinition[]; // Passed from parent or context
}

export const EventRegistryModal: React.FC<EventRegistryModalProps> = ({ 
    open, onCancel, onSelect, existingEvents 
}) => {
    const { token } = theme.useToken();
    const [searchText, setSearchText] = useState('');
    const [activeTab, setActiveTab] = useState('ALL');

    // ⚡ MOCK DEFAULT EVENTS (In production, fetch from CapabilitiesContext)
    const SYSTEM_EVENTS: EventDefinition[] = [
        { key: 'SUBMIT', label: 'Form Submit', scope: 'GLOBAL', description: 'Standard submission trigger.' },
        { key: 'APPROVE', label: 'Approve', scope: 'GLOBAL', description: 'Positive outcome trigger.' },
        { key: 'REJECT', label: 'Reject', scope: 'GLOBAL', description: 'Negative outcome trigger.' },
        { key: 'CANCEL', label: 'Cancel', scope: 'GLOBAL', description: 'Process termination.' },
        { key: 'TIMEOUT', label: 'Timeout', scope: 'GLOBAL', description: 'System auto-expiry.' },
    ];

    const allEvents = useMemo(() => {
        // Merge system defaults with any custom ones passed in
        const combined = [...SYSTEM_EVENTS, ...existingEvents];
        // Deduplicate by key
        const seen = new Set();
        return combined.filter(e => {
            const duplicate = seen.has(e.key);
            seen.add(e.key);
            return !duplicate;
        });
    }, [existingEvents]);

    const filteredEvents = useMemo(() => {
        return allEvents.filter(e => {
            const matchesSearch = e.key.toLowerCase().includes(searchText.toLowerCase()) || 
                                  e.label.toLowerCase().includes(searchText.toLowerCase());
            const matchesTab = activeTab === 'ALL' || e.scope === activeTab;
            return matchesSearch && matchesTab;
        });
    }, [allEvents, searchText, activeTab]);

    const handleCreateNew = () => {
        // Simple creation logic for now - just returns the uppercase search text
        if (!searchText) return;
        const newKey = searchText.toUpperCase().replace(/\s+/g, '_');
        onSelect(newKey);
    };

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            footer={null}
            title={<Space><ThunderboltOutlined style={{ color: token.colorWarning }} /> Select Trigger Event</Space>}
            width={600}
        >
            <Input 
                placeholder="Search or type new event name..." 
                prefix={<SearchOutlined style={{ color: token.colorTextDisabled }} />} 
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{ marginBottom: 16 }}
                size="large"
                addonAfter={
                    searchText && !filteredEvents.find(e => e.key === searchText.toUpperCase()) ? (
                        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleCreateNew}>
                            Create "{searchText.toUpperCase()}"
                        </Button>
                    ) : null
                }
            />

            <Tabs 
                activeKey={activeTab} 
                onChange={setActiveTab}
                items={[
                    { key: 'ALL', label: 'All Triggers' },
                    { key: 'GLOBAL', label: 'System Globals', icon: <GlobalOutlined /> },
                    { key: 'LOCAL', label: 'Custom', icon: <DeploymentUnitOutlined /> },
                ]}
            />

            <div style={{ height: 400, overflowY: 'auto', border: `1px solid ${token.colorBorderSecondary}`, borderRadius: 8 }}>
                <List
                    dataSource={filteredEvents}
                    renderItem={item => (
                        <List.Item 
                            onClick={() => onSelect(item.key)}
                            style={{ 
                                cursor: 'pointer', 
                                padding: '12px 16px',
                                transition: 'background 0.2s'
                            }}
                            className="event-item-hover"
                            // Hover effect handled via CSS or inline mouse events if needed
                            onMouseEnter={(e) => e.currentTarget.style.background = token.colorFillQuaternary}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <List.Item.Meta
                                avatar={
                                    item.scope === 'GLOBAL' 
                                    ? <GlobalOutlined style={{ color: token.colorTextSecondary }} /> 
                                    : <DeploymentUnitOutlined style={{ color: token.colorPurple }} />
                                }
                                title={
                                    <Space>
                                        <Text strong>{item.label}</Text>
                                        <Tag style={{ fontFamily: 'monospace', fontSize: 10 }}>{item.key}</Tag>
                                    </Space>
                                }
                                description={item.description || 'No description provided.'}
                            />
                            <Button size="small">Select</Button>
                        </List.Item>
                    )}
                    locale={{ emptyText: <Empty description="No events found. Type to create one." /> }}
                />
            </div>
        </Modal>
    );
};

