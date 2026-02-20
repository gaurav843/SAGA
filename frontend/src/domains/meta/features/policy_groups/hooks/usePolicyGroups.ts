/* FILEPATH: frontend/src/domains/meta/features/policy_groups/hooks/usePolicyGroups.ts */
/* @file Policy Groups Logic Hook */
/* @author The Engineer */
/* @description Manages CRUD operations for Policy Groups via the Backend API.
 * Uses React Query for state management and caching.
 * UPDATED: Uses Centralized Kernel Configuration via Alias.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { App } from 'antd';
import type { PolicyGroup, GroupDraft } from '../types';
// ⚡ FRACTAL IMPORT
import { API_BASE_URL } from '@kernel/config';

export const usePolicyGroups = () => {
    const queryClient = useQueryClient();
    const { message } = App.useApp();

    // 1. FETCH GROUPS
    const { data: groups = [], isLoading } = useQuery({
        queryKey: ['meta', 'groups'],
        queryFn: async () => {
            const res = await axios.get<PolicyGroup[]>(`${API_BASE_URL}/api/v1/meta/groups`);
            return res.data;
        }
    });

    // 2. CREATE GROUP
    const createMutation = useMutation({
        mutationFn: async (draft: GroupDraft) => {
            return axios.post(`${API_BASE_URL}/api/v1/meta/groups`, draft);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meta', 'groups'] });
            message.success('Policy Group Created');
        },
        onError: (err: any) => {
            message.error(err.response?.data?.detail || 'Creation Failed');
        }
    });

    // 3. UPDATE GROUP
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number, data: Partial<GroupDraft> }) => {
            return axios.patch(`${API_BASE_URL}/api/v1/meta/groups/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meta', 'groups'] });
            message.success('Policy Group Updated');
        },
        onError: (err: any) => {
            message.error(err.response?.data?.detail || 'Update Failed');
        }
    });

    // 4. DELETE GROUP
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            return axios.delete(`${API_BASE_URL}/api/v1/meta/groups/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meta', 'groups'] });
            message.success('Policy Group Deactivated');
        },
        onError: (err: any) => {
            message.error(err.response?.data?.detail || 'Deletion Failed');
        }
    });

    return {
        groups,
        isLoading,
        createGroup: createMutation.mutateAsync,
        updateGroup: updateMutation.mutateAsync,
        deleteGroup: deleteMutation.mutateAsync,
        isMutating: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending
    };
};
