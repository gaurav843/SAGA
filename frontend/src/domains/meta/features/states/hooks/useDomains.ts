/* FILEPATH: frontend/src/domains/meta/features/states/hooks/useDomains.ts */
/* @file Use Domains Hook (The Data Link) */
/* @author The Engineer */
/* @description Fetches the Domain Registry reliably using React Query.
 * REPLACES: The unreliable usage of SystemRegistry singleton for domain data.
 * INTEGRATED: UniversalNarrator for fetch logging.
 */

import { useQuery } from '@tanstack/react-query';
import { MetaKernelService } from '../../../../../api/services/MetaKernelService';
import type { DomainSummary } from '@kernel/types';

// ⚡ NARRATOR
const logData = (action: string, data?: any) => {
    console.log(`%c[DATA] ${action}`, 'color: #00bcd4; font-weight: bold;', data || '');
};

export const useDomains = () => {
    const { data: domains = [], isLoading, error } = useQuery({
        queryKey: ['meta', 'domains'],
        queryFn: async () => {
            logData('📡 Fetching Domain Registry...');
            try {
                // Fetch generic domains via Kernel Service
                // Note: The API returns `any`, we cast to DomainSummary[] based on known shape
                const response = await MetaKernelService.listDomainsApiV1MetaDomainsGet();
                
                // If response is wrapped in 'modules' (manifest style), extract it
                const result = (response as any).modules || response;
                
                logData('✅ Domains Loaded', { count: result.length });
                return result as DomainSummary[];
            } catch (err) {
                logData('🔥 Domain Fetch Failed', err);
                throw err;
            }
        },
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
        refetchOnWindowFocus: false
    });

    return {
        domains,
        isLoading,
        error
    };
};
