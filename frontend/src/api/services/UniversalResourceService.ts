/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UniversalResourceService {
    /**
     * Check Availability
     * Checks if a value exists in the database.
     * 🛑 GUARDRAIL: Only allows checks on INDEXED or UNIQUE columns to prevent Table Scans.
     * @param domain
     * @param field The column name to check
     * @param value The value to validate
     * @returns any Successful Response
     * @throws ApiError
     */
    public static checkAvailabilityApiV1ResourceDomainAvailabilityGet(
        domain: string,
        field: string,
        value: string,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/resource/{domain}/availability',
            path: {
                'domain': domain,
            },
            query: {
                'field': field,
                'value': value,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Resources
     * UNIVERSAL SEARCH ENGINE.
     * Supports filtering by any Column OR Custom Attribute (Dynamic Container).
     * ⚡ POLYMORPHIC: Adapts to DomainType (STANDARD vs CONFIG).
     * @param domain
     * @param page
     * @param size
     * @returns any Successful Response
     * @throws ApiError
     */
    public static listResourcesApiV1ResourceDomainGet(
        domain: string,
        page: number = 1,
        size: number = 20,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/resource/{domain}',
            path: {
                'domain': domain,
            },
            query: {
                'page': page,
                'size': size,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Resource
     * @param domain
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static createResourceApiV1ResourceDomainPost(
        domain: string,
        requestBody: Record<string, any>,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/resource/{domain}',
            path: {
                'domain': domain,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Resource
     * @param domain
     * @param id
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getResourceApiV1ResourceDomainIdGet(
        domain: string,
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/resource/{domain}/{id}',
            path: {
                'domain': domain,
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Resource
     * @param domain
     * @param id
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static updateResourceApiV1ResourceDomainIdPatch(
        domain: string,
        id: number,
        requestBody: Record<string, any>,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/resource/{domain}/{id}',
            path: {
                'domain': domain,
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
     * Delete Resource
     * @param domain
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static deleteResourceApiV1ResourceDomainIdDelete(
        domain: string,
        id: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/resource/{domain}/{id}',
            path: {
                'domain': domain,
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
