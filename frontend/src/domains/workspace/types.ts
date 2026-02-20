// FILEPATH: frontend/src/domains/workspace/types.ts
// @file: Workspace Runtime Contracts
// @role: 📦 Data Structure */
// @author: The Engineer
// @description: Defines the shape of the Runtime Application and Release Metadata.
// @security-level: LEVEL 0 (Core Types) */
// @invariant: Must match 'backend/app/domains/workspace/schemas.py' contracts. */
// @updated: Added 'meta' field to RuntimeLayout to support Versioning. */

import { type ScopeType } from "../meta/types/constants";

// --- 1. THE BRICK ---
export interface BrickType {
    id: number;
    key: string;
    label: string;
    type: string;
    domain: string;
    config: Record<string, any>;
}

// --- 2. THE SCREEN ---
export interface Screen {
    id: number;
    title: string;
    route_slug: string;
    security_policy: Record<string, any>;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    
    // ⚡ EAGER LOADED (Lobby Richness)
    live_release?: Release;
}

// --- 3. THE APP ---
export interface ActiveApp {
    id: number;
    
    // ⚡ JSON RESPONSE ADAPTATION
    // The Layout API returns a simplified view, IDs might be implicit or missing in read-mode
    screen_id?: number;
    scope_id?: number;
    parent_app_id?: number | null; 
    
    // Identity
    key?: string; // e.g. "APP_16"
    
    // ⚡ FIX: Match Backend JSON exactly ("type", not "scope_type")
    type: ScopeType | string; 
    scope_key: string; // e.g. "USER_CREATE"
    
    label: string;
    icon?: string;
    
    // Configuration (The Paint)
    // Backend sends "intent" in layout, but "config" in DB. We support both.
    config?: Record<string, any>;
    intent?: Record<string, any>;
    
    // Placement
    order: number;
    zone?: string; 
    width?: number; 
}

// --- 4. RELEASE HISTORY ---
export interface Release {
    id: number;
    version: number;
    version_label: string; // e.g. "1.0.5"
    description: string;
    created_at: string;
    screen_id: number;
}

// --- 5. THE RUNTIME LAYOUT ---
export interface RuntimeLayout {
    screen: {
        id?: number; // Optional in some views
        title: string;
        policy: Record<string, any>;
    };
    // ⚡ VERSION CONTROL INTELLIGENCE
    meta: {
        mode: "DRAFT" | "LIVE";
        version: string;     
        release_id?: number;
        latest_version: string; 
        latest_description?: string;
    };
    layout: Record<string, ActiveApp[]>; // Keyed by Zone (MAIN, SIDEBAR)
}

