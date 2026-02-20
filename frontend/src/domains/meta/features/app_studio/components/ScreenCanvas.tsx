// FILEPATH: frontend/src/domains/meta/features/app_studio/components/ScreenCanvas.tsx
// @file: Zone-Aware Screen Canvas
// @role: 🎨 UI Presentation */
// @author: The Engineer
// @description: Renders the Application Wireframe with nested Container support.
// @security-level: LEVEL 9 (UI Safe) */
// @invariant: Must visually represent the layout structure accurately, including hierarchy. */

import React from 'react';
import { theme, Typography, Space, Tag } from 'antd';
import { useDroppable } from '@dnd-kit/core';
import { HolderOutlined } from '@ant-design/icons';
import { ActiveApp } from '../types';
import { IconFactory } from './IconFactory';

const { Text } = Typography;

// ⚡ SUB-COMPONENT: DROP ZONE
const DropZone: React.FC<{ 
    zone: string; 
    apps: ActiveApp[]; 
    activeAppId?: number;
    orientation?: 'horizontal' | 'vertical';
    onSelect?: (id: number) => void;
}> = ({ zone, apps, activeAppId, orientation = 'vertical', onSelect }) => {
    const { token } = theme.useToken();
    const { setNodeRef, isOver } = useDroppable({
        id: `zone-${zone}`,
        data: { type: 'ZONE', zone }
    });

    // ⚡ RECURSIVE RENDERER
    const renderTree = (parentId: number | null) => {
        // Filter items for this zone AND this parent
        const items = apps
            .filter(a => a.placement.zone === zone && (a.parent_app_id || null) === parentId)
            .sort((a, b) => a.order - b.order);

        if (items.length === 0 && parentId === null && !isOver) {
            return (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: token.colorTextQuaternary }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>{zone}</Text>
                </div>
            );
        }

        return items.map(app => {
            // Check if this item is a CONTAINER
            const isContainer = app.type === 'CONTAINER' || app.scope_type === 'CONTAINER';
            // Recursively get children
            const children = renderTree(app.id);
            const hasChildren = items.some(child => child.parent_app_id === app.id); // Check logic might need optimization, but recursion handles render

            return (
                <div 
                    key={app.id}
                    onClick={(e) => { e.stopPropagation(); onSelect?.(app.id); }}
                    style={{
                        padding: '8px 12px',
                        background: activeAppId === app.id ? token.colorPrimaryBg : token.colorFillQuaternary,
                        border: `1px solid ${activeAppId === app.id ? token.colorPrimary : token.colorBorder}`,
                        borderRadius: 6,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column', // Stack children vertically
                        gap: 8,
                        minWidth: orientation === 'horizontal' ? 140 : 'auto',
                        width: isContainer && orientation === 'vertical' ? '100%' : 'auto'
                    }}
                >
                    {/* APP HEADER */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                        <HolderOutlined style={{ color: token.colorTextQuaternary, cursor: 'grab' }} />
                        <IconFactory icon={app.icon || 'antd:AppstoreOutlined'} style={{ color: token.colorPrimary }} />
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <Text style={{ fontSize: 13 }} strong ellipsis>{app.label}</Text>
                            <div style={{ fontSize: 10, color: token.colorTextTertiary }}>{app.type}</div>
                        </div>
                        {isContainer && <Tag style={{ fontSize: 9 }}>GROUP</Tag>}
                    </div>

                    {/* APP CHILDREN (If Container) */}
                    {isContainer && (
                        <div style={{ 
                            paddingLeft: 16, 
                            borderLeft: `2px solid ${token.colorBorderSecondary}`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                            width: '100%',
                            minHeight: 20 // Visual hint it can take items
                        }}>
                           {children} 
                           {/* Empty placeholder for group */}
                           {React.Children.count(children) === 0 && (
                                <Text type="secondary" style={{ fontSize: 10, fontStyle: 'italic' }}>Empty Group</Text>
                           )}
                        </div>
                    )}
                </div>
            );
        });
    };

    return (
        <div 
            ref={setNodeRef}
            style={{ 
                flex: 1,
                minHeight: orientation === 'vertical' ? '100%' : 80,
                minWidth: orientation === 'horizontal' ? '100%' : 200,
                padding: 12,
                borderRadius: 8,
                border: isOver ? `2px dashed ${token.colorPrimary}` : `1px solid ${token.colorBorderSecondary}`,
                background: isOver ? token.colorPrimaryBg : token.colorBgContainer,
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: orientation === 'vertical' ? 'column' : 'row',
                gap: 8,
                overflow: 'auto'
            }}
        >
            {renderTree(null)}
        </div>
    );
};

interface ScreenCanvasProps {
    apps: ActiveApp[];
    onSelect: (appId: number) => void;
    onDropBrick: (brick: any) => void;
    isLoading?: boolean;
    selectedAppId?: number | null;
}

export const ScreenCanvas: React.FC<ScreenCanvasProps> = ({ apps, onSelect, selectedAppId }) => {
    const { token } = theme.useToken();

    return (
        <div style={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 16, 
            padding: 24,
            background: token.colorBgLayout
        }}>
            
            {/* 1. TOP BAR */}
            <div style={{ height: 100, display: 'flex' }}>
                <DropZone 
                    zone="TOP_BAR" 
                    apps={apps} 
                    orientation="horizontal" 
                    activeAppId={selectedAppId || undefined} 
                    onSelect={onSelect}
                />
            </div>

            {/* 2. MIDDLE SECTION */}
            <div style={{ flex: 1, display: 'flex', gap: 16, minHeight: 0 }}>
                {/* 2A. SIDEBAR */}
                <div style={{ width: 250, display: 'flex' }}>
                    <DropZone 
                        zone="SIDEBAR" 
                        apps={apps} 
                        orientation="vertical"
                        activeAppId={selectedAppId || undefined} 
                        onSelect={onSelect}
                    />
                </div>

                {/* 2B. MAIN CONTENT */}
                <div style={{ flex: 1, display: 'flex' }}>
                    <DropZone 
                        zone="MAIN" 
                        apps={apps} 
                        orientation="vertical"
                        activeAppId={selectedAppId || undefined} 
                        onSelect={onSelect}
                    />
                </div>
            </div>

            {/* 3. BOTTOM BAR */}
            <div style={{ height: 80, display: 'flex' }}>
                <DropZone 
                    zone="BOTTOM_BAR" 
                    apps={apps} 
                    orientation="horizontal" 
                    activeAppId={selectedAppId || undefined} 
                    onSelect={onSelect}
                />
            </div>

        </div>
    );
};

