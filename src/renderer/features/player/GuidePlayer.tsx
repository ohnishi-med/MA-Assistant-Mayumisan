import React, { useState, useEffect } from 'react';
import { useManualStore } from '../../store/useManualStore';
import { optimizeImage } from '../../services/imageService';
import { ChevronRight, RotateCcw, CheckCircle2, X, Edit3, Image as ImageIcon, Star, Trash2, ArrowUp, ArrowDown, Info } from 'lucide-react';
import MarkdownEditor from '../editor/MarkdownEditor';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';



const GuidePlayer: React.FC = () => {
    const {
        loadManual,
        saveManual,
        updateNodeData,
        updateTitle,
        addNode,
        deleteNode,
        toggleFavorite,
        uploadImage,
        activeCategoryId,
        activeEntryPoint,
        currentManual,
        manualImages,
        acquireLock,
        releaseLock,
        forceReleaseLock,
        getHistory,
        restoreFromHistory
    } = useManualStore();

    const [isEditing, setIsEditing] = useState(false);

    const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
    const [history, setHistory] = useState<{ flowId: string; nodeId: string }[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [manualHistoryList, setManualHistoryList] = useState<any[]>([]);

    // Context Menu for Steps
    const [stepContextMenu, setStepContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);

    const nodes = currentManual?.flowchart_data?.nodes || [];
    const edges = currentManual?.flowchart_data?.edges || [];

    useEffect(() => {
        const handleClickOutside = () => setStepContextMenu(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Auto-scroll to current step
    useEffect(() => {
        if (currentNodeId) {
            const timer = setTimeout(() => {
                const element = document.getElementById(`step-${currentNodeId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [currentNodeId]);

    useEffect(() => {
        if (!currentManual) {
            setCurrentNodeId(null);
            setHistory([]);
            return;
        }

        if (nodes.length > 0) {
            const initialNodeId = (activeEntryPoint && nodes.some(n => n.id === activeEntryPoint))
                ? activeEntryPoint
                : (nodes.find(n => n.type === 'input') || nodes[0])?.id || null;

            setCurrentNodeId(initialNodeId);
        } else {
            setCurrentNodeId(null);
        }
        setHistory([]);
    }, [currentManual?.id, activeEntryPoint]);

    const navigateTo = (targetId: string) => {
        if (currentNodeId) {
            setHistory([...history, { flowId: 'main', nodeId: currentNodeId }]);
        }
        setCurrentNodeId(targetId);
    };

    const reset = () => {
        if (nodes.length > 0) {
            const initialNodeId = (activeEntryPoint && nodes.some(n => n.id === activeEntryPoint))
                ? activeEntryPoint
                : (nodes.find(n => n.type === 'input') || nodes[0])?.id || null;
            setCurrentNodeId(initialNodeId);
        }
        setHistory([]);
    };

    const goBack = () => {
        if (history.length > 0) {
            const last = history[history.length - 1];
            setCurrentNodeId(last.nodeId);
            setHistory(history.slice(0, -1));
        }
    };

    const handlePaste = async (event: React.ClipboardEvent) => {
        if (!isEditing || !currentNodeId || !currentManual) return;
        const currentNode = nodes.find(n => n.id === currentNodeId);
        if (!currentNode) return;

        const items = event.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    try {
                        const { buffer, extension } = await optimizeImage(file);
                        const timestamp = Date.now();
                        const fileName = `pasted_${timestamp}.${extension}`;
                        const newImage = await uploadImage(currentManual.id, fileName, buffer);
                        if (newImage && newImage.id) {
                            const currentIds = (currentNode.data.imageIds as number[]) || [];
                            updateNodeData(currentNode.id, { imageIds: [...currentIds, newImage.id] });
                        }
                    } catch (err) {
                        console.error('[GuidePlayer] Paste image failed:', err);
                    }
                }
            }
        }
    };

    const nextEdges = edges.filter(e => e.source === currentNodeId);

    return (
        <div
            className="flex-1 flex flex-col w-full h-full bg-slate-50 overflow-hidden"
            onPaste={handlePaste}
        >
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm z-20">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest leading-none">
                        Step {history.length + 1}
                    </div>
                    <div className="h-4 w-px bg-slate-200" />
                    {isEditing ? (
                        <input
                            value={currentManual?.title || ''}
                            onChange={(e) => updateTitle(e.target.value)}
                            className="text-sm font-bold text-slate-700 bg-white border border-blue-300 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 w-[300px]"
                            placeholder="マニュアルのタイトル"
                        />
                    ) : (
                        <h1 className="text-sm font-bold text-slate-700 truncate max-w-[300px]">
                            {currentManual?.title}
                        </h1>
                    )}

                    {currentManual && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(currentManual.id!, !currentManual.is_favorite);
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${currentManual.is_favorite
                                ? 'bg-yellow-50 text-yellow-500 hover:bg-yellow-100'
                                : 'text-slate-300 hover:bg-slate-100'
                                }`}
                            title={currentManual.is_favorite ? 'お気に入りから削除' : 'お気に入りに追加'}
                        >
                            <Star className={`w-4 h-4 ${currentManual.is_favorite ? 'fill-current' : ''}`} />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {/* Navigation Actions */}
                    <div className="flex items-center gap-3">
                        {isEditing ? (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={async () => {
                                        if (currentManual) {
                                            await saveManual(currentManual);
                                            await releaseLock(currentManual.id);
                                        }
                                        setIsEditing(false);
                                    }}
                                    className="flex items-center gap-2 px-4 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors text-xs font-bold"
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>保存</span>
                                </button>
                                <button
                                    onClick={async () => {
                                        if (currentManual) {
                                            await loadManual(currentManual.id, activeCategoryId || undefined);
                                            await releaseLock(currentManual.id);
                                        }
                                        setIsEditing(false);
                                    }}
                                    className="flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors text-xs font-bold"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    <span>キャンセル</span>
                                </button>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={async () => {
                                        if (!currentManual) return;
                                        const result = await acquireLock(currentManual.id);
                                        if (result.success) {
                                            setIsEditing(true);
                                        } else {
                                            if (window.confirm(`他のスタッフ（${result.editingBy}）がこのマニュアル現在編集中です。\n\nもし相手のPCがフリーズしている等の理由でロックが残っている場合は【OK】を押すと強制的に解除して編集を開始できます。\n強制解除しますか？`)) {
                                                await forceReleaseLock(currentManual.id);
                                                const retryResult = await acquireLock(currentManual.id);
                                                if (retryResult.success) {
                                                    setIsEditing(true);
                                                }
                                            }
                                        }
                                    }}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-xs font-bold mr-2"
                                    title="この場で手順を編集する"
                                >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>編集</span>
                                </button>

                                <button
                                    onClick={async () => {
                                        if (!currentManual) return;
                                        const hList = await getHistory(currentManual.id);
                                        setManualHistoryList(hList);
                                        setShowHistory(true);
                                    }}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-xs font-bold mr-2"
                                    title="過去の履歴を確認・復元"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    履歴
                                </button>
                            </>
                        )}
                        {!isEditing && history.length > 0 && (
                            <button
                                onClick={goBack}
                                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"
                                title="一つ前へ戻る"
                            >
                                <RotateCcw className="w-4 h-4 scale-x-[-1]" />
                            </button>
                        )}
                        {!isEditing && (
                            <button
                                onClick={reset}
                                className="flex items-center gap-2 px-3 py-1.5 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-lg transition-colors text-xs font-bold"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>最初から</span>
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Step Context Menu */}
            {stepContextMenu && (
                <div
                    className="fixed bg-white rounded-lg shadow-xl border border-slate-100 py-1 z-50 min-w-[200px] animate-in fade-in zoom-in-95 duration-100"
                    style={{ top: stepContextMenu.y, left: stepContextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-3 py-2 text-xs font-bold text-slate-400">ステップ操作</div>
                    {isEditing ? (
                        <>
                            <button
                                onClick={() => {
                                    addNode(stepContextMenu.nodeId, 'before');
                                    setStepContextMenu(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2"
                            >
                                <ArrowUp className="w-4 h-4" />
                                この上に追加
                            </button>
                            <button
                                onClick={() => {
                                    addNode(stepContextMenu.nodeId, 'after');
                                    setStepContextMenu(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2"
                            >
                                <ArrowDown className="w-4 h-4" />
                                この下に追加
                            </button>
                            <div className="my-1 border-t border-slate-100" />
                            <button
                                onClick={() => {
                                    if (window.confirm('この手順を削除してもよろしいですか？')) {
                                        deleteNode(stepContextMenu.nodeId);
                                        setStepContextMenu(null);
                                    }
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                削除
                            </button>
                        </>
                    ) : (
                        <div className="px-4 py-2 text-sm text-slate-500 flex items-center gap-2">
                            <Info className="w-4 h-4 text-blue-500" />
                            <span>編集は上の編集ボタンを押してください</span>
                        </div>
                    )}
                </div>
            )}

            <div className="flex-1 flex flex-col overflow-hidden relative">
                <div className="flex-1 overflow-y-auto p-10 bg-slate-50 custom-scrollbar">
                    <div className="max-w-5xl mx-auto">


                        <div className="grid gap-6">
                            {nodes.map((node, index) => {
                                const isCurrent = node.id === currentNodeId;
                                const isCompleted = history.some(h => h.nodeId === node.id);
                                const stepImages = manualImages.filter(img =>
                                    ((node.data.imageIds as number[]) || []).includes(img.id)
                                );

                                return (
                                    <div
                                        key={node.id}
                                        id={`step-${node.id}`}
                                        onClick={!isEditing ? () => {
                                            if (isCurrent) {
                                                if (nextEdges.length === 1) {
                                                    navigateTo(nextEdges[0].target);
                                                }
                                            } else {
                                                setCurrentNodeId(node.id);
                                            }
                                        } : undefined}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setStepContextMenu({ x: e.clientX, y: e.clientY, nodeId: node.id });
                                        }}
                                        className={`flex flex-col p-6 rounded-2xl border transition-all text-left group scroll-mt-4 ${isCurrent
                                            ? 'bg-white border-blue-500 ring-4 ring-blue-500/10 shadow-md scale-[1.01]'
                                            : isCompleted
                                                ? 'bg-green-50/50 border-green-200'
                                                : 'bg-white border-slate-200 ' + (!isEditing ? 'hover:border-blue-300 cursor-pointer' : '')
                                            }`}
                                    >
                                        <div className="flex items-start gap-6">
                                            {/* Step Number */}
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm mt-1 transition-colors ${isCurrent ? 'bg-blue-600 text-white' : isCompleted ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
                                                }`}>
                                                {index + 1}
                                            </div>

                                            {/* Content Area (Left/Main) */}
                                            <div className="flex-1 min-w-0 pt-1">
                                                <div className={`grid grid-cols-1 ${stepImages.length > 0 ? 'lg:grid-cols-2 gap-8' : ''}`}>
                                                    {/* Description Column */}
                                                    <div className="space-y-4">
                                                        {isEditing ? (
                                                            <div className="space-y-4">
                                                                <input
                                                                    value={node.data.label as string}
                                                                    onChange={(e) => updateNodeData(node.id, { label: e.target.value })}
                                                                    className="w-full text-lg font-bold tracking-tight text-blue-700 bg-blue-50/50 border-b border-blue-200 focus:outline-none focus:border-blue-500 px-2 py-1 rounded"
                                                                    placeholder="ステップ名を入力..."
                                                                />
                                                                <MarkdownEditor
                                                                    markdown={(node.data.comment as string) || ''}
                                                                    onChange={(markdown) => updateNodeData(node.id, { comment: markdown })}
                                                                    onAddImage={() => {
                                                                        const inputInfo = document.getElementById(`file-input-${node.id}`);
                                                                        if (inputInfo) inputInfo.click();
                                                                    }}
                                                                />
                                                                <input
                                                                    id={`file-input-${node.id}`}
                                                                    type="file"
                                                                    className="hidden"
                                                                    accept="image/*"
                                                                    onChange={async (e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file && currentManual) {
                                                                            try {
                                                                                const { buffer, extension } = await optimizeImage(file);
                                                                                const fileName = file.name.split('.').slice(0, -1).join('.') + '.' + extension;
                                                                                const newImage = await uploadImage(currentManual.id, fileName, buffer);
                                                                                if (newImage && newImage.id) {
                                                                                    const currentIds = (node.data.imageIds as number[]) || [];
                                                                                    updateNodeData(node.id, { imageIds: [...currentIds, newImage.id] });
                                                                                }
                                                                            } catch (err) {
                                                                                console.error('Image optimization failed:', err);
                                                                            }
                                                                        }
                                                                        e.target.value = '';
                                                                    }}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className={`text-xl font-black tracking-tight ${isCurrent ? 'text-blue-700' : 'text-slate-800'}`}>
                                                                    {node.data.label as string}
                                                                </div>
                                                                {node.data.comment && (
                                                                    <div className="text-base text-slate-700 prose prose-slate max-w-none prose-sm bg-slate-50/50 p-5 rounded-2xl border border-slate-100/50 group-hover:bg-white transition-colors">
                                                                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                                                                            {String(node.data.comment)}
                                                                        </ReactMarkdown>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>

                                                    {/* Image Column (Right) - Only shown if images exist */}
                                                    {stepImages.length > 0 && (
                                                        <div className="block mt-4 lg:mt-0">
                                                            {isEditing && (
                                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                                    <ImageIcon className="w-3 h-3" />
                                                                    画像メディア
                                                                </div>
                                                            )}
                                                            <div className="flex flex-col gap-4">
                                                                {stepImages.map(image => (
                                                                    <div key={image.id} className="relative w-full rounded-2xl overflow-hidden border border-slate-200 group/img shadow-md bg-white">
                                                                        <img
                                                                            src={`file:///${image.file_path.replace(/\\/g, '/')}`}
                                                                            className="w-full object-contain max-h-[400px]"
                                                                            onClick={(e) => {
                                                                                if (!isEditing) {
                                                                                    e.stopPropagation();
                                                                                    setSelectedImage(`file:///${image.file_path.replace(/\\/g, '/')}`);
                                                                                }
                                                                            }}
                                                                        />
                                                                        {isEditing && (
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    const currentIds = (node.data.imageIds as number[]) || [];
                                                                                    const newIds = currentIds.filter(id => id !== image.id);
                                                                                    updateNodeData(node.id, { imageIds: newIds });
                                                                                }}
                                                                                className="absolute top-3 right-3 bg-red-600 text-white p-2 rounded-full shadow-lg opacity-0 group-hover/img:opacity-100 transition-opacity"
                                                                            >
                                                                                <X className="w-4 h-4" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                                {isEditing && (
                                                                    <button
                                                                        onClick={() => {
                                                                            const input = document.getElementById(`file-input-${node.id}`);
                                                                            if (input) input.click();
                                                                        }}
                                                                        className="aspect-video rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 hover:border-blue-400 transition-all text-slate-400 hover:text-blue-500"
                                                                    >
                                                                        <ImageIcon className="w-6 h-6 opacity-30" />
                                                                        <span className="text-xs font-bold">追加</span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Status Indicator */}
                                            <div className="shrink-0 mt-2">
                                                {!isEditing && (isCurrent ? (
                                                    <div className="bg-blue-100 text-blue-600 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider animate-pulse">
                                                        実行中
                                                    </div>
                                                ) : isCompleted ? (
                                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                ) : (
                                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-400 transition-colors" />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>


            {/* Lightbox Overlay */}
            {
                selectedImage && (
                    <div
                        className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-10 animate-in fade-in duration-300 backdrop-blur-sm"
                        onClick={() => setSelectedImage(null)}
                    >
                        <button className="absolute top-8 right-8 text-white/50 hover:text-white hover:rotate-90 transition-all p-2">
                            <X className="w-12 h-12" />
                        </button>
                        <img
                            src={selectedImage}
                            alt="Preview"
                            className="max-w-[95vw] max-h-[95vh] object-contain rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300"
                        />
                    </div>
                )
            }


            {/* Manual History Modal */}
            {showHistory && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <RotateCcw className="w-4 h-4 text-blue-500" />
                                変更履歴（スナップショット）
                            </h3>
                            <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {manualHistoryList.length === 0 ? (
                                <p className="text-center py-8 text-slate-400 text-sm">履歴はありません</p>
                            ) : (
                                manualHistoryList.map((item) => (
                                    <div key={item.id} className="p-4 border rounded-xl hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                                Ver.{item.version || 'unknown'}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                {new Date(item.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-bold text-slate-700">{item.title}</p>
                                                <p className="text-[10px] text-slate-500 line-clamp-1">{item.content ? item.content.substring(0, 50) : '(内容なし)'}...</p>
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm(`このバージョン（${new Date(item.created_at).toLocaleString()}）の内容でマニュアルを復元しますか？\n現在の内容はさらに新しい履歴として保存されます。`)) {
                                                        await restoreFromHistory(currentManual!.id, item);
                                                        setShowHistory(false);
                                                        alert('復元完了しました。');
                                                    }
                                                }}
                                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
                                            >
                                                この状態に戻す
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-4 bg-slate-50 border-t text-[10px] text-slate-400 italic">
                            ※ 画像はコピーされず、常に最新の画像ライブラリが参照されます。
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default GuidePlayer;
