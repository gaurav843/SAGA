// FILEPATH: frontend/src/domains/meta_v2/_shell/MetaUIContext.tsx
// @file: Meta UI Context (The Interface Brain)
// @role: 🧠 UI State Manager */
// @author: The Engineer
// @description: Centralizes UI state (Sidebar collapse, Tree expansion) with LocalStorage persistence.
// FIX: Implements "State Amnesia" cure by remembering user preferences.

// @security-level: LEVEL 0 (Context) */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { logger } from '../../../platform/logging/Narrator';

// ⚡ KEYS FOR PERSISTENCE
const STORAGE_KEYS = {
    SIDEBAR_LEFT: 'flodock_meta_sidebar_left',
    SIDEBAR_RIGHT: 'flodock_meta_sidebar_right',
    TOPOLOGY_EXPANDED: 'flodock_meta_topology_expanded'
};

interface MetaUIState {
    // 1. Layout State
    leftSidebarCollapsed: boolean;
    rightInspectorCollapsed: boolean;
    toggleLeftSidebar: () => void;
    toggleRightInspector: () => void;
    
    // 2. Topology Tree State (Memory)
    topologyExpandedKeys: React.Key[];
    setTopologyExpandedKeys: (keys: React.Key[]) => void;
}

const MetaUIContext = createContext<MetaUIState | null>(null);

export const MetaUIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // --- 1. LAYOUT STATE ---
    const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(() => 
        localStorage.getItem(STORAGE_KEYS.SIDEBAR_LEFT) === 'true'
    );
    
    const [rightInspectorCollapsed, setRightInspectorCollapsed] = useState(() => 
        localStorage.getItem(STORAGE_KEYS.SIDEBAR_RIGHT) === 'true'
    );

    // --- 2. TREE STATE ---
    const [topologyExpandedKeys, setTopologyExpandedKeysState] = useState<React.Key[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.TOPOLOGY_EXPANDED);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // --- ACTIONS ---
    const toggleLeftSidebar = useCallback(() => {
        setLeftSidebarCollapsed(prev => {
            const next = !prev;
            localStorage.setItem(STORAGE_KEYS.SIDEBAR_LEFT, String(next));
            logger.whisper("UI", `Sidebar ${next ? 'Collapsed' : 'Expanded'}`);
            return next;
        });
    }, []);

    const toggleRightInspector = useCallback(() => {
        setRightInspectorCollapsed(prev => {
            const next = !prev;
            localStorage.setItem(STORAGE_KEYS.SIDEBAR_RIGHT, String(next));
            return next;
        });
    }, []);

    const setTopologyExpandedKeys = useCallback((keys: React.Key[]) => {
        setTopologyExpandedKeysState(keys);
        localStorage.setItem(STORAGE_KEYS.TOPOLOGY_EXPANDED, JSON.stringify(keys));
    }, []);

    const value: MetaUIState = {
        leftSidebarCollapsed,
        rightInspectorCollapsed,
        toggleLeftSidebar,
        toggleRightInspector,
        topologyExpandedKeys,
        setTopologyExpandedKeys
    };

    return (
        <MetaUIContext.Provider value={value}>
            {children}
        </MetaUIContext.Provider>
    );
};

export const useMetaUI = () => {
    const context = useContext(MetaUIContext);
    if (!context) {
        throw new Error("useMetaUI must be used within a MetaUIProvider");
    }
    return context;
};

