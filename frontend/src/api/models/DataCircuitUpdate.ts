/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Patch model for updates.
 */
export type DataCircuitUpdate = {
    name?: (string | null);
    description?: (string | null);
    tags?: (Array<string> | null);
    priority?: (number | null);
    gate_logic?: (Record<string, any> | null);
    map_logic?: (Record<string, any> | null);
    resilience?: (Record<string, any> | null);
    is_active?: (boolean | null);
};

