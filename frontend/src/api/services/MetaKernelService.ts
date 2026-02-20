// FILEPATH: frontend/src/api/services/MetaKernelService.ts
// generated using openapi-typescript-codegen -- do not edit */
// istanbul ignore file */
// tslint:disable */
// eslint-disable */
import type { AttributeCreate } from '../models/AttributeCreate';
import type { AttributeRead } from '../models/AttributeRead';
import type { AttributeUpdate } from '../models/AttributeUpdate';
import type { DryRunRequest } from '../models/DryRunRequest';
import type { DryRunResult } from '../models/DryRunResult';
import type { PolicyBindingCreate } from '../models/PolicyBindingCreate';
import type { PolicyBindingRead } from '../models/PolicyBindingRead';
import type { PolicyBindingUpdate } from '../models/PolicyBindingUpdate';
import type { PolicyCreate } from '../models/PolicyCreate';
import type { PolicyGroupCreate } from '../models/PolicyGroupCreate';
import type { PolicyGroupRead } from '../models/PolicyGroupRead';
import type { PolicyGroupUpdate } from '../models/PolicyGroupUpdate';
import type { PolicyRead } from '../models/PolicyRead';
import type { PolicyUpdate } from '../models/PolicyUpdate';
import type { RuleCreate } from '../models/RuleCreate';
import type { RuleRead } from '../models/RuleRead';
import type { StateMachineCreate } from '../models/StateMachineCreate';
import type { StateMachineRead } from '../models/StateMachineRead';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class MetaKernelService {

    /**
     * ⚡ GET TOPOLOGY (Manual Patch)
     * Fetch the Concrete Topology for a Domain.
     * @param domain
     * @returns any[] Successful Response
     */
    public static getTopology(
        domain: string,
    ): CancelablePromise<Array<any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/meta/topology/{domain}',
            path: {
                'domain': domain,
            },
        });
    }

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
     * List Policies
     * @returns PolicyRead Successful Response
     * @throws ApiError
     */
    public static listPoliciesApiV1MetaPoliciesGet(): CancelablePromise<Array<PolicyRead>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/meta/policies',
        });
    }
    /**
     * Create Policy
     * @param requestBody
     * @returns PolicyRead Successful Response
     * @throws ApiError
     */
    public static createPolicyApiV1MetaPoliciesPost(
        requestBody: PolicyCreate,
    ): CancelablePromise<PolicyRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/meta/policies',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Policy
     * @param id
     * @param requestBody
     * @returns PolicyRead Successful Response
     * @throws ApiError
     */
    public static updatePolicyApiV1MetaPoliciesIdPatch(
        id: number,
        requestBody: PolicyUpdate,
    ): CancelablePromise<PolicyRead> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/meta/policies/{id}',
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
     * Dry Run Policy
     * @param requestBody
     * @returns DryRunResult Successful Response
     * @throws ApiError
     */
    public static dryRunPolicyApiV1MetaPoliciesDryRunPost(
        requestBody: DryRunRequest,
    ): CancelablePromise<DryRunResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/meta/policies/dry-run',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Policy History
     * @param key
     * @returns PolicyRead Successful Response
     * @throws ApiError
     */
    public static getPolicyHistoryApiV1MetaPoliciesKeyHistoryGet(
        key: string,
    ): CancelablePromise<Array<PolicyRead>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/meta/policies/{key}/history',
            path: {
                'key': key,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Restore Policy Version
     * @param versionId
     * @returns PolicyRead Successful Response
     * @throws ApiError
     */
    public static restorePolicyVersionApiV1MetaPoliciesVersionIdRestorePost(
        versionId: number,
    ): CancelablePromise<PolicyRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/meta/policies/{version_id}/restore',
            path: {
                'version_id': versionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Bindings
     * @param domain Filter by Domain Key
     * @param scope Filter by Scope
     * @param search Search by Name or Tag
     * @returns PolicyBindingRead Successful Response
     * @throws ApiError
     */
    public static listBindingsApiV1MetaBindingsGet(
        domain?: (string | null),
        scope?: (string | null),
        search?: (string | null),
    ): CancelablePromise<Array<PolicyBindingRead>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/meta/bindings',
            query: {
                'domain': domain,
                'scope': scope,
                'search': search,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Binding
     * @param requestBody
     * @returns PolicyBindingRead Successful Response
     * @throws ApiError
     */
    public static createBindingApiV1MetaBindingsPost(
        requestBody: PolicyBindingCreate,
    ): CancelablePromise<PolicyBindingRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/meta/bindings',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Binding
     * @param id
     * @param requestBody
     * @returns PolicyBindingRead Successful Response
     * @throws ApiError
     */
    public static updateBindingApiV1MetaBindingsIdPatch(
        id: number,
        requestBody: PolicyBindingUpdate,
    ): CancelablePromise<PolicyBindingRead> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/meta/bindings/{id}',
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
     * Delete Binding
     * @param id
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteBindingApiV1MetaBindingsIdDelete(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/meta/bindings/{id}',
            path: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Attribute
     * @param requestBody
     * @returns AttributeRead Successful Response
     * @throws ApiError
     */
    public static createAttributeApiV1MetaAttributesPost(
        requestBody: AttributeCreate,
    ): CancelablePromise<AttributeRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/meta/attributes',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Attribute
     * @param id
     * @param requestBody
     * @returns AttributeRead Successful Response
     * @throws ApiError
     */
    public static updateAttributeApiV1MetaAttributesIdPatch(
        id: number,
        requestBody: AttributeUpdate,
    ): CancelablePromise<AttributeRead> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/meta/attributes/{id}',
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
     * Delete Attribute
     * @param id
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteAttributeApiV1MetaAttributesIdDelete(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/meta/attributes/{id}',
            path: {
                'id': id,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Rules
     * @param domain
     * @param eventType
     * @param scope
     * @returns RuleRead Successful Response
     * @throws ApiError
     */
    public static listRulesApiV1MetaRulesGet(
        domain: string,
        eventType?: (string | null),
        scope?: (string | null),
    ): CancelablePromise<Array<RuleRead>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/meta/rules',
            query: {
                'domain': domain,
                'event_type': eventType,
                'scope': scope,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Rule
     * @param requestBody
     * @returns RuleRead Successful Response
     * @throws ApiError
     */
    public static createRuleApiV1MetaRulesPost(
        requestBody: RuleCreate,
    ): CancelablePromise<RuleRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/meta/rules',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Domain Schema
     * SCHEMA FUSION ENDPOINT.
     * Delegates all logic to MetaService.get_fused_schema.
     * @param domain
     * @param activeOnly
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getDomainSchemaApiV1MetaSchemaDomainGet(
        domain: string,
        activeOnly: boolean = true,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/meta/schema/{domain}',
            path: {
                'domain': domain,
            },
            query: {
                'active_only': activeOnly,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Domains
     * @returns any Successful Response
     * @throws ApiError
     */
    public static listDomainsApiV1MetaDomainsGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/meta/domains',
        });
    }
}

