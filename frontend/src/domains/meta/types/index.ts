// FILEPATH: frontend/src/domains/meta/types/index.ts
// @file: Meta Domain Type Definitions
// @role: 📦 Data Structure */
// @author: The Engineer
// @description: Centralizes type definitions for the Meta Domain. Acts as the SSOT for Domain/Scope shapes.
// @security-level: LEVEL 0 (Core Types) */

// 1. Re-export Constants (Preserves existing imports)
export * from './constants';

import { type ScopeType } from './constants';

// --- KERNEL PROPERTIES ---

export interface DomainTypeProperties {
    storage_strategy: "TABLE" | "KV_STORE" | "NONE";
    api_strategy: "CRUD" | "REFLECT" | "READ_ONLY";
    supports_meta: boolean;
    supports_activity: boolean;
}

export interface DomainTypeDefinition {
    key: string;
    label: string;
    icon?: string;
    color?: string;
    description?: string;
    properties: DomainTypeProperties;
}

// --- SUMMARIES (Lists) ---

export interface ScopeSummary {
    key: string;
    label: string;
    type: ScopeType | string;
    target_field?: string;
    mode?: string;
    config?: Record<string, any>;
    
    // ⚡ RUNTIME STATE (Injected by Hypervisor)
    circuit_state?: {
        ui?: "NOMINAL" | "HALTED" | "MAINTENANCE";
        api?: "NOMINAL" | "HALTED" | "MAINTENANCE";
    };
}

export interface DomainSummary {
    key: string;
    label: string;
    
    // Dynamic Type
    type: string; 
    type_def?: DomainTypeDefinition;

    // Topology
    system_module: string;
    module_label: string;
    module_icon: string;
    
    // ⚡ HIERARCHY (The Tree Link)
    parent_domain?: string | null;

    // Visuals
    icon?: string;
    description?: string;
    
    // Capabilities
    scopes: ScopeSummary[];
    
    // Runtime Config
    is_active: boolean;
    config?: Record<string, any>;
}

// --- CONTEXT STATE ---

export interface MetaContextState {
    // Selection
    selectedDomain: DomainSummary | null;
    selectedScope: ScopeSummary | null;
    selectedItem: string | null;

    // Data
    domains: DomainSummary[];
    isLoading: boolean;
    error: string | null;
    
    // Actions
    selectDomain: (key: string) => void;
    selectScope: (key: string) => void;
    selectItem: (id: string | null) => void;
    refresh: () => void;
}

