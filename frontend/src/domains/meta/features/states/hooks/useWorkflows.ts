// FILEPATH: frontend/src/domains/meta/features/states/hooks/useWorkflows.ts
// @file: Workflow Data Hooks
// @author: The Engineer
// @description: React Query wrappers for the State Engine API.
// @security-level: LEVEL 9 (Type Safety)
// @invariant: Cache invalidation must occur on mutation success.
// @updated: Changed 'version' type from number to string (SemVer).

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
// ⚡ USE RELATIVE IMPORT (Safe Path)
import { request } from '../../../../../api/core/request';
import { OpenAPI } from '../../../../../api/core/OpenAPI';

export interface WorkflowDefinition {
    id: number;
    entity_key: string;
    scope: string;
    name: string;
    version: string; // ⚡ UPDATED: SemVer String (e.g., "1.0.0")
    is_active: boolean;
    is_latest: boolean;
    transitions: Record<string, any>;
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
    const { data: workflows, isLoading, error, isFetching } = useQuery({
        queryKey: ['workflows', domain],
        queryFn: async () => {
            console.log(`%c[Narrator] 📡 Fetching Workflows for domain: ${domain}`, 'color: #00bcd4; font-weight: bold;');
            
            try {
                const response = await request<WorkflowDefinition[]>(OpenAPI, {
                    url: '/api/v1/meta/states',
                    method: 'GET',
                    query: domain ? { domain } : undefined
                });

                console.log(`%c[Narrator] ✅ Workflows Received: ${Array.isArray(response) ? response.length : 'INVALID'} items`, 'color: #4caf50; font-weight: bold;', response);
                
                return Array.isArray(response) ? response : [];
            } catch (err) {
                console.error(`%c[Narrator] 🔥 Workflow Fetch Failed:`, 'color: #f44336; font-weight: bold;', err);
                throw err;
            }
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // 2. Create / Update
    const createWorkflow = useMutation({
        mutationFn: async (payload: CreateWorkflowPayload) => {
            return await request<WorkflowDefinition>(OpenAPI, {
                url: '/api/v1/meta/states',
                method: 'POST',
                body: payload
            });
        },
        onSuccess: (data) => {
            message.success(`Workflow '${data.scope}' ratified (v${data.version})`);
            queryClient.invalidateQueries({ queryKey: ['workflows', domain] });
        },
        onError: (err: any) => {
            notification.error({
                message: 'Publish Failed',
                description: err.message || 'Server rejected the definition.'
            });
        }
    });

    // 3. Delete
    const deleteWorkflow = useMutation({
        mutationFn: async (id: number) => {
            return await request<{ status: string }>(OpenAPI, {
                url: `/api/v1/meta/states/${id}`,
                method: 'DELETE'
            });
        },
        onSuccess: () => {
            message.success('Workflow deleted successfully.');
            queryClient.invalidateQueries({ queryKey: ['workflows', domain] });
        },
        onError: (err: any) => {
            notification.error({
                message: 'Deletion Blocked',
                description: err.message || 'This workflow is actively used.',
                duration: 5
            });
        }
    });

    return {
        workflows,
        isLoading: isLoading || isFetching,
        error,
        createWorkflow,
        deleteWorkflow 
    };
};
