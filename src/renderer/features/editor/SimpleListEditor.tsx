import React, { useState, useEffect } from 'react';
import { useManualStore } from '../../store/useManualStore';
import { Plus, Trash2, ArrowRight, Save, LayoutList } from 'lucide-react';
import type { Node, Edge } from '@xyflow/react';

const SimpleListEditor: React.FC = () => {
    const {
        currentManual,
        setNodes,
        setEdges,
        saveManual,
    } = useManualStore();

    const [localNodes, setLocalNodes] = useState<Node[]>(currentManual?.flowchart_data?.nodes || []);
    const [localEdges, setLocalEdges] = useState<Edge[]>(currentManual?.flowchart_data?.edges || []);

    // 階層移動時にローカルステートを同期
    useEffect(() => {
        setLocalNodes(currentManual?.flowchart_data?.nodes || []);
        setLocalEdges(currentManual?.flowchart_data?.edges || []);
    }, [currentManual?.id]);

    const handleAddNode = () => {
        const id = `node-${Date.now()}`;
        const newNode: Node = {
            id,
            position: { x: 0, y: 0 },
            data: { label: '新規ステップ', comment: '' },
        };
        setLocalNodes([...localNodes, newNode]);
    };

    const handleRemoveNode = (id: string) => {
        setLocalNodes(localNodes.filter(n => n.id !== id));
        setLocalEdges(localEdges.filter(e => e.source !== id && e.target !== id));
    };

    const handleUpdateNodeLabel = (id: string, label: string) => {
        setLocalNodes(localNodes.map(n => n.id === id ? { ...n, data: { ...n.data, label } } : n));
    };

    const handleToggleHasSubFlow = (id: string) => {
        setLocalNodes(localNodes.map(n => n.id === id ? { ...n, data: { ...n.data, hasSubFlow: !n.data.hasSubFlow } } : n));
    };

    const handleToggleEdge = (sourceId: string, targetId: string) => {
        const existingEdge = localEdges.find(e => e.source === sourceId && e.target === targetId);
        if (existingEdge) {
            setLocalEdges(localEdges.filter(e => e.id !== existingEdge.id));
        } else {
            const newEdge: Edge = {
                id: `e-${sourceId}-${targetId}`,
                source: sourceId,
                target: targetId,
            };
            setLocalEdges([...localEdges, newEdge]);
        }
    };

    const handleApply = () => {
        setNodes(localNodes);
        setEdges(localEdges);
    };

    return (
        <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
            <div className="p-4 bg-white border-b flex justify-between items-center shadow-sm">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 text-slate-700 mb-1">
                        <LayoutList className="w-5 h-5 text-blue-600" />
                        <span className="font-bold">リスト形式エディター</span>
                    </div>
                    {/* Manual Title */}
                    <div className="text-xs font-bold text-slate-500">
                        {currentManual?.title || 'マニュアル未選択'}
                    </div>
                </div>
                <button
                    onClick={() => {
                        handleApply();
                        if (currentManual) saveManual(currentManual);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
                    disabled={!currentManual}
                >
                    <Save className="w-4 h-4" />
                    <span>変更を保存する</span>
                </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-4xl mx-auto space-y-4">
                    {localNodes.map((node) => (
                        <div key={node.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all">
                            <div className="flex items-start gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-4">
                                        <input
                                            type="text"
                                            value={node.data.label as string}
                                            onChange={(e) => handleUpdateNodeLabel(node.id, e.target.value)}
                                            className="flex-1 text-lg font-bold text-slate-800 border-none focus:ring-0 p-0"
                                            placeholder="ステップ名を入力..."
                                        />
                                        <div className="flex items-center gap-2">
                                            <label className="flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={!!node.data.hasSubFlow}
                                                    onChange={() => handleToggleHasSubFlow(node.id)}
                                                    className="w-3 h-3 rounded"
                                                />
                                                詳細手順 (プロトタイプ)
                                            </label>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">次に繋がるステップ:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {localNodes.filter(n => n.id !== node.id).map(target => {
                                                const isConnected = localEdges.some(e => e.source === node.id && e.target === target.id);
                                                return (
                                                    <button
                                                        key={target.id}
                                                        onClick={() => handleToggleEdge(node.id, target.id)}
                                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isConnected
                                                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                                            : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'
                                                            }`}
                                                    >
                                                        {target.data.label as string}
                                                        {isConnected && <ArrowRight className="w-3 h-3" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemoveNode(node.id)}
                                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={handleAddNode}
                        className="w-full py-6 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50 transition-all flex flex-col items-center justify-center gap-2 group"
                    >
                        <Plus className="w-8 h-8 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-sm">新しいステップを追加</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SimpleListEditor;
