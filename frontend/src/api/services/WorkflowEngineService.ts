/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StateMachineCreate } from '../models/StateMachineCreate';
import type { StateMachineRead } from '../models/StateMachineRead';
import type { TransitionOption } from '../models/TransitionOption';
import type { TransitionRequest } from '../models/TransitionRequest';
import type { TransitionResponse } from '../models/TransitionResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class WorkflowEngineService {
    /**
     * Create State Machine
     * @param requestBody
     * @returns StateMachineRead Successful Response
     * @throws ApiError
     */
    public static createStateMachineApiV1MetaStatesPost(
        requestBody: StateMachineCreate,
    ): CancelablePromise<StateMachineRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/meta/states',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List State Machines
     * @param domain
     * @returns StateMachineRead Successful Response
     * @throws ApiError
     */
    public static listStateMachinesApiV1MetaStatesGet(
        domain?: (string | null),
    ): CancelablePromise<Array<StateMachineRead>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/meta/states',
            query: {
                'domain': domain,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Flow Definition
     * @param domain
     * @param scope
     * @returns StateMachineRead Successful Response
     * @throws ApiError
     */
    public static getFlowDefinitionApiV1MetaStatesDomainScopeGet(
        domain: string,
        scope: string,
    ): CancelablePromise<StateMachineRead> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/meta/states/{domain}/{scope}',
            path: {
                'domain': domain,
                'scope': scope,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Flow History
     * @param domain
     * @param scope
     * @returns StateMachineRead Successful Response
     * @throws ApiError
     */
    public static getFlowHistoryApiV1MetaStatesDomainScopeHistoryGet(
        domain: string,
        scope: string,
    ): CancelablePromise<Array<StateMachineRead>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/meta/states/{domain}/{scope}/history',
            path: {
                'domain': domain,
                'scope': scope,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Flow Version
     * @param domain
     * @param scope
     * @param version
     * @returns StateMachineRead Successful Response
     * @throws ApiError
     */
    public static getFlowVersionApiV1MetaStatesDomainScopeVersionGet(
        domain: string,
        scope: string,
        version: number,
    ): CancelablePromise<StateMachineRead> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/meta/states/{domain}/{scope}/{version}',
            path: {
                'domain': domain,
                'scope': scope,
                'version': version,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Workflow
     * @param id
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteWorkflowApiV1MetaStatesIdDelete(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/meta/states/{id}',
            path: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Transition Options
     * Menu Builder. Returns valid next steps for this specific entity.
     * @param domain
     * @param id
     * @returns TransitionOption Successful Response
     * @throws ApiError
     */
    public static getTransitionOptionsApiV1TransitionDomainIdOptionsGet(
        domain: string,
        id: number,
    ): CancelablePromise<Array<TransitionOption>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/transition/{domain}/{id}/options',
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
     * Execute Transition
     * Executes a State Transition with Context.
     * ⚡ UPDATED: Now applies Payload Data to the Entity (Data Persistence).
     * @param domain
     * @param id
     * @param requestBody
     * @returns TransitionResponse Successful Response
     * @throws ApiError
     */
    public static executeTransitionApiV1TransitionDomainIdPost(
        domain: string,
        id: number,
        requestBody: TransitionRequest,
    ): CancelablePromise<TransitionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/transition/{domain}/{id}',
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
}
