/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PolicyResolutionStrategy } from './PolicyResolutionStrategy';
import type { PolicyRule } from './PolicyRule';
export type PolicyUpdate = {
    name?: (string | null);
    description?: (string | null);
    resolution?: (PolicyResolutionStrategy | null);
    rules?: (Array<PolicyRule> | null);
    tags?: (Array<string> | null);
    is_active?: (boolean | null);
};

