/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RuleEffect } from './RuleEffect';
import type { RuleEventType } from './RuleEventType';
export type RuleCreate = {
    target_domain: string;
    scope?: (string | null);
    name: string;
    description?: (string | null);
    event_type?: RuleEventType;
    logic: Record<string, any>;
    effect: RuleEffect;
    priority?: number;
    is_active?: boolean;
};

