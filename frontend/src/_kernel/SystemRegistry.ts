// FILEPATH: frontend/src/_kernel/SystemRegistry.ts
// @file: System Registry (Legacy Shim)
// @role: 💀 Legacy Kernel Compatibility Layer */
// @author: The Engineer
// @description: Keeps the app alive by catching legacy calls from 'CapabilitiesContext' or 'SystemContext'.
// @status: ZOMBIE (Logic Removed, Interfaces Preserved)


import { logger } from '../platform/logging/Narrator';

// --- TYPES (Kept for compatibility to prevent TS errors) ---
export interface CapabilityItem {
    label: string;
    value: string;
    key?: string;
}

export interface ContextField {
    key: string;
    label: string;
    type: string;
    description: string;
}

export interface SystemCapabilities {
    version: string;
    actions: CapabilityItem[];
    triggers: CapabilityItem[];
    widgets: CapabilityItem[];
    data_types: CapabilityItem[];
    context_schema: {
        system: ContextField[];
        actor: ContextField[];
    };
}

// --- SAFE MODE DEFAULTS ---
const SAFE_MODE_CAPS: SystemCapabilities = {
    version: "LEGACY_SHIM",
    actions: [],
    triggers: [],
    widgets: [],
    data_types: [],
    context_schema: { system: [], actor: [] }
};

const _capabilities: SystemCapabilities = SAFE_MODE_CAPS;

export const SystemRegistry = {
    /**
     * @deprecated Legacy init method.
     */
    init: async () => {
        logger.warn("SYSTEM", "💀 [SystemRegistry] Legacy 'init' called. Redirecting...");
        return _capabilities;
    },

    /**
     * @deprecated Legacy initialize method (CRASH FIX).
     */
    initialize: async () => {
        logger.warn("SYSTEM", "💀 [SystemRegistry] Legacy 'initialize' called. Redirecting...");
        return _capabilities;
    },

    /**
     * @deprecated Legacy boot method.
     */
    boot: async () => {
        logger.warn("SYSTEM", "💀 [SystemRegistry] Legacy 'boot' called. Redirecting...");
        return _capabilities;
    },

    /**
     * @deprecated Accessor.
     */
    getCapabilities: () => _capabilities
};

