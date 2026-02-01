import React, { useState, useEffect } from 'react';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { ChevronRight, RotateCcw, MessageSquare, CheckCircle2 } from 'lucide-react';

const GuidePlayer: React.FC = () => {
    const {
        getNodes,
        getEdges,
        enterSubFlow,
        activeFlowPath,
        backToFlow,
        flows
    } = useWorkflowStore();

    const nodes = getNodes();
    const edges = getEdges();

    const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
    const [history, setHistory] = useState<{ flowId: string; nodeId: string }[]>([]);

    // Find root node or first node if no root exists
    useEffect(() => {
        if (!currentNodeId && nodes.length > 0) {
            const root = nodes.find(n => n.type === 'input') || nodes[0];
            setCurrentNodeId(root.id);
        }
    }, [nodes, currentNodeId]);

    const currentNode = nodes.find(n => n.id === currentNodeId);
    const nextEdges = edges.filter(e => e.source === currentNodeId);

    const navigateTo = (targetId: string) => {
        const targetNode = nodes.find(n => n.id === targetId);

        if (currentNodeId) {
            setHistory([...history, { flowId: useWorkflowStore.getState().activeFlowId, nodeId: currentNodeId }]);
        }

        // もしターゲットノードにサブフローがあるなら、その階層へ移動
        if (targetNode?.data.hasSubFlow) {
            enterSubFlow(targetId);
            setCurrentNodeId(null); // useEffectで次の階層のrootが選ばれる
        } else {
            setCurrentNodeId(targetId);
        }
    };

    const reset = () => {
        backToFlow(0); // mainに戻る
        setCurrentNodeId(null);
        setHistory([]);
    };

    const goBack = () => {
        if (history.length > 0) {
            const last = history[history.length - 1];

            // 階層が違うなら戻る
            if (last.flowId !== useWorkflowStore.getState().activeFlowId) {
                const targetIdx = activeFlowPath.indexOf(last.flowId);
                if (targetIdx !== -1) {
                    backToFlow(targetIdx);
                }
            }

            setCurrentNodeId(last.nodeId);
            setHistory(history.slice(0, -1));
        }
    };

    if (!currentNode) {
        return <div className="p-8 text-center text-slate-500">
            {nodes.length === 0 ? "この階層には手順がありません。" : "読み込み中..."}
        </div>;
    }

    return (
        <div className="flex-1 flex flex-col w-full h-full bg-slate-50">
            <div className="flex-1 bg-white border-l border-slate-200 overflow-hidden flex flex-col">
                {/* Progress header */}
                <div className="bg-white border-b border-slate-100 px-8 py-5 flex items-center justify-between shadow-sm z-10">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest leading-none">
                            Step {history.length + 1}
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <nav className="text-[10px] font-bold text-slate-300 flex items-center gap-2">
                            {activeFlowPath.map((id, i) => {
                                let label = id;
                                if (id === 'main') label = '全体';
                                else {
                                    const parentId = activeFlowPath[i - 1];
                                    const parentFlow = flows[parentId];
                                    const node = parentFlow?.nodes.find(n => n.id === id);
                                    if (node) label = node.data.label as string;
                                }
                                return (
                                    <React.Fragment key={id}>
                                        {i > 0 && <ChevronRight className="w-3 h-3 opacity-50" />}
                                        <span className={i === activeFlowPath.length - 1 ? "text-slate-500" : ""}>{label}</span>
                                    </React.Fragment>
                                );
                            })}
                        </nav>
                        <div className="flex items-center gap-4 border-l border-slate-100 pl-6 ml-2">
                            {history.length > 0 && (
                                <button
                                    onClick={goBack}
                                    className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1.5"
                                >
                                    <RotateCcw className="w-3 h-3 scale-x-[-1]" />
                                    <span>一つ前へ戻る</span>
                                </button>
                            )}
                            <button
                                onClick={reset}
                                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-500 transition-colors"
                            >
                                <RotateCcw className="w-3 h-3" />
                                <span>最初から</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* Left: Instruction Area */}
                    <div className="flex-1 p-10 overflow-auto bg-white custom-scrollbar">
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-50 p-4 rounded-2xl shrink-0 ring-4 ring-blue-50/50">
                                    <MessageSquare className="w-8 h-8 text-blue-600" />
                                </div>
                                <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">
                                    {currentNode.data.label as string}
                                </h2>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">作業指示</p>
                                {currentNode.data.comment ? (
                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-slate-700 text-lg leading-relaxed whitespace-pre-wrap shadow-inner">
                                        {currentNode.data.comment as string}
                                    </div>
                                ) : (
                                    <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl p-10 text-center">
                                        <p className="text-slate-400 italic font-medium">このステップに個別の作業指示はありません。</p>
                                    </div>
                                )}
                            </div>

                            {nextEdges.length === 0 && !currentNode.data.hasSubFlow && (
                                <div className="mt-4 flex flex-col items-center justify-center p-10 border-2 border-dashed border-green-200 rounded-3xl bg-green-50/50 text-green-800 ring-8 ring-green-50/30">
                                    <div className="bg-green-100 p-4 rounded-full mb-4">
                                        <CheckCircle2 className="w-12 h-12 text-green-600" />
                                    </div>
                                    <p className="font-black text-2xl mb-1 tracking-tight">フロー完了</p>
                                    <p className="text-sm font-medium opacity-80">本セクションの作業がすべて完了しました。お疲れ様でした！</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Action Area */}
                    <div className="w-full md:w-[500px] bg-slate-50 border-t md:border-t-0 md:border-l border-slate-100 flex flex-col shadow-[inset_10px_0_20px_-15px_rgba(0,0,0,0.05)]">
                        <div className="p-8 flex-1 overflow-auto custom-scrollbar">
                            <div className="flex flex-col gap-4">
                                <div className="mb-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                                        {currentNode.data.hasSubFlow ? '詳細手順へ進む' : '次へのアクション'}
                                    </p>
                                    <div className="h-1 w-8 bg-blue-600 rounded-full" />
                                </div>

                                <div className={`grid gap-3 ${nextEdges.length >= 5 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                    {nextEdges.map((edge) => (
                                        <button
                                            key={edge.id}
                                            onClick={() => navigateTo(edge.target)}
                                            className="flex items-center justify-between group bg-white border border-slate-200 p-5 rounded-2xl hover:border-blue-500 hover:ring-4 hover:ring-blue-500/10 transition-all shadow-sm active:scale-[0.97]"
                                        >
                                            <span className="font-bold text-slate-700 group-hover:text-blue-700 transition-colors pr-2 text-sm leading-tight text-left">
                                                {edge.label || (nodes.find(n => n.id === edge.target)?.data.label as string) || '次へ進む'}
                                            </span>
                                            <div className="bg-slate-50 group-hover:bg-blue-600 p-1 rounded-lg transition-colors shrink-0">
                                                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                                            </div>
                                        </button>
                                    ))}

                                    {Boolean(currentNode.data.hasSubFlow) && nextEdges.length === 0 && (
                                        <button
                                            onClick={() => navigateTo(currentNode.id)}
                                            className="col-span-full flex items-center justify-between group bg-blue-600 border border-blue-700 p-6 rounded-2xl hover:bg-blue-700 hover:ring-8 hover:ring-blue-600/10 transition-all shadow-xl active:scale-[0.97]"
                                        >
                                            <div className="flex flex-col items-start pr-2">
                                                <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-1 opacity-80">Drill-down</span>
                                                <span className="font-black text-white text-lg">
                                                    {(currentNode.data.label as string) || '詳細'}
                                                </span>
                                            </div>
                                            <div className="bg-blue-500 group-hover:bg-blue-400 p-2 rounded-xl transition-colors shrink-0">
                                                <ChevronRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </button>
                                    )}

                                    {nextEdges.length === 0 && !currentNode.data.hasSubFlow && (
                                        <button
                                            onClick={reset}
                                            className="flex items-center justify-center gap-2 group bg-slate-100 border border-slate-200 p-5 rounded-2xl hover:bg-slate-200 transition-all shadow-sm active:scale-[0.97]"
                                        >
                                            <RotateCcw className="w-4 h-4 text-slate-500 group-hover:rotate-[-45deg] transition-transform" />
                                            <span className="font-bold text-slate-600">トップに戻る</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuidePlayer;
