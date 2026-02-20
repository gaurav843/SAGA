// FILEPATH: frontend/src/domains/meta/features/states/components/FlowCanvas.tsx
// @file: Flow Canvas (The Graph Engine)
// @author: The Engineer
// @description: Renders the Interactive Node Graph with Auto-Layout.
// @security-level: LEVEL 9 (UI Invariant)
// @invariant: NodeTypes must be Memoized. Wrapper must be 100% Width/Height.
// @narrator: Logs layout recalculations.
// @description: Provides the ReactFlow surface.

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import ReactFlow, { 
    Background, 
    Controls, 
    Panel,
    useNodesState, 
    useEdgesState, 
    addEdge, 
    BackgroundVariant,
    ReactFlowProvider,
    type Connection, 
    type Edge, 
    type Node,
    type ReactFlowInstance,
    type NodeChange,
    type EdgeChange,
    applyNodeChanges,
    applyEdgeChanges
} from 'reactflow';
import 'reactflow/dist/style.css';
import { theme, Button, Tooltip } from 'antd';
import { PartitionOutlined } from '@ant-design/icons';
import debounce from 'lodash/debounce';
import dagre from 'dagre';

import { ScreenNode } from './canvas/nodes/ScreenNode';
import { TaskNode } from './canvas/nodes/TaskNode';
import { StandardNode } from './canvas/nodes/StandardNode';
import { useCanvasHistory } from '../hooks/useCanvasHistory';
import type { XStateDefinition } from '../types';

interface FlowCanvasProps {
    initialDefinition: XStateDefinition;
    scopeType?: string; 
    onChange: (definition: XStateDefinition) => void;
    onNodeClick?: (e: React.MouseEvent, node: Node) => void;
    onEdgeClick?: (e: React.MouseEvent, edge: Edge) => void;
    onPaneClick?: () => void;
    isReadOnly?: boolean;
}

// ⚡ CRITICAL FIX: Define NodeTypes OUTSIDE component to prevent re-render loops
const NODE_TYPES = {
    screen: ScreenNode,
    task: TaskNode,
    standard: StandardNode
};

const NODE_WIDTH = 240;
const NODE_HEIGHT = 150;

const FlowCanvasInner: React.FC<FlowCanvasProps> = ({ 
    initialDefinition, 
    scopeType = 'GOVERNANCE',
    onChange,
    onNodeClick,
    onEdgeClick,
    onPaneClick,
    isReadOnly = true 
}) => {
    const { token } = theme.useToken();
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

    const [nodes, setNodes] = useNodesState([]);
    const [edges, setEdges] = useEdgesState([]);
    const history = useCanvasHistory(nodes, edges);
    const loadedIdRef = useRef<string | null>(null);

    // ⚡ DAGRE LAYOUT ENGINE
    const getLayoutedElements = useCallback((currentNodes: Node[], currentEdges: Edge[], direction = 'TB') => {
        const dagreGraph = new dagre.graphlib.Graph();
        dagreGraph.setDefaultEdgeLabel(() => ({}));

        dagreGraph.setGraph({ rankdir: direction });

        currentNodes.forEach((node) => {
            dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
        });

        currentEdges.forEach((edge) => {
             dagreGraph.setEdge(edge.source, edge.target);
        });

        dagre.layout(dagreGraph);

        const layoutedNodes = currentNodes.map((node) => {
            const nodeWithPosition = dagreGraph.node(node.id);
            // Dagre gives center point, ReactFlow needs top-left
            return {
                ...node,
                position: {
                    x: nodeWithPosition.x - NODE_WIDTH / 2,
                    y: nodeWithPosition.y - NODE_HEIGHT / 2,
                },
            };
        });

        return { nodes: layoutedNodes, edges: currentEdges };
    }, []);

    // ⚡ MANUAL TRIGGER
    const onLayout = useCallback(() => {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
        setNodes([...layoutedNodes]);
        setEdges([...layoutedEdges]);
        // Push this layout change to history/backend
        const debouncePush = debounce(() => {
             const newDef = serializeGraph(layoutedNodes, layoutedEdges);
             onChange(newDef as XStateDefinition);
        }, 500);
        debouncePush();
        
        setTimeout(() => reactFlowInstance?.fitView({ padding: 0.2, duration: 800 }), 50);
    }, [nodes, edges, getLayoutedElements, reactFlowInstance, onChange]);

    // Sync ReadOnly State
    useEffect(() => {
        setNodes((nds) => nds.map((node) => ({
            ...node,
            draggable: !isReadOnly, 
            connectable: !isReadOnly,
        })));
    }, [isReadOnly, setNodes]);

    // Serializer
    const serializeGraph = useCallback((currentNodes: Node[], currentEdges: Edge[]) => {
        const states: Record<string, any> = {};
        currentNodes.forEach(node => {
            const transitions: Record<string, any> = {};
            currentEdges.filter(e => e.source === node.id).forEach(edge => {
                if (edge.data && (edge.data.guard || (edge.data.actions && edge.data.actions.length > 0))) {
                    transitions[edge.label || 'NEXT'] = {
                        target: edge.target,
                        guard: edge.data.guard,
                        actions: edge.data.actions
                    };
                } else {
                    transitions[edge.label || 'NEXT'] = edge.target;
                }
            });

            states[node.id] = {
                type: node.data.type || 'atomic',
                meta: {
                    x: node.position.x,
                    y: node.position.y,
                    description: node.data.meta?.description,
                    color: node.data.meta?.color,
                    form_schema: node.data.form_schema,
                    job_config: node.data.job_config,
                    nodeType: node.type
                },
                on: transitions
            };
        });

        return {
            id: initialDefinition.id || "workflow",
            initial: initialDefinition.initial || (currentNodes.length > 0 ? currentNodes[0].id : "new_state"),
            states: states
        };
    }, [initialDefinition.id, initialDefinition.initial]);

    const pushChanges = useMemo(
        () => debounce((n: Node[], e: Edge[]) => {
            if (isReadOnly) return;
            const newDef = serializeGraph(n, e);
            onChange(newDef as XStateDefinition);
        }, 500), 
        [serializeGraph, onChange, isReadOnly]
    );

    // 3. INITIALIZER
    useEffect(() => {
        if (!initialDefinition || !initialDefinition.states) return;
        
        const isNewWorkflow = initialDefinition.id !== loadedIdRef.current;
        if (!isNewWorkflow) return; 

        loadedIdRef.current = initialDefinition.id;

        let defaultType = 'standard';
        if (scopeType === 'WIZARD') defaultType = 'screen';
        else if (scopeType === 'JOB') defaultType = 'task';

        let newNodes: Node[] = [];
        const newEdges: Edge[] = [];
        const stateEntries = Object.entries(initialDefinition.states);

        // Detect if layout is needed (all 0,0)
        const needsAutoLayout = stateEntries.every(([_, s]: any) => !s.meta?.x && !s.meta?.y);

        stateEntries.forEach(([key, state]: [string, any]) => {
            const meta = state.meta || {};
            const visualType = meta.nodeType || defaultType;

            newNodes.push({
                id: key,
                type: visualType,
                position: { x: meta.x || 0, y: meta.y || 0 }, // Temporary position
                draggable: !isReadOnly,
                connectable: !isReadOnly,
                data: { 
                    label: key,
                    type: state.type || 'atomic',
                    isInitial: key === initialDefinition.initial,
                    meta: meta,
                    form_schema: meta.form_schema,
                    job_config: meta.job_config
                }
            });

            if (state.on) {
                Object.entries(state.on).forEach(([event, target]: [string, any]) => {
                    const targetKey = typeof target === 'string' ? target : target.target;
                    const edgeId = `${key}-${event}-${targetKey}`;
                    newEdges.push({
                        id: edgeId,
                        source: key,
                        target: targetKey,
                        label: event,
                        type: 'smoothstep',
                        animated: true,
                        style: { stroke: token.colorTextSecondary },
                        data: typeof target === 'object' ? target : {}
                    });
                 });
            }
        });

        // ⚡ RUN AUTO-LAYOUT IF NEEDED
        if (needsAutoLayout) {
            const layouted = getLayoutedElements(newNodes, newEdges, 'TB');
            newNodes = layouted.nodes;
        }

        setNodes(newNodes);
        setEdges(newEdges);
        
        setTimeout(() => reactFlowInstance?.fitView({ padding: 0.2 }), 50);

    }, [initialDefinition.id, scopeType, token, getLayoutedElements]);

    // 4. HANDLERS (Standard)
    const handleNodesChange = useCallback((changes: NodeChange[]) => {
        if (isReadOnly) return;
        setNodes((nds) => {
            const next = applyNodeChanges(changes, nds);
            pushChanges(next, edges);
            return next;
        });
    }, [pushChanges, edges, setNodes, isReadOnly]);

    const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
        if (isReadOnly) return;
        setEdges((eds) => {
            const next = applyEdgeChanges(changes, eds);
            pushChanges(nodes, next);
            return next;
        });
    }, [pushChanges, nodes, setEdges, isReadOnly]);

    const onConnect = useCallback((params: Connection) => {
        if (isReadOnly) return;
        setEdges((eds) => {
            const next = addEdge({ ...params, animated: true, type: 'smoothstep', label: 'NEXT' }, eds);
            history.takeSnapshot(nodes, next);
            pushChanges(nodes, next);
            return next;
        });
    }, [nodes, setEdges, history, pushChanges, isReadOnly]);

    const onDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        if (isReadOnly) return;
        if (!reactFlowWrapper.current || !reactFlowInstance) return;

        const type = event.dataTransfer.getData('application/reactflow');
        const payloadStr = event.dataTransfer.getData('application/flodock-payload');
        const payload = payloadStr ? JSON.parse(payloadStr) : {};

        if (!type) return;

        const position = reactFlowInstance.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
        });

        const newNode: Node = {
            id: `${type}_${Date.now()}`,
            type: type, 
            position,
            draggable: true,
            connectable: true,
            data: { 
                label: `New ${type}`, 
                meta: { ...payload, nodeType: type },
                form_schema: payload.form_schema || [],
                job_config: payload.job_config || {}
            },
        };

        setNodes((nds) => {
            const next = nds.concat(newNode);
            history.takeSnapshot(next, edges);
            pushChanges(next, edges);
            return next;
        });
    }, [reactFlowInstance, edges, setNodes, history, pushChanges, isReadOnly]);

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        if (isReadOnly) {
            event.dataTransfer.dropEffect = 'none';
        } else {
            event.dataTransfer.dropEffect = 'move';
        }
    }, [isReadOnly]);

    return (
        // ⚡ CRITICAL FIX: Ensure full dimensions for the wrapper
        <div ref={reactFlowWrapper} style={{ width: '100%', height: '100%', background: token.colorBgLayout }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                onConnect={onConnect}
                onInit={setReactFlowInstance}
                onDrop={onDrop}
                onDragOver={onDragOver}
                nodeTypes={NODE_TYPES} // ⚡ NOW MEMOIZED (Static Object)
                onNodeClick={onNodeClick}
                onEdgeClick={onEdgeClick}
                onPaneClick={onPaneClick}
                fitView
                nodesDraggable={!isReadOnly}
                nodesConnectable={!isReadOnly}
            >
                <Background variant={BackgroundVariant.Dots} gap={16} size={1} color={token.colorFill} />
                <Controls showInteractive={!isReadOnly} />
                
                {!isReadOnly && (
                    <Panel position="top-right">
                        <Tooltip title="Auto-Arrange Nodes (Top-Down)">
                             <Button 
                                icon={<PartitionOutlined rotate={270} />} 
                                onClick={onLayout} 
                                size="small"
                                style={{ boxShadow: token.boxShadowSmall }}
                            >
                                Auto Layout
                            </Button>
                        </Tooltip>
                    </Panel>
                )}
            </ReactFlow>
        </div>
    );
};

export const FlowCanvas: React.FC<FlowCanvasProps> = (props) => (
    // ⚡ CRITICAL FIX: Provider wraps everything
    <div style={{ height: '100%', width: '100%' }}>
        <ReactFlowProvider>
            <FlowCanvasInner {...props} />
        </ReactFlowProvider>
    </div>
);

