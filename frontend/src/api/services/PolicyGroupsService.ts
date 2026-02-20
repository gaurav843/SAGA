/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PolicyGroupCreate } from '../models/PolicyGroupCreate';
import type { PolicyGroupRead } from '../models/PolicyGroupRead';
import type { PolicyGroupUpdate } from '../models/PolicyGroupUpdate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PolicyGroupsService {
    /**
     * Create Policy Group
     * @param requestBody
     * @returns PolicyGroupRead Successful Response
     * @throws ApiError
     */
    public static createGroupApiV1MetaGroupsPost(
        requestBody: PolicyGroupCreate,
    ): CancelablePromise<PolicyGroupRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/meta/groups/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Groups
     * @param active Filter active groups
     * @returns PolicyGroupRead Successful Response
     * @throws ApiError
     */
    public static listGroupsApiV1MetaGroupsGet(
        active: boolean = true,
    ): CancelablePromise<Array<PolicyGroupRead>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/meta/groups/',
            query: {
                'active': active,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Group Details
     * @param id Group ID
     * @returns PolicyGroupRead Successful Response
     * @throws ApiError
     */
    public static getGroupApiV1MetaGroupsIdGet(
        id: number,
    ): CancelablePromise<PolicyGroupRead> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/meta/groups/{id}',
            path: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Group
     * @param id
     * @param requestBody
     * @returns PolicyGroupRead Successful Response
     * @throws ApiError
     */
    public static updateGroupApiV1MetaGroupsIdPatch(
        id: number,
        requestBody: PolicyGroupUpdate,
    ): CancelablePromise<PolicyGroupRead> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/meta/groups/{id}',
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
     * Deactivate Group
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static deleteGroupApiV1MetaGroupsIdDelete(
        id: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/meta/groups/{id}',
            path: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
