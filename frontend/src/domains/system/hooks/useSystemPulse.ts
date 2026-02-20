// FILEPATH: frontend/src/domains/system/hooks/useSystemPulse.ts
// @file: System Pulse Hook (The Heartbeat)
// @author: ansav8@gmail.com
// @description: Polls the System API to maintain situational awareness.
// FIXED: Corrected import path for logger (3 levels up, not 4).

import { useState, useEffect, useCallback } from 'react';
import { SystemAPI } from '../api';
import { type SystemPulse } from '../types';
// ⚡ FIX: Corrected Path depth
import { logger } from '../../../platform/logging'; 

export const useSystemPulse = () => {
    const [pulse, setPulse] = useState<SystemPulse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const checkPulse = useCallback(async (silent = false) => {
        try {
            if (!silent) setIsLoading(true);
            const data = await SystemAPI.getPulse();
            setPulse(data);
            
            // ⚡ TELEMETRY: Only whisper if something changed or on first load
            if (!silent) {
                logger.whisper("SYSTEM", "💓 Pulse Checked", { 
                    version: data.versioning.content, 
                    latency: data.health.latency 
                });
            }
        } catch (err: any) {
            setError(err.message);
            logger.warn("SYSTEM", "💔 Pulse Missed", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Boot Sequence
    useEffect(() => {
        checkPulse();

        // ⚡ HEARTBEAT: Poll every 60 seconds to detect version changes
        const interval = setInterval(() => checkPulse(true), 60000);
        return () => clearInterval(interval);
    }, [checkPulse]);

    return { pulse, isLoading, error, refresh: checkPulse };
};

