/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { DataCircuitCreate } from '../models/DataCircuitCreate';
import type { DataCircuitRead } from '../models/DataCircuitRead';
import type { DataCircuitUpdate } from '../models/DataCircuitUpdate';
import type { NexusTraceRead } from '../models/NexusTraceRead';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class NexusBrokerService {
    /**
     * List Circuits
     * Topology Discovery.
     * Returns the active neural pathways.
     * @param source Filter by Source Domain
     * @param target Filter by Target Domain
     * @returns DataCircuitRead Successful Response
     * @throws ApiError
     */
    public static listCircuitsApiV1NexusCircuitsGet(
        source?: (string | null),
        target?: (string | null),
    ): CancelablePromise<Array<DataCircuitRead>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/nexus/circuits',
            query: {
                'source': source,
                'target': target,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Circuit
     * Register a new Neural Pathway.
     * @param requestBody
     * @returns DataCircuitRead Successful Response
     * @throws ApiError
     */
    public static createCircuitApiV1NexusCircuitsPost(
        requestBody: DataCircuitCreate,
    ): CancelablePromise<DataCircuitRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/nexus/circuits',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Circuit
     * Hot-Swap Circuit Logic.
     * Updates gates or mapping without reboot.
     * @param id
     * @param requestBody
     * @returns DataCircuitRead Successful Response
     * @throws ApiError
     */
    public static updateCircuitApiV1NexusCircuitsIdPatch(
        id: string,
        requestBody: DataCircuitUpdate,
    ): CancelablePromise<DataCircuitRead> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/nexus/circuits/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Circuit
     * Sever a connection.
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static deleteCircuitApiV1NexusCircuitsIdDelete(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/nexus/circuits/{id}',
            path: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Search Traces
     * Black Box Search.
     * Find execution logs by Transaction ID.
     * @param correlationId Trace entire transaction chain
     * @param limit
     * @returns NexusTraceRead Successful Response
     * @throws ApiError
     */
    public static searchTracesApiV1NexusTracesGet(
        correlationId?: (string | null),
        limit: number = 50,
    ): CancelablePromise<Array<NexusTraceRead>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/nexus/traces',
            query: {
                'correlation_id': correlationId,
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
