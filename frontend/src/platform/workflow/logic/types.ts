/* FILEPATH: frontend/src/platform/workflow/logic/types.ts */
/* @file Workflow Domain Types */
/* @author The Engineer */

export interface TransitionOption {
    event: string;
    target: string;
}

export interface TransitionResponse {
    success: boolean;
    previous_state: string;
    new_state: string;
    message: string;
}

export interface WorkflowState {
    options: TransitionOption[];
    isLoading: boolean;
    error: string | null;
}

