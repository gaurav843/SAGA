// FILEPATH: frontend/src/platform/workflow/wizard-engine/wrappers/DependencyWrapper.tsx
// @file: Dependency Wrapper (The Nervous System)
// @author: ansav8@gmail.com
// @security-level: LEVEL 9 (Reactive Isolation)
// @invariant: If 'show_if' evaluates false, children must not be in the DOM.
// @narrator: Logs dependency triggers.
// @description: Wraps widgets to provide Conditional Rendering and disabling logic.

import React, { useMemo } from 'react';
import { ProFormDependency } from '@ant-design/pro-components';
import { LogicEngine } from '../logic/LogicEngine';
import { logger } from '../../../logging';

interface DependencyWrapperProps {
    children: React.ReactNode | ((props: { disabled: boolean }) => React.ReactNode);
    showIf?: string | boolean;
    disabledIf?: string | boolean;
    manualDependencies?: string[]; // For explicit dependencies from schema
}

export const DependencyWrapper: React.FC<DependencyWrapperProps> = ({ 
    children, 
    showIf, 
    disabledIf, 
    manualDependencies = [] 
}) => {
    
    // 1. Calculate what fields to listen to
    const dependencies = useMemo(() => {
        const deps = new Set([
            ...manualDependencies,
            ...LogicEngine.extractDependencies(showIf),
            ...LogicEngine.extractDependencies(disabledIf)
        ]);
        return Array.from(deps);
    }, [showIf, disabledIf, manualDependencies]);

    // 2. If no logic, render children directly (Performance)
    if (dependencies.length === 0 && typeof showIf !== 'string' && typeof disabledIf !== 'string') {
        // If static boolean hidden=true, Handle upstream in renderer. 
        // This wrapper specifically handles DYNAMIC dependencies.
        return <>{typeof children === 'function' ? children({ disabled: false }) : children}</>;
    }

    // 3. Render the Reactor
    return (
        <ProFormDependency name={dependencies}>
            {(values) => {
                // values contains the current state of the dependent fields
                
                // A. Evaluate Visibility
                const isVisible = LogicEngine.evaluate(showIf, values);
                if (!isVisible) {
                    // logger.trace("UI", "👻 Hidden by Logic", { showIf, values });
                    return null;
                }

                // B. Evaluate Disabled State
                const isDisabled = LogicEngine.evaluate(disabledIf, values);
                
                // C. Render Child
                // We pass the calculated state down if the child is a function
                if (typeof children === 'function') {
                    return children({ disabled: isDisabled });
                }

                // If child is a node, we clone it to inject disabled prop if supported,
                // but usually the child is the PrimitiveRenderer which handles its own props.
                // The 'disabled' prop injection here is a fallback.
                return (
                    <div style={isDisabled ? { opacity: 0.6, pointerEvents: 'none' } : undefined}>
                        {children}
                    </div>
                );
            }}
        </ProFormDependency>
    );
};

