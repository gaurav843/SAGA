// FILEPATH: frontend/src/domains/meta/features/app_studio/components/StudioEditor.tsx
// @file: Studio Editor (Extracted Organism)
// @role: 🎨 UI Presentation */
// @author: The Engineer
// @description: The full-screen IDE interface. Displays Version History in Header.
// @security-level: LEVEL 9 (UI Partition) */
// @narrator: 🕵️ TELEMETRY + VERSIONING ENABLED */

import React, { useState, useEffect } from 'react';
import { Layout, Button, Drawer, Space, Typography, theme, Dropdown, type MenuProps, Modal, Input, Badge } from 'antd';
import { 
  SaveOutlined, 
  PlayCircleOutlined, 
  SettingOutlined, 
  ArrowLeftOutlined,
  DownOutlined,
  AppstoreOutlined,
  HomeOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { 
    DndContext, 
    DragOverlay, 
    type DragEndEvent, 
    type DragStartEvent, 
    useSensor, 
    useSensors, 
    MouseSensor, 
    TouchSensor 
} from '@dnd-kit/core';

import { BrickLibrary } from './BrickLibrary';
import { ScreenCanvas } from './ScreenCanvas';
import { AppConfigurator } from './AppConfigurator';
import { DraggableBrick } from './DraggableBrick';
import { logger } from '../../../../../platform/logging';
import { useNotification } from '../../../../../platform/design/system/useNotification';
import { type SystemBrick, type ActiveApp, type Screen } from '../types';
import { type RuntimeLayout } from '../../../../workspace/types';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

interface StudioEditorProps {
    screen?: Screen;
    apps: ActiveApp[];
    screens: Screen[];
    lastRelease?: RuntimeLayout['meta']; 
    isLoading: boolean;
    onBack: () => void;
    onSelectScreen: (id: number) => void;
    onInstall: (brick: SystemBrick, zone: string) => void;
    onUpdate: (id: number, updates: any) => void;
    onDelete: (id: number) => void;
    // ⚡ FIX: Updated signature to accept version
    onPublish: (id: number, version: string, notes: string) => Promise<void>;
    onRefresh: () => void;
    onDragEnd: (e: DragEndEvent) => void;
}

export const StudioEditor: React.FC<StudioEditorProps> = (props) => {
    const { token } = theme.useToken();
    const { notify } = useNotification();
    const { screen, apps, screens, lastRelease, isLoading, onBack, onSelectScreen, onInstall, onUpdate, onDelete, onPublish, onRefresh, onDragEnd } = props;

    // 🕵️ TELEMETRY
    useEffect(() => {
        logger.tell("STUDIO_EDITOR", "👁️ Editor Active", {
            screen: screen?.title,
            lastVersion: lastRelease?.latest_version
        });
    }, [screen, lastRelease]);

    const [selectedComponentId, setSelectedComponentId] = useState<number | null>(null);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [activeDragItem, setActiveDragItem] = useState<any>(null);

    // ⚡ PUBLISH STATE
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [publishComment, setPublishComment] = useState('');
    const [nextVersion, setNextVersion] = useState('');

    // ⚡ SEMVER CALCULATOR
    const calculateNextVersion = (current: string) => {
        if (!current || current === 'auto' || current === '0.0.0') return '1.0.0';
        const parts = current.split('.');
        if (parts.length < 3) return `${current}.1`;
        const patch = parseInt(parts[2], 10) + 1;
        return `${parts[0]}.${parts[1]}.${patch}`;
    };

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveDragItem(event.active.data.current?.brick);
    };

    const handleDragEndInternal = (event: DragEndEvent) => {
        setActiveDragItem(null);
        onDragEnd(event);
    };

    const handleSaveClick = () => {
        onRefresh();
        notify.success("Workspace synced");
    };

    const handlePublishClick = () => {
        setPublishComment('');
        const currentVer = lastRelease?.latest_version || 'auto';
        const next = calculateNextVersion(currentVer);
        setNextVersion(next);
        setIsPublishModalOpen(true);
    };

    const handlePublishConfirm = async () => {
        if (screen?.id) {
            // ⚡ FIX: Pass the user-edited version string
            await onPublish(screen.id, nextVersion, publishComment || `Release ${nextVersion}`);
            setIsPublishModalOpen(false);
        }
    };

    const handleComponentSelect = (id: number) => {
        setSelectedComponentId(id);
        setIsConfigOpen(true);
    };

    const handleConfigClose = () => {
        setIsConfigOpen(false);
        setSelectedComponentId(null);
    };

    const handleDeleteWrapper = async (id: number) => {
        await onDelete(id);
        handleConfigClose();
    };

    const appMenu: MenuProps['items'] = [
        { key: 'lobby', label: 'Back to Lobby', icon: <HomeOutlined />, onClick: onBack },
        { type: 'divider' },
        ...screens.map(s => ({
            key: s.id,
            label: s.title,
            icon: <AppstoreOutlined />,
            onClick: () => onSelectScreen(s.id)
        }))
    ];

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEndInternal}>
            <Layout style={{ height: '100vh', overflow: 'hidden' }}>
                <Header style={{ 
                    background: token.colorBgContainer, 
                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                    padding: '0 24px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    height: 64, zIndex: 10
                }}>
                    <Space>
                        <Button icon={<ArrowLeftOutlined />} type="text" onClick={onBack} />
                        <Dropdown menu={{ items: appMenu }} trigger={['click']}>
                            <div style={{ cursor: 'pointer', lineHeight: '1.2', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Title level={5} style={{ margin: 0 }}>{screen?.title || 'Unknown App'}</Title>
                                        <DownOutlined style={{ fontSize: 10, color: token.colorTextSecondary }} />
                                    </div>
                                    <Space size={4} style={{ fontSize: 12, color: token.colorTextSecondary }}>
                                        <Badge status="processing" text="Draft" />
                                        {lastRelease?.latest_version && (
                                            <>
                                                <span>•</span>
                                                <ClockCircleOutlined /> 
                                                <span>Last: {lastRelease.latest_version}</span>
                                            </>
                                        )}
                                    </Space>
                                </div>
                            </div>
                        </Dropdown>
                    </Space>

                    <Space>
                        <Button icon={<SettingOutlined />}>Settings</Button>
                        <Button icon={<SaveOutlined />} onClick={handleSaveClick}>Save</Button>
                        <Button type="primary" icon={<PlayCircleOutlined />} onClick={handlePublishClick}>Publish</Button>
                    </Space>
                </Header>

                <Layout>
                    <Sider 
                        width={300} 
                        theme="light" 
                        collapsible 
                        collapsed={isSidebarCollapsed}
                        onCollapse={setIsSidebarCollapsed}
                        style={{ borderRight: `1px solid ${token.colorBorderSecondary}` }}
                    >
                        {!isSidebarCollapsed && <BrickLibrary onInstall={onInstall} />}
                    </Sider>

                    <Content style={{ background: token.colorBgLayout, padding: 24, overflow: 'auto' }}>
                        <div style={{ 
                            maxWidth: 1200, margin: '0 auto', height: '100%', 
                            background: token.colorBgContainer, borderRadius: token.borderRadiusLG, 
                            boxShadow: token.boxShadowSecondary, minHeight: 800 
                        }}>
                            <ScreenCanvas 
                                apps={apps} 
                                onSelect={handleComponentSelect} 
                                onDropBrick={() => {}} 
                                isLoading={isLoading}
                                selectedAppId={selectedComponentId}
                            />
                        </div>
                    </Content>

                    <Drawer
                        title="Configure Component"
                        placement="right"
                        width={400}
                        onClose={handleConfigClose}
                        open={isConfigOpen}
                        mask={false}
                        style={{ marginTop: 64 }}
                        getContainer={false}
                    >
                        {selectedComponentId && (
                            <AppConfigurator 
                                app={apps?.find(a => a.id === selectedComponentId) || null}
                                allApps={apps} 
                                onSave={onUpdate}
                                onDelete={handleDeleteWrapper}
                                isLoading={isLoading}
                            />
                        )}
                    </Drawer>
                </Layout>

                <Modal 
                    title="Publish New Release"
                    open={isPublishModalOpen}
                    onOk={handlePublishConfirm} 
                    onCancel={() => setIsPublishModalOpen(false)}
                    confirmLoading={isLoading}
                    okText="Publish & Deploy"
                >
                    <div style={{ marginBottom: 16 }}>
                         <Text strong style={{ display: 'block', marginBottom: 4 }}>Version Label</Text>
                         <Input 
                            prefix="v" 
                            value={nextVersion} 
                            onChange={e => setNextVersion(e.target.value)} 
                            placeholder="1.0.0" 
                        />
                         <Text type="secondary" style={{ fontSize: 12 }}>
                             Previous: {lastRelease?.latest_version || 'N/A'}
                         </Text>
                    </div>
                    <div>
                        <Text strong style={{ display: 'block', marginBottom: 4 }}>Release Notes</Text>
                        <TextArea 
                            rows={4} 
                            value={publishComment} 
                            onChange={e => setPublishComment(e.target.value)} 
                            placeholder="What changed in this version?"
                        />
                    </div>
                </Modal>

                <DragOverlay>
                    {activeDragItem ? (
                        <div style={{ opacity: 0.9, transform: 'scale(1.05)' }}>
                            <DraggableBrick brick={activeDragItem} />
                        </div>
                    ) : null}
                </DragOverlay>
            </Layout>
        </DndContext>
    );
};

