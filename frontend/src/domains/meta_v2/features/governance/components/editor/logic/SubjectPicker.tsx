/* FILEPATH: frontend/src/domains/meta_v2/features/governance/components/editor/logic/SubjectPicker.tsx */
/* @file: Subject Picker (SVO Component - V2) */
/* @role: 🎨 UI Presentation */
/* @author: The Engineer */
/* @description: Smart Context Selector. Strict TS bindings, avoids AntD click-interception, deep telemetry. */
/* @security-level: LEVEL 9 (Data Access) */
/* @narrator: Emits explicit string paths for the Logic Compiler. */

import React, { useState, useMemo, useEffect } from 'react';
import { Select, Cascader, Tabs, Spin, Space } from 'antd';
import { DatabaseOutlined, UserOutlined, GlobalOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

import { API_BASE_URL } from '@/config';
import { logger } from '@/platform/logging/Narrator';
import { useCapabilities } from '@/_kernel/CapabilitiesContext';

// ⚡ STRICT TYPING: Resolves VSCode Interface missing property errors
interface SchemaField {
    key: string;
    label: string;
    data_type?: string; 
    type?: string; // Fallback for context fields
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
    
    // ⚡ FIX: Use pure strings. Prevents AntD `rc-select` from intercepting clicks on internal spans!
    const renderHostFieldOptions = (fields: SchemaField[]) => {
        if (!fields || !Array.isArray(fields)) return [];
        return fields.map(f => ({
            label: `${f.label} [${f.data_type || f.type || 'ANY'}]`, // Safe primitive string
            value: `host.${f.key}` // ⚡ ENFORCED PREFIX for JMESPath Engine
        }));
    };

    const renderGlobalFieldOptions = (fields: SchemaField[]) => {
        if (!fields || !Array.isArray(fields)) return [];
        return fields.map(f => ({
            label: `${f.label} [${f.data_type || f.type || 'ANY'}]`, 
            value: f.key
        }));
    };

    // ⚡ DYNAMIC CASCADER OPTIONS
    const contextOptions = useMemo(() => {
        return Object.entries(contextSchema).map(([namespace, fields]) => ({
            label: namespace.charAt(0).toUpperCase() + namespace.slice(1),
            value: namespace,
            // Cascader needs the exact final value at the leaf node
            children: (fields || []).map((f: SchemaField) => ({
                label: `${f.label} [${f.type || f.data_type || 'ANY'}]`, 
                value: `${namespace}.${f.key}` 
            }))
        }));
    }, [contextSchema]);


    const HostTab = () => (
        <Select
            showSearch
            style={{ width: '100%' }}
            placeholder={`Search ${currentDomain} fields...`}
            options={renderHostFieldOptions(hostFields)}
            value={value || undefined} // ⚡ FIX: undefined prevents empty string rendering crash
            onChange={(val: string) => {
                logger.trace("UI", `Selected Host field`, { field: val });
                onChange(val);
            }}
            listHeight={300}
            suffixIcon={<DatabaseOutlined />}
            // ⚡ TS FIX: Safely coerce label to String for filtering
            filterOption={(input, option) => 
                String(option?.label || '').toLowerCase().includes(input.toLowerCase()) ||
                String(option?.value || '').toLowerCase().includes(input.toLowerCase())
            }
        />
    );

    const ContextTab = () => (
        <Cascader
            options={contextOptions}
            placeholder="Select Context Variable..."
            expandTrigger="hover"
            style={{ width: '100%' }}
            // ⚡ FIX: Reconstruct array path for Cascader (e.g., 'actor.id' -> ['actor', 'actor.id'])
            value={value && value.includes('.') ? [value.split('.')[0], value] : undefined}
            onChange={(val) => {
                // ⚡ TS FIX: Narrow type explicitly for the Cascader array
                if (Array.isArray(val) && val.length > 0) {
                    const finalPath = val[val.length - 1] as string;
                    logger.trace("UI", `Selected Context field`, { field: finalPath });
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
                    { key: 'HOST', label: <span><DatabaseOutlined /> {currentDomain}</span>, children: <HostTab /> },
                    { key: 'CONTEXT', label: <span><UserOutlined /> Context</span>, children: <ContextTab /> },
                    { key: 'GLOBAL', label: <span><GlobalOutlined /> Global</span>, children: <GlobalTab /> }
                ]}
                tabBarStyle={{ marginBottom: 8 }}
            />
        </div>
    );
};