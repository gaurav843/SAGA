// FILEPATH: frontend/src/platform/workflow/wizard-engine/renderers/SmartGridRenderer.tsx
// @file: Smart Grid Renderer (Dynamic Logic Edition)
// @author: ansav8@gmail.com
// @description: Renders a Server-Side Data Grid with Context-Aware Actions.
// @security-level: LEVEL 9 (Icon Safe + Dynamic Scope)
// @updated: Fixed logic to switch between 'create_flow' and 'edit_flow'. Added key-reset.

import React, { useRef, useState } from 'react';
import { ProTable, type ProColumns, type ActionType } from '@ant-design/pro-components';
import { Button, Popconfirm, message, Space, Tag, theme, Modal } from 'antd';

import { UniversalResourceService } from '../../../../api/services/UniversalResourceService';
import type { WizardFieldSchema, RenderContext } from '../types';

import { logger } from '../../../logging';
import { WizardPlayer } from '../../components/WizardPlayer';
import { IconFactory } from '../../../ui/icons/IconFactory';

interface SmartGridRendererProps {
    field: WizardFieldSchema;
    context: RenderContext;
}

export const SmartGridRenderer: React.FC<SmartGridRendererProps> = ({ field, context }) => {
    const { token } = theme.useToken();
    const actionRef = useRef<ActionType>();

    // Local State for "Sub-Wizard"
    const [editingId, setEditingId] = useState<number | string | undefined>(undefined);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // 1. CONFIGURATION EXTRACTION
    const targetDomain = field.options?.[0]?.value || context.domain;
    
    // ⚡ DYNAMIC SCOPE LOGIC
    // We read these from the Backend Schema (passed via 'field')
    const createScope = (field as any).create_flow || field.placeholder || 'USER_CREATE';
    const editScope = (field as any).edit_flow || field.placeholder || 'USER_EDIT';

    const fetchData = async (params: any, sort: any, filter: any) => {
        try {
            const { current, pageSize, _timestamp, ...filters } = params;
            const combinedFilters = { ...filters, ...filter };

            logger.whisper("GRID", `📡 Fetching [${targetDomain}] Page ${current}`, combinedFilters);

            const response = await UniversalResourceService.listResourcesApiV1ResourceDomainGet(
                targetDomain, 
                current || 1, 
                pageSize || 10,
                combinedFilters 
            );

            return {
                data: response.items,
                success: true,
                total: response.total
            };
        } catch (error: any) {
            logger.scream("GRID", "🔥 Data Fetch Failed", error);
            return { data: [], success: false, total: 0 };
        }
    };

    const handleEdit = (record: any) => {
        logger.trace("GRID", `✏️ Edit Request: ID [${record.id}] -> Scope [${editScope}]`);
        setEditingId(record.id);
        setIsEditModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        try {
            await UniversalResourceService.deleteResourceApiV1ResourceDomainIdDelete(targetDomain, id);
            message.success('Record deleted');
            actionRef.current?.reload();
        } catch (error: any) {
            const msg = error?.body?.detail || "Delete failed";
            message.error(msg);
            logger.scream("GRID", "🔥 Delete Failed", error);
        }
    };

    const handleCreate = () => {
        logger.trace("GRID", `✨ Create Request -> Scope [${createScope}]`);
        setEditingId(undefined);
        setIsEditModalOpen(true);
    };

    const handleWizardClose = () => {
        setIsEditModalOpen(false);
        setEditingId(undefined);
        actionRef.current?.reload(); 
    };

    const columns: ProColumns[] = (field.columns || []).map(col => ({
        title: col.title, 
        dataIndex: col.dataIndex,
        valueType: (col.valueType as any) || 'text',
        hideInSearch: col.hideInSearch,
        hideInTable: col.hideInTable,
        valueEnum: col.valueEnum
    }));

    columns.push({
        title: 'Actions',
        valueType: 'option',
        key: 'option',
        render: (text, record, _, action) => [
            <a key="edit" onClick={() => handleEdit(record)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <IconFactory icon="antd:EditOutlined" /> Edit
            </a>,
            <Popconfirm
                key="delete"
                title="Delete this record?"
                onConfirm={() => handleDelete(record.id)}
            >
                <a style={{ color: token.colorError, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <IconFactory icon="antd:DeleteOutlined" /> Delete
                </a>
            </Popconfirm>,
        ],
    });

    // ⚡ CALCULATE ACTIVE SCOPE
    const activeScope = editingId ? editScope : createScope;

    return (
        <div style={{ 
            background: token.colorBgContainer, 
            padding: 16, 
            borderRadius: 8, 
            border: `1px solid ${token.colorBorderSecondary}`,
            boxShadow: token.boxShadowTertiary,
            marginTop: 16
        }}>
            <ProTable
                headerTitle={
                    <Space>
                        <span style={{ fontSize: 16, fontWeight: 600 }}>{field.label}</span>
                        <Tag color="blue">{targetDomain}</Tag>
                    </Space>
                }
                actionRef={actionRef}
                rowKey="id"
                search={{ labelWidth: 'auto', defaultCollapsed: false }}
                toolBarRender={() => [
                    <Button 
                        key="button" 
                        type="primary"
                        onClick={handleCreate}
                        icon={<IconFactory icon="antd:PlusOutlined" />}
                    >
                        Add New
                    </Button>,
                    <Button 
                        key="refresh" 
                        onClick={() => actionRef.current?.reload()}
                        icon={<IconFactory icon="antd:ReloadOutlined" />}
                    />
                ]}
                request={fetchData}
                columns={columns}
                pagination={{ pageSize: 10 }}
                options={{ density: true, fullScreen: true, reload: true, setting: true }}
            />

            <Modal
                open={isEditModalOpen}
                onCancel={handleWizardClose}
                footer={null}
                width={800}
                destroyOnClose // ⚡ CRITICAL: Wipes state on close
                title={null}
                styles={{ body: { padding: 0 } }}
            >
                {/* ⚡ MOUNT WIZARD WITH DYNAMIC SCOPE */}
                {isEditModalOpen && (
                    <WizardPlayer 
                        // ⚡ KEY CHANGE: Force remount if ID changes
                        key={`${activeScope}_${editingId || 'new'}`} 
                        domain={targetDomain} 
                        scope={activeScope} 
                        entityId={editingId} 
                        onClose={handleWizardClose} 
                    />
                )}
            </Modal>
        </div>
    );
};
