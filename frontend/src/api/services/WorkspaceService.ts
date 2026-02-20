/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ActiveAppCreate } from '../models/ActiveAppCreate';
import type { ActiveAppRead } from '../models/ActiveAppRead';
import type { ActiveAppUpdate } from '../models/ActiveAppUpdate';
import type { BrickList } from '../models/BrickList';
import type { ReleaseCreate } from '../models/ReleaseCreate';
import type { ReleaseRead } from '../models/ReleaseRead';
import type { ScreenCreate } from '../models/ScreenCreate';
import type { ScreenList } from '../models/ScreenList';
import type { ScreenRead } from '../models/ScreenRead';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class WorkspaceService {
    /**
     * List Screens
     * @returns ScreenList Successful Response
     * @throws ApiError
     */
    public static listScreensApiV1WorkspaceScreensGet(): CancelablePromise<ScreenList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/workspace/screens',
        });
    }
    /**
     * Create Screen
     * @param requestBody
     * @returns ScreenRead Successful Response
     * @throws ApiError
     */
    public static createScreenApiV1WorkspaceScreensPost(
        requestBody: ScreenCreate,
    ): CancelablePromise<ScreenRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/workspace/screens',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Bricks
     * @returns BrickList Successful Response
     * @throws ApiError
     */
    public static listBricksApiV1WorkspaceBricksGet(): CancelablePromise<BrickList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/workspace/bricks',
        });
    }
    /**
     * Install App
     * @param requestBody
     * @returns ActiveAppRead Successful Response
     * @throws ApiError
     */
    public static installAppApiV1WorkspaceAppsPost(
        requestBody: ActiveAppCreate,
    ): CancelablePromise<ActiveAppRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/workspace/apps',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Configure App
     * @param appId
     * @param requestBody
     * @returns ActiveAppRead Successful Response
     * @throws ApiError
     */
    public static configureAppApiV1WorkspaceAppsAppIdPatch(
        appId: number,
        requestBody: ActiveAppUpdate,
    ): CancelablePromise<ActiveAppRead> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/workspace/apps/{app_id}',
            path: {
                'app_id': appId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Uninstall App
     * @param appId
     * @returns void
     * @throws ApiError
     */
    public static uninstallAppApiV1WorkspaceAppsAppIdDelete(
        appId: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/workspace/apps/{app_id}',
            path: {
                'app_id': appId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Publish Release
     * Triggers a Snapshot of the current Draft.
     * @param screenId
     * @param requestBody
     * @returns ReleaseRead Successful Response
     * @throws ApiError
     */
    public static publishReleaseApiV1WorkspaceScreensScreenIdReleasesPost(
        screenId: number,
        requestBody: ReleaseCreate,
    ): CancelablePromise<ReleaseRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/workspace/screens/{screen_id}/releases',
            path: {
                'screen_id': screenId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Releases
     * @param screenId
     * @returns ReleaseRead Successful Response
     * @throws ApiError
     */
    public static listReleasesApiV1WorkspaceScreensScreenIdReleasesGet(
        screenId: number,
    ): CancelablePromise<Array<ReleaseRead>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/workspace/screens/{screen_id}/releases',
            path: {
                'screen_id': screenId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Resolve Layout
     * Returns the layout tree.
     * - mode=DRAFT (Default): Returns mutable workspace.
     * - mode=LIVE: Returns the frozen release pointed to by the screen.
     * @param routeSlug
     * @param mode
     * @returns any Successful Response
     * @throws ApiError
     */
    public static resolveLayoutApiV1WorkspaceLayoutRouteSlugGet(
        routeSlug: string,
        mode?: (string | null),
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/workspace/layout/{route_slug}',
            path: {
                'route_slug': routeSlug,
            },
            query: {
                'mode': mode,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
