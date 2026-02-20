// FILEPATH: frontend/src/domains/meta_v2/features/workflows/hooks/useDomainSchema.ts
// @file: Domain Schema Hook
// @role: 🧠 Data Normalizer */
// @author: The Engineer
// @description: Fetches and normalizes the Domain Schema from the Kernel for the V2 Workflow Engine.
// @security-level: LEVEL 9 (Type Safety) */

import { useQuery } from '@tanstack/react-query';
import { MetaKernelService } from '@/api';
import { logger } from '@/platform/logging';

export const useDomainSchema = (domain: string) => {
    const { 
        data, 
        isLoading,
        error 
    } = useQuery({
        // ⚡ FIX: Namespaced Key 'workflow_schema' to prevent collision with Governance 'schema' key.
        // This ensures this hook always runs its own normalization logic (Array) instead of receiving a raw Object from cache.
        queryKey: ['meta_v2', 'workflow_schema', domain],
        queryFn: async () => {
            if (!domain) return { domain: '', fields: [] };
            
            logger.tell("SCHEMA", `Fetching Dictionary for ${domain}...`);
            
            // 1. Fetch from Backend
            const res: any = await MetaKernelService.getDomainSchemaApiV1MetaSchemaDomainGet(domain, true);
            
            // 2. ⚡ NORMALIZATION LOGIC
            let normalized: any[] = [];
            let returnedDomain = domain; 

            if (res && typeof res === 'object') {
                if (res.fields) {
                    returnedDomain = res.domain || domain;
                    normalized = Object.values(res.fields).map((f: any) => ({
                        key: f.key,
                        label: f.label,
                        data_type: f.data_type,
                        widget_type: f.widget_type,
                        options: f.configuration?.options, 
                        is_system: f.is_system,
                        read_only: f.read_only, 
                        group: f.is_system ? 'SYSTEM' : 'DATA'
                    }));
                } 
                else if (Array.isArray(res)) {
                    normalized = res;
                }
                else {
                    normalized = Object.values(res).filter((x: any) => x.key);
                }
            }

            logger.trace("SCHEMA", `Normalized ${normalized.length} fields for [${returnedDomain}].`);

            return {
                domain: returnedDomain,
                fields: normalized
            };
        },
        enabled: !!domain
    });

    return {
        domain: data?.domain || domain,
        fields: data?.fields || [], 
        schemaFields: data?.fields || [], 
        isLoading,
        error
    };
};

