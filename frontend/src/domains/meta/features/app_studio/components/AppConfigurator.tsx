// FILEPATH: frontend/src/domains/meta/features/app_studio/components/AppConfigurator.tsx
// @file: App Configurator Panel (v3.3 - Strict Hierarchy)
// @role: 🎨 UI Presentation */
// @author: The Engineer
// @description: The Inspector. Now supports Parent/Child relationships with strict Container filtering.
// @security-level: LEVEL 9 (UI Safe) */
// @invariant: Must handle missing 'config' objects gracefully. Only nesting under CONTAINERS is allowed. */

import React, { useEffect, useMemo } from 'react';
import { Form, Input, Select, Button, Typography, Divider, Tag, Empty, Alert, Tabs, Checkbox, TreeSelect } from 'antd';
import { ActiveApp } from '../types';
import { IconPicker } from './IconPicker';
import { DeleteOutlined, SaveOutlined, InfoCircleOutlined, LockOutlined, SettingOutlined, FolderOpenOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

interface AppConfiguratorProps {
    app: ActiveApp | null;
    allApps?: ActiveApp[];
    onSave: (appId: number, changes: any) => void;
    onDelete: (appId: number) => void;
    isLoading: boolean;
}

export const AppConfigurator: React.FC<AppConfiguratorProps> = ({ app, allApps = [], onSave, onDelete, isLoading }) => {
    const [form] = Form.useForm();

    // ⚡ HIERARCHY LOGIC: Build Tree Options for Parent Selection
    const parentOptions = useMemo(() => {
        if (!app) return [];
        
        // ⚡ STRICT FILTER: Only allow nesting under CONTAINERS in the SIDEBAR
        // FIX: Check both 'type' (Runtime) and 'scope_type' (Static) to ensure compatibility
        const validParents = allApps.filter(a => 
            a.id !== app.id && 
            a.placement.zone === 'SIDEBAR' && 
            (a.type === 'CONTAINER' || a.scope_type === 'CONTAINER')
        ); 
        
        return validParents.map(p => ({
            value: p.id,
            // ⚡ FIX: Safe access to config.label with fallbacks
            title: p.config?.label || p.label || p.scope_key,
            icon: <FolderOpenOutlined />
        }));
    }, [allApps, app]);

    useEffect(() => {
        if (app) {
            // 🛡️ SAFE ACCESS
            const config = app.config || {};
            const placement = app.placement || {};
            const security = app.security_policy || {};
            const intent = config.intent || {};

            form.setFieldsValue({
                // Identity
                label: config.label || app.label || app.scope_key,
                icon: config.icon || app.icon || 'antd:AppstoreOutlined',
                keywords: intent.keywords || [], 
                
                // Placement & Hierarchy
                zone: placement.zone || 'SIDEBAR',
                order: placement.order || 0,
                parent_app_id: app.parent_app_id || null, 
                
                // Behavior (Polymorphic)
                mode: intent.mode || 'VIEW', 
                target: intent.target || '',
                
                // Security
                roles: security.roles || ['admin', 'manager', 'user'],
                policy_mode: security.mode || 'allow'
            });
        }
    }, [app, form]);

    if (!app) {
        return (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
                <Empty 
                    image={Empty.PRESENTED_IMAGE_SIMPLE} 
                    description="Select an App on the canvas to edit properties." 
                />
            </div>
        );
    }

    const handleFinish = (values: any) => {
        const changes = {
            config: {
                label: values.label,
                icon: values.icon,
                intent: { 
                    mode: values.mode,
                    target: values.target,
                    keywords: values.keywords 
                }
            },
            placement: {
                zone: values.zone,
                order: Number(values.order)
            },
            parent_app_id: values.parent_app_id,
            security_policy: {
                mode: values.policy_mode,
                roles: values.roles
            }
        };
        onSave(app.id, changes);
    };

    // ⚡ DYNAMIC FIELDS based on Brick Type
    const renderBehaviorFields = () => {
        const brickType = app.type || app.scope_type; // Normalized type check

        switch(brickType) {
            case 'WIZARD':
                return (
                    <>
                        <Form.Item label="Wizard Mode" name="mode">
                            <Select>
                                <Option value="CREATE">Create New Record</Option>
                                <Option value="EDIT">Edit Existing Record</Option>
                                <Option value="VIEW">Read-Only View</Option>
                            </Select>
                        </Form.Item>
                    </>
                );
            case 'VIEW':
                return (
                    <>
                        <Form.Item label="Data Source" name="target">
                            <Input placeholder="e.g. API:USERS_LIST" />
                        </Form.Item>
                        <Form.Item label="Default View" name="mode">
                            <Select>
                                <Option value="TABLE">Table</Option>
                                <Option value="KANBAN">Kanban Board</Option>
                                <Option value="LIST">List</Option>
                            </Select>
                        </Form.Item>
                    </>
                );
            case 'CONTAINER':
                return <Alert message="This item can act as a parent for other apps." type="success" style={{fontSize: 12}} showIcon />;
            default:
                return <Alert message={`No behavioral settings for this ${brickType} component.`} type="info" style={{fontSize: 12}} />;
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={5} style={{ margin: 0 }}>Inspector</Title>
                    <Tag color="blue">{app.type || app.scope_type}</Tag>
                </div>
                <Text type="secondary" style={{ fontSize: 10 }}>{app.scope_key} (ID: {app.id})</Text>
            </div>

            {/* Form Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 0 }}>
                <Form form={form} layout="vertical" onFinish={handleFinish}>
                    <Tabs defaultActiveKey="1" items={[
                        {
                            key: '1',
                            label: 'General',
                            icon: <SettingOutlined />,
                            children: (
                                <div style={{ padding: 24 }}>
                                    <Form.Item label="Label" name="label" rules={[{ required: true }]}>
                                        <Input />
                                    </Form.Item>
                                    
                                    <Form.Item label="Icon" name="icon">
                                        <IconPicker />
                                    </Form.Item>
                                    
                                    <Form.Item label="Search Keywords" name="keywords" help="Press Enter to add tags (e.g. 'urgent', 'daily')">
                                        <Select mode="tags" placeholder="Add keywords..." tokenSeparators={[',']} />
                                    </Form.Item>

                                    <Divider style={{ margin: '12px 0' }} />
                                    
                                    <Form.Item label="Zone" name="zone">
                                        <Select>
                                            <Option value="SIDEBAR">Sidebar</Option>
                                            <Option value="TOP_BAR">Top Bar</Option>
                                            <Option value="BOTTOM_BAR">Footer</Option>
                                            <Option value="USER_MENU">User Avatar Menu</Option> 
                                        </Select>
                                    </Form.Item>

                                    {/* ⚡ HIERARCHY SELECTOR */}
                                    <Form.Item 
                                        label="Parent Folder" 
                                        name="parent_app_id"
                                        help="Nest this app under a Menu Group."
                                    >
                                        <TreeSelect
                                            treeData={parentOptions}
                                            placeholder={parentOptions.length === 0 ? "No Containers Available" : "None (Root Level)"}
                                            allowClear
                                            treeDefaultExpandAll
                                            disabled={parentOptions.length === 0}
                                        />
                                    </Form.Item>
                                    
                                    {/* ⚡ HINT FOR USERS */}
                                    {parentOptions.length === 0 && app.placement.zone === 'SIDEBAR' && (
                                         <Alert 
                                            type="warning" 
                                            showIcon
                                            style={{ marginBottom: 16, fontSize: 11 }}
                                            message="To create a sub-menu, add a 'Menu Group' brick to the Sidebar first." 
                                         />
                                    )}

                                    <Form.Item label="Order" name="order">
                                        <Input type="number" />
                                    </Form.Item>
                                </div>
                            )
                        },
                        {
                            key: '2',
                            label: 'Behavior',
                            icon: <InfoCircleOutlined />,
                            children: (
                                <div style={{ padding: 24 }}>
                                    {renderBehaviorFields()}
                                </div>
                            )
                        },
                        {
                            key: '3',
                            label: 'Security',
                            icon: <LockOutlined />,
                            children: (
                                <div style={{ padding: 24 }}>
                                    <Form.Item label="Access Mode" name="policy_mode">
                                        <Select>
                                            <Option value="allow">Allow Selected Roles</Option>
                                            <Option value="deny">Deny Selected Roles</Option>
                                        </Select>
                                    </Form.Item>
                                    <Form.Item label="Roles" name="roles">
                                        <Checkbox.Group style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            <Checkbox value="admin">Admin</Checkbox>
                                            <Checkbox value="manager">Manager</Checkbox>
                                            <Checkbox value="user">Standard User</Checkbox>
                                            <Checkbox value="guest">Guest</Checkbox>
                                        </Checkbox.Group>
                                    </Form.Item>
                                </div>
                            )
                        }
                    ]} tabBarStyle={{ padding: '0 24px' }} />

                    {/* Actions */}
                    <div style={{ padding: 24, borderTop: '1px solid #f0f0f0', background: '#fff' }}>
                        <Button type="primary" icon={<SaveOutlined />} htmlType="submit" loading={isLoading} block style={{ marginBottom: 12 }}>
                            Apply
                        </Button>
                        <Button danger icon={<DeleteOutlined />} onClick={() => onDelete(app.id)} disabled={isLoading} block type="text">
                            Uninstall
                        </Button>
                    </div>
                </Form>
            </div>
        </div>
    );
};

