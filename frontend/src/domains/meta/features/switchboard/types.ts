/* FILEPATH: frontend/src/domains/meta/features/switchboard/types.ts */
/* @file Switchboard Types */
/* @author The Engineer */
/* @description Defines the shapes for Policies and Bindings.
 * MATCHES: backend/app/core/meta/schemas.py (PolicyBindingRead, BindingDraft)
 * REFACTOR: Replaced 'policy_tag' with 'policy_group_id'.
 */

import type { PolicyGroup } from '../policy_groups/types';

// --- 1. THE ATOM (Policy) ---
export interface PolicyDefinition {
    id: number;
    key: string;
    name: string;
    description?: string;
    rules: any[];
    tags: string[];
    is_active: boolean;
    version_major: number;
    version_minor: number;
    is_latest: boolean;
}

// --- 2. THE ASSIGNMENT (Binding) ---
export interface PolicyBinding {
    id: number;
    
    // Source Polymorphism (One is always set)
    policy_id?: number;
    policy_group_id?: number; // ⚡ NEW: Strict Link to Group Entity
    
    // Expanded Relations (For UI display)
    policy?: PolicyDefinition;
    group?: PolicyGroup;      // ⚡ NEW: Expanded Group Data

    // Target Polymorphism
    binding_type: 'ENTITY'; 
    target_domain: string;
    target_scope: BindingScope;
    target_context?: string;
    
    priority: number;
    is_active: boolean;
}

// --- 3. OPTIONS ---
export type BindingScope = 'GLOBAL' | 'DOMAIN' | 'PROCESS' | 'TRANSITION' | 'FIELD' | 'JOB';

export interface BindingDraft {
    // ⚡ Logic: Must provide either policy_id OR policy_group_id
    policy_id?: number;
    policy_group_id?: number;
    
    binding_type: 'ENTITY';
    target_domain: string;
    target_scope: BindingScope;
    target_context?: string;
    priority: number;
    is_active: boolean;
}

