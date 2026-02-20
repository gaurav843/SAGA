// FILEPATH: frontend/src/platform/workflow/wizard-engine/renderers/DynamicWidget.tsx
// @file: Dynamic Widget Renderer (Reactive Edition)
// @author: ansav8@gmail.com
// @description: Intelligent wrapper that dehydrates Backend Config and injects Logic Responsiveness.
// @security-level: LEVEL 9 (Sanitized Merge + Reactive Wrapper)
// @updated: Integrated 'DependencyWrapper' to enable 'show_if' and 'disabled_if' logic.

import React, { useMemo } from 'react';
import { Alert } from 'antd';

import { COMPONENT_MAP } from './ComponentMap';
import { useWidgetRegistry } from '../hooks/useWidgetRegistry';
import { IconFactory } from '../../../ui/icons/IconFactory';
import { logger } from '../../../logging';
import { DependencyWrapper } from '../wrappers/DependencyWrapper'; // ⚡ NEW IMPORT

interface DynamicWidgetProps {
    componentKey: string;
    commonProps: any; // Name, Label, Rules (Functions), etc.
    customProps?: any; // The 'field' bag from JSON (contains Logic Strings)
}

export const DynamicWidget: React.FC<DynamicWidgetProps> = ({ componentKey, commonProps, customProps = {} }) => {
    // 1. Get Definition from Backend Registry
    const { getWidget } = useWidgetRegistry();
    const widgetDef = getWidget(componentKey);

    // 2. Resolve Physical Component
    const Component = COMPONENT_MAP[widgetDef.key] || COMPONENT_MAP[componentKey];

    // 3. Merge Props (Backend Defaults < Runtime Overrides < Logic)
    const finalProps = useMemo(() => {
        // Extract defaults from schema if available
        const defaults: Record<string, any> = {};
        if (widgetDef.props_schema?.properties) {
            Object.entries(widgetDef.props_schema.properties).forEach(([k, v]: [string, any]) => {
                if (v.default !== undefined) defaults[k] = v.default;
            });
        }

        // ⚡ CRITICAL FIX: SANITIZE CUSTOM PROPS
        // We must REMOVE 'rules' from customProps because they contain 
        // raw strings (e.g. "validator": "checkUniqueness") which crash
        // the form engine. The Logic Layer (commonProps) owns the rules.
        const { rules: _unsafeRules, fieldProps: customFieldProps, ...safeCustomProps } = customProps;

        return {
            ...defaults,        // 1. Base Defaults
            ...safeCustomProps, // 2. JSON Config (Labels, Placeholders) - MINUS RULES
            ...commonProps,     // 3. Logic Layer (Functions, Validators) - WINS

            // Merge nested fieldProps deeply
            fieldProps: {
                ...commonProps.fieldProps,
                ...(customFieldProps || {}),
                ...(defaults.rows ? { rows: defaults.rows } : {}),
            }
        };
    }, [widgetDef, commonProps, customProps]);

    // 🔍 DEEP NARRATOR INSPECTION
    React.useEffect(() => {
        if (finalProps.name === 'email' || finalProps.name === 'password') {
            logger.trace("MERGE", `⚡ Final Props for [${finalProps.name}]`, {
                component: componentKey,
                rules_count: finalProps.rules?.length,
                validator_type: typeof finalProps.rules?.find((r:any) => r.validator)?.validator
            });
        }
    }, [finalProps, componentKey]);

    // 4. Fallback for Unknowns
    if (!Component) {
        logger.warn("RENDERER", `❌ Unknown Component: ${componentKey}`);
        return (
            <Alert 
                type="warning" 
                message={`Unknown Widget: ${componentKey}`} 
                icon={<IconFactory icon="antd:WarningOutlined" />}
            />
        );
    }

    // 5. EXTRACT LOGIC PROPS
    // These keys drive the DependencyWrapper and shouldn't necessarily pass to the widget
    const { show_if, disabled_if, dependencies } = customProps;

    // 6. RENDER (Wrapped in Logic Engine)
    return (
        <DependencyWrapper
            showIf={show_if || finalProps.hidden === false ? undefined : finalProps.hidden} // Handle 'hidden' vs 'show_if'
            disabledIf={disabled_if}
            manualDependencies={dependencies}
        >
            {({ disabled }) => (
                <Component 
                    {...finalProps} 
                    disabled={finalProps.disabled || disabled} // Merge static and dynamic disabled state
                />
            )}
        </DependencyWrapper>
    );
};

