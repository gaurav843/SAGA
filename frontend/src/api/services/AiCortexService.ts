/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AIRequest } from '../models/AIRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AiCortexService {
    /**
     * Generate Schema
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static generateSchemaApiV1AiGeneratePost(
        requestBody: AIRequest,
    ): CancelablePromise<Array<Record<string, any>>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/ai/generate',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
