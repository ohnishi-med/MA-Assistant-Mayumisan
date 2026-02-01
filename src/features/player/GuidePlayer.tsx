import React, { useState, useEffect } from 'react';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { ChevronRight, RotateCcw, MessageSquare, CheckCircle2 } from 'lucide-react';

const GuidePlayer: React.FC = () => {
    const { nodes, edges } = useWorkflowStore();
    const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
    const [history, setHistory] = useState<string[]>([]);

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
        if (currentNodeId) {
            setHistory([...history, currentNodeId]);
        }
        setCurrentNodeId(targetId);
    };

    const reset = () => {
        const root = nodes.find(n => n.type === 'input') || nodes[0];
        setCurrentNodeId(root?.id || null);
        setHistory([]);
    };

    const goBack = () => {
        if (history.length > 0) {
            const prevId = history[history.length - 1];
            setCurrentNodeId(prevId);
            setHistory(history.slice(0, -1));
        }
    };

    if (!currentNode) {
        return <div className="p-8 text-center text-slate-500">フローが見つかりません。エディターで作成してください。</div>;
    }

    return (
        <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
            <div className="bg-white rounded-2xl shadow-xl border overflow-hidden flex flex-col h-full max-h-[600px]">
                {/* Progress header */}
                <div className="bg-slate-50 border-b px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Step {history.length + 1}</span>
                        {history.length > 0 && (
                            <button
                                onClick={goBack}
                                className="text-xs text-slate-500 hover:text-slate-800 underline ml-2"
                            >
                                戻る
                            </button>
                        )}
                    </div>
                    <button
                        onClick={reset}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500"
                    >
                        <RotateCcw className="w-3 h-3" />
                        最初から
                    </button>
                </div>

                {/* Instruction Area */}
                <div className="p-8 flex-1 overflow-auto">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="bg-blue-100 p-3 rounded-full shrink-0">
                            <MessageSquare className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">{currentNode.data.label as string}</h2>
                            {currentNode.data.comment ? (
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-slate-700 leading-relaxed whitespace-pre-wrap">
                                    {currentNode.data.comment as string}
                                </div>
                            ) : (
                                <p className="text-slate-400 italic">このステップに説明はありません。</p>
                            )}
                        </div>
                    </div>

                    {nextEdges.length === 0 && (
                        <div className="mt-8 flex flex-col items-center justify-center p-8 border-2 border-dashed border-green-200 rounded-2xl bg-green-50 text-green-700">
                            <CheckCircle2 className="w-12 h-12 mb-2 text-green-500" />
                            <p className="font-bold text-lg">フロー完了</p>
                            <p className="text-sm">お疲れ様でした！作業が終了しました。</p>
                        </div>
                    )}
                </div>

                {/* Navigation Buttons */}
                <div className="p-6 bg-slate-50 border-t flex flex-col gap-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-1 px-1">次に行うアクションを選択してください</p>
                    <div className="grid grid-cols-1 gap-3">
                        {nextEdges.map((edge) => (
                            <button
                                key={edge.id}
                                onClick={() => navigateTo(edge.target)}
                                className="flex items-center justify-between group bg-white border border-slate-200 p-4 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all shadow-sm active:scale-[0.98]"
                            >
                                <span className="font-semibold text-slate-700 group-hover:text-blue-700">
                                    {edge.label || nodes.find(n => n.id === edge.target)?.data.label as string || '次へ'}
                                </span>
                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* History log */}
            <div className="mt-6 flex flex-wrap gap-2 justify-center opacity-60">
                {history.map((id, index) => (
                    <React.Fragment key={id}>
                        <span className="text-xs text-slate-500">{nodes.find(n => n.id === id)?.data.label as string}</span>
                        {index < history.length - 1 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default GuidePlayer;
