// FILEPATH: frontend/src/domains/meta_v2/features/dictionary/DictionaryTool.tsx
// @file: Dictionary Tool (V2 Adapter)
// @role: 🧩 Feature Container */
// @author: The Engineer
// @description: The V2-Native wrapper for the Data Dictionary.
// Fully decoupled from V1.

// @security-level: LEVEL 9 (UI Safe) */

import React, { useMemo, useState, useEffect } from 'react';
import { Layout, Typography, theme, Button, Space, Spin, Empty } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined, PlusOutlined, MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';

// ⚡ LOCAL V2 IMPORTS
import { useDictionary } from './hooks/useDictionary';
import { AttributeExplorer } from './components/AttributeExplorer';
import { AttributeEditor } from './components/AttributeEditor';
import { AttributeDraft } from './types/types'; 
import { AttributeType, WidgetType } from './types/constants';

import { logger } from '@/platform/logging';
import { useKernel } from '../../_kernel/KernelContext';

const { Content, Sider } = Layout;
const { Title } = Typography;

// ⚡ DEFAULT DRAFT STATE
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
    configuration: {},
    domain: ""
};

interface DictionaryToolProps {
    domain?: string; 
}

export const DictionaryTool: React.FC<DictionaryToolProps> = ({ domain: propDomain }) => {
    const { token } = theme.useToken();
    const navigate = useNavigate();
    
    // ⚡ ROUTING LOGIC: Capture both Path Param and Query Param
    const { domain: paramDomain } = useParams<{ domain: string }>();
    const [searchParams] = useSearchParams();
    const urlDomain = searchParams.get('domain');
    
    // 1. RESOLVE CONTEXT (V2 Way)
    const { activeContext, selectContext } = useKernel();
    
    // Prioritize Prop -> Path Param -> Query Param -> Active Context
    const targetDomain = propDomain || paramDomain || urlDomain || activeContext?.key;

    // ⚡ SYNC ENGINE: Ensure Kernel is aware of Router URL changes
    useEffect(() => {
        if (targetDomain && activeContext?.key !== targetDomain) {
            logger.trace("DICTIONARY", `🔄 Syncing Kernel Context with Route: ${targetDomain}`);
            selectContext(targetDomain);
        }
    }, [targetDomain, activeContext?.key, selectContext]);
    
    // 2. FEATURE LOGIC
    const { 
        attributes, 
        isLoading, 
        saveAttribute, 
        deleteAttribute, 
        refresh 
    } = useDictionary(targetDomain || '');

    // 3. LOCAL UI STATE
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    
    // ⚡ UX STATE: Auto-Collapse the list when editing
    const [collapsed, setCollapsed] = useState(false); 

    // 4. COMPUTED DRAFT
    const activeDraft = useMemo(() => {
        if (selectedKey) {
            const found = attributes.find(a => a.key === selectedKey);
            if (found) {
                return {
                    ...FRESH_DRAFT,
                    ...found,
                    configuration: found.configuration || (found as any).config || {},
                    domain: targetDomain || ''
                } as AttributeDraft;
            }
        }
        return { ...FRESH_DRAFT, domain: targetDomain || '' };
    }, [selectedKey, attributes, targetDomain]);

    // 5. HANDLERS
    const handleBack = () => {
        // Go back to Topology (parent route)
        navigate('/meta-v2');
    };

    const handleSave = async (draft: AttributeDraft) => {
        const success = await saveAttribute(draft);
        if (success) {
            setIsCreating(false);
            setSelectedKey(null);
            
            // ⚡ UX: Expand list again after saving so they can pick the next item
            setCollapsed(false); 
            logger.whisper('UI', '📐 Expanding Attribute Explorer');
        }
    };

    const handleDelete = async (key: string) => {
        const success = await deleteAttribute(key);
        if (success) {
            if (selectedKey === key) {
                setSelectedKey(null);
                setIsCreating(false);
                setCollapsed(false);
            }
        }
    };

    if (!targetDomain) {
        return <Empty description="No Domain Selected" />;
    }

    const showEditor = selectedKey !== null || isCreating;

    return (
        <Layout style={{ height: '100%', background: 'transparent' }}>
            {/* TOOLBAR */}
            <div style={{ 
                padding: '16px 24px', 
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: token.colorBgContainer
            }}>
                <Space>
                    <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>Back</Button>
                    <Title level={4} style={{ margin: 0 }}>
                        Data Dictionary: {targetDomain}
                    </Title>
                </Space>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={refresh} loading={isLoading} />
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => { 
                        setSelectedKey(null); 
                        setIsCreating(true); 
                        setCollapsed(true); // ⚡ Auto-collapse for creation focus
                    }}>
                        Add Field
                    </Button>
                </Space>
            </div>

            {/* MAIN CONTENT (Split View) */}
            <Layout hasSider style={{ height: 'calc(100% - 64px)' }}>
                <Sider 
                    width={320} 
                    theme="light" 
                    collapsible 
                    collapsed={collapsed}
                    trigger={null}
                    style={{ borderRight: `1px solid ${token.colorBorderSecondary}`, overflowY: 'auto' }}
                >
                    {isLoading ? (
                        <div style={{ padding: 32, textAlign: 'center' }}><Spin /></div>
                    ) : (
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

                             <AttributeExplorer 
                                attributes={attributes} 
                                onSelect={(attr) => { 
                                    setIsCreating(false); 
                                    setSelectedKey(attr.key); 
                                     
                                    // ⚡ UX: Auto-collapse when user selects a field to edit
                                    setCollapsed(true); 
                                    logger.whisper('UI', `📐 Auto-collapsing Explorer to edit: ${attr.key}`);
                                }}
                                selectedKey={selectedKey}
                                collapsed={collapsed}
                                onToggleCollapse={() => setCollapsed(!collapsed)}
                                onCreate={() => {
                                    setSelectedKey(null); 
                                    setIsCreating(true); 
                                    setCollapsed(true);
                                }}
                            />
                        </div>
                    )}
                </Sider>

                <Content style={{ padding: 24, overflowY: 'auto', background: token.colorBgLayout }}>
                    {showEditor ? (
                        <div style={{ maxWidth: 800, margin: '0 auto', background: token.colorBgContainer, padding: 24, borderRadius: 8 }}>
                            <AttributeEditor 
                                key={selectedKey || 'new'}
                                draft={activeDraft}
                                isNew={isCreating || !selectedKey}
                                isSaving={false}
                                onSave={handleSave}
                                onDelete={(!isCreating && !activeDraft.is_system) ? () => handleDelete(selectedKey!) : undefined}
                            />
                        </div>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Empty description="Select a field to edit details" />
                        </div>
                    )}
                </Content>
            </Layout>
        </Layout>
    );
};

export default DictionaryTool;

