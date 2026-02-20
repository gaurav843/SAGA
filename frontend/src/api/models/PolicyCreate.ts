/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PolicyResolutionStrategy } from './PolicyResolutionStrategy';
import type { PolicyRule } from './PolicyRule';
export type PolicyCreate = {
    key: string;
    name: string;
    description?: (string | null);
    resolution?: PolicyResolutionStrategy;
    rules: Array<PolicyRule>;
    tags?: Array<string>;
    is_active?: boolean;
};

