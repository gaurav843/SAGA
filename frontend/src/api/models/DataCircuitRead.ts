/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Full database representation.
 */
export type DataCircuitRead = {
    /**
     * Immutable System Key (e.g. SALES_TO_LOGISTICS)
     */
    key: string;
    name: string;
    description?: (string | null);
    tags?: Array<string>;
    /**
     * Source Module Key (e.g. SALES)
     */
    source_domain: string;
    /**
     * Event Signal (e.g. DELIVERY_CREATED)
     */
    event_name: string;
    /**
     * Higher runs first
     */
    priority?: number;
    /**
     * JsonLogic Condition
     */
    gate_logic?: (Record<string, any> | null);
    /**
     * JMESPath Transformation Map
     */
    map_logic?: (Record<string, any> | null);
    /**
     * Target Module Key (e.g. LOGISTICS)
     */
    target_domain: string;
    /**
     * Target Command (e.g. CREATE_SHIPMENT)
     */
    action_key: string;
    /**
     * Retry Policy
     */
    resilience?: Record<string, any>;
    is_active?: boolean;
    id: string;
    version: number;
    created_at: string;
    updated_at?: (string | null);
};

