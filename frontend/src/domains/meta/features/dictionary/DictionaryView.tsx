// 
// FILEPATH: frontend/src/domains/meta/features/dictionary/DictionaryView.tsx
// @file: Dictionary View (Master Schema Editor)
// @role: 🎨 UI Presentation */
// @author: The Engineer
// @description: Master Controller. Fixes 'config' vs 'configuration' crash and Layout Regressions.
// @security-level: LEVEL 9 (UI Safe) */

import React, { useEffect, useMemo, useState } from 'react';
import { 
    Layout, Typography, theme, Button, Space, 
    Breadcrumb, Empty, Spin 
} from 'antd';
import { 
    ArrowLeftOutlined, 
    ReloadOutlined, 
    DatabaseOutlined,
    PlusOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined
} from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';

// ⚡ SHARED COMPONENTS
import { DomainTree } from '../../components/DomainTree'; 
import { useMetaContext } from '../../_kernel/MetaContext';
import { useDomains } from '../../features/states/hooks/useDomains'; 

// Local Components
import { AttributeExplorer } from './components/AttributeExplorer';
import { AttributeEditor } from './components/AttributeEditor';
import { useDictionary } from './hooks/useDictionary';

// ⚡ CRITICAL FIX: Explicit type import to prevent Vite transpilation crash
import type { AttributeDraft } from './types/types'; 

import { AttributeType, WidgetType } from './types/constants'; // Explicit Import for Defaults (Enums exist at runtime)

// ⚡ CRITICAL FIX: Adjusted relative path depth (added one '../')
import { logger } from '../../../../platform/logging/Narrator'; 

const { Content, Sider } = Layout;
const { Title } = Typography;

// ⚡ SAFETY: Local Default to prevent "Undefined" crash.
// ⚡ CONTRACT FIX: Renamed 'config' -> 'configuration' to match Types.
const FRESH_DRAFT: AttributeDraft = {
    key: "",
    label: "",
    data_type: AttributeType.TEXT,
    widget_type: WidgetType.INPUT,
    is_system: false,
    is_dynamic: true,
    is_required: false,
    is_unique: false,
    is_active: true,
    options: [],
    configuration: {}, // ✅ CORRECT PROPERTY NAME
    domain: ""
};

export const DictionaryView: React.FC = () => {
    const { token } = theme.useToken();
    const [searchParams, setSearchParams] = useSearchParams();
    
    // 1. GLOBAL CONTEXT
    const { 
        selectedDomain, 
        selectDomain,
        selectedItem,
        selectItem 
    } = useMetaContext();

    const { domains, isLoading: isDomainsLoading } = useDomains();
    const domainKey = searchParams.get('domain');
    
    // Sync URL -> Context
    useEffect(() => {
        if (domainKey && (!selectedDomain || selectedDomain.key !== domainKey)) {
            if (domains.length > 0) selectDomain(domainKey);
        } else if (!domainKey && selectedDomain) {
            selectDomain('');
        }
    }, [domainKey, domains, selectedDomain]);

    // 2. FEATURE LOGIC
    const activeDomain = selectedDomain?.key || null;

    const { 
        attributes, 
        isLoading: isSchemaLoading, 
        saveAttribute, 
        deleteAttribute,
        refresh 
    } = useDictionary(activeDomain || '');

    // Local UI State
    const [collapsed, setCollapsed] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    
    // 3. HANDLERS
    const handleDomainSelect = (key: string) => {
        selectDomain(key);
        setSearchParams({ domain: key });
        setIsCreating(false);
    };

    const handleBack = () => {
        selectDomain('');
        setSearchParams({});
        selectItem(null);
        setIsCreating(false);
    };

    const handleEdit = (fieldKey: string) => {
        logger.tell("DICTIONARY", `✏️ Editing Field: ${fieldKey}`);
        selectItem(fieldKey);
        setIsCreating(false);
    };

    const handleCreate = () => {
        logger.tell("DICTIONARY", "✨ Creating New Field");
        selectItem(null);
        setIsCreating(true);
    };

    const handleSave = async (draft: AttributeDraft) => {
        const success = await saveAttribute(draft);
        if (success) {
            setIsCreating(false);
            selectItem(null); 
        }
    };

    const handleDelete = async (key: string) => {
        const success = await deleteAttribute(key);
        if (success) {
            if (selectedItem === key) {
                selectItem(null);
                setIsCreating(false);
            }
        }
    };

    // 4. COMPUTED: Safe Data Resolution
    const activeDraft = useMemo(() => {
        if (selectedItem) {
            const found = attributes.find(a => a.key === selectedItem);
            if (found) {
                return {
                    ...FRESH_DRAFT, // Use safe defaults for missing props
                    ...found,       // Overwrite with DB data
                    // ⚡ CONTRACT FIX: Ensure we map DB config to 'configuration'
                    configuration: found.configuration || (found as any).config || {}, 
                    domain: activeDomain || ''
                } as AttributeDraft;
            }
        }
        
        // Return Fresh Draft for "New" mode
        return { 
            ...FRESH_DRAFT, 
            domain: activeDomain || '' 
        };
    }, [selectedItem, attributes, activeDomain]);

    // ⚡ SECURITY CHECK: Is this a System Field?
    const isSystemField = activeDraft.is_system;

    // ⚡ STATE: Are we in "New Mode"? 
    const isNewMode = isCreating || !selectedItem;

    // --- RENDER: STATE A (LOBBY) ---
    if (!activeDomain) {
        return (
            <div style={{ padding: 48, minHeight: '100%', background: token.colorBgLayout }}>
                {isDomainsLoading ? (
                    <div style={{ textAlign: 'center', marginTop: 100 }}>
                         <Spin size="large" tip="Loading System Topology..." />
                    </div>
                ) : (
                    <DomainTree 
                         domains={domains} 
                        onSelect={handleDomainSelect} 
                        isLoading={isDomainsLoading} 
                    />
                )}
            </div>
        );
    }

    // --- RENDER: STATE B (MASTER-DETAIL EDITOR) ---
    const showEditor = selectedItem !== null || isCreating;

    return (
        <Layout style={{ height: '100vh', overflow: 'hidden' }}>
            {/* HEADER */}
            <div style={{ 
                padding: '0 24px', 
                background: token.colorBgContainer, 
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                height: 64,
                flexShrink: 0
            }}>
                <Space>
                    <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>Back</Button>
                    <Breadcrumb items={[
                        { title: <Space><DatabaseOutlined /> Data Dictionary</Space> },
                        { title: selectedDomain?.label || activeDomain }
                    ]} />
                </Space>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={refresh} loading={isSchemaLoading}>Refresh</Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>New Field</Button>
                </Space>
            </div>

            {/* ⚡ LAYOUT FIX: 'hasSider' ensures Left-to-Right layout */}
            <Layout hasSider style={{ height: 'calc(100vh - 64px)' }}>
                
                {/* LEFT: ATTRIBUTE LIST */}
                <Sider 
                    width={350} 
                    theme="light" 
                    collapsible 
                    collapsed={collapsed} 
                    trigger={null} // ⚡ FIX: Removed default bottom trigger
                    style={{ 
                        borderRight: `1px solid ${token.colorBorderSecondary}`,
                        overflowY: 'auto',
                        height: '100%',
                        zIndex: 10
                    }}
                >
                    <div style={{ padding: 16 }}>
                        {/* ⚡ FIX: Header with Collapse Toggle */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            {!collapsed && <Title level={5} style={{ margin: 0 }}>Attributes</Title>}
                            <Button 
                                type="text" 
                                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} 
                                onClick={() => setCollapsed(!collapsed)}
                            />
                        </div>

                        {isSchemaLoading ? (
                            <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>
                        ) : attributes.length === 0 ? (
                            <Empty description="No Attributes" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        ) : (
                            <AttributeExplorer 
                                attributes={attributes} 
                                onSelect={handleEdit}
                                selectedKey={selectedItem}
                            />
                        )}
                    </div>
                </Sider>

                {/* RIGHT: EDITOR CANVAS */}
                <Content style={{ 
                    padding: 24, 
                    overflowY: 'auto', 
                    height: '100%',
                    background: token.colorBgLayout
                }}>
                    <div style={{ maxWidth: 800, margin: '0 auto', minHeight: '100%' }}>
                        {showEditor ? (
                            <div style={{ 
                                background: token.colorBgContainer, 
                                padding: 24, 
                                borderRadius: token.borderRadiusLG,
                                border: `1px solid ${token.colorBorderSecondary}`
                            }}>
                                <AttributeEditor 
                                    // ⚡ KEY FIX: Force remount when switching items to reset form state
                                    key={selectedItem || 'new'} 
                                    draft={activeDraft}
                                    
                                    // ⚡ CRITICAL: Pass Mode Signal to Unlock Fields
                                    isNew={isNewMode}
                                    onSave={handleSave}

                                    // ⚡ SECURITY FIX: Disable delete for System Fields or New Items
                                    onDelete={(!isCreating && !isSystemField) ? () => handleDelete(selectedItem!) : undefined}
                                    isSaving={false} 
                                />
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', marginTop: 100 }}>
                                <Empty 
                                    description="Select a field to edit properties" 
                                    image={Empty.PRESENTED_IMAGE_SIMPLE} 
                                >
                                    <Button type="primary" onClick={handleCreate}>Create New Field</Button>
                                </Empty>
                            </div>
                        )}
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
};
