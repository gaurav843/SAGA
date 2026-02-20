/* FILEPATH: frontend/src/domains/meta/features/policy_groups/types.ts */
/* @file Policy Group Types */
/* @author The Engineer */
/* @description TypeScript interfaces for Policy Bundles.
 * MATCHES: backend/app/core/meta/schemas.py (PolicyGroupRead, PolicyGroupCreate)
 */

export interface PolicyGroup {
    id: number;
    key: string;
    name: string;
    description?: string;
    
    // The ordered list of policy keys to execute
    policy_keys: string[];
    
    is_active: boolean;
    created_at: string;
    updated_at?: string;
}

export interface GroupDraft {
    key: string;
    name: string;
    description?: string;
    policy_keys: string[];
    is_active: boolean;
}

export const DEFAULT_GROUP_DRAFT: GroupDraft = {
    key: '',
    name: '',
    description: '',
    policy_keys: [],
    is_active: true
};

