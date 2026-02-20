/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { AttributeConfig } from './AttributeConfig';
import type { WidgetType } from './WidgetType';
export type AttributeUpdate = {
    label?: (string | null);
    description?: (string | null);
    widget_type?: (WidgetType | null);
    is_required?: (boolean | null);
    is_active?: (boolean | null);
    configuration?: (AttributeConfig | null);
};

