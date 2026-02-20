/* FILEPATH: frontend/src/domains/meta/features/states/hooks/useFlowEditor.ts */
/* @file Workflow Data Controller */
/* @author The Engineer */
/* @description Manages CRUD operations for State Machines.
 * Connects the Visual Editor to the Backend API.
 * UPDATED: Uses Centralized Kernel Configuration via Alias.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { App } from 'antd';
import type { StateDefinition, StateMachineDraft } from '../types';
// ⚡ FRACTAL IMPORT
import { API_BASE_URL } from '@kernel/config';

export const useFlowEditor = (domainKey: string) => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  // 1. FETCH MACHINES
  const { data: machines = [], isLoading } = useQuery({
    queryKey: ['meta', 'states', domainKey],
    queryFn: async () => {
        const params: any = {};
        if (domainKey) params.domain = domainKey;
        
        // ⚡ GATEWAY: Use standardized base
        const res = await axios.get<StateDefinition[]>(`${API_BASE_URL}/api/v1/meta/states`, { params });
        return res.data;
    },
    enabled: true 
  });

  // 2. SAVE (CREATE / UPDATE)
  const saveMutation = useMutation({
    mutationFn: async (payload: StateMachineDraft) => {
        // POST creates a new VERSION in the ledger strategy
        return axios.post<StateDefinition>(`${API_BASE_URL}/api/v1/meta/states`, payload);
    },
    onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['meta', 'states'] });
        message.success(`Workflow v${data.data.version} Ratified`);
    },
    onError: (err: any) => {
        message.error(err.response?.data?.detail || 'Save Failed');
    }
  });

  return {
    machines,
    isLoading,
    saveMachine: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending
  };
};

