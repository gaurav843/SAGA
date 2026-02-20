// FILEPATH: frontend/src/platform/workflow/wizard-engine/hooks/useWidgetRegistry.ts
// @file: Widget Registry Hook
// @author: The Engineer
// @description: Provides O(1) access to the System's UI Library.
// FIXED: Updated import path to use valid '@domains' alias.


import { useMemo } from 'react';
// ⚡ FIX: Use the valid '@domains' alias instead of the missing '@meta-kernel'
import { useCapabilities } from '@domains/meta/_kernel/CapabilitiesContext';
import { logger } from '@platform/logging';

export interface WidgetDefinition {
    key: string;
    name: string;
    category: string;
    icon: string;
    props_schema?: any;
}

const FALLBACK_WIDGET: WidgetDefinition = {
    key: 'UNKNOWN',
    name: 'Unknown Widget',
    category: 'SYSTEM',
    icon: 'antd:QuestionCircleOutlined'
};

export const useWidgetRegistry = () => {
    // 1. CONSUME KERNEL CAPABILITIES
    // We get the raw list of widgets from the backend via the Context
    const { registry } = useCapabilities();
    const rawWidgets = registry?.widgets || [];

    // 2. INDEXING (O(n) -> O(1))
    // Convert the array to a Map for instant lookups during rendering
    const widgetMap = useMemo(() => {
        const map = new Map<string, WidgetDefinition>();
        
        rawWidgets.forEach((w: any) => {
            // 🛡️ NORMALIZE KEYS: DB keys are UPPERCASE. 
            // We force upper here to be safe when looking up 'text_input' vs 'TEXT_INPUT'.
            if (w.key) map.set(w.key.toUpperCase(), w);
        });

        // ⚡ CONNECTION VERIFICATION
        if (map.size > 0) {
            // Only whisper once to avoid spamming console on re-renders
            // logger.whisper("REGISTRY", `🔗 Connected to Kernel. Indexed ${map.size} Widgets.`);
        }

        return map;
    }, [rawWidgets]);

    // 3. PUBLIC API
    const getWidget = (key: string): WidgetDefinition => {
        if (!key) return FALLBACK_WIDGET;
        return widgetMap.get(key.toUpperCase()) || FALLBACK_WIDGET;
    };

    return {
        getWidget,
        // Expose the full list for the "Context Browser" or "Palette"
        allWidgets: rawWidgets 
    };
};

