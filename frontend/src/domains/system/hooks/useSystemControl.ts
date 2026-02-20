// FILEPATH: frontend/src/domains/system/hooks/useSystemControl.ts
// @file: System Control Hook (Polymorphic Edition)
// @author: ansav8@gmail.com
// @description: Smartly routes toggle requests to either Domain Governance or Circuit Hypervisor.
// UPDATED: Added 'screens' query and polymorphic 'toggleFeature'.

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { App } from 'antd';

import { logger } from '../../../platform/logging';
import { API_BASE_URL } from '../../../config';
import type { KernelDomain, SystemConfig } from '../types';

const ENDPOINT = `${API_BASE_URL}/api/v1/system`;

export const useSystemControl = () => {
    const queryClient = useQueryClient();
    const { message } = App.useApp();
    const [isSafetyOn, setIsSafetyOn] = useState(true);

    // 1. Fetch Domains (Modules & Scopes)
    const { data: domains, isLoading: isLoadingDomains, refetch: refetchDomains } = useQuery({
        queryKey: ['system', 'domains'],
        queryFn: async () => {
            const res = await axios.get<KernelDomain[]>(`${ENDPOINT}/domains`);
            return res.data;
        }
    });

    // 2. Fetch Screens (Raw Circuits)
    // We fetch all circuits of type 'SCREEN'
    const { data: screens, isLoading: isLoadingScreens } = useQuery({
        queryKey: ['system', 'circuits', 'screens'],
        queryFn: async () => {
            const res = await axios.get<any[]>(`${ENDPOINT}/circuits?module_type=SCREEN`);
            return res.data;
        }
    });

    // 3. Fetch System Config
    const { data: config, isLoading: isLoadingConfig } = useQuery({
        queryKey: ['system', 'config'],
        queryFn: async () => {
            const res = await axios.get<SystemConfig[]>(`${ENDPOINT}/config`);
            return res.data;
        }
    });

    // ⚡ POLYMORPHIC TOGGLER
    const toggleFeatureMutation = useMutation({
        mutationFn: async ({ key, feature, state }: { key: string; feature: 'ui_enabled' | 'api_enabled' | 'UI' | 'API'; state: boolean }) => {
            
            // BRANCH A: Circuit Target (Scope/Screen) -> Uses ':' as separator
            if (key.includes(':')) {
                const target = key; // key IS the target URI (e.g. scope:USER:SIGNUP)
                const plane = feature === 'ui_enabled' ? 'UI' : 'API';
                const status = state ? 'NOMINAL' : 'HALTED';

                logger.whisper("HYPERVISOR", `⚡ Direct Switch: ${target} [${plane}] -> ${status}`);
                const res = await axios.patch(`${ENDPOINT}/circuits`, { target, plane, status });
                return res.data;
            } 
            
            // BRANCH B: Domain Target (Simple Key) -> Uses legacy patch
            else {
                const domain = domains?.find(d => d.key === key);
                const currentConfig = domain?.config || {};
                // Map UI/API to config keys
                const configKey = feature === 'UI' ? 'ui_enabled' : (feature === 'API' ? 'api_enabled' : feature);
                
                const newConfig = { ...currentConfig, [configKey]: state };
                
                logger.whisper("GOVERNANCE", `🔧 Domain Config: ${key} [${configKey}] -> ${state}`);
                const res = await axios.patch(`${ENDPOINT}/domains/${key}`, { config: newConfig });
                return res.data;
            }
        },
        onSuccess: (_, vars) => {
            logger.story("GOVERNANCE", `🛡️ Control Shift: ${vars.key} updated.`);
            
            // Invalidate everything to be safe
            queryClient.invalidateQueries({ queryKey: ['system', 'domains'] });
            queryClient.invalidateQueries({ queryKey: ['system', 'circuits'] });
            queryClient.invalidateQueries({ queryKey: ['system', 'manifest'] });
            
            message.success(`Circuit Updated: ${vars.key}`);
        },
        onError: (err: any) => {
            logger.scream("GOVERNANCE", "❌ Toggle Failed", err);
            message.error("Hypervisor rejected command.");
        }
    });

    const updateConfigMutation = useMutation({
        mutationFn: async ({ key, value }: { key: string; value: any }) => {
            const res = await axios.patch(`${ENDPOINT}/config/${key}`, { value });
            return res.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['system', 'config'] })
    });

    return {
        domains,
        screens, // Expose Screens
        config,
        isLoading: isLoadingDomains || isLoadingConfig || isLoadingScreens,
        isMutating: toggleFeatureMutation.isPending || updateConfigMutation.isPending,
        toggleFeature: toggleFeatureMutation.mutate,
        updateConfig: updateConfigMutation.mutate,
        refresh: refetchDomains,
        safety: {
            isOn: isSafetyOn,
            toggle: () => setIsSafetyOn(!isSafetyOn)
        }
    };
};

