/* FILEPATH: frontend/src/domains/meta/features/states/components/DomainPicker.tsx */
/* @file Domain Picker (Resilient Dropdown) */
/* @author The Engineer */
/* @description A pure, high-density dropdown for domain selection.
 * UPDATED: Handles loading state gracefully.
 */

import React from 'react';
import { Select, Spin } from 'antd';
import type { DomainSummary } from '@kernel/types';

interface DomainPickerProps {
    domains: DomainSummary[];
    onSelect: (domainKey: string) => void;
    isLoading: boolean;
    value?: string;
}

export const DomainPicker: React.FC<DomainPickerProps> = ({ domains, onSelect, isLoading, value }) => {
    // ⚡ SAFETY: Ensure we have an array
    const safeDomains = Array.isArray(domains) ? domains : [];
    
    // Only block with spinner if we have NO data to show
    const showSpinner = isLoading && safeDomains.length === 0;

    const options = safeDomains.map(d => ({
        label: `${d.label} (${d.key})`,
        value: d.key,
    }));

    return (
        <Select
            showSearch
            style={{ width: '100%' }} 
            placeholder={showSpinner ? "Loading Registry..." : "Select Domain..."}
            optionFilterProp="label"
            onChange={(val) => {
                console.log(`%c[USER] Selected Domain: ${val}`, 'color: #e91e63');
                onSelect(val);
            }}
            value={value}
            options={options}
            loading={showSpinner}
            disabled={showSpinner}
            // Fix for AntD v5 style warning
            popupMatchSelectWidth={false}
        />
    );
};

