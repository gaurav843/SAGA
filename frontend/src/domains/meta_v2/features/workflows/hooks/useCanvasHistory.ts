// FILEPATH: frontend/src/domains/meta_v2/features/workflows/hooks/useCanvasHistory.ts
// @file: Canvas History Hook
// @role: 🧠 Logic Container */
// @author: The Engineer
// @description: Provides Undo/Redo capability for ReactFlow with debounced snapshots.
// @security-level: LEVEL 9 */

import { useState, useCallback, useRef } from 'react';
import type { Node, Edge } from 'reactflow';
import debounce from 'lodash/debounce'; 
import { logger } from '@/platform/logging';

interface HistorySnapshot {
    nodes: Node[];
    edges: Edge[];
}

export const useCanvasHistory = (initialNodes: Node[], initialEdges: Edge[]) => {
    const [past, setPast] = useState<HistorySnapshot[]>([]);
    const [future, setFuture] = useState<HistorySnapshot[]>([]);
    
    // ⚡ SNAPSHOT ENGINE
    const takeSnapshot = useCallback((nodes: Node[], edges: Edge[]) => {
        setPast((prev) => {
            const newPast = [...prev, { nodes, edges }];
            // Limit history depth to 50
            if (newPast.length > 50) newPast.shift(); 
            return newPast;
        });
        setFuture([]); // New action clears future
    }, []);

    const debouncedSnapshot = useRef(
        debounce((nodes: Node[], edges: Edge[]) => {
            logger.trace("CANVAS", "History snapshot captured (Debounced)");
            takeSnapshot(nodes, edges);
        }, 500)
    ).current;

    // ⚡ UNDO
    const undo = useCallback((currentNodes: Node[], currentEdges: Edge[]) => {
        if (past.length === 0) return null;
        logger.tell("CANVAS", "⏪ Undo action triggered");

        const previous = past[past.length - 1];
        const newPast = past.slice(0, past.length - 1);

        setPast(newPast);
        setFuture((prev) => [{ nodes: currentNodes, edges: currentEdges }, ...prev]);

        return previous;
    }, [past]);

    // ⚡ REDO
    const redo = useCallback((currentNodes: Node[], currentEdges: Edge[]) => {
        if (future.length === 0) return null;
        logger.tell("CANVAS", "⏩ Redo action triggered");

        const next = future[0];
        const newFuture = future.slice(1);

        setFuture(newFuture);
        setPast((prev) => [...prev, { nodes: currentNodes, edges: currentEdges }]);

        return next;
    }, [future]);

    return {
        takeSnapshot,
        debouncedSnapshot,
        undo,
        redo,
        canUndo: past.length > 0,
        canRedo: future.length > 0,
        historyDepth: past.length
    };
};

