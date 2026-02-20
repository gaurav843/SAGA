// FILEPATH: frontend/src/domains/meta/features/governance/types/index.ts
// @file: Governance Type Definitions
// @author: The Engineer
// @description: Contracts for Policy Management and Logic Building.
// @security-level: LEVEL 9 (Type Safety) */

import { PolicyResolutionStrategy, RuleActionType, RuleEventType } from "../../../types/constants";

// --- CONSEQUENCES (The Verdicts) ---
export interface Consequence {
    id: string; // Unique ID for React keys
    type: RuleActionType;
    params: {
        message?: string;       // For BLOCK/WARN
        target_field?: string;  // For SET_VALUE, HIDE, REQUIRE
        value?: any;            // For SET_VALUE
        event_key?: string;     // For TRIGGER_EVENT
        template_id?: string;   // For NOTIFY
        [key: string]: any;     // Extension point
    };
}

// --- RULES ---
export interface Rule {
    id: string; // React Key
    logic: string; // JMESPath expression (e.g. "host.amount > 100")
    
    // ⚡ ENTERPRISE UPGRADE: Multi-Vector Consequences
    consequences: Consequence[];
    
    // Metadata
    description?: string;
    is_active: boolean;
}

// --- POLICIES ---
export interface Policy {
    id: number;
    key: string;
    name: string;
    description?: string;
    resolution: PolicyResolutionStrategy;
    rules: Rule[];
    tags: string[];
    is_active: boolean;
    
    // Ledger Metadata
    version_major: number;
    version_minor: number;
    is_latest: boolean;
    created_at: string;
    updated_at?: string;
    version_display: string;
}

export interface PolicyDraft {
    id?: number;
    key: string;
    name: string;
    description: string;
    resolution: PolicyResolutionStrategy;
    rules: Rule[];
    tags: string[];
    is_active: boolean;
}

export const DEFAULT_POLICY_DRAFT: PolicyDraft = {
    key: "",
    name: "",
    description: "",
    resolution: PolicyResolutionStrategy.ALL_MUST_PASS,
    rules: [],
    tags: [],
    is_active: true
};

// --- SCHEMA REFLECTION (For Dropdowns) ---
export interface SelectOption {
    label: string;
    value: string;
}

export interface SchemaField {
    key: string;
    label: string;
    data_type: string;
    widget_type?: string;
    options?: SelectOption[];
    is_system?: boolean;
    is_dynamic?: boolean;
    
    // ⚡ GROUPING: For the Omni-Picker
    group?: 'HOST' | 'ACTOR' | 'SYSTEM' | string; 
}

// --- SIMULATION ---
export interface DryRunRequest {
    policy: PolicyDraft;
    context: Record<string, any>;
}

export interface DryRunResult {
    is_valid: boolean;
    blocking_errors: string[];
    warnings: string[];
    mutations: Array<{ target: string; value: any }>;
    side_effects: Array<{ type: string; value: any }>;
}
