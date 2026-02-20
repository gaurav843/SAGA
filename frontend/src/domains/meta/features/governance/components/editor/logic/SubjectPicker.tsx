// FILEPATH: frontend/src/domains/meta/features/governance/components/editor/logic/SubjectPicker.tsx
// @file: Subject Picker (SVO Component)
// @author: The Engineer
// @description: Smart Context Selector with Lazy Loading, Module Grouping, and State Hydration.
// @security-level: LEVEL 9 (Data Access) */

import React, { useState, useMemo, useEffect } from 'react';
import { Select, Cascader, Tabs, Spin, Tag, Space, Typography, theme } from 'antd';
import { 
    DatabaseOutlined, UserOutlined, GlobalOutlined, 
    AppstoreOutlined
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

import { API_BASE_URL } from '@/config';
import { type SchemaField } from '@/domains/meta/features/governance/types';

const { Text } = Typography;

interface SubjectPickerProps {
    value?: string;
    onChange: (path: string) => void;
    hostFields: SchemaField[];
    contextFields: SchemaField[]; // Actor + System
    currentDomain: string;
}

export const SubjectPicker: React.FC<SubjectPickerProps> = ({ 
    value, onChange, hostFields, contextFields, currentDomain 
}) => {
    const { token } = theme.useToken();
    const [activeTab, setActiveTab] = useState<string>('HOST');
    const [selectedGlobalDomain, setSelectedGlobalDomain] = useState<string | null>(null);

    // ⚡ STATE HYDRATION: Restore tab and domain from existing value
    useEffect(() => {
        if (value && !selectedGlobalDomain) {
            // Check known roots
            if (value.startsWith('host.')) {
                setActiveTab('HOST');
                return;
            }
            if (value.startsWith('actor.') || value.startsWith('system.')) {
                setActiveTab('CONTEXT');
                return;
            }
            
            // Assume Global Domain (e.g., "user.email" -> Domain "USER")
            const parts = value.split('.');
            if (parts.length > 1) {
                const potentialDomain = parts[0].toUpperCase();
                // Ensure it's not one of our reserved keywords
                if (!['HOST', 'ACTOR', 'SYSTEM', 'CONTEXT'].includes(potentialDomain)) {
                    setActiveTab('GLOBAL');
                    setSelectedGlobalDomain(potentialDomain);
                }
            }
        }
    }, [value]); // Only run when value changes (e.g. initial load)

    // ⚡ LAZY LOAD: Global Domain List
    const { data: globalDomains = [], isLoading: loadingDomains } = useQuery({
        queryKey: ['meta', 'domains', 'list'],
        queryFn: async () => {
            const res = await axios.get(`${API_BASE_URL}/api/v1/meta/domains`);
            return res.data;
        },
        enabled: activeTab === 'GLOBAL'
    });

    // ⚡ DATA TRANSFORM: Group Domains by Module
    const groupedGlobalDomains = useMemo(() => {
        const groups: Record<string, any[]> = {};
        globalDomains.forEach((d: any) => {
            const groupName = d.module_label || 'General';
            if (!groups[groupName]) groups[groupName] = [];
            groups[groupName].push({ label: d.label, value: d.key });
        });

        return Object.entries(groups)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([label, options]) => ({
                label,
                options: options.sort((a, b) => a.label.localeCompare(b.label))
            }));
    }, [globalDomains]);

    // ⚡ LAZY LOAD: Specific Domain Schema
    const { data: globalFields = [], isLoading: loadingSchema } = useQuery({
        queryKey: ['meta', 'schema', selectedGlobalDomain],
        queryFn: async () => {
            if (!selectedGlobalDomain) return [];
            const res = await axios.get(`${API_BASE_URL}/api/v1/meta/schema/${selectedGlobalDomain}`);
            return Object.values(res.data.fields || {}).map((f: any) => ({
                key: `${selectedGlobalDomain.toLowerCase()}.${f.key}`, // Namespace it
                label: f.label,
                data_type: f.data_type,
                group: 'GLOBAL'
            }));
        },
        enabled: !!selectedGlobalDomain
    });

    // --- RENDERERS ---

    const renderFieldOptions = (fields: SchemaField[]) => (
        fields.map(f => ({
            label: (
                <Space>
                    <Text>{f.label}</Text>
                    <Tag style={{ fontSize: 9, marginRight: 0 }}>{f.data_type}</Tag>
                </Space>
            ),
            value: f.key
        }))
    );

    const HostTab = () => (
        <Select
            showSearch
            style={{ width: '100%' }}
            placeholder={`Search ${currentDomain} fields...`}
            options={renderFieldOptions(hostFields)}
            value={value?.startsWith('host.') ? value : undefined}
            onChange={onChange}
            listHeight={300}
            suffixIcon={<DatabaseOutlined />}
            filterOption={(input, option) => 
                (option?.value as string).toLowerCase().includes(input.toLowerCase())
            }
        />
    );

    const ContextTab = () => (
        <Cascader
            options={[
                { 
                    label: 'Actor (User)', 
                    value: 'actor', 
                    children: renderFieldOptions(contextFields.filter(f => f.group === 'ACTOR')) 
                },
                { 
                    label: 'System (Env)', 
                    value: 'system', 
                    children: renderFieldOptions(contextFields.filter(f => f.group === 'SYSTEM')) 
                }
            ]}
            placeholder="Select Context Variable..."
            expandTrigger="hover"
            style={{ width: '100%' }}
            onChange={(val) => {
                if (val && val.length > 0) onChange(val[val.length - 1] as string);
            }}
        />
    );

    const GlobalTab = () => (
        <Space direction="vertical" style={{ width: '100%' }}>
            <Select 
                placeholder="Select External Domain..."
                style={{ width: '100%' }}
                loading={loadingDomains}
                options={groupedGlobalDomains}
                onChange={setSelectedGlobalDomain}
                value={selectedGlobalDomain}
                suffixIcon={<AppstoreOutlined />}
            />
            
            {selectedGlobalDomain && (
                loadingSchema ? <Spin size="small" /> :
                <Select
                    placeholder={`Select ${selectedGlobalDomain} Field...`}
                    style={{ width: '100%' }}
                    showSearch
                    options={renderFieldOptions(globalFields)}
                    value={value} // ⚡ FIX: Binding Value
                    onChange={onChange}
                    status={!value ? 'warning' : undefined}
                    filterOption={(input, option) => 
                        (option?.value as string).toLowerCase().includes(input.toLowerCase())
                    }
                />
            )}
        </Space>
    );

    return (
        <div style={{ width: '100%' }}>
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                type="card"
                size="small"
                items={[
                    { 
                        key: 'HOST', 
                        label: <span><DatabaseOutlined /> {currentDomain}</span>, 
                        children: <HostTab /> 
                    },
                    { 
                        key: 'CONTEXT', 
                        label: <span><UserOutlined /> Context</span>, 
                        children: <ContextTab /> 
                    },
                    { 
                        key: 'GLOBAL', 
                        label: <span><GlobalOutlined /> Global</span>, 
                        children: <GlobalTab /> 
                    }
                ]}
                tabBarStyle={{ marginBottom: 8 }}
            />
        </div>
    );
};

