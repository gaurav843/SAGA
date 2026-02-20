// FILEPATH: frontend/src/domains/meta_v2/features/workflows/hooks/useEditorSession.ts
// @file: V2 Editor Session Logic
// @role: 🧠 Logic Container */
// @author: The Engineer
// @description: Manages the 'VIEW' vs 'EDIT' state and the Draft copy. Crash-proofed against undefined transitions.
// @security-level: LEVEL 9 (State Integrity) */

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/platform/logging';

export const useEditorSession = (
    domain: string,
    scope: string,
    activeMachine: any | undefined
) => {
    const [mode, setMode] = useState<'VIEW' | 'EDIT'>('VIEW');
    const [draft, setDraft] = useState<any | null>(null);

    // ⚡ AUTO-RESET: When changing workflows, always revert to VIEW and clear draft.
    useEffect(() => {
        logger.trace("WORKFLOW_SESSION", `Resetting session for ${scope}`);
        setMode('VIEW');
        setDraft(null);
    }, [activeMachine?.id, scope]);

    const hasChanges = !!draft;

    const actions = {
        enterEditMode: useCallback(() => {
            logger.tell("WORKFLOW_SESSION", `✏️ Entering Edit Mode for [${scope}]`);
            setMode('EDIT');
            
            if (!draft && activeMachine) {
                // 🛡️ CRASH FIX: Safe extraction of definition
                // Look for 'transitions' first, fallback to 'definition', fallback to empty XState structure
                const rawDef = activeMachine.transitions || activeMachine.definition || { 
                    id: scope, 
                    initial: 'start', 
                    states: {} 
                };
                
                try {
                    const clonedDef = JSON.parse(JSON.stringify(rawDef));
                    setDraft(clonedDef);
                    logger.trace("WORKFLOW_SESSION", "Draft successfully initialized", { keys: Object.keys(clonedDef.states || {}) });
                } catch (e: any) {
                    logger.scream("WORKFLOW_SESSION", "Failed to parse workflow definition", e);
                    setDraft({ id: scope, initial: 'start', states: {} }); // Ultimate fallback
                }
            }
        }, [draft, activeMachine, scope]),

        discardChanges: useCallback(() => {
            logger.whisper("WORKFLOW_SESSION", "🗑️ Discarding draft changes");
            setDraft(null);
            setMode('VIEW');
        }, []),

        updateDraft: useCallback((newDef: any) => {
            // Suppress heavy logging here as this fires rapidly on node drag
            setDraft(newDef);
        }, []),

        publishDraft: useCallback(() => {
            logger.tell("WORKFLOW_SESSION", "🚀 Finalizing draft for publish");
            setDraft(null);
            setMode('VIEW');
        }, [])
    };

    return {
        mode,
        draft,
        hasChanges,
        actions,
        isReadOnly: mode === 'VIEW'
    };
};
