// FILEPATH: frontend/src/platform/workflow/logic/useWizardLogic.ts
// @file: Wizard Logic Hook (Syntax Fixed)
// @author: ansav8@gmail.com
// @description: Manages State, Data Collection, and Execution Mode.
// ⚡ FIX: Added missing backticks to 'getStorageKey' template literal.

import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MetaKernelService } from '../../../api/services/MetaKernelService';
import { UniversalResourceService } from '../../../api/services/UniversalResourceService';
import { logger } from '../../logging';

// ⚡ PERSISTENCE KEY GENERATOR
const getStorageKey = (domain: string, scope: string, isLive: boolean, entityId?: string | number) => 
    `flodock_wizard_v2_${isLive ? 'PROD' : 'SANDBOX'}_${domain}_${scope}${entityId ? `_${entityId}` : ''}`;

export const useWizardLogic = (
    domain: string, 
    scope: string, 
    entityId?: string | number, 
    onClose?: () => void
) => {
    // 1. CONTEXT
    const location = useLocation();
    
    // Treat '/app/' routes as Production environments
    const isLiveMode = 
        location.pathname.includes('/production') || 
        location.pathname.includes('/app/') || 
        !!entityId;
        
    const isEditMode = !!entityId;

    // 2. STATE
    const [currentStep, setCurrentStep] = useState<string | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [historyStack, setHistoryStack] = useState<string[]>([]);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRestored, setIsRestored] = useState(false);
    const [isHydrating, setIsHydrating] = useState(false);

    // 3. BOOT TELEMETRY
    useEffect(() => {
        const mode = isLiveMode ? "🔴 PRODUCTION" : "🏖️ SANDBOX";
        const action = isEditMode ? `✏️ EDITING ID [${entityId}]` : "✨ CREATING NEW";
        
        logger.tell("SYSTEM", `🛡️ WIZARD CONTEXT: ${mode} | ${action}`, {
            domain,
            scope,
            entityId: entityId || 'N/A'
        });
    }, [isLiveMode, isEditMode, domain, scope, entityId]);

    // 4. HYDRATION
    useEffect(() => {
        const hydrateEntity = async () => {
            if (!isEditMode || !entityId) return;

            setIsHydrating(true);
            logger.whisper("WIZARD", `🔍 Hydrating Data for Entity #${entityId}...`);

            try {
                const response = await UniversalResourceService.getResourceApiV1ResourceDomainIdGet(domain, Number(entityId));
                setFormData(prev => ({ ...prev, ...response }));
                
                logger.tell("WIZARD", `✅ Hydration Complete`, { 
                    keys_loaded: Object.keys(response).length,
                    sample: Object.keys(response).slice(0, 3) 
                });
            } catch (err: any) {
                logger.scream("WIZARD", `🔥 Hydration Failed for #${entityId}`, err);
            } finally {
                setIsHydrating(false);
            }
        };

        hydrateEntity();
    }, [domain, entityId, isEditMode]);

    // 5. FETCH DEFINITION
    const { data: workflowData, isLoading: isSchemaLoading, error } = useQuery({
        queryKey: ['meta', 'workflow', domain, scope],
        queryFn: async () => {
            logger.whisper("WIZARD", `📡 Fetching Schema for [${domain}/${scope}]...`);
            try {
                const rawResponse = await MetaKernelService.getFlowDefinitionApiV1MetaStatesDomainScopeGet(domain, scope);
                
                if (!rawResponse) throw new Error("API Returned Empty Response");

                // 🔧 SHIM: POLYFILL CHECK
                const states = rawResponse.transitions?.states || {};
                Object.values(states).forEach((step: any) => {
                    const fields = step.meta?.form_schema || [];
                    fields.forEach((f: any) => {
                        if (f.name === 'email') {
                            f.rules = f.rules || [];
                            const hasCheck = f.rules.some((r: any) => r.validator === 'checkUniqueness');
                            if (!hasCheck && !isEditMode) {
                                f.rules.push({
                                    validator: 'checkUniqueness',
                                    field: 'email',
                                    message: 'This email is already registered.'
                                });
                            }
                        }
                    });
                });

                return {
                    ...rawResponse,
                    initial: rawResponse.initial_state 
                };
            } catch (e) {
                logger.scream("WIZARD", `🔥 Schema Fetch Failed`, e);
                throw e;
            }
        },
        enabled: !!domain && !!scope,
        retry: 1,
        staleTime: 1000 * 60 * 5, 
    });

    // 6. INITIALIZATION & RECOVERY
    useEffect(() => {
        // Only run if we have data and haven't set a step yet
        if (workflowData && !currentStep) {
            const key = getStorageKey(domain, scope, isLiveMode, entityId);
            const savedDraft = localStorage.getItem(key);
            
            // ⚡ RESOLVE INITIAL STEP: Use API initial, or first key, or fallback
            const initialStep = workflowData.initial || Object.keys(workflowData.transitions?.states || {})[0] || 'start';

            if (savedDraft) {
                try {
                    const parsed = JSON.parse(savedDraft);
                    // Verify step still exists in schema
                    if (workflowData.transitions?.states?.[parsed.step]) {
                        setCurrentStep(parsed.step);
                        setFormData(prev => ({ ...prev, ...parsed.data }));
                        setHistoryStack(parsed.history || []);
                        setIsRestored(true);
                        logger.tell("CACHE", `📦 Restored Draft`, { step: parsed.step });
                    } else {
                        // Schema changed, draft invalid
                        localStorage.removeItem(key);
                        setCurrentStep(initialStep);
                    }
                } catch (e) {
                    localStorage.removeItem(key);
                    setCurrentStep(initialStep);
                }
            } else {
                setCurrentStep(initialStep);
            }
        }
    }, [workflowData, domain, scope, currentStep, isLiveMode, entityId]);

    // 7. AUTO-SAVE
    useEffect(() => {
        if (currentStep && workflowData) {
            const key = getStorageKey(domain, scope, isLiveMode, entityId);
            const payload = {
                step: currentStep,
                data: formData,
                history: historyStack,
                updatedAt: Date.now()
            };
            localStorage.setItem(key, JSON.stringify(payload));
        }
    }, [currentStep, formData, historyStack, domain, scope, workflowData, isLiveMode, entityId]);

    // 8. TRANSITION ENGINE
    const goNext = useCallback(async (stepData: any) => {
        if (!workflowData || !currentStep) return;

        const currentStateDef = workflowData.transitions?.states?.[currentStep];
        const nextStepKey = currentStateDef?.on?.['NEXT'];
        const isFinal = currentStateDef?.type === 'final' || !nextStepKey;

        // Merge Data
        const updatedData = { ...formData, ...stepData };
        setFormData(updatedData);

        if (isFinal) {
            setIsSubmitting(true);
            logger.story("WIZARD", isEditMode ? "💾 COMMITTING UPDATE" : "🚀 COMMITTING CREATION");
            
            try {
                if (isLiveMode) {
                    if (isEditMode && entityId) {
                        await UniversalResourceService.updateResourceApiV1ResourceDomainIdPatch(
                            domain, 
                            Number(entityId), 
                            updatedData
                        );
                        logger.tell("API", "✅ Resource Updated", { id: entityId });
                    } else {
                        const result = await UniversalResourceService.createResourceApiV1ResourceDomainPost(domain, updatedData);
                        logger.tell("API", "✅ Resource Created", { id: result.id });
                    }
                } else {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    logger.tell("MOCK", "✅ Simulation Complete (No DB Write)");
                }

                // Cleanup
                localStorage.removeItem(getStorageKey(domain, scope, isLiveMode, entityId));
                if (onClose) onClose();

            } catch (err: any) {
                const errorMsg = err.body?.detail || err.message || "Unknown Error";
                logger.scream("WIZARD", "🔥 Submission Failed", { error: errorMsg });
            } finally {
                setIsSubmitting(false);
            }

        } else {
            if (nextStepKey) {
                logger.trace("WIZARD", `➡️ Moving: ${currentStep} -> ${nextStepKey}`);
                setHistoryStack(prev => [...prev, currentStep]);
                setCurrentStep(nextStepKey);
            }
        }
    }, [workflowData, currentStep, formData, domain, scope, onClose, isLiveMode, isEditMode, entityId]);

    const goBack = useCallback(() => {
        if (historyStack.length > 0) {
            const previousStep = historyStack[historyStack.length - 1];
            const newStack = historyStack.slice(0, -1);
            setHistoryStack(newStack);
            setCurrentStep(previousStep);
        }
    }, [historyStack]);

    const stepDefinition = currentStep ? workflowData?.transitions?.states?.[currentStep] : null;

    // ⚡ CRITICAL FIX: Calculate 'isLoading' to include the initialization gap
    const effectiveIsLoading = isSchemaLoading || isHydrating || (!!workflowData && !currentStep && !error);

    return {
        isLoading: effectiveIsLoading,
        error, 
        currentStep,
        stepDefinition,
        formData,
        isSubmitting,
        isRestored,
        isFirstStep: historyStack.length === 0,
        isLiveMode,
        isEditMode, 
        goNext,
        goBack
    };
};

