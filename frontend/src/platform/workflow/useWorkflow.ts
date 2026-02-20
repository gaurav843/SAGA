// FILEPATH: frontend/src/platform/workflow/useWorkflow.ts
// @file: Workflow Runtime Hook (Dumb UI Pattern)
// @role 🧠 Logic Container */
// @author: The Engineer
// @description: Determines available actions via Backend Fused Manifest and executes transitions via Dedicated API.
// @security-level: LEVEL 9 (UI Safe) */
// @narrator: Logs API requests, transition attempts, and governance results. */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { App } from 'antd';
import { API_BASE_URL } from '@kernel/config';
import { logger } from '../logging';

export interface TransitionOption {
    name: string;
    target: string;
    allowed: boolean; // ⚡ INJECTED BY GOVERNANCE
    reason?: string;  // ⚡ EXPLANATION FOR UI
    ui_config?: {
        icon?: string;
        type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
        danger?: boolean;
    };
}

export const useWorkflow = (domain: string, entityId: string | number, currentState: string, scope: string = 'LIFECYCLE') => {
    const { message, notification } = App.useApp();
    const queryClient = useQueryClient();

    // 1. Fetch Fused Manifest from Backend (The "Dumb UI" Approach)
    const { data: options = [], isLoading } = useQuery<TransitionOption[]>({
        queryKey: ['workflow', 'options', domain, scope, entityId, currentState],
        queryFn: async () => {
            logger.whisper("WORKFLOW", `Fetching transition options for ${domain}:${entityId} in state '${currentState}'...`);
            const res = await axios.get(`${API_BASE_URL}/api/v1/workflow/${domain}/${scope}/${entityId}/options`);
            logger.trace("WORKFLOW", `Received ${res.data.length} options for ${domain}:${entityId}`, { options: res.data });
            return res.data;
        },
        enabled: !!domain && !!entityId && !!currentState
    });

    // 2. Execute Transition via Specialized API
    const transitionMutation = useMutation({
        mutationFn: async (payload: { action: string; data?: any }) => {
            logger.trace("WORKFLOW", `Initiating transition [${payload.action}] on ${domain}:${entityId}`, payload.data);
            return axios.post(`${API_BASE_URL}/api/v1/workflow/${domain}/${scope}/${entityId}/transition`, {
                event: payload.action,
                context_data: payload.data || {}
            });
        },
        onSuccess: (_, variables) => {
            logger.tell("WORKFLOW", `Transition [${variables.action}] Successful on ${domain}:${entityId}`);
            message.success("State Transition Successful");
            
            // Invalidate the entity data so the UI refreshes
            queryClient.invalidateQueries({ queryKey: ['resource', domain, entityId] });
            queryClient.invalidateQueries({ queryKey: ['workflow'] });
        },
        onError: (err: any, variables) => {
            const detail = err.response?.data?.detail;
            
            // ⚡ GOVERNANCE ERROR PARSING
            if (Array.isArray(detail)) {
                logger.scream("WORKFLOW", `Governance Blocked Transition [${variables.action}]`, err);
                notification.error({
                    message: 'Transition Blocked by Governance',
                    description: detail.join('\n'),
                    duration: 5
                });
            } else {
                logger.scream("WORKFLOW", `Transition [${variables.action}] Failed`, err);
                message.error(detail || "Transition Failed");
            }
        }
    });

    return {
        availableActions: options,
        send: (action: string, data?: any) => transitionMutation.mutate({ action, data }),
        isTransitioning: transitionMutation.isPending,
        isLoading
    };
};
