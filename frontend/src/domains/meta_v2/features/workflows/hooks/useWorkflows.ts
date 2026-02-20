// FILEPATH: frontend/src/domains/meta_v2/features/workflows/hooks/useWorkflows.ts
// @file: V2 Workflow Data Hooks
// @role: 🧠 Logic Container */
// @author: The Engineer
// @description: React Query wrappers for the State Engine API. Fully instrumented with Narrator.
// @security-level: LEVEL 9 (Data Access) */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { request } from '@/api/core/request';
import { OpenAPI } from '@/api/core/OpenAPI';
import { logger } from '@/platform/logging';

export interface WorkflowDefinition {
    id: number;
    entity_key: string;
    scope: string;
    scope_key?: string; // Fallback for various API shapes
    name: string;
    label?: string;
    version: string;
    type: string;
    is_active: boolean;
    is_latest: boolean;
    transitions?: Record<string, any>;
    definition?: Record<string, any>;
    initial_state?: string;
    governed_field: string;
    updated_at?: string;
}

interface CreateWorkflowPayload {
    domain: string;
    scope: string;
    name: string;
    governed_field?: string;
    definition: Record<string, any>;
}

export const useWorkflows = (domain?: string) => {
    const queryClient = useQueryClient();
    const { message, notification } = App.useApp();

    // 1. Fetch List
    const { data: workflows, isLoading, error, isFetching, refetch } = useQuery({
        queryKey: ['meta_v2', 'workflows', domain],
        queryFn: async () => {
            logger.whisper("DATA", `📡 Fetching Workflows for domain: ${domain || 'ALL'}`);
            
            try {
                const response = await request<WorkflowDefinition[]>(OpenAPI, {
                    url: '/api/v1/meta/states',
                    method: 'GET',
                    query: domain ? { domain } : undefined
                });

                const result = Array.isArray(response) ? response : [];
                logger.trace("DATA", `✅ Workflows Received`, { count: result.length });
                return result;
            } catch (err) {
                logger.scream("DATA", `🔥 Workflow Fetch Failed`, err);
                throw err;
            }
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!domain
    });

    // 2. Create / Update
    const updateWorkflow = useMutation({
        mutationFn: async (payload: any) => {
            logger.whisper("DATA", `Submitting Workflow Update...`);
            // The API expects the full definition wrapper
            return await request<WorkflowDefinition>(OpenAPI, {
                url: '/api/v1/meta/states',
                method: 'POST',
                body: payload
            });
        },
        onSuccess: (data) => {
            message.success(`Workflow '${data.scope || data.name}' saved successfully (v${data.version})`);
            logger.tell("DATA", `✅ Workflow Update Success`, { version: data.version });
            queryClient.invalidateQueries({ queryKey: ['meta_v2', 'workflows', domain] });
        },
        onError: (err: any) => {
            notification.error({
                message: 'Save Failed',
                description: err.message || 'Server rejected the definition.'
            });
            logger.scream("DATA", "❌ Workflow Update Failed", err);
        }
    });

    // 3. Delete
    const deleteWorkflow = useMutation({
        mutationFn: async (id: number) => {
            logger.whisper("DATA", `Executing Delete for Workflow ID: ${id}`);
            return await request<{ status: string }>(OpenAPI, {
                url: `/api/v1/meta/states/${id}`,
                method: 'DELETE'
            });
        },
        onSuccess: () => {
            message.success('Workflow deleted successfully.');
            logger.tell("DATA", `✅ Workflow Deleted`);
            queryClient.invalidateQueries({ queryKey: ['meta_v2', 'workflows', domain] });
        },
        onError: (err: any) => {
            notification.error({
                message: 'Deletion Blocked',
                description: err.message || 'This workflow is actively used.',
                duration: 5
            });
            logger.scream("DATA", "❌ Workflow Deletion Blocked", err);
        }
    });

    return {
        workflows: workflows || [],
        isLoading: isLoading || isFetching,
        error,
        updateWorkflow: updateWorkflow.mutateAsync,
        deleteWorkflow: deleteWorkflow.mutateAsync,
        refreshWorkflows: refetch
    };
};

