// FILEPATH: frontend/src/domains/meta_v2/features/governance/hooks/useGovernance.ts
// @file: Governance Logic Hook (V2)
// @role: 🧠 Logic Container */
// @author: The Engineer
// @description: Manages Policy State and Fuses Domain Schema with System Context. Uses OpenAPI SDK.
// @security-level: LEVEL 9 (Schema Fusion) */
// @updated: Added Data Normalization to convert Schema Dictionary -> Array. Fixes 'filter is not a function' crash. */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useMemo } from 'react';

import { MetaKernelService } from '@/api/services/MetaKernelService';
import { logger } from '@/platform/logging';

import type { PolicyDraft, DryRunRequest, DryRunResult } from '../../../../meta/features/governance/types';

export const useGovernance = (domain?: string) => {
    const queryClient = useQueryClient();
    const { message } = App.useApp();

    // 1. FETCH POLICIES (The Law)
    const { 
        data: policies = [], 
        isLoading: loadingPolicies,
        error: policyError 
    } = useQuery({
        queryKey: ['meta_v2', 'policies', domain],
        queryFn: async () => {
            logger.whisper("GOVERNANCE", `Fetching policies for domain: ${domain || 'ALL'}`);
            // Note: In standard architecture, policies are fetched globally and bound locally.
            const allPolicies = await MetaKernelService.listPoliciesApiV1MetaPoliciesGet();
            logger.trace("GOVERNANCE", `Fetched ${allPolicies.length} policies`, { count: allPolicies.length });
            return allPolicies;
        },
        enabled: !!domain
    });

    // 2. FETCH FUSED SCHEMA (The Vocabulary)
    const { 
        data: schemaContextRaw = { fields: {} }, 
        isLoading: loadingSchema 
    } = useQuery({
        queryKey: ['meta_v2', 'schema', domain],
        queryFn: async () => {
            if (!domain) return { fields: {} };
            
            logger.whisper("GOVERNANCE", `Fusing Schema for ${domain}...`);
            const res = await MetaKernelService.getDomainSchemaApiV1MetaSchemaDomainGet(domain, true);
            logger.trace("GOVERNANCE", `Schema Fusion Complete`, { domain });
            return res;
        },
        enabled: !!domain
    });

    // ⚡ ADAPTER: Normalize Dictionary to Array for UI Consumption
    const schemaContext = useMemo(() => {
        if (!schemaContextRaw || !schemaContextRaw.fields) return { fields: [] };
        
        // If it's already an array, pass it through (Legacy Safe)
        if (Array.isArray(schemaContextRaw.fields)) {
            return { fields: schemaContextRaw.fields };
        }

        // If it's a Dictionary, convert to Array and inject 'group' for grouping logic
        const fieldArray = Object.values(schemaContextRaw.fields).map((f: any) => ({
            ...f,
            group: 'HOST' // Default to HOST group for the ConsequenceStack filter
        }));

        logger.trace("GOVERNANCE", `Normalized ${fieldArray.length} schema fields`, { sample: fieldArray[0] });
        
        return {
            ...schemaContextRaw,
            fields: fieldArray
        };
    }, [schemaContextRaw]);

    // 3. CREATE POLICY
    const createMutation = useMutation({
        mutationFn: async (draft: PolicyDraft) => {
            logger.whisper("GOVERNANCE", `Attempting to ratify new policy: ${draft.key}`);
            return await MetaKernelService.createPolicyApiV1MetaPoliciesPost({
                key: draft.key,
                name: draft.name,
                description: draft.description,
                resolution: draft.resolution,
                rules: draft.rules as any, // Alignment with SDK
                tags: draft.tags,
                is_active: draft.is_active
            });
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['meta_v2', 'policies'] });
            message.success('Policy Ratified');
            logger.tell("GOVERNANCE", `✅ Policy [${variables.key}] Created successfully`);
        },
        onError: (err: any, variables) => {
            const msg = err.body?.detail || 'Ratification Failed';
            message.error(msg);
            logger.scream("GOVERNANCE", `❌ Create Failed for [${variables.key}]`, err);
        }
    });

    // 4. UPDATE POLICY
    const updateMutation = useMutation({
        mutationFn: async ({ id, payload }: { id: number, payload: Partial<PolicyDraft> }) => {
            logger.whisper("GOVERNANCE", `Attempting to amend policy ID: ${id}`);
            return await MetaKernelService.updatePolicyApiV1MetaPoliciesIdPatch(id, payload as any);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['meta_v2', 'policies'] });
            message.success('Policy Amended');
            logger.tell("GOVERNANCE", `✅ Policy ID [${variables.id}] Amended successfully`);
        },
        onError: (err: any, variables) => {
            message.error('Amendment Failed');
            logger.scream("GOVERNANCE", `❌ Update Failed for ID [${variables.id}]`, err);
        }
    });

    // 5. DELETE POLICY
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            logger.whisper("GOVERNANCE", `Attempting to revoke policy ID: ${id}`);
            // Explicit cast to 'any' to handle OpenAPI Codegen delete signature if it varies
            return await (MetaKernelService as any).deletePolicyApiV1MetaPoliciesIdDelete(id);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['meta_v2', 'policies'] });
            message.success('Policy Revoked');
            logger.tell("GOVERNANCE", `✅ Policy ID [${variables}] Revoked successfully`);
        },
        onError: (err: any, variables) => {
            message.error('Revocation Failed');
            logger.scream("GOVERNANCE", `❌ Delete Failed for ID [${variables}]`, err);
        }
    });

    // 6. DRY RUN
    const dryRunMutation = useMutation({
        mutationFn: async (payload: DryRunRequest): Promise<DryRunResult> => {
            logger.whisper("GOVERNANCE", `Executing Simulation Sandbox...`);
            const result = await MetaKernelService.dryRunPolicyApiV1MetaPoliciesDryRunPost(payload as any);
            logger.trace("GOVERNANCE", `Simulation Results Calculated`, { result });
            return result as any;
        }
    });

    return {
        // Data
        policies,
        schemaContext, // ⚡ NOW RETURNS NORMALIZED ARRAY
        loadingPolicies,
        loadingSchema,
        policyError,

        // Actions
        createPolicy: createMutation.mutateAsync,
        updatePolicy: updateMutation.mutateAsync,
        deletePolicy: deleteMutation.mutateAsync,
        dryRunPolicy: dryRunMutation.mutateAsync,

        // State
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
        isSimulating: dryRunMutation.isPending
    };
};

