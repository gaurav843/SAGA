// FILEPATH: frontend/src/domains/system/api/index.ts
// @file: System API Client
// @author: ansav8@gmail.com
// @description: Typed fetchers for System Internals.
// FIXED: Corrected import path for config (3 levels up).

import { SystemPulse } from '../types';
// ⚡ FIX: Corrected Path depth
import { API_BASE_URL } from '../../../config'; 

const ENDPOINT = `${API_BASE_URL}/api/v1/system`;

export const SystemAPI = {
    /**
     * GET /pulse
     * Retrieves the Tri-Layer System State (Engine, Schema, Content).
     */
    getPulse: async (): Promise<SystemPulse> => {
        const res = await fetch(`${ENDPOINT}/pulse`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!res.ok) throw new Error(`System Pulse Failed: ${res.status}`);
        return res.json();
    }
};

