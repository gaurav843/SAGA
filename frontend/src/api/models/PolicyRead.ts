/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PolicyResolutionStrategy } from './PolicyResolutionStrategy';
import type { PolicyRule } from './PolicyRule';
export type PolicyRead = {
    key: string;
    name: string;
    description?: (string | null);
    resolution?: PolicyResolutionStrategy;
    rules: Array<PolicyRule>;
    tags?: Array<string>;
    is_active?: boolean;
    id: number;
    version_major: number;
    version_minor: number;
    is_latest: boolean;
    created_at: string;
    updated_at: (string | null);
    readonly version_display: string;
};

