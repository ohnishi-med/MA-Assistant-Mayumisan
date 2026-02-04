import React, { useState, useEffect } from 'react';
import { useManualStore } from '../../store/useManualStore';
import { optimizeImage } from '../../services/imageService';
import { ChevronRight, RotateCcw, MessageSquare, CheckCircle2, X, List, Edit3, Image as ImageIcon, Star, Trash2, ArrowUp, ArrowDown, Table as TableIcon, Info } from 'lucide-react';
import TableEditor from '../editor/TableEditor';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';



const GuidePlayer: React.FC = () => {
    const {
        currentManual,
        activeCategoryId,
        activeEntryPoint,
        manualImages,
        updateNodeData,
        saveManual,
        loadManual,
        uploadImage,
        toggleFavorite,
        addNode,
        deleteNode,
        updateTitle,
    } = useManualStore();

    const [isEditing, setIsEditing] = useState(false);

    const nodes = currentManual?.flowchart_data?.nodes || [];
    const edges = currentManual?.flowchart_data?.edges || [];

    const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
    const [history, setHistory] = useState<{ flowId: string; nodeId: string }[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'interactive' | 'overview'>('overview');

    // Context Menu for Steps
    const [stepContextMenu, setStepContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
    const [showTableEditor, setShowTableEditor] = useState(false);

    useEffect(() => {
        const handleClickOutside = () => setStepContextMenu(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Auto-scroll to current step in overview mode
    useEffect(() => {
        if (viewMode === 'overview' && currentNodeId) {
            // Small delay to ensure DOM is updated
            const timer = setTimeout(() => {
                const element = document.getElementById(`step-${currentNodeId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [currentNodeId, viewMode]);

    // Add logging to track what's happening

    // Reset logic: when the manual changes OR user clicks another manual
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

    const currentNode = nodes.find(n => n.id === currentNodeId);

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
        if (!isEditing || !currentNode || !currentManual) return;
        console.log('[GuidePlayer] Paste event detected');

        const items = event.clipboardData.items;
        console.log('[GuidePlayer] Clipboard items:', items.length);

        for (let i = 0; i < items.length; i++) {
            console.log(`[GuidePlayer] Item ${i}: type=${items[i].type}, kind=${items[i].kind}`);
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    console.log('[GuidePlayer] Image file extracted:', file.name, file.size, file.type);
                    try {
                        const { buffer, extension } = await optimizeImage(file);
                        console.log('[GuidePlayer] Image optimized. Extension:', extension, 'Buffer size:', buffer.byteLength);

                        // eslint-disable-next-line react-hooks/purity
                        const timestamp = Date.now();
                        const fileName = `pasted_${timestamp}.${extension}`;
                        const newImage = await uploadImage(currentManual.id, fileName, buffer);
                        console.log('[GuidePlayer] Image uploaded:', newImage);

                        if (newImage && newImage.id) {
                            const currentIds = (currentNode.data.imageIds as number[]) || [];
                            updateNodeData(currentNode.id, { imageIds: [...currentIds, newImage.id] });
                            console.log('[GuidePlayer] Node updated with new image ID');
                        }
                    } catch (err) {
                        console.error('[GuidePlayer] Paste image failed:', err);
                    }
                } else {
                    console.warn('[GuidePlayer] Failed to get file from image item');
                }
            }
        }
    };

    if (!currentNode) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50 text-slate-500 font-medium">
                {nodes.length === 0 ? "このマニュアルには手順データがありません。" : "マニュアルを読み込んでいます..."}
            </div>
        );
    }

    const nextEdges = edges.filter(e => e.source === currentNodeId);
    const currentImages = manualImages.filter(img =>
        ((currentNode.data.imageIds as number[]) || []).includes(img.id)
    );

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

                <div className="flex items-center gap-6">
                    {/* View Toggle */}
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                            onClick={() => setViewMode('interactive')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'interactive' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>対話型</span>
                        </button>
                        <button
                            onClick={() => setViewMode('overview')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'overview' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <List className="w-3.5 h-3.5" />
                            <span>手順一覧</span>
                        </button>
                    </div>

                    {/* Navigation Actions */}
                    <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                        {isEditing ? (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        if (currentManual) saveManual(currentManual);
                                        setIsEditing(false);
                                    }}
                                    className="flex items-center gap-2 px-4 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors text-xs font-bold"
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>保存</span>
                                </button>
                                <button
                                    onClick={() => {
                                        if (currentManual) loadManual(currentManual.id, activeCategoryId || undefined);
                                        setIsEditing(false);
                                    }}
                                    className="flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors text-xs font-bold"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    <span>キャンセル</span>
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-xs font-bold mr-2"
                                title="この場で手順を編集する"
                            >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>編集</span>
                            </button>
                        )}
                        {!isEditing && history.length > 0 && (
                            <button
                                onClick={goBack}
                                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors title='一つ前へ戻る'"
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
                {viewMode === 'overview' ? (
                    <div className="flex-1 overflow-y-auto p-10 bg-slate-50 custom-scrollbar">
                        <div className="max-w-4xl mx-auto">
                            <div className="mb-8">
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-1">全体手順</h2>
                                <p className="text-sm text-slate-500 font-medium tracking-tight">
                                    {isEditing ? "右クリックで手順の追加・削除ができます。" : "クリックするとそのステップから再開できます。"}
                                </p>
                            </div>

                            <div className="grid gap-4">
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
                                                    // Move to next step if possible
                                                    if (nextEdges.length === 1) {
                                                        navigateTo(nextEdges[0].target);
                                                    } else if (nextEdges.length > 1) {
                                                        // Multiple choices, go to interactive to pick
                                                        setViewMode('interactive');
                                                    }
                                                } else {
                                                    // Jump to this step
                                                    setCurrentNodeId(node.id);
                                                }
                                            } : undefined}
                                            onContextMenu={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setStepContextMenu({ x: e.clientX, y: e.clientY, nodeId: node.id });
                                            }}
                                            className={`flex flex-col gap-4 p-6 rounded-2xl border transition-all text-left group scroll-mt-4 ${isCurrent
                                                ? 'bg-white border-blue-500 ring-4 ring-blue-500/10 shadow-md scale-[1.01]'
                                                : isCompleted
                                                    ? 'bg-green-50/50 border-green-200'
                                                    : 'bg-white border-slate-200 ' + (!isEditing ? 'hover:border-blue-300 cursor-pointer' : '')
                                                }`}
                                        >
                                            <div className="flex items-start gap-5">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm mt-1 transition-colors ${isCurrent ? 'bg-blue-600 text-white' : isCompleted ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
                                                    }`}>
                                                    {index + 1}
                                                </div>

                                                <div className="flex-1 min-w-0 pt-1">
                                                    {isEditing ? (
                                                        <div className="space-y-2">
                                                            <input
                                                                value={node.data.label as string}
                                                                onChange={(e) => updateNodeData(node.id, { label: e.target.value })}
                                                                className="w-full text-lg font-bold tracking-tight text-blue-700 bg-blue-50/50 border-b border-blue-200 focus:outline-none focus:border-blue-500 px-2 py-1 rounded"
                                                                placeholder="ステップ名を入力..."
                                                            />
                                                            <textarea
                                                                value={(node.data.comment as string) || ''}
                                                                onChange={(e) => updateNodeData(node.id, { comment: e.target.value })}
                                                                className="w-full text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                                rows={2}
                                                                placeholder={
                                                                    index === 0 ? "こちらに手順を記載してください" :
                                                                        index === 1 ? "表の作成もできます" :
                                                                            index === 2 ? "画像の添付もできます" :
                                                                                "作業指示を入力..."
                                                                }
                                                            />
                                                            <div className="flex justify-end mt-2">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setCurrentNodeId(node.id);
                                                                        setShowTableEditor(true);
                                                                    }}
                                                                    className="flex items-center gap-2 px-2 py-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold transition-colors shadow-sm"
                                                                >
                                                                    <TableIcon className="w-3.5 h-3.5" />
                                                                    <span>テーブルを追加</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className={`text-lg font-bold tracking-tight mb-2 ${isCurrent ? 'text-blue-700' : 'text-slate-700'}`}>
                                                                {node.data.label as string}
                                                            </div>
                                                            {node.data.comment && (
                                                                <div className="text-sm text-slate-600 prose prose-slate max-w-none prose-sm bg-slate-50/50 p-3 rounded-xl border border-slate-100/50 group-hover:bg-white transition-colors mb-4">
                                                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                                                                        {String(node.data.comment)}
                                                                    </ReactMarkdown>
                                                                </div>
                                                            )}

                                                            {/* Display Images in View Mode */}
                                                            {stepImages.length > 0 && (
                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                                                                    {stepImages.map(image => (
                                                                        <div key={image.id} className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-white">
                                                                            <img
                                                                                src={`file:///${image.file_path.replace(/\\/g, '/')}`}
                                                                                alt={image.file_name}
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>

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

                                            {/* Image editing in list mode */}
                                            {isEditing && (
                                                <div className="pl-[60px] space-y-4">
                                                    <div className="grid grid-cols-4 gap-2">
                                                        {stepImages.map(image => (
                                                            <div key={image.id} className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 group/img">
                                                                <img src={`file:///${image.file_path.replace(/\\/g, '/')}`} className="w-full h-full object-cover" />
                                                                <button
                                                                    onClick={() => {
                                                                        const currentIds = (node.data.imageIds as number[]) || [];
                                                                        const newIds = currentIds.filter(id => id !== image.id);
                                                                        updateNodeData(node.id, { imageIds: newIds });
                                                                    }}
                                                                    className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <label className="aspect-video rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 hover:bg-white hover:border-blue-400 transition-all cursor-pointer text-slate-400 hover:text-blue-500">
                                                            <input
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
                                                                }}
                                                            />
                                                            <ImageIcon className="w-4 h-4 opacity-50" />
                                                            <span className="text-[10px] font-bold">追加</span>
                                                        </label>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
                        {/* Interactive Mode - Left: Instructions */}
                        <section className="flex-1 bg-white overflow-y-auto p-10 custom-scrollbar">
                            <div className="max-w-3xl mx-auto space-y-10">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-blue-600 p-4 rounded-2xl shadow-blue-200 shadow-lg">
                                            <MessageSquare className="w-8 h-8 text-white" />
                                        </div>
                                        {isEditing ? (
                                            <input
                                                value={currentNode.data.label as string}
                                                onChange={(e) => updateNodeData(currentNode.id, { label: e.target.value })}
                                                className="flex-1 text-4xl font-black text-slate-800 tracking-tighter leading-tight italic bg-blue-50/50 border-b-2 border-blue-200 focus:outline-none focus:border-blue-600 px-4 py-2 rounded-xl"
                                                placeholder="ステップ名を入力..."
                                            />
                                        ) : (
                                            <h2 className="text-4xl font-black text-slate-800 tracking-tighter leading-tight italic">
                                                {currentNode.data.label as string}
                                            </h2>
                                        )}
                                    </div>
                                    <div className="h-1.5 w-24 bg-blue-600 rounded-full ml-1" />
                                </div>

                                <article className="space-y-4">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                                            作業手順
                                        </div>
                                        {isEditing && (
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => setShowTableEditor(true)}
                                                    className="flex items-center gap-2 px-2 py-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold transition-colors shadow-sm normal-case tracking-normal"
                                                >
                                                    <TableIcon className="w-3.5 h-3.5" />
                                                    <span>テーブル</span>
                                                </button>
                                                <span className="text-[10px] font-medium text-slate-400 normal-case">Markdown形式で入力可能</span>
                                            </div>
                                        )}
                                    </h3>
                                    {isEditing ? (
                                        <textarea
                                            value={(currentNode.data.comment as string) || ''}
                                            onChange={(e) => updateNodeData(currentNode.id, { comment: e.target.value })}
                                            className="w-full min-h-[200px] bg-slate-50 border border-slate-200 rounded-3xl p-8 text-slate-700 text-xl leading-relaxed shadow-inner focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                                            placeholder={
                                                nodes.findIndex(n => n.id === currentNode.id) === 0 ? "こちらに手順を記載してください" :
                                                    nodes.findIndex(n => n.id === currentNode.id) === 1 ? "表の作成もできます" :
                                                        nodes.findIndex(n => n.id === currentNode.id) === 2 ? "画像の添付もできます" :
                                                            "ここに詳しい手順を記述してください..."
                                            }
                                        />
                                    ) : currentNode.data.comment ? (
                                        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 text-slate-700 text-xl leading-relaxed shadow-inner prose prose-slate max-w-none">
                                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                                                {currentNode.data.comment as string}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        <div className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                                            <p className="text-slate-400 font-bold italic">このステップに個別の作業指示はありません。</p>
                                        </div>
                                    )}
                                </article>

                                {isEditing ? (
                                    <section className="space-y-4">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                                            画像・メディアの添付
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            {currentImages.map((image) => {
                                                // Use file:/// protocol directly with webSecurity: false
                                                // Ensure 3 slashes for Windows: file:///C:/...
                                                const normalizedPath = image.file_path.replace(/\\/g, '/');
                                                const src = `file:///${normalizedPath}`;
                                                console.log('[GuidePlayer] Rendering Image:', { id: image.id, path: image.file_path, computedSrc: src });
                                                return (
                                                    <div key={image.id} className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 group">
                                                        <img
                                                            src={src}
                                                            className="w-full h-full object-cover"
                                                            onError={() => console.error('[GuidePlayer] Image load error:', src)}
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                const newImageIds = ((currentNode.data.imageIds as number[]) || []).filter(id => id !== image.id);
                                                                updateNodeData(currentNode.id, { imageIds: newImageIds });
                                                            }}
                                                            className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                            <label className="aspect-video rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 hover:bg-white hover:border-blue-400 transition-all cursor-pointer text-slate-400 hover:text-blue-500">
                                                <input
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
                                                                    const currentIds = (currentNode.data.imageIds as number[]) || [];
                                                                    updateNodeData(currentNode.id, { imageIds: [...currentIds, newImage.id] });
                                                                }
                                                            } catch (err) {
                                                                console.error('Image optimization failed:', err);
                                                            }
                                                        }
                                                    }}
                                                />
                                                <ImageIcon className="w-8 h-8 opacity-20" />
                                                <span className="text-sm font-bold">画像を追加</span>
                                            </label>
                                        </div>
                                    </section>
                                ) : currentImages.length > 0 && (
                                    <section className="space-y-4">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                                            参考資料
                                        </h3>
                                        <div className="flex gap-4 overflow-x-auto pb-6 custom-scrollbar snap-x">
                                            {currentImages.map((image) => (
                                                <button
                                                    key={image.id}
                                                    onClick={() => {
                                                        const normalizedPath = image.file_path.replace(/\\/g, '/');
                                                        setSelectedImage(`file:///${normalizedPath}`);
                                                    }}
                                                    className="shrink-0 w-72 aspect-video rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all snap-center bg-white p-1"
                                                >
                                                    <img
                                                        src={`file:///${image.file_path.replace(/\\/g, '/')}`}
                                                        alt={image.file_name}
                                                        className="w-full h-full object-cover rounded-xl"
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {nextEdges.length === 0 && !currentNode.data.hasSubFlow && (
                                    <div className="p-12 bg-green-50 border-2 border-green-100 rounded-[3rem] text-center shadow-lg shadow-green-100/50 flex flex-col items-center gap-4">
                                        <div className="bg-green-600 p-5 rounded-full shadow-lg shadow-green-200">
                                            <CheckCircle2 className="w-12 h-12 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-3xl font-black text-green-900 tracking-tight mb-1">セクション完了！</p>
                                            <p className="text-green-700 font-bold opacity-80 leading-relaxed text-lg">このフローの最後まで到達しました。<br />次のカテゴリの作業へ移るか、最初から読み直してください。</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Interactive Mode - Right: Actions */}
                        <aside className="w-full md:w-[450px] bg-slate-50 border-t md:border-t-0 md:border-l border-slate-200 flex flex-col">
                            <div className="p-10 flex-1 overflow-y-auto custom-scrollbar">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                                            {currentNode.data.hasSubFlow ? '詳細ステップへ進む' : '次のアクションを選択'}
                                        </h3>
                                        <div className="h-1 w-12 bg-blue-600 rounded-full" />
                                    </div>

                                    <div className="grid gap-4">
                                        {nextEdges.map((edge) => (
                                            <button
                                                key={edge.id}
                                                onClick={() => navigateTo(edge.target)}
                                                className="flex items-center justify-between group bg-white border border-slate-200 p-6 rounded-2xl hover:border-blue-500 hover:ring-4 hover:ring-blue-500/10 transition-all shadow-sm active:scale-[0.98] text-left"
                                            >
                                                <span className="font-black text-slate-800 group-hover:text-blue-700 transition-colors pr-6 text-lg leading-tight">
                                                    {edge.label || (nodes.find(n => n.id === edge.target)?.data.label as string) || '次に進む'}
                                                </span>
                                                <div className="bg-slate-50 group-hover:bg-blue-600 p-2 rounded-xl transition-all shrink-0">
                                                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                                </div>
                                            </button>
                                        ))}

                                        {Boolean(currentNode.data.hasSubFlow) && nextEdges.length === 0 && (
                                            <div className="bg-slate-100 border-2 border-dashed border-slate-300 p-10 rounded-3xl text-center">
                                                <p className="text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">Sub-Flow Placeholder</p>
                                                <p className="text-slate-500 font-bold">詳細な作業フローは<br />現在準備中です。</p>
                                            </div>
                                        )}

                                        {nextEdges.length === 0 && !currentNode.data.hasSubFlow && (
                                            <button
                                                onClick={reset}
                                                className="flex items-center justify-center gap-3 bg-slate-800 text-white p-6 rounded-2xl hover:bg-slate-900 shadow-xl transition-all active:scale-[0.98]"
                                            >
                                                <RotateCcw className="w-5 h-5" />
                                                <span className="text-lg font-black tracking-tight">最初からやり直す</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                )}
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

            {/* Table Editor Modal */}
            {showTableEditor && currentNode && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl rounded-xl animate-in zoom-in-95 duration-200">
                        <TableEditor
                            initialMarkdown=""
                            onSave={(markdown) => {
                                const currentComment = (currentNode.data.comment as string) || '';
                                const newComment = currentComment ? `${currentComment}\n\n${markdown}` : markdown;
                                updateNodeData(currentNode.id, { comment: newComment });
                                setShowTableEditor(false);
                            }}
                            onCancel={() => setShowTableEditor(false)}
                        />
                    </div>
                </div>
            )}
        </div >
    );
};

export default GuidePlayer;
