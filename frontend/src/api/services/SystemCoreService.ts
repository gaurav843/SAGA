/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SystemCoreService {
    /**
     * Get System Manifest
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getSystemManifestApiV1SystemManifestGet(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/system/manifest',
        });
    }
    /**
     * Get System Capabilities
     * THE AI MANIFEST.
     * Returns the complete menu of building blocks available to the OS.
     * Merges Static Enums (Kernel) with Dynamic Registries (Database).
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getSystemCapabilitiesApiV1SystemCapabilitiesGet(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/system/capabilities',
        });
    }
    /**
     * Get System Pulse
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getSystemPulseApiV1SystemPulseGet(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/system/pulse',
        });
    }
    /**
     * List Domains
     * @returns any Successful Response
     * @throws ApiError
     */
    public static listDomainsApiV1SystemDomainsGet(): CancelablePromise<Array<Record<string, any>>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/system/domains',
        });
    }
    /**
     * Patch Domain
     * @param key
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static patchDomainApiV1SystemDomainsKeyPatch(
        key: string,
        requestBody: Record<string, any>,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/system/domains/{key}',
            path: {
                'key': key,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Circuits
     * Fetches raw Circuit Breakers.
     * Useful for listing 'Screens' or 'Standalone' features.
     * @param plane
     * @param moduleType
     * @returns any Successful Response
     * @throws ApiError
     */
    public static listCircuitsApiV1SystemCircuitsGet(
        plane?: (string | null),
        moduleType?: (string | null),
    ): CancelablePromise<Array<Record<string, any>>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/system/circuits',
            query: {
                'plane': plane,
                'module_type': moduleType,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Set Circuit State
     * Directly toggles a switch in the Hypervisor.
     * Payload: { target: str, plane: str, status: 'NOMINAL' | 'HALTED' }
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static setCircuitStateApiV1SystemCircuitsPatch(
        requestBody: Record<string, any>,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/system/circuits',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Config
     * @returns any Successful Response
     * @throws ApiError
     */
    public static listConfigApiV1SystemConfigGet(): CancelablePromise<Array<Record<string, any>>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/system/config',
        });
    }
    /**
     * Update Config
     * @param key
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static updateConfigApiV1SystemConfigKeyPatch(
        key: string,
        requestBody: Record<string, any>,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/system/config/{key}',
            path: {
                'key': key,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
