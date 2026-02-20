// FILEPATH: frontend/src/domains/meta_v2/features/workflows/components/FlowCanvas.tsx
// @file: Flow Canvas (The Graph Engine)
// @role: 🎨 UI Presentation / 🧠 Logic Container */
// @author: The Engineer
// @description: Renders the Interactive Node Graph with Auto-Layout. Rewired to V2 Nodes.
// @security-level: LEVEL 9 (UI Invariant) */

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import ReactFlow, { 
    Background, Controls, Panel, useNodesState, useEdgesState, addEdge, BackgroundVariant, ReactFlowProvider,
    type Connection, type Edge, type Node, type ReactFlowInstance, type NodeChange, type EdgeChange,
    applyNodeChanges, applyEdgeChanges
} from 'reactflow';
import 'reactflow/dist/style.css';

import { theme, Button, Tooltip } from 'antd';
import { PartitionOutlined } from '@ant-design/icons';
import debounce from 'lodash/debounce';
import dagre from 'dagre';

import { logger } from '@/platform/logging';

// ⚡ LOCAL V2 IMPORTS (Cord severed from V1)
import { ScreenNode, TaskNode, StandardNode } from './canvas/CanvasNodes';
import { useCanvasHistory } from '../hooks/useCanvasHistory';

const NODE_TYPES = {
    screen: ScreenNode,
    task: TaskNode,
    standard: StandardNode
};

const NODE_WIDTH = 240;
const NODE_HEIGHT = 150;

interface FlowCanvasProps {
    initialDefinition: any;
    scopeType?: string; 
    onChange: (definition: any) => void;
    onNodeClick?: (e: React.MouseEvent, node: Node) => void;
    onEdgeClick?: (e: React.MouseEvent, edge: Edge) => void;
    onPaneClick?: () => void;
    readOnly?: boolean;
}

const FlowCanvasInner: React.FC<FlowCanvasProps> = ({ 
    initialDefinition, scopeType = 'GOVERNANCE', onChange, onNodeClick, onEdgeClick, onPaneClick, readOnly = true 
}) => {
    const { token } = theme.useToken();
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

    const [nodes, setNodes] = useNodesState([]);
    const [edges, setEdges] = useEdgesState([]);
    const history = useCanvasHistory(nodes, edges);
    const loadedIdRef = useRef<string | null>(null);

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

    const onLayout = useCallback(() => {
        logger.trace("CANVAS", "Executing Dagre Auto-Layout");
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
        setNodes([...layoutedNodes]);
        setEdges([...layoutedEdges]);
        
        const debouncePush = debounce(() => {
            const newDef = serializeGraph(layoutedNodes, layoutedEdges);
            onChange(newDef);
        }, 500);
        debouncePush();
        
        setTimeout(() => reactFlowInstance?.fitView({ padding: 0.2, duration: 800 }), 50);
    }, [nodes, edges, getLayoutedElements, reactFlowInstance, onChange]);

    useEffect(() => {
        setNodes((nds) => nds.map((node) => ({
            ...node,
            draggable: !readOnly, 
            connectable: !readOnly,
        })));
    }, [readOnly, setNodes]);

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
            id: initialDefinition?.id || "workflow",
            initial: initialDefinition?.initial || (currentNodes.length > 0 ? currentNodes[0].id : "new_state"),
            states: states
        };
    }, [initialDefinition?.id, initialDefinition?.initial]);

    const pushChanges = useMemo(
        () => debounce((n: Node[], e: Edge[]) => {
            if (readOnly) return;
            const newDef = serializeGraph(n, e);
            onChange(newDef);
        }, 500), 
        [serializeGraph, onChange, readOnly]
    );

    useEffect(() => {
        if (!initialDefinition || !initialDefinition.states) return;
        
        const isNewWorkflow = initialDefinition.id !== loadedIdRef.current;
        if (!isNewWorkflow) return; 

        logger.whisper("CANVAS", "Bootstrapping initial graph state from definition");
        loadedIdRef.current = initialDefinition.id;

        let defaultType = 'standard';
        if (scopeType === 'WIZARD') defaultType = 'screen';
        else if (scopeType === 'JOB') defaultType = 'task';

        let newNodes: Node[] = [];
        const newEdges: Edge[] = [];
        const stateEntries = Object.entries(initialDefinition.states);

        const needsAutoLayout = stateEntries.every(([_, s]: any) => !s.meta?.x && !s.meta?.y);

        stateEntries.forEach(([key, state]: [string, any]) => {
            const meta = state.meta || {};
            const visualType = meta.nodeType || defaultType;

            newNodes.push({
                id: key,
                type: visualType,
                position: { x: meta.x || 0, y: meta.y || 0 },
                draggable: !readOnly,
                connectable: !readOnly,
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
                    newEdges.push({
                        id: `${key}-${event}-${targetKey}`,
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

        if (needsAutoLayout) {
            const layouted = getLayoutedElements(newNodes, newEdges, 'TB');
            newNodes = layouted.nodes;
        }

        setNodes(newNodes);
        setEdges(newEdges);
        setTimeout(() => reactFlowInstance?.fitView({ padding: 0.2 }), 50);

    }, [initialDefinition?.id, scopeType, token, getLayoutedElements]);

    const handleNodesChange = useCallback((changes: NodeChange[]) => {
        if (readOnly) return;
        setNodes((nds) => {
            const next = applyNodeChanges(changes, nds);
            pushChanges(next, edges);
            return next;
        });
    }, [pushChanges, edges, setNodes, readOnly]);

    const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
        if (readOnly) return;
        setEdges((eds) => {
            const next = applyEdgeChanges(changes, eds);
            pushChanges(nodes, next);
            return next;
        });
    }, [pushChanges, nodes, setEdges, readOnly]);

    const onConnect = useCallback((params: Connection) => {
        if (readOnly) return;
        logger.trace("CANVAS", "Nodes connected", params);
        setEdges((eds) => {
            const next = addEdge({ ...params, animated: true, type: 'smoothstep', label: 'NEXT' }, eds);
            history.takeSnapshot(nodes, next);
            pushChanges(nodes, next);
            return next;
        });
    }, [nodes, setEdges, history, pushChanges, readOnly]);

    const onDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        if (readOnly || !reactFlowWrapper.current || !reactFlowInstance) return;

        const type = event.dataTransfer.getData('application/reactflow');
        const payloadStr = event.dataTransfer.getData('application/flodock-payload');
        const payload = payloadStr ? JSON.parse(payloadStr) : {};

        if (!type) return;

        logger.tell("CANVAS", `🪂 Node dropped onto canvas: ${type}`);

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
    }, [reactFlowInstance, edges, setNodes, history, pushChanges, readOnly]);

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = readOnly ? 'none' : 'move';
    }, [readOnly]);

    return (
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
                nodeTypes={NODE_TYPES} 
                onNodeClick={onNodeClick}
                onEdgeClick={onEdgeClick}
                onPaneClick={onPaneClick}
                fitView
                nodesDraggable={!readOnly}
                nodesConnectable={!readOnly}
            >
                <Background variant={BackgroundVariant.Dots} gap={16} size={1} color={token.colorFill} />
                <Controls showInteractive={!readOnly} />
                
                {!readOnly && (
                    <Panel position="top-right">
                        <Tooltip title="Auto-Arrange Nodes (Top-Down)">
                             <Button icon={<PartitionOutlined rotate={270} />} onClick={onLayout} size="small" style={{ boxShadow: token.boxShadowSmall }}>
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
    <div style={{ height: '100%', width: '100%' }}>
        <ReactFlowProvider>
            <FlowCanvasInner {...props} />
        </ReactFlowProvider>
    </div>
);

