/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BindingType } from './BindingType';
import type { PolicyGroupRead } from './PolicyGroupRead';
import type { PolicyRead } from './PolicyRead';
import type { ScopeType } from './ScopeType';
export type PolicyBindingRead = {
    policy_id?: (number | null);
    policy_group_id?: (number | null);
    binding_type?: BindingType;
    target_domain: string;
    target_scope?: ScopeType;
    target_context?: (string | null);
    priority?: number;
    is_active?: boolean;
    id: number;
    policy?: (PolicyRead | null);
    group?: (PolicyGroupRead | null);
};

