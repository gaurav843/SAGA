/* FILEPATH: frontend/src/domains/meta/features/states/logic/xstateAdapter.ts */
/* @file XState <-> ReactFlow Adapter */
/* @author The Engineer */
/* @description Converts backend JSON into Graph Nodes/Edges and back.
 * KEY LOGIC: XState 'states' become Nodes. 'on' events become Edges.
 */

import { MarkerType, type Node, type Edge } from 'reactflow'; // ProFlow uses ReactFlow types under the hood
import type { XStateDefinition } from '../types';

/**
 * CONVERTER: Backend JSON -> Frontend Graph
 */
export const toGraph = (definition: XStateDefinition): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  if (!definition || !definition.states) return { nodes: [], edges: [] };

  // 1. Build Nodes
  Object.entries(definition.states).forEach(([key, state], index) => {
    // Default layout if no positions saved (Simple grid fallback)
    const x = state.meta?.x ?? (index * 350) + 50;
    const y = state.meta?.y ?? 100;

    nodes.push({
      id: key,
      type: 'pro-card', // Maps to our custom Node Component
      position: { x, y },
      data: {
        label: key,
        description: state.meta?.description || '',
        isInitial: key === definition.initial,
        color: state.meta?.color || '#1677ff'
      }
    });

    // 2. Build Edges (Transitions)
    if (state.on) {
      Object.entries(state.on).forEach(([event, target]) => {
        const targetKey = typeof target === 'string' ? target : target.target;
        
        edges.push({
          id: `${key}-${event}-${targetKey}`,
          source: key,
          target: targetKey,
          label: event, // The Event Name is the Edge Label
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed },
          animated: true,
          style: { strokeWidth: 2 },
          data: { event }
        });
      });
    }
  });

  return { nodes, edges };
};

/**
 * CONVERTER: Frontend Graph -> Backend JSON
 */
export const toXState = (nodes: Node[], edges: Edge[], originalId: string): XStateDefinition => {
  const definition: XStateDefinition = {
    id: originalId,
    initial: nodes.find(n => n.data.isInitial)?.id || nodes[0]?.id || 'unknown',
    states: {}
  };

  // 1. Serialize Nodes (State + Metadata)
  nodes.forEach(node => {
    definition.states[node.id] = {
      meta: {
        description: node.data.description,
        color: node.data.color,
        // Persist Layout Positions
        x: node.position.x,
        y: node.position.y
      },
      on: {}
    };
  });

  // 2. Serialize Edges (Transitions)
  edges.forEach(edge => {
    const sourceState = definition.states[edge.source];
    
    // Safety check: ensure source/target nodes actually exist in the definition
    if (sourceState && definition.states[edge.target]) {
      const eventName = edge.data?.event || edge.label || 'NEXT'; 
      
      // XState simple syntax: "EVENT": "TARGET"
      // TODO: Expand this to object syntax if we add actions/guards later
      sourceState.on![eventName] = edge.target;
    }
  });

  return definition;
};

