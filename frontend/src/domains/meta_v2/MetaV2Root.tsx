// FILEPATH: frontend/src/domains/meta_v2/MetaV2Root.tsx
// @file: Meta-Kernel V2 Bootstrap
// @role: 🔌 Application Root */
// @author: The Engineer
// @description: Bootstraps the Meta V2 Kernel Context and Routing.
// @security-level: LEVEL 0 (Kernel Boot) */
// @updated: Injected WorkflowsTool routes to prevent Router Unmount crashes. */

import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { logger } from '@/platform/logging/Narrator';

// ⚡ V2 CONTEXTS
import { KernelProvider } from './_kernel/KernelContext';
import { MetaUIProvider } from './_shell/MetaUIContext';
import { StudioLayout } from './_shell/StudioLayout';

// ⚡ V2 TOOLS
import { DomainTopology } from './components/DomainTopology';
import { DictionaryTool } from './features/dictionary/DictionaryTool';
import { GovernanceTool } from './features/governance/GovernanceTool'; 
// ⚡ NEW: Imported the decoupled Workflows Engine
import { WorkflowsTool } from './features/workflows/WorkflowsTool';

export const MetaV2Root: React.FC = () => {
    
    // ⚡ DIAGNOSTIC: Log Entry
    useEffect(() => {
        logger.story("INIT", "Mounting Meta-Kernel V2 Environment");
        return () => logger.whisper("SYSTEM", "Unmounting Meta-Kernel V2");
    }, []);

    return (
        <KernelProvider>
            <MetaUIProvider>
                <Routes>
                    <Route element={<StudioLayout />}>
                        {/* Default view shows context and topology */}
                        <Route index element={<DomainTopology />} />
                        
                        {/* ⚡ DRILL-DOWN ROUTES */}
                        <Route path="dictionary/:domain" element={<DictionaryTool />} />
                        <Route path="governance/:domain" element={<GovernanceTool />} />
                        
                        {/* ⚡ NEW V2 WORKFLOW ROUTES */}
                        <Route path="workflows/:domain" element={<WorkflowsTool />} />
                        <Route path="workflows/:domain/:scope" element={<WorkflowsTool />} />
                    </Route>
                </Routes>
            </MetaUIProvider>
        </KernelProvider>
    );
};

