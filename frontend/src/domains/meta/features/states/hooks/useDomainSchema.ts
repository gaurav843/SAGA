// FILEPATH: frontend/src/domains/meta/features/states/hooks/useDomainSchema.ts
// @file: Domain Schema Hook
// @role: 🧠 Data Normalizer */
// @author: The Engineer
// @description: Fetches and normalizes the Domain Schema from the Kernel.
// @security-level: LEVEL 9 (Type Safety) */
// @updated: Now returns full Context Identity to prevent Assembler Race Conditions. */

import { useQuery } from '@tanstack/react-query';
import { MetaKernelService } from '@/api';
import { logger } from '@/platform/logging';
import { SchemaField } from '@/domains/meta/features/governance/types';

// ⚡ SYSTEM FIELDS (Fallback)
const SYSTEM_FIELDS: SchemaField[] = [
    { key: 'id', label: 'ID', data_type: 'NUMBER', group: 'SYSTEM' },
    { key: 'created_at', label: 'Created At', data_type: 'DATETIME', group: 'SYSTEM' },
    { key: 'updated_at', label: 'Updated At', data_type: 'DATETIME', group: 'SYSTEM' }
];

interface DomainSchemaContext {
    domain: string;
    fields: SchemaField[];
}

export const useDomainSchema = (domain: string) => {
    const { 
        data, 
        isLoading,
        error 
    } = useQuery<DomainSchemaContext>({
        queryKey: ['meta', 'schema', domain],
        queryFn: async () => {
            if (!domain) return { domain: '', fields: [] };
            
            logger.tell("SCHEMA", `Fetching Dictionary for ${domain}...`);
        
            // 1. Fetch from Backend
            // Response Format: { domain: "USER", fields: { "email": { ... }, "role": { ... } } }
            const res: any = await MetaKernelService.getDomainSchemaApiV1MetaSchemaDomainGet(domain, true);
            
            // 2. ⚡ NORMALIZATION LOGIC
            // The backend returns { domain: "USER", fields: { key: def } }
            // We need to convert that Dictionary into a List [ def1, def2 ]
            let normalized: SchemaField[] = [];
            let returnedDomain = domain; // Default to requested

            if (res && typeof res === 'object') {
                // Scenario A: Standard V2 Dictionary
                if (res.fields) {
                    returnedDomain = res.domain || domain; // Trust backend source of truth
                    
                    normalized = Object.values(res.fields).map((f: any) => ({
                        key: f.key,
                        label: f.label,
                        data_type: f.data_type,
                        widget_type: f.widget_type,
                        options: f.configuration?.options, 
                        is_system: f.is_system,
                        read_only: f.read_only, // ⚡ Capture ReadOnly state for AI
                        group: f.is_system ? 'SYSTEM' : 'DATA'
                    }));
                } 
                // Scenario B: Legacy Array (Rare fallback)
                else if (Array.isArray(res)) {
                    normalized = res;
                }
                // Scenario C: Flat Object Fallback
                else {
                    normalized = Object.values(res).filter((x: any) => x.key);
                }
            }

            logger.tell("SCHEMA", `Normalized ${normalized.length} fields for [${returnedDomain}].`);
            
            return {
                domain: returnedDomain,
                fields: normalized
            };
        },
        enabled: !!domain,
        initialData: { domain: domain, fields: SYSTEM_FIELDS } // Fail Safe
    });

    return {
        // ⚡ EXPOSE FULL CONTEXT
        domain: data?.domain || domain,
        fields: data?.fields || [], // Backward compatibility
        schemaFields: data?.fields || [], // Explicit naming
        isLoading,
        error
    };
};

