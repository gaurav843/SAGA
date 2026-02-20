/* FILEPATH: frontend/src/domains/meta/features/switchboard/hooks/useSwitchboard.ts */
/* @file Switchboard Logic Hook */
/* @author The Engineer */
/* @description Manages fetching and binding of Policies AND Policy Groups.
 * UPDATED: Uses Centralized Kernel Configuration via Alias.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { App } from 'antd';
import type { PolicyDefinition, PolicyBinding, BindingDraft } from '../types';
import type { PolicyGroup } from '../../policy_groups/types'; // Import from sibling feature
// ⚡ FRACTAL IMPORT
import { API_BASE_URL } from '@kernel/config';

export const useSwitchboard = (domainKey?: string) => {
    const queryClient = useQueryClient();
    const { message } = App.useApp();

    // 1. FETCH AVAILABLE POLICIES (The Atoms)
    const { data: policies = [], isLoading: isLoadingPolicies } = useQuery({
        queryKey: ['meta', 'policies', 'list'],
        queryFn: async () => {
            const res = await axios.get<PolicyDefinition[]>(`${API_BASE_URL}/api/v1/meta/policies`);
            return res.data;
        }
    });

    // 2. FETCH AVAILABLE GROUPS (The Bundles) - ⚡ NEW
    const { data: groups = [], isLoading: isLoadingGroups } = useQuery({
        queryKey: ['meta', 'groups', 'list'],
        queryFn: async () => {
            const res = await axios.get<PolicyGroup[]>(`${API_BASE_URL}/api/v1/meta/groups`);
            return res.data;
        }
    });

    // 3. FETCH ACTIVE BINDINGS (The Assignments)
    const { data: bindings = [], isLoading: isLoadingBindings } = useQuery({
        queryKey: ['meta', 'bindings', domainKey || 'ALL'],
        queryFn: async () => {
            const params: any = {};
            if (domainKey) params.domain = domainKey;
            
            const res = await axios.get<PolicyBinding[]>(`${API_BASE_URL}/api/v1/meta/bindings`, { params });
            return res.data;
        },
        enabled: true 
    });

    // 4. CREATE ASSIGNMENT
    const bindMutation = useMutation({
        mutationFn: async (draft: BindingDraft) => {
            return axios.post(`${API_BASE_URL}/api/v1/meta/bindings`, draft);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meta', 'bindings'] });
            message.success('Policy Enforced');
        },
        onError: (err: any) => {
            message.error(err.response?.data?.detail || 'Assignment Failed');
        }
    });

    // 5. UPDATE ASSIGNMENT
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number, data: Partial<PolicyBinding> }) => {
            return axios.patch(`${API_BASE_URL}/api/v1/meta/bindings/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meta', 'bindings'] });
        },
        onError: (err: any) => {
            message.error(err.response?.data?.detail || 'Update Failed');
        }
    });

    // 6. REMOVE ASSIGNMENT
    const unbindMutation = useMutation({
        mutationFn: async (bindingId: number) => {
            return axios.delete(`${API_BASE_URL}/api/v1/meta/bindings/${bindingId}`);
        },
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['meta', 'bindings'] });
            message.success(data?.data?.message || 'Assignment Removed');
        }
    });

    return {
        // Data
        availablePolicies: policies,
        availableGroups: groups, // ⚡ EXPOSED
        activeBindings: bindings,
        isLoading: isLoadingPolicies || isLoadingBindings || isLoadingGroups,

        // Actions
        assignPolicy: bindMutation.mutateAsync,
        updateAssignment: updateMutation.mutateAsync,
        removeAssignment: unbindMutation.mutateAsync,
        
        isAssigning: bindMutation.isPending
    };
};

