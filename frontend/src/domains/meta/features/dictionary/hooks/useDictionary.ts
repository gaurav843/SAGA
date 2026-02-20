/* FILEPATH: frontend/src/domains/meta/features/dictionary/hooks/useDictionary.ts */
/* @file Dictionary Logic Hook */
/* @author The Engineer */
/* @description Encapsulates all Data Access Logic for Domain Attributes.
 * FRACTAL PATTERN: Separates Data (Axios/ReactQuery) from View (Components).
 * UPDATED: Uses Centralized Kernel Configuration.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { App } from 'antd';
import { normalizeSchema } from '../logic/schemaNormalizer';
import type { AttributeDefinition, AttributeDraft } from '../types';
// ⚡ FRACTAL IMPORT
import { API_BASE_URL } from '@kernel/config';

export const useDictionary = (domainKey: string) => {
    const queryClient = useQueryClient();
    const { message } = App.useApp();

    // 1. FETCH ATTRIBUTES
    const { data: attributes = [], isLoading, isError } = useQuery({
        queryKey: ['meta', 'attributes', domainKey],
        queryFn: async () => {
            if (!domainKey) return [];
            // ⚡ GATEWAY: Use standardized base
            const res = await axios.get(`${API_BASE_URL}/api/v1/meta/schema/${domainKey}`, {
                params: { active_only: false }
            });
            return normalizeSchema(res.data);
        },
        enabled: !!domainKey
    });

    // 2. SAVE (CREATE / UPDATE)
    const saveMutation = useMutation({
        mutationFn: async (draft: AttributeDraft) => {
            if (draft.id && draft.id > 0) {
                // Update Existing
                return axios.patch(`${API_BASE_URL}/api/v1/meta/attributes/${draft.id}`, draft);
            } else {
                // Create New
                return axios.post(`${API_BASE_URL}/api/v1/meta/attributes`, { 
                    ...draft, 
                    domain: domainKey 
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meta', 'attributes'] });
            message.success('Schema Definition Saved');
        },
        onError: (err: any) => {
            message.error(err.response?.data?.detail || 'Save failed');
        }
    });

    // 3. DELETE
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            return axios.delete(`${API_BASE_URL}/api/v1/meta/attributes/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meta', 'attributes'] });
            message.success('Attribute Deleted');
        },
        onError: (err: any) => {
            message.error(err.response?.data?.detail || 'Delete failed');
        }
    });

    return {
        // Data
        attributes,
        isLoading,
        isError,
        
        // Actions
        saveAttribute: saveMutation.mutate,
        deleteAttribute: deleteMutation.mutateAsync, // Async allows waiting in UI if needed
        
        // State
        isSaving: saveMutation.isPending,
        isDeleting: deleteMutation.isPending
    };
};

