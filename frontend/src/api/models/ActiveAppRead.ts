/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ActiveAppRead = {
    screen_id: number;
    scope_id: number;
    parent_app_id?: (number | null);
    config?: Record<string, any>;
    placement?: Record<string, any>;
    security_policy?: Record<string, any>;
    is_active?: boolean;
    id: number;
    created_at: string;
    updated_at?: (string | null);
    scope_key?: (string | null);
    scope_type?: (string | null);
};

