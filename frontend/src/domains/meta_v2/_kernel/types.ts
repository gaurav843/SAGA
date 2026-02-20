// FILEPATH: frontend/src/domains/meta_v2/_kernel/types.ts
// @file: Kernel Type Definitions
// @role: 🧠 Core Types */
// @author: The Engineer
// @description: Strict type definitions for the Context-Driven Architecture.
// @security-level: LEVEL 0 (Kernel) */
// @invariant: Must match Backend Pydantic Models in 'app.core.kernel.registry.schemas'. */
// @updated: Added 'WorkflowTypeRead' for V3 Dynamic Workflow Types. */

// KERNEL PROPERTIES
export interface ScopeConfig {
  [key: string]: any;
  target_field?: string; // For Governance/Sub-Flow: Which DB column does this control?
  mode?: string;         // For Wizards: "CREATE" or "EDIT"
  queue?: string;        // For Jobs: "high_priority" etc.
}

export interface DomainTypeProperties {
  storage_strategy: "TABLE" | "KV_STORE" | "NONE";
  api_strategy: "CRUD" | "REFLECT" | "READ_ONLY" | "NONE";
  supports_meta: boolean;
  supports_activity: boolean;
}

// ⚡ LEVEL 7: DYNAMIC TYPE DEFINITION (From DB: kernel_domain_types)
export interface DomainTypeDefinition {
  key: string;
  label: string;
  icon?: string;
  color?: string;
  description?: string;
  properties: DomainTypeProperties; // ⚡ FIX: Added strictly typed properties bag to receive Backend Contract
}

// ⚡ V3: DYNAMIC WORKFLOW TYPE (From DB: meta_workflow_types)
export interface WorkflowTypeRead {
  key: string;            // 'WIZARD', 'JOB'
  label: string;          // 'Interactive Wizard'
  description?: string;
  ui_config: {            // Frontend Hints
    icon?: string;
    color?: string;
    [key: string]: any;
  };
  validation_schema: Record<string, any>; // JSON Schema
  created_at: string;
}

// --- SUMMARIES (Lists) ---
export interface ScopeSummary {
  key: string;
  label: string;
  type: string; // WIZARD, VIEW, JOB
  target_field?: string;
  mode?: string;
  config?: ScopeConfig;
  // ⚡ RUNTIME STATE (Injected by Hypervisor)
  circuit_state?: {
    ui: "NOMINAL" | "HALTED" | "MAINTENANCE";
    api: "NOMINAL" | "HALTED" | "MAINTENANCE";
  };
}

export interface DomainSummary {
  key: string;
  label: string;
  
  // ⚡ DYNAMIC TYPE (Data-Driven)
  type: string; // "STANDARD", "CONFIG", "SYSTEM"
  type_def?: DomainTypeDefinition; // Matches 'backend/app/domains/system/features/domain_types/models.py'
  
  // ⚡ TOPOLOGY METADATA (Level 100)
  system_module: string; // "AUTH", "LOGISTICS"
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
  // 1. Registry (The Menu)
  registry: DomainSummary[];
  
  // ⚡ V3 STATE: The Rules of Physics
  workflowTypes: WorkflowTypeRead[]; 
  
  // 2. Selection (The Focus)
  selectedDomainKey: string | null;
  selectedScopeKey: string | null;
  
  // ⚡ GLOBAL ITEM STATE (Fixes Refresh Amnesia)
  // Stores the full object so we don't have to re-find it constantly
  selectedDomain: DomainSummary | null;
  selectedScope: ScopeSummary | null;

  // 3. Data Access
  isLoading: boolean;
  error: string | null;
  
  // 4. Actions
  refresh: () => Promise<void>;
  selectDomain: (key: string | null) => void;
  selectScope: (key: string | null) => void;
}

