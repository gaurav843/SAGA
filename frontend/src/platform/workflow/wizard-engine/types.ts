// FILEPATH: frontend/src/platform/workflow/wizard-engine/types.ts
// @file: Wizard Engine Types (Context Expanded)
// @author: ansav8@gmail.com
// @security-level: LEVEL 9 (Type Safety)
// @updated: Added 'formData' to RenderContext for Read-Only binding.

export interface WizardFieldSchema {
    // Identity
    name: string;
    label: string;
    component: string; // e.g., 'ProFormText', 'ProTable'
    
    // State & Visibility
    hidden?: boolean | string; // JMESPath or boolean
    disabled?: boolean | string; // JMESPath or boolean
    required?: boolean | string;
    
    // Data & Validation
    initialValue?: any;
    placeholder?: string; // ⚡ Used by SmartGrid to store target Scope (e.g. 'SIGNUP_FLOW')
    rules?: any[];

    // Options (Select/Radio)
    options?: { label: string; value: any }[];
    request?: string; // URL for async options
    
    // Structure (Nested/Grid)
    // ⚡ NEW: Defines columns for ProTable/SmartGrid components
    columns?: {
        title: string;
        dataIndex: string;
        key?: string;
        valueType?: string; // 'text', 'date', 'select', etc.
        hideInSearch?: boolean;
        hideInTable?: boolean;
        valueEnum?: Record<string, any>;
    }[];
    
    // Container Props
    width?: string | number;
    tooltip?: string;
    
    // Extension Bag (for custom props not typed above)
    fieldProps?: Record<string, any>;
}

export interface WizardStepSchema {
    meta?: {
        title?: string;
        description?: string;
        form_schema?: WizardFieldSchema[];
    };
    on?: Record<string, string>; // Transitions
    type?: 'final' | 'atomic' | 'compound';
}

export interface RenderContext {
    domain: string;
    scope: string;
    isSubmitting: boolean;
    form?: any; // Antd Form Instance
    
    // ⚡ DATA INJECTION: Allows widgets to read state without Form binding
    formData?: Record<string, any>; 
}

