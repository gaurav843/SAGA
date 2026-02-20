// FILEPATH: frontend/src/domains/meta_v2/_kernel/logic.ts
// @file: Kernel Capability Engine
// @role: 🧠 Pure Logic */
// @author: The Engineer
// @description: Calculates features based on Backend Domain Properties. Zero UI dependencies.
// @security-level: LEVEL 9 (Logic Safe) */
// @updated: Removed 'SYS' magic string. Now uses strict type checking. */

import { type DomainSummary, type ActiveContext, type KernelCapabilities } from './types';

/**
 * @description Decodes the Domain Properties into UI Capabilities.
 * @invariant Must rely STRICTLY on 'type_def.properties' from the Backend. No magic strings.
 */
export const calculateCapabilities = (domain: DomainSummary): KernelCapabilities => {
    // 🛡️ SAFETY: Handle missing type definitions gracefully (Legacy fallback)
    const props = domain.type_def?.properties || {
        storage_strategy: 'NONE',
        api_strategy: 'NONE',
        supports_meta: false,
        supports_activity: false
    };

    return {
        // 1. Dictionary: Only if the domain supports Custom Attributes (Metadata)
        canEditSchema: props.supports_meta === true,

        // 2. Workflows: Only if the domain logs Activity/State Transitions
        canEditWorkflows: props.supports_activity === true,

        // 3. Governance: If it has an API, it needs Rules.
        // We exclude 'NONE' (Virtual domains) but include 'READ_ONLY'.
        canGovern: props.api_strategy !== 'NONE',

        // 4. Data Browser: Only if we can CRUD the data via standard API.
        canBrowseData: props.api_strategy === 'CRUD'
    };
};

/**
 * @description Factory that builds the Context Object from a selected Domain.
 */
export const buildActiveContext = (domain: DomainSummary): ActiveContext => {
    const capabilities = calculateCapabilities(domain);

    // ⚡ FIX: Use the Domain Type classification, NOT the hardcoded 'SYS' key.
    const isSystem = domain.type === 'SYSTEM';

    return {
        key: domain.key,
        label: domain.label,
        type: isSystem ? 'SYSTEM' : 'DOMAIN',
        capabilities,
        source: domain
    };
};

