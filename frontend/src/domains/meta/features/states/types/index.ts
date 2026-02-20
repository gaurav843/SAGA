/* FILEPATH: frontend/src/domains/meta/features/states/types/index.ts */
/* @file State Engine Types */
/* @author The Engineer */
/* @description Shared definitions for the Visual Workflow Editor. 
 * UPDATED: Added 'governed_field' for Composite Workflows.
 */

// --- BACKEND CONTRACT (XState JSON) ---
export interface StateDefinition {
  id: number;
  entity_key: string; // Domain (e.g. USER)
  scope: string;      // Context (e.g. LIFECYCLE)
  
  // ⚡ NEW: The Composite Column Target
  // Default is 'status'. Can be 'approval_state', 'shipping_stage', etc.
  governed_field: string; 

  name: string;
  initial_state: string;
  transitions: XStateDefinition;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

// Strict XState v5 Schema
export interface XStateDefinition {
  id: string;
  initial: string;
  states: Record<string, XStateNode>;
}

export interface XStateNode {
  on?: Record<string, string | { target: string; actions?: string[]; guard?: string }>;
  meta?: {
    description?: string;
    color?: string; // For UI rendering
    x?: number;     // Persisted position
    y?: number;
  };
}

// --- FRONTEND MODEL (ProFlow / ReactFlow) ---
export interface FlowNodeData {
  label: string;
  isInitial?: boolean;
  description?: string;
  color?: string;
  // Metadata for the Inspector
  actions?: string[]; 
}

export interface FlowEdgeData {
  event: string; // The trigger name (e.g. "SUBMIT")
  guard?: string;
  actions?: string[];
}

export interface StateMachineDraft {
    domain: string;
    scope: string;
    name: string;
    
    // ⚡ NEW: Must specify which column to control
    governed_field: string;

    definition: XStateDefinition;
}

