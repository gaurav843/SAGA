// FILEPATH: frontend/src/platform/workflow/wizard-engine/utils/propsNormalizer.ts
// @file: Props Normalization Engine (The Rosetta Stone)
// @author: ansav8@gmail.com
// @security-level: LEVEL 9 (Strict Type Enforcement)
// @invariant: Backend State (read_only) must ALWAYS override Component Default State.
// @narrator: Silent utility, used by Renderers.
// @description: Translates Backend JSON Schema (snake_case) to Ant Design React Props (camelCase).

import type { WizardFieldSchema } from '../types';

/**
 * Normalizes backend field schema into strict React props.
 * Handles casing mismatches, type coercion, and state enforcement.
 */
export const normalizeProps = (
    field: WizardFieldSchema, 
    context: { isSubmitting: boolean; formData?: Record<string, any> }
): Record<string, any> => {
    // 1. EXTRACT RAW CONFIG
    // fieldProps bag contains the loose JSON from the DB
    const rawProps = field.fieldProps || {};
    
    // 2. STATE NORMALIZATION (The "Locked Field" Fix)
    // We check ALL possible backend keys for "Read Only" intent.
    const isReadOnly = 
        field.disabled === true || // Explicit schema prop
        rawProps.readonly === true || 
        rawProps.readOnly === true || 
        rawProps.read_only === true ||
        rawProps.disabled === true ||
        rawProps.is_locked === true;

    // 3. LAYOUT NORMALIZATION
    // Map backend layout concepts to AntD Grid/Form props
    const width = field.width || rawProps.width || 'md';
    
    // 4. CONSTRUCT BASE PROPS
    const normalized: Record<string, any> = {
        // Identity
        id: field.name,
        name: field.name,
        label: field.label,
        tooltip: field.tooltip || rawProps.tooltip,
        placeholder: field.placeholder || rawProps.placeholder,
        
        // Layout
        width,
        
        // Data Binding
        initialValue: field.initialValue,
        
        // ⚡ STATE ENFORCEMENT (Level 9 Invariant)
        // We set BOTH 'readonly' (ProForm) and 'disabled' to be safe.
        // For inputs, we also force HTML attributes via 'fieldProps'.
        readonly: isReadOnly,
        disabled: context.isSubmitting || isReadOnly, // Submitting freezes everything
        
        // Visibility
        hidden: field.hidden === true, // TODO: Add JMESPath evaluation here in Phase 2
    };

    // 5. COMPONENT-SPECIFIC SAFETY (Edge Cases)
    // Prevent dropdowns from opening if they are read-only
    if (field.component === 'SELECT_DROPDOWN' || field.component === 'ProFormSelect') {
        if (isReadOnly) {
            normalized.fieldProps = { 
                ...(normalized.fieldProps || {}), 
                open: false, 
                showSearch: false 
            };
        }
    }

    // 6. INJECT RAW PROPS (Low Priority)
    // We merge the remaining raw props, but specific keys above take precedence.
    // This allows the DB to pass 'addonAfter' or 'prefix' seamlessly.
    const { 
        readonly: _1, readOnly: _2, read_only: _3, disabled: _4, // Strip these, handled above
        width: _5,
        ...passThrough 
    } = rawProps;

    return {
        ...passThrough, // Backend overrides (e.g. prefix: "[LOCK]")
        ...normalized,  // Normalizer overrides (State invariants)
        
        // ⚡ DEEP MERGE for fieldProps to ensure HTML attributes stick
        fieldProps: {
            ...(passThrough.fieldProps || {}),
            ...(normalized.fieldProps || {}),
            // HTML-level enforcement
            readOnly: isReadOnly,
            autoComplete: "off" // Security default
        }
    };
};

