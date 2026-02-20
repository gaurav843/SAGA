/* FILEPATH: frontend/src/platform/workflow/api/client.ts */
/* @file Workflow API Client */
/* @author The Engineer */
/* @description Strict API Proxy for the Workflow Engine. 
 * UPDATED: Uses Robust '@kernel' Alias for Configuration.
 */

import axios from 'axios';
import type { TransitionOption, TransitionResponse } from '../logic/types';
// ⚡ FRACTAL IMPORT: Absolute path via Kernel Alias
import { API_BASE_URL } from '@kernel/config';

export const workflowApi = {
    /** * Ask the Bouncer: "What can I do with this entity?" 
     */
    getOptions: async (domain: string, id: string | number): Promise<TransitionOption[]> => {
        // ⚡ GATEWAY: Use normalized base + explicit versioning
        const res = await axios.get(`${API_BASE_URL}/api/v1/transition/${domain}/${id}/options`);
        return res.data;
    },

    /** * Execute Move: "I want to go to the VIP Lounge" 
     */
    execute: async (
        domain: string, 
        id: string | number, 
        event: string, 
        payload: Record<string, any>
    ): Promise<TransitionResponse> => {
        const res = await axios.post(`${API_BASE_URL}/api/v1/transition/${domain}/${id}`, {
            event,
            payload
        });
        return res.data;
    }
};
