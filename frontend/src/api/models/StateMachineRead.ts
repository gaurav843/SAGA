/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type StateMachineRead = {
    id: number;
    /**
     * Matches DB Column
     */
    entity_key: string;
    scope: string;
    governed_field: string;
    name: string;
    version_major: number;
    version_minor: number;
    version_patch: number;
    is_active: boolean;
    is_latest?: boolean;
    transitions: Record<string, any>;
    initial_state?: (string | null);
    created_at: string;
    updated_at?: (string | null);
    readonly version: string;
};

