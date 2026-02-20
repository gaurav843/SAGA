// FILEPATH: frontend/src/platform/workflow/wizard-engine/renderers/ResultRenderer.tsx
// @file: Result Renderer (Feedback Layer)
// @author: ansav8@gmail.com
// @security-level: LEVEL 9 (Recursion Enabled)
// @invariant: Must support all standard AntD status codes (403, 404, 500, success).
// @narrator: Logs feedback events.
// @description: Renders a Result page. Allows injecting buttons via 'columns' array.

import React, { useEffect } from 'react';
import { Result } from 'antd';
import { FieldFactory } from '../FieldFactory'; // ⚡ RECURSION
import type { WizardFieldSchema, RenderContext } from '../types';
import { logger } from '../../../logging';

interface ResultRendererProps {
    field: WizardFieldSchema;
    context: RenderContext;
}

export const ResultRenderer: React.FC<ResultRendererProps> = ({ field, context }) => {
    // 1. Destructure Config
    // Backend schema: { component: "RESULT", fieldProps: { status: "404", title: "Missing" } }
    const { status, title, subTitle } = field.fieldProps || {};

    // 2. Telemetry
    useEffect(() => {
        logger.story("FEEDBACK", `📢 Showing Result: [${status}] ${title}`);
    }, [status, title]);

    // 3. Resolve "Extra" (Buttons/Actions)
    // If the schema defines 'columns', we render them in the 'extra' slot of the Result
    // This allows backend-driven "Back to Home" or "Retry" buttons.
    const renderExtra = () => {
        if (!field.columns || field.columns.length === 0) return null;
        
        return (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                {field.columns.map((childField, idx) => (
                    <FieldFactory 
                        key={childField.name || `result_action_${idx}`}
                        field={childField}
                        context={context}
                    />
                ))}
            </div>
        );
    };

    return (
        <Result
            status={status || 'info'}
            title={title || field.label}
            subTitle={subTitle || field.tooltip}
            extra={renderExtra()}
            style={{ padding: '48px 32px' }}
        />
    );
};

