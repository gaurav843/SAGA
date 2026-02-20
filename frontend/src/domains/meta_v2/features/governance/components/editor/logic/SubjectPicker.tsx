// FILEPATH: frontend/src/domains/meta_v2/features/governance/components/editor/logic/SubjectPicker.tsx
// @file: Subject Picker (SVO Component - V2)
// @role: 🎨 UI Presentation */
// @author: The Engineer
// @description: Smart Context Selector. Strict TS bindings, avoids AntD click-interception, deep telemetry.
// @security-level: LEVEL 9 (Data Access) */
// @narrator: Emits explicit string paths for the Logic Compiler. */

import React, { useState, useMemo, useEffect } from 'react';
import { Select, Cascader, Tabs, Spin, Space } from 'antd';
import { DatabaseOutlined, UserOutlined, GlobalOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

import { API_BASE_URL } from '@/config';
import { logger } from '@/platform/logging/Narrator';
import { useCapabilities } from '@/_kernel/CapabilitiesContext';

// ⚡ STRICT TYPING: Removed 'any' to satisfy ESLint
interface SchemaField {
    key: string;
    label: string;
    data_type?: string; 
    type?: string; 
    [key: string]: unknown;
}

interface SubjectPickerProps {
    value?: string;
    onChange: (path: string) => void;
    hostFields: SchemaField[];
    currentDomain: string;
}

// Interfaces for API Responses to avoid 'any'
interface GlobalDomainItem {
    key: string;
    label: string;
    module_label?: string;
}

interface GlobalSchemaField {
    key: string;
    label: string;
    data_type?: string;
}

export const SubjectPicker: React.FC<SubjectPickerProps> = ({ 
    value, onChange, hostFields, currentDomain 
}) => {
    const [activeTab, setActiveTab] = useState<string>('HOST');
    const [selectedGlobalDomain, setSelectedGlobalDomain] = useState<string | null>(null);

    // ⚡ THE DUMB UI LINK: Read Context safely using the Registry accessor
    const registry = useCapabilities();
    const capabilities = registry.getCapabilities();
    const contextSchema = (capabilities?.context_schema as Record<string, SchemaField[]>) || {};
    const dynamicContextRoots = Object.keys(contextSchema);

    // ⚡ STATE HYDRATION: Restore tab and domain from existing value robustly
    useEffect(() => {
        if (!value) return;

        // 1. Check Context Roots (e.g. actor., system.)
        if (dynamicContextRoots.some(root => value.startsWith(`${root}.`))) {
            setActiveTab('CONTEXT');
            return;
        }
        
        // 2. Check Global Domain (e.g., "USER.email")
        const parts = value.split('.');
        if (parts.length > 1) {
            const potentialDomain = parts[0].toUpperCase();
            // Ensure it's not a known root or 'HOST'
            if (potentialDomain !== 'HOST' && !dynamicContextRoots.map(r => r.toUpperCase()).includes(potentialDomain)) {
                setActiveTab('GLOBAL');
                setSelectedGlobalDomain(potentialDomain);
                return;
            }
        }

        // 3. Fallback to Host (Any un-prefixed field or explicitly 'host.email')
        setActiveTab('HOST');
    }, [value, dynamicContextRoots]);

    // ⚡ LAZY LOAD: Global Domain List
    const { data: globalDomains = [], isLoading: loadingDomains } = useQuery({
        queryKey: ['meta_v2', 'domains', 'list'],
        queryFn: async () => {
            const res = await axios.get(`${API_BASE_URL}/api/v1/meta/domains`);
            return res.data as GlobalDomainItem[];
        },
        enabled: activeTab === 'GLOBAL'
    });

    const groupedGlobalDomains = useMemo(() => {
        const groups: Record<string, {label: string, value: string}[]> = {};
        globalDomains.forEach((d) => {
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
        queryKey: ['meta_v2', 'schema', selectedGlobalDomain],
        queryFn: async () => {
            if (!selectedGlobalDomain) return [];
            const res = await axios.get<{fields: Record<string, GlobalSchemaField>}>(`${API_BASE_URL}/api/v1/meta/schema/${selectedGlobalDomain}`);
            return Object.values(res.data.fields || {}).map((f) => ({
                key: `${selectedGlobalDomain.toLowerCase()}.${f.key}`,
                label: f.label,
                data_type: f.data_type,
                group: 'GLOBAL'
            })) as SchemaField[];
        },
        enabled: !!selectedGlobalDomain
    });

    // --- RENDERERS ---
    
    const renderHostFieldOptions = (fields: SchemaField[]) => {
        if (!fields || !Array.isArray(fields)) return [];
        return fields.map(f => ({
            label: `${f.label} [${f.data_type || f.type || 'ANY'}]`, 
            value: `host.${f.key}` 
        }));
    };

    const renderGlobalFieldOptions = (fields: SchemaField[]) => {
        if (!fields || !Array.isArray(fields)) return [];
        return fields.map(f => ({
            label: `${f.label} [${f.data_type || f.type || 'ANY'}]`, 
            value: f.key
        }));
    };

    const contextOptions = useMemo(() => {
        return Object.entries(contextSchema).map(([namespace, fields]) => ({
            label: namespace.charAt(0).toUpperCase() + namespace.slice(1),
            value: namespace,
            children: (fields || []).map((f: SchemaField) => ({
                label: `${f.label} [${f.type || f.data_type || 'ANY'}]`, 
                value: `${namespace}.${f.key}` 
            }))
        }));
    }, [contextSchema]);

    // ⚡ CRITICAL FIX: Convert from Components to standard Render Functions 
    // This stops the "Cannot create components during render" crash.
    const renderHostTab = () => (
        <Select
            showSearch
            style={{ width: '100%' }}
            placeholder={`Search ${currentDomain} fields...`}
            options={renderHostFieldOptions(hostFields)}
            value={value || undefined}
            onChange={(val: string) => {
                logger.trace("UI", `Selected Host field`, { field: val });
                onChange(val);
            }}
            listHeight={300}
            suffixIcon={<DatabaseOutlined />}
            filterOption={(input, option) => 
                String(option?.label || '').toLowerCase().includes(input.toLowerCase()) ||
                String(option?.value || '').toLowerCase().includes(input.toLowerCase())
            }
        />
    );

    const renderContextTab = () => (
        <Cascader
            options={contextOptions}
            placeholder="Select Context Variable..."
            expandTrigger="hover"
            style={{ width: '100%' }}
            value={value && value.includes('.') ? [value.split('.')[0], value] : undefined}
            onChange={(val) => {
                if (Array.isArray(val) && val.length > 0) {
                    const finalPath = val[val.length - 1] as string;
                    logger.trace("UI", `Selected Context field`, { field: finalPath });
                    onChange(finalPath);
                }
            }}
        />
    );

    const renderGlobalTab = () => (
        <Space direction="vertical" style={{ width: '100%' }}>
            <Select 
                placeholder="Select External Domain..."
                style={{ width: '100%' }}
                loading={loadingDomains}
                options={groupedGlobalDomains}
                onChange={(val: string) => setSelectedGlobalDomain(val)}
                value={selectedGlobalDomain}
                suffixIcon={<AppstoreOutlined />}
            />
            {selectedGlobalDomain && (
                loadingSchema ? <Spin size="small" /> :
                <Select
                    placeholder={`Select ${selectedGlobalDomain} Field...`}
                    style={{ width: '100%' }}
                    showSearch
                    options={renderGlobalFieldOptions(globalFields)}
                    value={value || undefined}
                    onChange={(val: string) => {
                        logger.trace("UI", `Selected Global field`, { field: val });
                        onChange(val);
                    }}
                    status={!value ? 'warning' : undefined}
                    filterOption={(input, option) => 
                        String(option?.label || '').toLowerCase().includes(input.toLowerCase()) ||
                        String(option?.value || '').toLowerCase().includes(input.toLowerCase())
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
                    { key: 'HOST', label: <span><DatabaseOutlined /> {currentDomain}</span>, children: renderHostTab() },
                    { key: 'CONTEXT', label: <span><UserOutlined /> Context</span>, children: renderContextTab() },
                    { key: 'GLOBAL', label: <span><GlobalOutlined /> Global</span>, children: renderGlobalTab() }
                ]}
                tabBarStyle={{ marginBottom: 8 }}
            />
        </div>
    );
};
