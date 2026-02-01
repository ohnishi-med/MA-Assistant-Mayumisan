import React, { useState, useCallback } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useWorkflowStore } from '../../store/useWorkflowStore';
import NodeProperties from './NodeProperties';
import { Plus, Sparkles, Layout, List, Minus, Maximize2 } from 'lucide-react';
import { getLayoutedElements } from './layoutUtils';
import SimpleListEditor from './SimpleListEditor';

const FlowEditor: React.FC = () => {
    const {
        getNodes,
        getEdges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        setNodes,
        enterSubFlow,
        activeFlowPath,
        activeFlowId,
        backToFlow,
        flows
    } = useWorkflowStore();

    const nodes = getNodes();
    const edges = getEdges();

    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [editMode, setEditMode] = useState<'visual' | 'list'>('visual');

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        setSelectedNode(node);
    }, []);

    const onNodeDoubleClickHandler = useCallback((_: React.MouseEvent, node: Node) => {
        // hasSubFlowフラグがあるか、特定の条件でサブフローに入る
        if (node.data.hasSubFlow || node.id.startsWith('cat-')) {
            enterSubFlow(node.id);
        }
    }, [enterSubFlow]);

    const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>('LR'); // デフォルトをLR（横に伸びる）に変更
    const [nodeSep, setNodeSep] = useState(30);
    const [rankSep, setRankSep] = useState(80);

    const onLayout = useCallback((nSep = nodeSep, rSep = rankSep, dir = layoutDirection) => {
        const { nodes: layoutedNodes } = getLayoutedElements(nodes, edges, dir, { nodesep: nSep, ranksep: rSep });
        setNodes([...layoutedNodes]);
    }, [nodes, edges, layoutDirection, nodeSep, rankSep, setNodes]);

    const toggleDirection = () => {
        const nextDir = layoutDirection === 'TB' ? 'LR' : 'TB';
        setLayoutDirection(nextDir);
        onLayout(nodeSep, rankSep, nextDir);
    };

    const adjustSpacing = (type: 'node' | 'rank', delta: number) => {
        if (type === 'node') {
            const newVal = Math.max(0, nodeSep + delta);
            setNodeSep(newVal);
            onLayout(newVal, rankSep);
        } else {
            const newVal = Math.max(0, rankSep + delta);
            setRankSep(newVal);
            onLayout(nodeSep, newVal);
        }
    };

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
        <div className="w-full h-full border rounded-lg bg-white overflow-hidden shadow-sm relative flex flex-col">
            {/* Header Area: Breadcrumbs + Mode Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border-b">
                <div className="flex items-center gap-2">
                    <div className="flex bg-slate-100 p-1 rounded-lg border shadow-sm">
                        <button
                            onClick={() => setEditMode('visual')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${editMode === 'visual' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Layout className="w-4 h-4" />
                            <span>ビジュアル編集</span>
                        </button>
                        <button
                            onClick={() => setEditMode('list')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${editMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <List className="w-4 h-4" />
                            <span>リスト編集</span>
                        </button>
                    </div>

                    <div className="h-6 w-px bg-slate-300 mx-2" />

                    {/* Breadcrumbs */}
                    <nav className="flex items-center text-sm font-medium">
                        {activeFlowPath.map((pathId, idx) => {
                            // 表示名の解決
                            let label = pathId === 'main' ? '全体' : pathId;
                            // 親階層のノードからラベルを探す
                            if (idx > 0) {
                                const parentFlow = flows[activeFlowPath[idx - 1]];
                                const node = parentFlow?.nodes.find(n => n.id === pathId);
                                if (node) label = node.data.label as string;
                            }

                            const isLast = idx === activeFlowPath.length - 1;

                            return (
                                <React.Fragment key={pathId}>
                                    <button
                                        onClick={() => backToFlow(idx)}
                                        disabled={isLast}
                                        className={`${isLast ? 'text-slate-900 cursor-default' : 'text-blue-600 hover:underline hover:text-blue-700'}`}
                                    >
                                        {label}
                                    </button>
                                    {!isLast && <span className="mx-2 text-slate-400">/</span>}
                                </React.Fragment>
                            );
                        })}
                    </nav>
                </div>

                <div className="flex gap-2">
                    <div className="flex items-center bg-white border border-slate-300 rounded shadow-sm px-2 gap-2">
                        <span className="text-[10px] font-bold text-slate-400 border-r pr-2 py-1">間隔</span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => adjustSpacing('node', -10)}
                                className="p-1 hover:bg-slate-100 rounded text-slate-500"
                                title="上下の間隔を詰める"
                            >
                                <Minus className="w-3 h-3" />
                            </button>
                            <button
                                onClick={() => adjustSpacing('node', 10)}
                                className="p-1 hover:bg-slate-100 rounded text-slate-500"
                                title="上下の間隔を広げる"
                            >
                                <Plus className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="w-px h-3 bg-slate-200" />
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => adjustSpacing('rank', -20)}
                                className="p-1 hover:bg-slate-100 rounded text-slate-500"
                                title="左右の間隔を詰める"
                            >
                                <Maximize2 className="w-3 h-3 rotate-90 scale-x-[-1]" />
                            </button>
                            <button
                                onClick={() => adjustSpacing('rank', 20)}
                                className="p-1 hover:bg-slate-100 rounded text-slate-500"
                                title="左右の間隔を広げる"
                            >
                                <Maximize2 className="w-3 h-3 rotate-90" />
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={toggleDirection}
                        className="bg-white text-slate-600 border border-slate-300 px-3 py-1.5 rounded shadow-sm hover:bg-slate-50 flex items-center justify-center gap-2 text-xs font-bold transition-colors"
                        title="整列の方向（縦・横）を切り替えます"
                    >
                        <Layout className={`w-3.5 h-3.5 ${layoutDirection === 'LR' ? 'rotate-90' : ''} transition-transform`} />
                        <span>{layoutDirection === 'TB' ? '縦並び' : '横並び'}</span>
                    </button>
                    <button
                        onClick={() => onLayout()}
                        className="bg-white text-blue-600 border border-blue-600 px-3 py-1.5 rounded shadow-sm hover:bg-blue-50 flex items-center justify-center gap-2 text-xs font-bold"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>自動整列</span>
                    </button>
                    <button
                        onClick={addNewNode}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded shadow-sm hover:bg-blue-700 flex items-center justify-center gap-2 text-xs font-bold"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>ノード追加</span>
                    </button>
                </div>
            </div>

            {editMode === 'visual' ? (
                <div className="flex-1 relative">
                    <ReactFlow
                        key={activeFlowId} // 階層ごとにリセット
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        onNodeDoubleClick={onNodeDoubleClickHandler}
                        fitView
                    >
                        <Background />
                        <Controls />
                        <MiniMap />
                    </ReactFlow>

                    {selectedNode && (
                        <NodeProperties
                            node={selectedNode}
                            onClose={() => setSelectedNode(null)}
                        />
                    )}
                </div>
            ) : (
                <SimpleListEditor />
            )}
        </div>
    );
};

export default FlowEditor;
