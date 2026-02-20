// FILEPATH: frontend/src/platform/kernel/types.ts
// @file: Kernel Types
// @author: The Engineer
// @description: Shared definitions for the Operating System Core.

export interface ProcessStep {
  key: string;
  label: string;
  route: string;
  type: 'PUBLIC' | 'PROTECTED';
}

export interface ProcessDefinition {
  key: string;
  label: string;
  steps: string[];
  route_base: string;
  mode?: 'KERNEL' | 'HYBRID';
}

export interface ModuleDefinition {
  key: string;
  label: string;
  processes: ProcessDefinition[];
  // Legacy config support
  config?: Record<string, any>;
  is_active?: boolean;
}

// ⚡ NEW: Navigation Node Contract (Matches Backend)
export interface NavigationNode {
    key: string;
    label: string;
    icon?: string;
    path?: string;
    
    // Architecture Metadata
    component_path?: string;
    api_endpoint?: string;
    
    // Discovery
    search_tags?: string[];
    
    // Config
    config?: Record<string, any>;
    
    // Recursion
    children?: NavigationNode[];
}

export interface NavigationResponse {
    sidebar: NavigationNode[];
    user_menu: NavigationNode[];
    top_bar: NavigationNode[];
}

export interface SystemManifest {
  version: string;
  environment: string;
  modules: ModuleDefinition[];
  // ⚡ NEW: Secured Navigation Payload
  navigation: NavigationResponse;
}

