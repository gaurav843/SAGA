/* FILEPATH: frontend/src/platform/workflow/wizard-engine/hooks/useFieldSentinel.ts */
/* @file Field Sentinel Hook (The Global Sniper - Diagnostic Mode) */
/* @author The Engineer */
/* @description Provides Validation Triggering via Global Event Delegation.
 * ARCHITECTURE:
 * - ⚡ GLOBAL SNIPER: Listens to document-level events to bypass React/AntD barriers.
 * - ⚡ DIAGNOSTIC: Logs rule evaluation state to debug silent failures.
 * - ⚡ DEFENSIVE: Accepts explicit rules array to avoid reference mutation bugs.
 */

import { useEffect } from 'react';
import type { FormInstance } from 'antd';
import type { WizardFieldSchema } from '../types';
import { logger } from '../../../logging';

export const useFieldSentinel = (
    field: WizardFieldSchema, 
    form: FormInstance,
    contextDomain: string,
    rawRules: any[] // ⚡ EXPLICIT RULES PASS
) => {
    // 1. Detect Async Rules (using the explicit rules array)
    const hasAsyncRule = (rawRules || []).some((r: any) => r.validator === 'checkUniqueness');

    // 2. The Global Sniper Logic
    useEffect(() => {
        // 🔍 DEBUG: Inspect Initialization
        // This tells us immediately if the Sentinel correctly identified the async requirement
        logger.whisper("SENTINEL", `🛡️ Init [${field.name}]`, { 
            hasAsyncRule, 
            rules_count: rawRules?.length,
            raw_rules: rawRules 
        });

        const handleGlobalBlur = (e: FocusEvent) => {
            const target = e.target as HTMLInputElement;
            
            // 🛡️ SAFETY CHECK: Ensure target exists and is an input-like element
            if (!target || !['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

            // 🎯 SNIPER SCOPE: Does this element belong to us?
            const isTarget = target.id === field.name || target.name === field.name;

            if (isTarget) {
                logger.tell("SENTINEL", `🎯 Sniper Hit: Blur on [${field.name}]`, { value: target.value });

                if (hasAsyncRule) {
                    logger.story("VALIDATION", `⚡ Triggering Async Check for [${field.name}]`);
                    
                    setTimeout(() => {
                        form.validateFields([field.name]).catch((err) => {
                            logger.whisper("SENTINEL", `📉 Validation Result: Invalid`, { error_count: err.errorFields?.length });
                        });
                    }, 50);
                } else {
                    // 🔍 DEBUG: Why didn't we trigger?
                    logger.whisper("SENTINEL", `ℹ️ Skipped Validation on [${field.name}]. hasAsyncRule=false.`, {
                        current_rules: rawRules
                    });
                }
            }
        };

        const handleGlobalInput = (e: Event) => {
            const target = e.target as HTMLInputElement;
            if (!target) return;
            
            const isTarget = target.id === field.name || target.name === field.name;
            if (isTarget) {
                // logger.trace("SENTINEL", `📝 Input on [${field.name}]`);
            }
        };

        // --- ATTACHMENT ---
        document.addEventListener('focusout', handleGlobalBlur);
        document.addEventListener('input', handleGlobalInput);

        // --- CLEANUP ---
        return () => {
            document.removeEventListener('focusout', handleGlobalBlur);
            document.removeEventListener('input', handleGlobalInput);
        };
    }, [field.name, hasAsyncRule, form, rawRules]);

    return null;
};

