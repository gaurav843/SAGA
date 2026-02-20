/* FILEPATH: frontend/src/domains/meta/features/governance/hooks/usePolicyBindings.ts */
/* @file Policy Binding Hook */
/* @author The Engineer */
/* @description Manages the "Jurisdiction" of policies (Binding Policies to Domains/Events). 
 * UPDATED: Uses Centralized Kernel Configuration.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { App } from 'antd';
// ⚡ FRACTAL IMPORT
import { API_BASE_URL } from '@kernel/config';

export interface PolicyBinding {
  id: number;
  policy_id: number;
  target_domain: string;
  target_scope: string; // 'DOMAIN' | 'PROCESS' | 'FIELD'
  target_context?: string; // e.g. 'GATE_IN' or 'email'
  priority: number;
  is_active: boolean;
}

export interface PolicyBindingDraft {
  policy_id: number;
  target_domain: string;
  target_scope: string;
  target_context?: string;
  priority: number;
  is_active: boolean;
}

export const usePolicyBindings = (domainKey: string) => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  // 1. FETCH BINDINGS
  const { data: bindings = [], isLoading } = useQuery({
    queryKey: ['meta', 'bindings', domainKey],
    queryFn: async () => {
        const res = await axios.get<PolicyBinding[]>(`${API_BASE_URL}/api/v1/meta/bindings`, {
            params: { domain: domainKey }
        });
        return res.data;
    },
    enabled: !!domainKey
  });

  // 2. CREATE BINDING
  const createMutation = useMutation({
    mutationFn: async (draft: PolicyBindingDraft) => {
        return axios.post(`${API_BASE_URL}/api/v1/meta/bindings`, draft);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['meta', 'bindings'] });
        message.success('Policy Enforced');
    },
    onError: (err: any) => {
        message.error(err.response?.data?.detail || 'Binding Failed');
    }
  });

  // 3. TOGGLE/UPDATE BINDING
  const updateMutation = useMutation({
      mutationFn: async ({ id, data }: { id: number, data: Partial<PolicyBinding> }) => {
          return axios.patch(`${API_BASE_URL}/api/v1/meta/bindings/${id}`, data);
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['meta', 'bindings'] });
      }
  });

  // 4. DELETE BINDING
  const deleteMutation = useMutation({
      mutationFn: async (id: number) => {
          return axios.delete(`${API_BASE_URL}/api/v1/meta/bindings/${id}`);
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['meta', 'bindings'] });
          message.success('Enforcement Removed');
      }
  });

  return {
    bindings,
    isLoading,
    createBinding: createMutation.mutateAsync,
    updateBinding: updateMutation.mutate,
    deleteBinding: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending
  };
};

