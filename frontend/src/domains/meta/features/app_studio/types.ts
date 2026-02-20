// FILEPATH: frontend/src/domains/meta/features/app_studio/types.ts
// @file: App Studio Type Definitions
// @author: ansav8@gmail.com
// @description: Added 'Release' interface for version history.

// 1. THE BRICK
export type BrickType = 'WIZARD' | 'JOB' | 'VIEW' | 'CONTAINER';

export interface SystemBrick {
  id: number;
  key: string;
  label: string;
  type: BrickType;
  domain: string;
  config?: Record<string, any>; 
}

// 2. THE SCREEN
export interface Screen {
  id: number;
  title: string;
  route_slug: string;
  security_policy: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

// 3. THE APP
export interface ActiveApp {
  id: number;
  screen_id: number;
  scope_id: number;
  scope_key: string;
  scope_type: BrickType;
  parent_app_id: number | null; 
  config: {
    label?: string;
    icon?: string;
    intent?: {
      keywords?: string[];
      verb?: string;
    };
    collapsed?: boolean;
  };
  placement: {
    zone: ZoneType;
    order: number;
  };
  security_policy: Record<string, any>;
  is_active: boolean;
}

// ⚡ NEW: RELEASE HISTORY
export interface Release {
    id: number;
    version: number; // Internal Counter (1, 2, 3)
    version_label: string; // SemVer (1.0.0)
    description: string;
    created_at: string;
}

export type ZoneType = 'SIDEBAR' | 'TOP_BAR' | 'BOTTOM_BAR' | 'USER_MENU';

export interface DragItem {
  type: 'BRICK' | 'APP';
  id: number | string;
  data: SystemBrick | ActiveApp;
}
