// FILEPATH: frontend/src/domains/meta/_kernel/types.ts
// @file: Meta-Kernel Types
// @author: The Engineer
// @description: Shared type definitions for the Meta Module state.
// @security-level: LEVEL 0 (Kernel Definition) */
// @invariant: Must match Backend Pydantic Models in 'app.core.kernel.registry.schemas'. */
// @updated: Added 'selectedItem' for Global Deep Linking. */

// ⚡ LEVEL 6: SCOPE TOPOLOGY (Matches Backend Registry)
export interface ScopeConfig {
  key: string;            // e.g. "LIFECYCLE", "REGISTER"
  label: string;          // e.g. "Account Status", "New User Wizard"
  type: 'GOVERNANCE' | 'SUB_FLOW' | 'WIZARD' | 'ACTION' | 'VIEW' | 'JOB' | 'CONTAINER';
  
  // For Governance/Sub-Flow: Which DB column does this control?
  target_field?: string | null;
  
  // For Wizards: "CREATE" or "EDIT"
  // For Jobs: "high_priority" etc.
  mode?: string | null;
  
  // Generic Configuration
  config?: Record<string, any>;
}

// ⚡ LEVEL 7: DYNAMIC TYPE DEFINITION (From DB: kernel_domain_types)
export interface DomainTypeProperties {
    api_strategy: 'CRUD' | 'READ_ONLY' | 'REFLECT' | 'NONE';
    storage_strategy: 'TABLE' | 'KV_STORE' | 'NONE';
    supports_meta: boolean;
    supports_activity: boolean;
}

export interface DomainTypeDefinition {
  key: string;        // e.g. "CONFIG", "INFRA"
  label: string;      // e.g. "Configuration Store"
  icon?: string;      // e.g. "antd:SettingOutlined"
  color?: string;     // e.g. "purple", "#f50"
  description?: string;
  
  // ⚡ FIX: Added strictly typed properties bag to receive Backend Contract
  properties?: DomainTypeProperties;
}

export interface DomainSummary {
  key: string;
  label: string;
  
  // ⚡ DYNAMIC TYPE (Data-Driven)
  // Matches 'backend/app/domains/system/features/domain_types/models.py'
  type: string;
  type_def?: DomainTypeDefinition; // Injected by Backend Relationship

  // ⚡ TOPOLOGY METADATA (Level 100)
  system_module: string;      // e.g. "AUTH", "SYSTEM"
  module_label: string;       // e.g. "Identity & Access"
  module_icon: string;        // e.g. "antd:LockOutlined"
  parent_domain?: string | null; // e.g. "USER" (for "USER_PREFS")

  // Visuals
  icon?: string;              // Legacy/Fallback icon
  description?: string;
  
  // Capabilities
  scopes: ScopeConfig[];
}

export interface MetaContextState {
  // Selection State (Deep Linking)
  selectedDomainKey: string;
  setSelectedDomainKey: (key: string) => void;
  
  selectedScope: string;
  setSelectedScope: (scope: string) => void;

  // ⚡ GLOBAL ITEM STATE (Fixes Refresh Amnesia)
  selectedItem: string | null;
  setSelectedItem: (key: string | null) => void;

  // Data Access
  domainList: DomainSummary[];
  activeDomain: DomainSummary | undefined;
  isLoadingDomains: boolean;
}
