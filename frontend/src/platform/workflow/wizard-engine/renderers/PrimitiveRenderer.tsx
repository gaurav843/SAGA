// FILEPATH: frontend/src/platform/workflow/wizard-engine/renderers/PrimitiveRenderer.tsx
// @file: Primitive Renderer (Normalized & Secure)
// @author: ansav8@gmail.com
// @description: Delegates rendering to DynamicWidget with Level 9 Props Normalization.
// @security-level: LEVEL 9 (Data Injection + State Enforcement)
// @updated: Integrated 'normalizeProps' to fix the "Locked Email" bug.

import React, { useMemo } from 'react';
import { Form } from 'antd';
import axios from 'axios';

import type { WizardFieldSchema, RenderContext } from '../types';
import { logger } from '../../../logging';
import { useFieldSentinel } from '../hooks/useFieldSentinel';
import { API_BASE_URL } from '../../../../_kernel/config';
import { DynamicWidget } from './DynamicWidget';
import { normalizeProps } from '../utils/propsNormalizer'; // ⚡ IMPORT NORMALIZER

interface PrimitiveRendererProps {
    field: WizardFieldSchema;
    context: RenderContext;
}

export const PrimitiveRenderer: React.FC<PrimitiveRendererProps> = ({ field, context }) => {
    const form = Form.useFormInstance();

    // 0. DEFENSIVE: Snapshot rules
    const safeRules = useMemo(() => {
        return field.rules ? [...field.rules] : [];
    }, [field.rules, field.name]);

    // 1. EVENT SENTINEL (Validation Sniper)
    const sentinelRef = useFieldSentinel(field, form, context.domain, safeRules);

    // 2. RULE HYDRATION (Async Validator Logic)
    const hydratedRules = useMemo(() => {
        const rawRules = [...safeRules];
        
        if (rawRules.length === 0 && field.required) {
            rawRules.push({ required: true, message: `${field.label} is required` });
        }

        return rawRules.map((rule: any) => {
            if (rule.validator === 'checkUniqueness') {
                const cleanRule = JSON.parse(JSON.stringify(rule));
                delete cleanRule.validator;

                return {
                    ...cleanRule,
                    validator: async (_: any, value: any) => {
                        if (!value) return Promise.resolve();
                        try {
                            const endpoint = `${API_BASE_URL}/api/v1/resource/${context.domain}/availability`;
                            const fieldName = rule.field || field.name;
                            
                            logger.whisper("VALIDATOR", `🔍 Checking [${fieldName}]="${value}"`);
                            const res = await axios.get(endpoint, { params: { field: fieldName, value: value } });

                            if (!res.data.available) {
                                logger.warn("VALIDATOR", `⛔ Conflict: ${value} is taken.`);
                                return Promise.reject(new Error(rule.message || "This value is already taken."));
                            }
                            return Promise.resolve();
                        } catch (err: any) {
                            console.error(`[PrimitiveRenderer] Validation Error:`, err);
                            return Promise.resolve(); // Fail open on network error
                        }
                    }
                };
            }
            return rule;
        });
    }, [safeRules, field.required, field.name, context.domain, field.label]);

    // 3. ⚡ PROPS NORMALIZATION (The Fix)
    // We delegate all prop calculation to the Level 9 Engine.
    const normalizedProps = useMemo(() => {
        // A. Run the Normalizer
        const props = normalizeProps(field, { 
            isSubmitting: context.isSubmitting,
            formData: context.formData
        });

        // B. Inject Runtime Bindings (Handlers & Data)
        return {
            ...props,
            
            // ⚡ DATA INJECTION: Support Read-Only widgets reading directly from context
            value: context.formData?.[field.name],

            // ⚡ LOGIC INJECTION: Hydrated Rules & Sentinel
            rules: hydratedRules,
            fieldProps: {
                ...props.fieldProps,
                id: field.name,
                ref: sentinelRef, // Attach Global Sniper
            },
            
            // ⚡ ASYNC OPTIONS (If request URL exists)
            options: field.options,
            request: field.request ? async () => [] : undefined // Stub for Phase 3
        };
    }, [field, context.isSubmitting, context.formData, hydratedRules, sentinelRef]);

    // 4. RENDER
    return (
        <DynamicWidget 
            componentKey={field.component} 
            commonProps={normalizedProps}
            customProps={field} // Pass original field for deep debug access if needed
        />
    );
};

