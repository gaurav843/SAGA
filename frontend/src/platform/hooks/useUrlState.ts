// FILEPATH: frontend/src/platform/hooks/useUrlState.ts
// @file: Universal URL State Hook
// @role 🔌 Platform Utility */
// @author: The Engineer
// @description: Provides a useState-like interface that persists to the URL Query String.
// @security-level LEVEL 0 (Kernel Utility) */
// @invariant Must handle browser history without causing page reloads. */

import { useState, useEffect, useCallback } from 'react';

/**
 * @description Creates a state variable that syncs with a URL query parameter.
 * @example const [tab, setTab] = useUrlState('tab', 'overview');
 */
export function useUrlState<T extends string>(key: string, defaultValue: T): [T, (newValue: T | null) => void] {
    // 1. READ: Lazy initializer to read from URL only once on boot
    const [state, setState] = useState<T>(() => {
        if (typeof window === 'undefined') return defaultValue;
        const params = new URLSearchParams(window.location.search);
        const value = params.get(key);
        return (value as T) || defaultValue;
    });

    // 2. WRITE: Updates both Local State and URL
    const setUrlState = useCallback((newValue: T | null) => {
        setState(newValue || defaultValue);

        // Access the current URL state directly from the browser to avoid race conditions
        const currentUrl = new URL(window.location.href);
        
        if (newValue && newValue !== defaultValue) {
            currentUrl.searchParams.set(key, newValue);
        } else {
            currentUrl.searchParams.delete(key);
        }

        // ⚡ HISTORY: Use replaceState to avoid cluttering the "Back" button history with every click
        // If you want "Back" to undo the selection, change this to pushState.
        // For simple UI tabs/filters, replaceState is usually better UX.
        window.history.replaceState(null, '', currentUrl.toString());
    }, [key, defaultValue]);

    // 3. LISTEN: (Optional) If the user clicks "Back", sync the internal state
    useEffect(() => {
        const handlePopState = () => {
            const params = new URLSearchParams(window.location.search);
            const value = params.get(key);
            setState((value as T) || defaultValue);
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [key, defaultValue]);

    return [state, setUrlState];
}

