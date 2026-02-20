/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { BindingType } from './BindingType';
import type { ScopeType } from './ScopeType';
export type PolicyBindingCreate = {
    policy_id?: (number | null);
    policy_group_id?: (number | null);
    binding_type?: BindingType;
    target_domain: string;
    target_scope?: ScopeType;
    target_context?: (string | null);
    priority?: number;
    is_active?: boolean;
};

