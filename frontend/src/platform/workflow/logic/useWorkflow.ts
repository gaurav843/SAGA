/* FILEPATH: frontend/src/platform/workflow/logic/useWorkflow.ts */
/* @file Workflow State Logic Hook */
/* @author The Engineer */

import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { workflowApi } from '../api/client';
import type { TransitionOption } from './types';

export const useWorkflow = (domain: string, id: string | number, onSuccess?: () => void) => {
    const [options, setOptions] = useState<TransitionOption[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchOptions = useCallback(async () => {
        try {
            const data = await workflowApi.getOptions(domain, id);
            setOptions(data);
        } catch (err) {
            console.error('[Workflow] Failed to load options', err);
        }
    }, [domain, id]);

    // Initial Load
    useEffect(() => {
        fetchOptions();
    }, [fetchOptions]);

    const transition = async (event: string, payload: any) => {
        setLoading(true);
        try {
            const res = await workflowApi.execute(domain, id, event, payload);
            message.success(`Transition to ${res.new_state} successful.`);
            
            // Refresh options as state has changed
            await fetchOptions();
            
            if (onSuccess) onSuccess();
            return true;
        } catch (err: any) {
            const msg = err.response?.data?.detail || "Transition failed";
            message.error(msg);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        options,
        loading,
        transition,
        refresh: fetchOptions
    };
};

