import React, { useState, useCallback } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useManualStore } from '../../store/useManualStore';
import NodeProperties from './NodeProperties';
import { Plus, Sparkles, Layout, List, Minus, Maximize2, Save, Settings, X } from 'lucide-react';
import { getLayoutedElements } from './layoutUtils';
import SimpleListEditor from './SimpleListEditor';

import { CategoryMapping } from './components/CategoryMapping';

const FlowEditor: React.FC = () => {
    const {
        currentManual,
        onNodesChange,
        onEdgesChange,
        onConnect,
        setNodes,
        saveManual,
    } = useManualStore();

    const nodes = currentManual?.flowchart_data?.nodes || [];
    const edges = currentManual?.flowchart_data?.edges || [];

    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [editMode, setEditMode] = useState<'visual' | 'list'>('visual');
    const [showSettings, setShowSettings] = useState(false);

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        setSelectedNode(node);
    }, []);

    const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>('LR');
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

    if (!currentManual) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-white border rounded-lg shadow-sm border-dashed text-slate-400 gap-4">
                <Layout className="w-12 h-12 opacity-20" />
                <div className="flex flex-col items-center gap-1">
                    <p className="font-bold">マニュアルが選択されていません</p>
                    <p className="text-xs">左側のナビゲーションから選択するか、新規作成してください</p>
                </div>
                {/* 
                    NOTE: Manual creation UI is pending integration. 
                    For now, select from sidebar.
                */}
            </div>
        );
    }

    return (
        <div className="w-full h-full border rounded-lg bg-white overflow-hidden shadow-sm relative flex flex-col">
            {/* Header Area */}
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

                    {/* Current Manual Title */}
                    <div className="flex items-center text-sm font-bold text-slate-700">
                        {currentManual?.title || 'マニュアル未選択'}
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`px-3 py-1.5 rounded border text-xs font-bold transition-colors flex items-center gap-2 ${showSettings ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                    >
                        <Settings className="w-3.5 h-3.5" />
                        <span>設定</span>
                    </button>
                    <div className="h-6 w-px bg-slate-300 mx-1 self-center" />
                    <button
                        onClick={addNewNode}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded shadow-sm hover:bg-blue-700 flex items-center justify-center gap-2 text-xs font-bold"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>ノード追加</span>
                    </button>
                    <button
                        onClick={() => currentManual && saveManual(currentManual)}
                        className="bg-green-600 text-white px-3 py-1.5 rounded shadow-sm hover:bg-green-700 flex items-center justify-center gap-2 text-xs font-bold"
                        disabled={!currentManual}
                    >
                        <Save className="w-3.5 h-3.5" />
                        <span>保存</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative">
                <div className="flex-1 relative flex flex-col">
                    {/* Visual controls when in visual mode */}
                    {editMode === 'visual' && (
                        <div className="absolute top-4 left-4 z-10 flex gap-2">
                            <div className="flex items-center bg-white border border-slate-300 rounded shadow-sm px-2 gap-2">
                                <span className="text-[10px] font-bold text-slate-400 border-r pr-2 py-1">間隔</span>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => adjustSpacing('node', -10)} className="p-1 hover:bg-slate-100 rounded text-slate-500" title="上下の間隔を詰める"><Minus className="w-3 h-3" /></button>
                                    <button onClick={() => adjustSpacing('node', 10)} className="p-1 hover:bg-slate-100 rounded text-slate-500" title="上下の間隔を広げる"><Plus className="w-3 h-3" /></button>
                                </div>
                                <div className="w-px h-3 bg-slate-200" />
                                <div className="flex items-center gap-1">
                                    <button onClick={() => adjustSpacing('rank', -20)} className="p-1 hover:bg-slate-100 rounded text-slate-500" title="左右の間隔を詰める"><Maximize2 className="w-3 h-3 rotate-90 scale-x-[-1]" /></button>
                                    <button onClick={() => adjustSpacing('rank', 20)} className="p-1 hover:bg-slate-100 rounded text-slate-500" title="左右の間隔を広げる"><Maximize2 className="w-3 h-3 rotate-90" /></button>
                                </div>
                            </div>
                            <button
                                onClick={toggleDirection}
                                className="bg-white text-slate-600 border border-slate-300 px-3 py-1.5 rounded shadow-sm hover:bg-slate-50 flex items-center gap-2 text-[10px] font-bold transition-colors"
                            >
                                <Layout className={`w-3 h-3 ${layoutDirection === 'LR' ? 'rotate-90' : ''}`} />
                                <span>{layoutDirection === 'TB' ? '縦並び' : '横並び'}</span>
                            </button>
                            <button
                                onClick={() => onLayout()}
                                className="bg-white text-blue-600 border border-blue-600 px-3 py-1.5 rounded shadow-sm hover:bg-blue-50 flex items-center gap-2 text-[10px] font-bold"
                            >
                                <Sparkles className="w-3 h-3" />
                                <span>自動整列</span>
                            </button>
                        </div>
                    )}

                    {editMode === 'visual' ? (
                        <div className="flex-1 relative">
                            <ReactFlow
                                key={currentManual?.id || 'empty'}
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
                            </ReactFlow>

                            {selectedNode && (
                                <NodeProperties
                                    node={selectedNode}
                                    onClose={() => setSelectedNode(null)}
                                />
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 overflow-auto">
                            <SimpleListEditor />
                        </div>
                    )}
                </div>

                {/* Settings Side Panel */}
                {showSettings && (
                    <div className="w-80 bg-slate-50 border-l p-4 flex flex-col gap-4 overflow-auto animate-in slide-in-from-right duration-200 shadow-2xl">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="font-black text-slate-800 uppercase tracking-tighter text-sm">マニュアル設定</h3>
                            <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <CategoryMapping />
                    </div>
                )}
            </div>
        </div>
    );
};

export default FlowEditor;
