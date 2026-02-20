/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * The Black Box Record.
 */
export type NexusTraceRead = {
    id: string;
    circuit_id: (string | null);
    correlation_id: string;
    parent_trace_id: (string | null);
    status: string;
    retry_count: number;
    input_snapshot: (Record<string, any> | null);
    output_snapshot: (Record<string, any> | null);
    error_log: (Record<string, any> | null);
    duration_ms: number;
    created_at: string;
    circuit_key?: (string | null);
};

