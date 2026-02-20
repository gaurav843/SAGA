// FILEPATH: frontend/src/domains/meta/features/governance/hooks/useGovernance.ts
// @file: Governance Logic Hook
// @role: 🧠 Logic Container */
// @author: The Engineer
// @description: Manages Policy State and Fuses Domain Schema with System Context.
// @security-level: LEVEL 9 (Schema Fusion) */
// @updated: Aligned API calls with generated OpenAPI SDK. Preserved Delete logic. */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { MetaKernelService } from '@/api';
import { logger } from '@/platform/logging';

// ⚡ CRITICAL FIX: Add 'type' keyword to prevent Vite transpilation crashes
import type { 
    Policy, 
    PolicyDraft, 
    DryRunRequest, 
    DryRunResult 
} from '../types';

export const useGovernance = (domain: string) => {
    const queryClient = useQueryClient();
    const { message } = App.useApp();

    // 1. FETCH POLICIES (The Law)
    const { 
        data: policies = [], 
        isLoading: loadingPolicies,
        error: policyError 
    } = useQuery({
        queryKey: ['meta', 'policies'],
        queryFn: async () => {
            // ⚡ FIX: Use generated SDK name
            return await MetaKernelService.listPoliciesApiV1MetaPoliciesGet();
        }
    });

    // 2. FETCH FUSED SCHEMA (The Vocabulary)
    const { 
        data: schemaContext = { fields: {} }, 
        isLoading: loadingSchema 
    } = useQuery({
        queryKey: ['meta', 'schema', domain],
        queryFn: async () => {
            if (!domain) return { fields: {} };
            
            logger.tell("GOVERNANCE", `Fusing Schema for ${domain}...`);
            
            // ⚡ LEVEL 100: Context Fusion
            // The API returns the "Fused" schema (Static + Dynamic + Context)
            // ⚡ FIX: Use generated SDK name
            const res = await MetaKernelService.getDomainSchemaApiV1MetaSchemaDomainGet(domain, true);
            return res;
        },
        enabled: !!domain
    });

    // 3. CREATE POLICY
    const createMutation = useMutation({
        mutationFn: async (draft: PolicyDraft) => {
            // ⚡ FIX: Use generated SDK name
            return await MetaKernelService.createPolicyApiV1MetaPoliciesPost({
                key: draft.key,
                name: draft.name,
                description: draft.description,
                resolution: draft.resolution,
                rules: draft.rules,
                tags: draft.tags,
                is_active: draft.is_active
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meta', 'policies'] });
            message.success('Policy Ratified');
            logger.tell("GOVERNANCE", "Policy Created successfully");
        },
        onError: (err: any) => {
            const msg = err.body?.detail || 'Ratification Failed';
            message.error(msg);
            logger.scream("GOVERNANCE", "Create Failed", err);
        }
    });

    // 4. UPDATE POLICY
    const updateMutation = useMutation({
        mutationFn: async ({ id, payload }: { id: number, payload: Partial<PolicyDraft> }) => {
            // ⚡ FIX: Use generated SDK name
            return await MetaKernelService.updatePolicyApiV1MetaPoliciesIdPatch(id, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meta', 'policies'] });
            message.success('Policy Amended');
        },
        onError: (err: any) => {
            message.error('Amendment Failed');
            logger.scream("GOVERNANCE", "Update Failed", err);
        }
    });

    // 5. DELETE POLICY (Restored)
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            // ⚡ FIX: Use 'any' cast if SDK signature varies, but call correct delete endpoint
            // Assuming standard naming pattern from codegen
            return await (MetaKernelService as any).deletePolicyApiV1MetaPoliciesIdDelete(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meta', 'policies'] });
            message.success('Policy Revoked');
        },
        onError: (err: any) => {
             message.error('Revocation Failed');
             logger.scream("GOVERNANCE", "Delete Failed", err);
        }
    });

    // 6. DRY RUN
    const dryRunMutation = useMutation({
        mutationFn: async (payload: DryRunRequest): Promise<DryRunResult> => {
            // ⚡ FIX: Use generated SDK name
            return await MetaKernelService.dryRunPolicyApiV1MetaPoliciesDryRunPost(payload);
        }
    });

    return {
        // Data
        policies,
        schemaContext,
        loadingPolicies,
        loadingSchema,
        policyError,

        // Actions
        createPolicy: createMutation.mutateAsync,
        updatePolicy: updateMutation.mutateAsync,
        deletePolicy: deleteMutation.mutateAsync, // ✅ RESTORED
        dryRunPolicy: dryRunMutation.mutateAsync,

        // State
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,     // ✅ RESTORED
        isSimulating: dryRunMutation.isPending
    };
};
