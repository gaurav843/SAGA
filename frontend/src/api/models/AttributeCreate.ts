/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AttributeConfig } from './AttributeConfig';
import type { AttributeType } from './AttributeType';
import type { WidgetType } from './WidgetType';
export type AttributeCreate = {
    domain: string;
    key: string;
    label: string;
    description?: (string | null);
    data_type?: AttributeType;
    widget_type?: WidgetType;
    is_required?: boolean;
    is_unique?: boolean;
    is_system?: boolean;
    is_active?: boolean;
    configuration?: AttributeConfig;
};

