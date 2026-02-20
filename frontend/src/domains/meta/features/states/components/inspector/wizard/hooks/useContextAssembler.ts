// FILEPATH: frontend/src/domains/meta/features/states/components/inspector/wizard/hooks/useContextAssembler.ts
// @file: AI Context Assembler (Omniscient)
// @role: 🧠 Intelligence Controller */
// @author: The Engineer
// @description: Marshals Data, Rules, Flows, and UI Components into a structured AI Payload.
// @security-level: LEVEL 9 (Sanitized Input) */
// @invariant: Sync is Manual & Omniscient. Fetches all selected domains on demand. */

import { useState, useRef, useEffect, useCallback } from 'react';
import { message, notification } from 'antd'; 
import { logger } from '@/platform/logging';

// ⚡ API & SERVICES
import { AiCortexService } from '@/api/services/AiCortexService';
import { MetaKernelService } from '@/api/services/MetaKernelService'; // ⚡ NEW: Direct Data Access
import { request } from '@/api/core/request';
import { OpenAPI } from '@/api/core/OpenAPI';

// ⚡ TYPES
import type { WidgetDefinition } from '@/platform/workflow/wizard-engine/hooks/useWidgetRegistry';
import type { WorkflowDefinition } from '@/domains/meta/features/states/hooks/useWorkflows';

export type CommandMode = 'WIZARD' | 'JOB' | 'GOVERNANCE' | 'VIEW' | 'FREE_CHAT';

interface AssemblerConfig {
    currentDomain: string; // Keeps track of "Active" view for drafts
    currentDraft: any;
    commandMode: CommandMode;
    
    widgets: WidgetDefinition[];
    // domainFields: SchemaField[]; // ❌ REMOVED: Single source
    // schemaDomain?: string;       // ❌ REMOVED: Single source
    
    policies: any[];     
    groups: any[];       
    workflows: WorkflowDefinition[];

    selectedWidgets: string[];
    selectedGovernance: string[];
    selectedWorkflows: string[];
    selectedDomains: string[]; // ⚡ NEW: Multi-source truth
}

export const useContextAssembler = ({
    currentDomain,
    currentDraft,
    commandMode,
    widgets = [],
    policies = [],
    groups = [],
    workflows = [],
    selectedWidgets = [],
    selectedGovernance = [],
    selectedWorkflows = [],
    selectedDomains = [] // ⚡ NEW
}: AssemblerConfig) => {
    // ⚡ STATE
    const [state, setState] = useState({
        loading: false,     // For API generation
        isSyncing: false,   // For Payload construction
        isStale: false      // For UI warning
    });
    
    const [aiContext, setAiContext] = useState<any[]>([]);
    const lastSyncedRef = useRef<string>("");

    // ⚡ CHANGE DETECTION
    useEffect(() => {
        const currentSignature = JSON.stringify({
            mode: commandMode,
            domains: selectedDomains.sort(), // ⚡ Track list changes
            w: (selectedWidgets || []).sort(),
            g: (selectedGovernance || []).sort(),
            f: (selectedWorkflows || []).sort()
        });

        if (currentSignature !== lastSyncedRef.current) {
            setState(s => ({ ...s, isStale: true }));
        }
    }, [commandMode, selectedDomains, selectedWidgets, selectedGovernance, selectedWorkflows]);

    // ⚡ HELPER: Normalize API Response
    const normalizeSchema = (res: any) => {
        let fields: any[] = [];
        if (res && typeof res === 'object') {
            if (res.fields) {
                 fields = Object.values(res.fields).map((f: any) => ({
                    key: f.key,
                    type: f.data_type,
                    label: f.label,
                    options: f.configuration?.options,
                    readonly: f.read_only
                }));
            } else if (Array.isArray(res)) {
                fields = res;
            } else {
                 fields = Object.values(res).filter((x: any) => x.key);
            }
        }
        return fields;
    };

    // ⚡ SYNC ENGINE (Omniscient)
    const sync = useCallback(async () => {
        setState(s => ({ ...s, isSyncing: true }));
        
        // 🕐 Artificial Delay for UX
        await new Promise(resolve => setTimeout(resolve, 600));

        const contextPayload: any[] = [];
        const stats = { schemas: 0, fields: 0, policies: 0, groups: 0, workflows: 0, widgets: 0 };

        try {
            console.group("🧩 Cortex Omniscient Sync");
            console.log("Targets:", selectedDomains);

            // 0. System Instruction
            contextPayload.push({
                kind: "SYSTEM_INSTRUCTION",
                mode: commandMode,
                description: "Defines the operating mode and output format expectations."
            });

            // A. Database Context (MULTI-DOMAIN FETCH)
            if (selectedDomains.length > 0) {
                // ⚡ PARALLEL FETCH: Get all schemas at once
                const promises = selectedDomains.map(async (domain) => {
                    try {
                        logger.tell("ASSEMBLER", `Fetching Schema for [${domain}]...`);
                        const res = await MetaKernelService.getDomainSchemaApiV1MetaSchemaDomainGet(domain, true);
                        const fields = normalizeSchema(res);
                        return { domain, fields, success: true };
                    } catch (err) {
                        logger.warn("ASSEMBLER", `Failed to fetch [${domain}]`, err);
                        return { domain, fields: [], success: false };
                    }
                });

                const results = await Promise.all(promises);

                results.forEach(({ domain, fields, success }) => {
                    if (success && fields.length > 0) {
                        contextPayload.push({
                            kind: "DATABASE_SCHEMA",
                            domain: domain,
                            description: `Complete schema definition for ${domain}`,
                            field_count: fields.length,
                            fields: fields
                        });
                        stats.schemas++;
                        stats.fields += fields.length;
                    }
                });
            }
            
            // B. Governance
            if (policies) {
                policies.forEach(p => {
                    const matchKey = `POLICY:${p.key}`;
                    if ((selectedGovernance || []).includes(matchKey)) {
                        contextPayload.push({
                            kind: "GOVERNANCE_MANIFEST",
                            key: p.key,
                            name: p.name,
                            rules: p.rules
                        });
                        stats.policies++;
                    }
                });
            }

            if (groups) {
                groups.forEach(g => {
                    const matchKey = `GROUP:${g.key}`;
                    if ((selectedGovernance || []).includes(matchKey)) {
                        contextPayload.push({
                            kind: "GOVERNANCE_GROUP",
                            key: g.key,
                            name: g.name,
                            policies: g.policy_keys 
                        });
                        stats.groups++;
                    }
                });
            }

            // C. Workflows
            if (workflows) {
                workflows.forEach(w => {
                    if ((selectedWorkflows || []).includes(w.scope)) {
                        contextPayload.push({
                            kind: "REFERENCE_WORKFLOW",
                            id: w.id,
                            name: w.name,
                            scope: w.scope,
                            structure: w.transitions 
                        });
                        stats.workflows++;
                    }
                });
            }

            // D. UI Toolkit
            if (widgets && widgets.length > 0) {
                widgets.forEach(w => {
                    if ((selectedWidgets || []).includes(w.key)) {
                        contextPayload.push({
                            kind: "UI_COMPONENT",
                            key: w.key,
                            category: w.category,
                            props: w.props_schema 
                        });
                        stats.widgets++;
                    }
                });
            }

            // E. Draft
            if (currentDraft) {
                contextPayload.push({
                    kind: "CURRENT_DRAFT",
                    data: currentDraft
                });
            }

            console.log("Stats:", stats);
            console.groupEnd();

            // ⚡ COMMIT
            setAiContext(contextPayload);
            
            // Update Signature
            lastSyncedRef.current = JSON.stringify({
                mode: commandMode,
                domains: selectedDomains.sort(),
                w: (selectedWidgets || []).sort(),
                g: (selectedGovernance || []).sort(),
                f: (selectedWorkflows || []).sort()
            });

            setState(s => ({ ...s, isSyncing: false, isStale: false }));

            // ⚡ FEEDBACK
            const total = contextPayload.length - 1;
            if (total > 0) {
                message.success(`Synced: ${stats.schemas} Schemas (${stats.fields} Fields), ${stats.workflows} Flows.`);
            } else {
                notification.warning({
                    message: "Payload Empty",
                    description: "No matching items found. Please check your selection.",
                    placement: "topRight"
                });
            }

        } catch (e) {
            console.error("ASSEMBLER ERROR", e);
            message.error("Context Sync Failed");
            setState(s => ({ ...s, isSyncing: false }));
        }

    }, [
        policies, 
        groups, 
        workflows, 
        widgets, 
        currentDraft, 
        selectedWidgets, 
        selectedGovernance, 
        selectedWorkflows,
        selectedDomains, // ⚡ NOW THE PRIMARY TRIGGER
        commandMode,
        currentDomain
    ]);

    // ⚡ COPY UTILITY
    const copyToClipboard = (userInstruction: string = "") => {
        if (!aiContext || aiContext.length === 0) {
            message.warning("Context is empty. Please Sync Payload first.");
            return;
        }

        const fullPayload = {
            system_context: aiContext,
            user_instruction: userInstruction
        };

        navigator.clipboard.writeText(JSON.stringify(fullPayload, null, 2));
        message.success("Full Prompt Payload copied to clipboard");
    };

    // ⚡ GENERATION ENGINE
    const generate = async (userPrompt?: string) => {
        if (state.isStale) {
            message.warning("Unsynced changes. Syncing before generation...");
            await sync();
        }

        setState(s => ({ ...s, loading: true }));
        try {
            const hydratedContext = await Promise.all(aiContext.map(async (item) => {
                if (item.kind === 'REFERENCE_WORKFLOW' && item.id) {
                    try {
                        const fullWorkflow = await request<any>(OpenAPI, {
                            url: `/api/v1/meta/states/${item.id}`,
                            method: 'GET'
                        });
                        return { ...item, structure: fullWorkflow.transitions };
                    } catch (err) {
                        return item;
                    }
                }
                return item;
            }));

            const response = await AiCortexService.generateSchemaApiV1AiGeneratePost({
                prompt: userPrompt || currentDraft?.description || "Generate instructions",
                context: hydratedContext,
                domain: currentDomain
            });

            return response.schema;

        } catch (err: any) {
            const msg = err.body?.detail || err.message || "Generation Failed";
            message.error(msg);
            return null;
        } finally {
            setState(s => ({ ...s, loading: false }));
        }
    };

    return {
        aiContext,
        ready: aiContext.length > 0,
        loading: state.loading,
        isSyncing: state.isSyncing,
        isStale: state.isStale,
        sync,
        copyToClipboard,
        generate
    };
};

