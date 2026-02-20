// FILEPATH: frontend/src/domains/meta_v2/features/governance/hooks/usePolicyBindings.ts
// @file: Policy Bindings Hook
// @role: 🧠 Logic Container */
// @author: The Engineer
// @description: Manages enforcement jurisdictions. Uses OpenAPI SDK.
// @security-level: LEVEL 9 (API Integration) */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { MetaKernelService } from '@/api/services/MetaKernelService';
import { logger } from '@/platform/logging/Narrator';

// Using OpenAPI generated types
import type { PolicyBindingRead, PolicyBindingCreate, PolicyBindingUpdate } from '@/api';

export const usePolicyBindings = (domain: string) => {
    const queryClient = useQueryClient();
    const { message } = App.useApp();

    const queryKey = ['meta_v2', 'bindings', domain];

    // 1. FETCH BINDINGS
    const { data: bindings = [], isLoading } = useQuery({
        queryKey,
        queryFn: async () => {
            logger.whisper("GOVERNANCE", `Fetching policy bindings for domain: ${domain}`);
            const res = await MetaKernelService.listBindingsApiV1MetaBindingsGet(domain);
            logger.trace("GOVERNANCE", `Fetched ${res.length} bindings`, { domain });
            return res as PolicyBindingRead[];
        },
        enabled: !!domain
    });

    // 2. CREATE BINDING
    const createMutation = useMutation({
        mutationFn: async (payload: PolicyBindingCreate) => {
            logger.whisper("GOVERNANCE", `Creating new binding for domain: ${domain}`);
            return await MetaKernelService.createBindingApiV1MetaBindingsPost(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            message.success('Jurisdiction Enforced');
            logger.tell("GOVERNANCE", "✅ Policy Binding created successfully");
        },
        onError: (err: any) => {
            const errorMsg = err.body?.detail || 'Binding Failed';
            message.error(errorMsg);
            logger.scream("GOVERNANCE", "❌ Create Binding Failed", err);
        }
    });

    // 3. TOGGLE/UPDATE BINDING
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number, data: PolicyBindingUpdate }) => {
            logger.whisper("GOVERNANCE", `Updating binding ID: ${id}`);
            return await MetaKernelService.updateBindingApiV1MetaBindingsIdPatch(id, data);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey });
            message.success('Binding Updated');
            logger.tell("GOVERNANCE", `✅ Policy Binding [${variables.id}] updated`);
        },
        onError: (err: any) => {
            message.error('Update Failed');
            logger.scream("GOVERNANCE", "❌ Update Binding Failed", err);
        }
    });

    // 4. DELETE BINDING
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            logger.whisper("GOVERNANCE", `Revoking binding ID: ${id}`);
            return await MetaKernelService.deleteBindingApiV1MetaBindingsIdDelete(id);
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey });
            message.success('Jurisdiction Revoked');
            logger.tell("GOVERNANCE", `✅ Policy Binding [${id}] removed`);
        },
        onError: (err: any) => {
            message.error('Revocation Failed');
            logger.scream("GOVERNANCE", "❌ Delete Binding Failed", err);
        }
    });

    return {
        bindings,
        isLoading,
        createBinding: createMutation.mutateAsync,
        updateBinding: updateMutation.mutateAsync,
        deleteBinding: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending
    };
};

