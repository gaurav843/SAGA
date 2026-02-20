// FILEPATH: frontend/src/domains/meta_v2/features/governance/components/editor/logic/SubjectPicker.tsx
// @file: Subject Picker (SVO Component - V2)
// @role: 🎨 UI Presentation */
// @author: The Engineer
// @description: Smart Context Selector.
// UPDATED: Stripped hardcoded contexts. Now dynamically builds Cascader
// from Backend Capabilities context_schema (Dumb UI Pattern).

// @security-level: LEVEL 9 (Data Access) */

import React, { useState, useMemo, useEffect } from 'react';
import { Select, Cascader, Tabs, Spin, Tag, Space, Typography, theme } from 'antd';
import { DatabaseOutlined, UserOutlined, GlobalOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

import { API_BASE_URL } from '@/config';
import { logger } from '@/platform/logging/Narrator';
import { useCapabilities } from '@/_kernel/CapabilitiesContext';

const { Text } = Typography;

interface SchemaField {
    key: string;
    label: string;
    data_type: string;
    [key: string]: any;
}

interface SubjectPickerProps {
    value?: string;
    onChange: (path: string) => void;
    hostFields: SchemaField[];
    currentDomain: string;
}

export const SubjectPicker: React.FC<SubjectPickerProps> = ({ 
    value, onChange, hostFields, currentDomain 
}) => {
    const { token } = theme.useToken();
    const [activeTab, setActiveTab] = useState<string>('HOST');
    const [selectedGlobalDomain, setSelectedGlobalDomain] = useState<string | null>(null);

    // ⚡ THE DUMB UI LINK: Read Context directly from Kernel Capabilities
    const { capabilities } = useCapabilities();
    const contextSchema = capabilities?.context_schema || {};
    const dynamicContextRoots = Object.keys(contextSchema);

    // ⚡ STATE HYDRATION: Restore tab and domain from existing value
    useEffect(() => {
        if (value && !selectedGlobalDomain) {
            // Check Host
            if (value.startsWith('host.')) {
                setActiveTab('HOST');
                return;
            }
            
            // Check Dynamic Context Roots (e.g. actor., system., config.)
            if (dynamicContextRoots.some(root => value.startsWith(`${root}.`))) {
                setActiveTab('CONTEXT');
                return;
            }
            
            // Assume Global Domain (e.g., "user.email" -> Domain "USER")
            const parts = value.split('.');
            if (parts.length > 1) {
                const potentialDomain = parts[0].toUpperCase();
                // Ensure it's not a known root
                if (potentialDomain !== 'HOST' && !dynamicContextRoots.map(r => r.toUpperCase()).includes(potentialDomain)) {
                    setActiveTab('GLOBAL');
                    setSelectedGlobalDomain(potentialDomain);
                }
            }
        }
    }, [value, dynamicContextRoots, selectedGlobalDomain]);

    // ⚡ LAZY LOAD: Global Domain List
    const { data: globalDomains = [], isLoading: loadingDomains } = useQuery({
        queryKey: ['meta_v2', 'domains', 'list'],
        queryFn: async () => {
            const res = await axios.get(`${API_BASE_URL}/api/v1/meta/domains`);
            return res.data;
        },
        enabled: activeTab === 'GLOBAL'
    });

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
                options: options.sort((a: any, b: any) => a.label.localeCompare(b.label))
            }));
    }, [globalDomains]);

    // ⚡ LAZY LOAD: Specific Domain Schema
    const { data: globalFields = [], isLoading: loadingSchema } = useQuery({
        queryKey: ['meta_v2', 'schema', selectedGlobalDomain],
        queryFn: async () => {
            if (!selectedGlobalDomain) return [];
            const res = await axios.get(`${API_BASE_URL}/api/v1/meta/schema/${selectedGlobalDomain}`);
            return Object.values(res.data.fields || {}).map((f: any) => ({
                key: `${selectedGlobalDomain.toLowerCase()}.${f.key}`,
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

    // ⚡ DYNAMIC CASCADER (Builds options from Backend schema payload)
    const contextOptions = useMemo(() => {
        return Object.entries(contextSchema).map(([namespace, fields]) => ({
            label: namespace.charAt(0).toUpperCase() + namespace.slice(1),
            value: namespace,
            children: renderFieldOptions((fields as any[]).map(f => ({
                key: `${namespace}.${f.key}`,
                label: f.label,
                data_type: f.type || 'ANY'
            })))
        }));
    }, [contextSchema]);

    const HostTab = () => (
        <Select
            showSearch
            style={{ width: '100%' }}
            placeholder={`Search ${currentDomain} fields...`}
            options={renderFieldOptions(hostFields)}
            value={value?.startsWith('host.') ? value : undefined}
            onChange={(val) => {
                logger.whisper("UI", `Selected Host field: ${val}`);
                onChange(val);
            }}
            listHeight={300}
            suffixIcon={<DatabaseOutlined />}
            filterOption={(input, option) => 
                (option?.value as string).toLowerCase().includes(input.toLowerCase())
            }
        />
    );

    const ContextTab = () => (
        <Cascader
            options={contextOptions}
            placeholder="Select Context Variable..."
            expandTrigger="hover"
            style={{ width: '100%' }}
            value={value ? value.split('.') : []}
            onChange={(val) => {
                if (val && val.length > 0) {
                    const finalPath = val[val.length - 1] as string;
                    logger.whisper("UI", `Selected Context field: ${finalPath}`);
                    onChange(finalPath);
                }
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
                    value={value}
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
                    { key: 'HOST', label: <span><DatabaseOutlined /> {currentDomain}</span>, children: <HostTab /> },
                    { key: 'CONTEXT', label: <span><UserOutlined /> Context</span>, children: <ContextTab /> },
                    { key: 'GLOBAL', label: <span><GlobalOutlined /> Global</span>, children: <GlobalTab /> }
                ]}
                tabBarStyle={{ marginBottom: 8 }}
            />
        </div>
    );
};

