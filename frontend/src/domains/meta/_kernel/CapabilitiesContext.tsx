// FILEPATH: frontend/src/domains/meta/_kernel/CapabilitiesContext.tsx
// @file: Capabilities Provider
// @author: The Engineer
// @description: Fetches and provides System Introspection Data.
// @security-level: LEVEL 0 (Kernel)
// @invariant: Must be the ONLY instance in the app.
// @updated: Added Strict Array Sanitization to prevent 'NEURAL LINK SEVERED' crash.


import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { logger } from '../../../platform/logging/Narrator';
import { API_BASE_URL } from '../../../config';

export interface CapabilityItem {
    label: string;
    value: string;
    key?: string;
}

export interface ContextField {
    key: string;
    label: string;
    type: string;
    description: string;
}

export interface SystemCapabilities {
    version: string;
    actions: CapabilityItem[];
    triggers: CapabilityItem[];
    widgets: CapabilityItem[];
    data_types: CapabilityItem[];
    context_schema: {
        system: ContextField[];
        actor: ContextField[];
    };
}

interface CapabilitiesState {
    registry: SystemCapabilities | null;
    isLoading: boolean;
    error: string | null;
    refresh: () => void;
}

const CapabilitiesContext = createContext<CapabilitiesState | undefined>(undefined);

const SAFE_MODE_CAPS: SystemCapabilities = {
    version: "SAFE_MODE",
    actions: [],
    triggers: [],
    widgets: [],
    data_types: [],
    context_schema: { system: [], actor: [] }
};

export const CapabilitiesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [registry, setRegistry] = useState<SystemCapabilities | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const providerId = useMemo(() => Math.floor(Math.random() * 10000), []);

    const fetchCapabilities = async () => {
        logger.whisper("KERNEL", `🔮 [${providerId}] Handshake Initiated...`);
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/system/capabilities`);
            
            if (!response.ok) {
                throw new Error(`Kernel Panic: ${response.status}`);
            }
            
            const rawData = await response.json();
            
            // ⚡ SANITIZATION LAYER: Ensure no null arrays to prevent crashes
            const safeData: SystemCapabilities = {
                version: rawData.version || "UNKNOWN",
                actions: Array.isArray(rawData.actions) ? rawData.actions : [],
                triggers: Array.isArray(rawData.triggers) ? rawData.triggers : [],
                widgets: Array.isArray(rawData.widgets) ? rawData.widgets : [],
                data_types: Array.isArray(rawData.data_types) ? rawData.data_types : [],
                context_schema: {
                    system: Array.isArray(rawData.context_schema?.system) ? rawData.context_schema.system : [],
                    actor: Array.isArray(rawData.context_schema?.actor) ? rawData.context_schema.actor : [],
                }
            };

            setRegistry(safeData);
            setError(null);
            logger.tell("KERNEL", `✨ [${providerId}] Registry Synced. (v${safeData.version})`, safeData);
            
        } catch (err: any) {
            logger.scream("KERNEL", `🔥 Handshake Failed: ${err.message}`, err);
            setError(err.message);
            setRegistry(SAFE_MODE_CAPS); 
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCapabilities();
    }, []);

    const value = {
        registry,
        isLoading,
        error,
        refresh: fetchCapabilities
    };

    return (
        <CapabilitiesContext.Provider value={value}>
            {children}
        </CapabilitiesContext.Provider>
    );
};

export const useCapabilities = () => {
    const context = useContext(CapabilitiesContext);
    if (context === undefined) {
        throw new Error('useCapabilities must be used within a CapabilitiesProvider');
    }
    return context;
};

