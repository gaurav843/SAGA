// FILEPATH: frontend/src/domains/meta/features/switchboard/hooks/useSwitchboard.ts
// @file: Switchboard Logic Hook (Dumb UI Adapter)
// @author: The Engineer
// @description: Connects the Switchboard View to the Backend Manifest Engine.
// All business logic and data aggregation is deferred to the Server.

// @security-level: LEVEL 9 (UI Delegation) */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { App } from 'antd';

// ⚡ FRACTAL IMPORT
import { API_BASE_URL } from '@kernel/config';
import type { SwitchboardManifest, BindingDraft, PolicyDefinition } from '../types';
import type { PolicyGroup } from '../../policy_groups/types';

export const useSwitchboard = (domainKey?: string) => {
    const queryClient = useQueryClient();
    const { message } = App.useApp();

    // 1. FETCH MANIFEST (The God Schema)
    const { data: manifest, isLoading: isManifestLoading } = useQuery({
        queryKey: ['meta', 'switchboard', 'manifest', domainKey || 'ALL'],
        queryFn: async () => {
            const params: Record<string, string> = {};
            if (domainKey) params.domain = domainKey;
            
            const res = await axios.get<SwitchboardManifest>(`${API_BASE_URL}/api/v1/meta/switchboard/manifest`, { params });
            return res.data;
        }
    });

    // 2. DISPATCH ACTION (Universal Mutation)
    // The frontend sends an intent (actionKey) and the payload. The backend decides what happens.
    const actionMutation = useMutation({
        mutationFn: async ({ actionKey, payload }: { actionKey: string, payload: Record<string, unknown> }) => {
            return axios.post(`${API_BASE_URL}/api/v1/meta/switchboard/execute-action`, {
                action_key: actionKey,
                payload
            });
        },
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['meta', 'switchboard'] });
            if (res.data?.message) {
                message.success(res.data.message);
            }
        },
        onError: (err: any) => {
            message.error(err.response?.data?.detail || 'Action Failed');
        }
    });

    // -------------------------------------------------------------------------
    // LEGACY DATA FOR MODAL
    // We keep these standard REST calls just to populate the "Create Binding" dropdowns.
    // -------------------------------------------------------------------------
    const { data: policies = [] } = useQuery({
        queryKey: ['meta', 'policies', 'list'],
        queryFn: async () => {
            const res = await axios.get<PolicyDefinition[]>(`${API_BASE_URL}/api/v1/meta/policies`);
            return res.data;
        }
    });

    const { data: groups = [] } = useQuery({
        queryKey: ['meta', 'groups', 'list'],
        queryFn: async () => {
            const res = await axios.get<PolicyGroup[]>(`${API_BASE_URL}/api/v1/meta/groups`);
            return res.data;
        }
    });

    const bindMutation = useMutation({
        mutationFn: async (draft: BindingDraft) => {
            return axios.post(`${API_BASE_URL}/api/v1/meta/bindings`, draft);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meta', 'switchboard'] });
            message.success('Policy Enforced');
        }
    });

    return {
        // Manifest State
        manifest,
        isLoading: isManifestLoading,
        dispatchAction: actionMutation.mutateAsync,
        
        // Modal State
        availablePolicies: policies,
        availableGroups: groups, 
        assignPolicy: bindMutation.mutateAsync,
        isAssigning: bindMutation.isPending
    };
};
