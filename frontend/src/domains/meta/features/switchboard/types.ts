// FILEPATH: frontend/src/domains/meta/features/switchboard/types.ts
// @file: Switchboard Types (Manifest Driven)
// @author: The Engineer
// @description: Defines the 'Dumb UI' shapes for the Switchboard.
// The UI knows nothing about 'Policies' or 'Groups', only 'Rows' and 'Columns'.


export interface SwitchboardUIColumn {
    key: string;
    label: string;
    data_type: string;
    icon?: string;
    color?: string;
}

export interface SwitchboardUIAction {
    key: string;
    label: string;
    icon?: string;
    danger: boolean;
    requires_confirmation: boolean;
    confirmation_text?: string;
}

export interface SwitchboardManifest {
    columns: SwitchboardUIColumn[];
    actions: SwitchboardUIAction[];
    // We use `any` here because the row structure is entirely dynamic and driven by the backend schema
    data: any[]; 
}

// --- OPTIONS (Used by the Assignment Modal) ---
export type BindingScope = 'GLOBAL' | 'DOMAIN' | 'PROCESS' | 'TRANSITION' | 'FIELD' | 'JOB';

export interface BindingDraft {
    // Logic: Must provide either policy_id OR policy_group_id
    policy_id?: number;
    policy_group_id?: number;
    
    binding_type: 'ENTITY';
    target_domain: string;
    target_scope: BindingScope;
    target_context?: string;
    priority: number;
    is_active: boolean;
}

// Kept for modal dropdowns
export interface PolicyDefinition {
    id: number;
    key: string;
    name: string;
    description?: string;
    is_active: boolean;
}
