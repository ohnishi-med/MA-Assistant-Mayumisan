import React, { useState, useCallback } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    Panel,
    Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useWorkflowStore } from '../../store/useWorkflowStore';
import NodeProperties from './NodeProperties';
import { Plus } from 'lucide-react';

const FlowEditor: React.FC = () => {
    const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setNodes } = useWorkflowStore();
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        setSelectedNode(node);
    }, []);

    const addNewNode = useCallback(() => {
        const id = `node-${Date.now()}`;
        const newNode: Node = {
            id,
            position: { x: Math.random() * 400, y: Math.random() * 400 },
            data: { label: '新規ステップ', comment: '' },
        };
        setNodes([...nodes, newNode]);
    }, [nodes, setNodes]);

    return (
        <div className="w-full h-full border rounded-lg bg-white overflow-hidden shadow-sm relative">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                fitView
            >
                <Background />
                <Controls />
                <MiniMap />
                <Panel position="top-right" className="flex flex-col gap-2">
                    <div className="bg-white p-2 border rounded shadow-md text-sm font-bold text-gray-700">
                        フローチャート・エディター
                    </div>
                    <button
                        onClick={addNewNode}
                        className="bg-blue-600 text-white p-2 rounded shadow-md hover:bg-blue-700 flex items-center justify-center gap-2 text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span>ノード追加</span>
                    </button>
                </Panel>
            </ReactFlow>

            {selectedNode && (
                <NodeProperties
                    node={selectedNode}
                    onClose={() => setSelectedNode(null)}
                />
            )}
        </div>
    );
};

export default FlowEditor;
