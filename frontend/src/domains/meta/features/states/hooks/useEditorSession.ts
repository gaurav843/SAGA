// FILEPATH: frontend/src/domains/meta/features/states/hooks/useEditorSession.ts
// @file: Editor Session Logic
// @author: The Engineer
// @description: Manages the 'VIEW' vs 'EDIT' state and the Draft copy.
// @security-level: LEVEL 9 (State Integrity)
// @invariant: Mode defaults to VIEW. Draft is cleared on Discard.

import { useState, useEffect, useCallback } from 'react';
import type { WorkflowDefinition } from './useWorkflows';
import type { XStateDefinition } from '../types';

export const useEditorSession = (
    activeMachine: WorkflowDefinition | undefined,
    onPublish: (newDef: XStateDefinition) => Promise<void>
) => {
    const [mode, setMode] = useState<'VIEW' | 'EDIT'>('VIEW');
    const [draft, setDraft] = useState<XStateDefinition | null>(null);

    // ⚡ AUTO-RESET: When changing workflows, always revert to VIEW and clear draft.
    useEffect(() => {
        setMode('VIEW');
        setDraft(null);
    }, [activeMachine?.id]);

    const hasChanges = !!draft;

    const actions = {
        enterEditMode: useCallback(() => {
            setMode('EDIT');
            // Initialize draft with current definition if not exists
            if (!draft && activeMachine) {
                setDraft(JSON.parse(JSON.stringify(activeMachine.transitions)));
            }
        }, [draft, activeMachine]),

        discardChanges: useCallback(() => {
            setDraft(null);
            setMode('VIEW');
        }, []),

        updateDraft: useCallback((newDef: XStateDefinition) => {
            setDraft(newDef);
            // ⚡ FIX: Removed auto-setMode('EDIT'). 
            // We now require explicit entry via "Edit Workflow" button.
            // This prevents the Toolbar from flipping if the Canvas auto-layouts on load.
        }, []),

        publishDraft: useCallback(async () => {
            if (!draft) return;
            await onPublish(draft);
            setDraft(null);
            setMode('VIEW');
        }, [draft, onPublish])
    };

    return {
        mode,
        draft,
        hasChanges,
        actions,
        isReadOnly: mode === 'VIEW'
    };
};

