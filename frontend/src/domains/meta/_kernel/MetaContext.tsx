// FILEPATH: frontend/src/domains/meta/_kernel/MetaContext.tsx
// @file: Meta Context (The Brain)
// @role: 🧠 State Manager */
// @author: The Engineer
// @description: Manages Domain Selection, Scope, and Deep Linking. Bridges the URL to the Application State.
// @security-level: LEVEL 0 (Kernel) */

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useUrlState } from '../../../platform/hooks/useUrlState';
import { logger } from '../../../platform/logging/Narrator';
import { MetaKernelService } from '../../../api/services/MetaKernelService';
import { useQuery } from '@tanstack/react-query';

// ⚡ CRITICAL FIX: IMPORT SHARED CONTRACTS AS TYPES ONLY
import type { 
    MetaContextState, 
    DomainSummary, 
    ScopeSummary 
} from '../types';

// Default State (Safe Fallback)
const DEFAULT_STATE: MetaContextState = {
    selectedDomain: null,
    selectedScope: null,
    selectedItem: null,
    domains: [],
    isLoading: true,
    error: null,
    selectDomain: () => logger.scream("META", "selectDomain called before Context Init"),
    selectScope: () => {},
    selectItem: () => {},
    refresh: () => {}
};

const MetaContext = createContext<MetaContextState>(DEFAULT_STATE);

export const MetaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    
    // 1. DATA: Fetch Topology (Domains -> Scopes)
    const { 
        data: rawDomains = [], 
        isLoading, 
        error, 
        refetch 
    } = useQuery({
        queryKey: ['meta', 'domains'],
        queryFn: async () => {
            logger.tell("META", "📡 Fetching System Topology...");
            // ⚡ API FIX: Match the exact generated OpenAPI SDK method name
            const response = await MetaKernelService.listDomainsApiV1MetaDomainsGet();
            
            // @ts-ignore - Handle Manifest Wrapper if present
            const domains = (response.modules || response) as DomainSummary[]; 
            logger.trace("META", "Topology Fetched", { count: domains?.length });
            return domains;
        },
        staleTime: 1000 * 60 * 5, 
    });

    // 2. STATE: Universal URL Persistence
    const [domainKey, setDomainKey] = useUrlState('domain', '');
    const [scopeKey, setScopeKey] = useUrlState('scope', '');
    const [itemId, setItemId] = useUrlState('select', ''); 

    // 3. DERIVED STATE: Resolve Objects from Keys
    const selectedDomain = useMemo(() => {
        if (!domainKey) return null;
        return rawDomains.find(d => d.key === domainKey) || null;
    }, [domainKey, rawDomains]);

    const selectedScope = useMemo(() => {
        if (!selectedDomain || !scopeKey) return null;
        return selectedDomain.scopes?.find(s => s.key === scopeKey) || null;
    }, [selectedDomain, scopeKey]);

    // 4. ACTIONS (The Interface Implementation)
    const selectDomain = (key: string) => {
        if (key === domainKey) return; 
        logger.tell("META", `👉 Select Domain: ${key || 'None'}`);
        setDomainKey(key || null);
        // Clear children when parent changes
        setScopeKey(null);
        setItemId(null); 
    };

    const selectScope = (key: string) => {
        if (key === scopeKey) return;
        logger.tell("META", `👉 Select Scope: ${key || 'None'}`);
        setScopeKey(key || null);
        setItemId(null);
    };

    const selectItem = (id: string | null) => {
        if (id === itemId) return;
        if (id) logger.tell("META", `👉 Select Item: ${id}`);
        setItemId(id || null);
    };

    // 5. SIDE EFFECTS
    useEffect(() => {
        if (rawDomains.length > 0) {
            logger.whisper("META", `📥 Loaded ${rawDomains.length} Domains into Context`);
        }
    }, [rawDomains.length]);

    useEffect(() => {
        if (error) {
            logger.scream("META", "🔥 Failed to fetch topology", error);
        }
    }, [error]);

    // 6. CONSTRUCT CONTEXT
    const value: MetaContextState = {
        domains: rawDomains,
        isLoading,
        error: error ? String(error) : null,
        selectedDomain,
        selectedScope,
        selectedItem: itemId,
        selectDomain,
        selectScope,
        selectItem,
        refresh: refetch
    };

    return (
        <MetaContext.Provider value={value}>
            {children}
        </MetaContext.Provider>
    );
};

export const useMetaContext = () => {
    const context = useContext(MetaContext);
    if (!context) {
        throw new Error("useMetaContext must be used within a MetaProvider");
    }
    return context;
};
