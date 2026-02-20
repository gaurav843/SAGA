// FILEPATH: frontend/src/platform/workflow/wizard-engine/renderers/EmptyRenderer.tsx
// @file: Empty State Renderer (Feedback Layer)
// @author: ansav8@gmail.com
// @security-level: LEVEL 9 (Visual Consistency)
// @invariant: Must visually indicate 'No Data'.
// @narrator: Silent (Passive UI).
// @description: Renders Ant Design Empty component.

import React from 'react';
import { Empty } from 'antd';
import type { WizardFieldSchema } from '../types';

interface EmptyRendererProps {
    field: WizardFieldSchema;
}

export const EmptyRenderer: React.FC<EmptyRendererProps> = ({ field }) => {
    // Backend schema: { component: "EMPTY", fieldProps: { description: "No items found" } }
    const { description, image } = field.fieldProps || {};

    // Map string image names to AntD constants if needed, 
    // otherwise default to standard SIMPLE/PRESENTED logic or allow null.
    let imageStyle = Empty.PRESENTED_IMAGE_SIMPLE;
    if (image === 'DEFAULT') imageStyle = Empty.PRESENTED_IMAGE_DEFAULT;

    return (
        <Empty
            image={imageStyle}
            description={description || field.label || "No Data"}
            style={{ margin: '40px 0' }}
        />
    );
};

