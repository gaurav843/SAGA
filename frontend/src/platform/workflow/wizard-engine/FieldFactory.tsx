// FILEPATH: frontend/src/platform/workflow/wizard-engine/FieldFactory.tsx
// @file: Field Factory (The Dispatcher - v5)
// @author: ansav8@gmail.com
// @description: Polymorphic Router that converts JSON Schema into React Components.
// @architecture: LEVEL 10 (Registry-Driven Routing)
// @updated: Implemented Category-Based Routing to fix 'SMART_GRID' mismatch.


import React, { useEffect } from 'react';

import { TableRenderer } from './renderers/TableRenderer';
import { PrimitiveRenderer } from './renderers/PrimitiveRenderer';
import { SmartGridRenderer } from './renderers/SmartGridRenderer';
import { GroupRenderer } from './renderers/GroupRenderer';
import { ResultRenderer } from './renderers/ResultRenderer';
import { EmptyRenderer } from './renderers/EmptyRenderer';

import type { WizardFieldSchema, RenderContext } from './types';
import { logger } from '../../logging';
import { useWidgetRegistry } from './hooks/useWidgetRegistry';

interface FieldFactoryProps {
    field: WizardFieldSchema;
    context: RenderContext;
}

export const FieldFactory: React.FC<FieldFactoryProps> = ({ field, context }) => {
    // ⚡ 1. CONSULT THE REGISTRY (The Source of Truth)
    const { getWidget } = useWidgetRegistry();
    
    // This resolves 'SMART_GRID' (Data) -> Widget Definition { category: 'DATA_DISPLAY', ... }
    const widgetDef = getWidget(field.component);

    // ⚡ TELEMETRY: Trace layout decisions
    useEffect(() => {
        if (widgetDef.category === 'CONTAINER' || widgetDef.category === 'DATA_DISPLAY') {
            logger.trace("FieldFactory", `🏗️ Structuring [${field.name}]`, { 
                component: field.component,
                resolvedKey: widgetDef.key,
                category: widgetDef.category
            });
        }
    }, [field.name, field.component, widgetDef.key, widgetDef.category]);

    // ⚡ 2. ROUTING LOGIC (CATEGORY BASED)
    // We route based on the *Category* defined in the DB, not the hardcoded string.
    
    // --- LAYOUTS (Groups, Tabs, Sections) ---
    if (widgetDef.category === 'CONTAINER') {
        return <GroupRenderer field={field} context={context} />;
    }

    // --- DATA GRIDS (Smart Tables) ---
    if (widgetDef.category === 'DATA_DISPLAY') {
        // P2 Logic: Route all Heavy Tables to SmartGridRenderer
        // This CATCHES 'SMART_GRID', 'PRO_TABLE', 'EDITABLE_TABLE' automatically.
        if (['SMART_GRID', 'PRO_TABLE', 'EDITABLE_TABLE'].includes(widgetDef.key)) {
            return <SmartGridRenderer field={field} context={context} />;
        }
    }

    // --- FEEDBACK (Results, Empty States) ---
    if (widgetDef.category === 'FEEDBACK') {
        if (widgetDef.key === 'EMPTY') return <EmptyRenderer field={field} />;
        if (widgetDef.key === 'RESULT') return <ResultRenderer field={field} context={context} />;
    }

    // --- COMPLEX INPUTS (Repeater/Nested) ---
    // Legacy support: Some structures might not be fully migrated to Categories yet
    const isRecursiveStructure = 
        field.component === 'ProFormList' || 
        field.component === 'RepeaterGroup';

    if (isRecursiveStructure) {
        return <TableRenderer field={field} context={context} />;
    }

    // --- PRIMITIVES (Atoms) ---
    // Fallback for everything else (Inputs, Selects, etc.)
    return <PrimitiveRenderer field={field} context={context} />;
};

