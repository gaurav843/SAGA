/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type StateMachineCreate = {
    /**
     * The Business Object (e.g. USER)
     */
    domain: string;
    /**
     * The Process Context (e.g. LIFECYCLE)
     */
    scope: string;
    /**
     * Human readable name
     */
    name: string;
    /**
     * The DB column this workflow controls
     */
    governed_field?: string;
    /**
     * Full XState JSON definition
     */
    definition: Record<string, any>;
};

