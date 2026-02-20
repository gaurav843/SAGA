// FILEPATH: frontend/src/platform/ui/animation/FadeIn.tsx
// @file: Fade In Animation (The "Breathing" Fix)
// @role: 🎨 UI Utility */
// @author: The Engineer
// @description: Standardized entry animation wrapper.
// FIX: Replaced 'translateY' (which caused scrollbars) with 'scale' (which contains them).
// TELEMETRY: Now communicates view transitions to the Narrator.


import React, { useEffect } from 'react';
import { theme } from 'antd';
import { logger } from '../../logging';

interface FadeInProps {
    children: React.ReactNode;
    /** Optional key to trigger re-animation when data changes */
    triggerKey?: string | number | null;
}

export const FadeIn: React.FC<FadeInProps> = ({ children, triggerKey }) => {
    const { token } = theme.useToken();

    // ⚡ TELEMETRY: Communicate the transition
    useEffect(() => {
        logger.trace("UI", "✨ View Transition Complete", { key: triggerKey || 'root' });
    }, [triggerKey]);

    return (
        <>
            <style>{`
                @keyframes systemFadeIn {
                    from { 
                        opacity: 0; 
                        transform: scale(0.99); /* ⚡ FIX: Scale keeps it INSIDE the viewport */
                    }
                    to { 
                        opacity: 1; 
                        transform: scale(1); 
                    }
                }
                .system-fade-enter {
                    animation: systemFadeIn ${token.motionDurationMid} ${token.motionEaseOut};
                    height: 100%;
                    width: 100%;
                    overflow: hidden; 
                    display: flex;
                    flex-direction: column;
                    will-change: transform, opacity; /* ⚡ PERF: GPU Acceleration */
                }
            `}</style>
            
            <div 
                key={triggerKey ?? 'static'} 
                className="system-fade-enter"
            >
                {children}
            </div>
        </>
    );
};
