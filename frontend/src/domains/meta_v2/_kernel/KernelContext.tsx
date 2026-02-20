// FILEPATH: frontend/src/domains/meta_v2/_kernel/KernelContext.tsx
// @file: Kernel Context Provider
// @role: 🧠 System Brain */
// @author: The Engineer
// @description: Bootstraps the Meta-Kernel V2. Loads Registry, Types, and Capabilities.
// @security-level: LEVEL 0 (Kernel Boot) */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useUrlState } from '../../../platform/hooks/useUrlState';
import { logger } from '../../../platform/logging';
import { OpenAPI } from '../../../api/core/OpenAPI';
import { request } from '../../../api/core/request'; // ⚡ GENERIC REQUEST FOR V3 BRIDGE
import { MetaContextState, DomainSummary, ScopeSummary, WorkflowTypeRead } from './types';
import { buildActiveContext } from './logic';

// 1. INITIAL STATE
const INITIAL_STATE: MetaContextState = {
  registry: [],
  workflowTypes: [], // ⚡ V3: Empty by default, populated by DB
  selectedDomainKey: null,
  selectedScopeKey: null,
  selectedDomain: null,
  selectedScope: null,
  isLoading: true,
  error: null,
  refresh: async () => {},
  selectDomain: () => {},
  selectScope: () => {},
  selectContext: () => {}, // ⚡ FIX: Added to initial state type signature
};

export const KernelContext = createContext<MetaContextState>(INITIAL_STATE);

export const KernelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 2. STATE: Universal URL Persistence
  const [urlDomain, setUrlDomain] = useUrlState('domain', '');
  const [urlScope, setUrlScope] = useUrlState('scope', '');

  const [kernelState, setKernelState] = useState<MetaContextState>(INITIAL_STATE);

  // 3. ACTIONS
  const loadSystem = async () => {
    setKernelState(prev => ({ ...prev, isLoading: true, error: null }));
    const bootStart = performance.now();

    try {
      logger.tell("KERNEL", "🔌 Connecting to Spinal Cord...");

      // ⚡ PARALLEL FETCHING: Use raw requests for both to bypass OpenAPI generated name mismatches
      const [domainsResponse, typesResponse] = await Promise.all([
        request(OpenAPI, { method: 'GET', url: '/api/v1/meta/domains' }),
        request(OpenAPI, { method: 'GET', url: '/api/v1/meta/states/types' })
      ]);

      // Handle potential response wrappers (e.g. { modules: [...] } vs [...])
      const domains = (domainsResponse as any).modules || (domainsResponse as any).items || domainsResponse;
      const types = (typesResponse as any).items || typesResponse;

      logger.tell("KERNEL", `✅ System Registry Loaded (${Array.isArray(domains) ? domains.length : 0} Modules)`);
      logger.tell("KERNEL", `✅ V3 Workflow Types Loaded (${Array.isArray(types) ? types.length : 0} Types)`);

      setKernelState(prev => ({
        ...prev,
        registry: domains as DomainSummary[],
        workflowTypes: types as WorkflowTypeRead[], // ⚡ STORE V3 TYPES
        isLoading: false,
        error: null
      }));

    } catch (err: any) {
      logger.scream("KERNEL", "🔥 System Boot Failure", err);
      setKernelState(prev => ({ ...prev, isLoading: false, error: err.message || "Boot Failed" }));
    } finally {
      logger.whisper("KERNEL", `🥾 Boot Sequence: ${(performance.now() - bootStart).toFixed(2)}ms`);
    }
  };

  // 4. EFFECTS: Boot
  useEffect(() => {
    loadSystem();
  }, []);

  // 5. DERIVED STATE (Selection Resolution)
  const contextValue = useMemo(() => {
    // Resolve Objects from Keys (O(n) but n is small)
    const activeDomain = kernelState.registry.find(d => d.key === urlDomain) || null;
    let activeScope: ScopeSummary | null = null;

    if (activeDomain && urlScope) {
      activeScope = activeDomain.scopes.find(s => s.key === urlScope) || null;
    }

    return {
      ...kernelState,
      selectedDomainKey: urlDomain || null,
      selectedScopeKey: urlScope || null,
      selectedDomain: activeDomain ? buildActiveContext(activeDomain as any).source as DomainSummary : null,
      selectedScope: activeScope,
      activeContext: activeDomain ? buildActiveContext(activeDomain as any) : null,
      refresh: loadSystem,
      selectDomain: (key: string | null) => {
        setUrlDomain(key || '');
        setUrlScope(''); // Reset scope on domain change
      },
      selectScope: (key: string | null) => setUrlScope(key || ''),
      // ⚡ CRITICAL FIX: Add selectContext as an alias to selectDomain so UniversalTree works
      selectContext: (key: string | null) => {
        setUrlDomain(key || '');
        setUrlScope(''); 
      }
    };
  }, [kernelState, urlDomain, urlScope]);

  return (
    <KernelContext.Provider value={contextValue}>
      {children}
    </KernelContext.Provider>
  );
};

export const useKernel = () => useContext(KernelContext);

