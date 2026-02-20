// FILEPATH: frontend/src/domains/system/types.ts
// @file: System Type Contracts (The Protocol)
// @author: ansav8@gmail.com
// @description: TypeScript definitions for System Domain.
// UPDATED: Added KernelScope and nested structure for the Control Tree.

export interface SystemIdentity {
    name: string;
    environment: string; // DEV, STAGING, PROD
    is_maintenance: boolean;
}

export interface SystemVersioning {
    engine: string;      // v2.5.0 (Code)
    schema: string;      // Hash (DB)
    content: string;     // v1.0.1 (User Logic)
}

export interface SystemHealth {
    database: 'CONNECTED' | 'DISCONNECTED' | 'DEGRADED';
    latency: string;
    modules_active: number;
}

// The Aggregate Payload
export interface SystemPulse {
    identity: SystemIdentity;
    versioning: SystemVersioning;
    health: SystemHealth;
}

// ⚡ NEW: Governance Types

export interface KernelScope {
    id: number;
    key: string;
    label: string;
    type: string; // WIZARD, JOB, GOVERNANCE
    target_field?: string;
    config?: Record<string, any>;
}

export interface KernelDomain {
    key: string;
    label: string;
    is_active: boolean;
    is_virtual: boolean;
    config?: Record<string, any>;
    updated_at?: string;
    // ⚡ NEW: Hierarchy
    scopes?: KernelScope[];
}

export interface SystemConfig {
    id: number;
    key: string;
    label: string;
    description?: string;
    value_type: 'STRING' | 'BOOLEAN' | 'NUMBER' | 'JSON';
    value_raw: string;
    category: string;
    is_active: boolean;
    is_encrypted: boolean;
}
