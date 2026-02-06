import React, { useState, useEffect } from 'react';
import {
    ChevronDown, ChevronRight, Folder, FileText, Loader2, X, Move, Link, Plus, Edit2, Trash2,
    UserCheck, Calculator, BadgeJapaneseYen, Stethoscope, Microscope, ShoppingCart, Package,
    Car, MoreHorizontal, HeartPulse, Thermometer, Briefcase, Users, Mail, Phone, Bell, Calendar, Info,
    TestTube2, Syringe, Pill, Tablets, Dna, FlaskConical, Activity, Clipboard, History
} from 'lucide-react';

const IconMap: Record<string, any> = {
    Folder, UserCheck, Calculator, BadgeJapaneseYen, Stethoscope,
    FileText, Microscope, ShoppingCart, Package, Car,
    MoreHorizontal, HeartPulse, Thermometer, Briefcase,
    Users, Mail, Phone, Bell, Calendar, Info,
    TestTube2, Syringe, Pill, Tablets, Dna, FlaskConical, Activity, Clipboard, History
};
import { useCategoryStore } from '../../store/useCategoryStore';
import { useManualStore } from '../../store/useManualStore';
import type { Category } from '../../types/category';

interface TreeItemProps {
    category: Category;
    allCategories: Category[];
    level: number;
    onManualSelect: (id: number, categoryId: number) => void;
    onCategorySelect: (categoryId: number | null) => void;
    isCollapsed?: boolean;
}

interface DropSelectionModalProps {
    onSelect: (choice: 'move' | 'link') => void;
    onCancel: () => void;
    isFromUnassigned: boolean;
}

interface ContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onAction: (action: 'new_folder' | 'rename' | 'delete') => void;
    type: 'root' | 'category';
}

const ContextMenu = ({ x, y, onClose, onAction, type }: ContextMenuProps) => {
    useEffect(() => {
        const handleClick = () => onClose();
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [onClose]);

    return (
        <div
            className="fixed z-[10000] bg-white rounded-lg shadow-xl border border-slate-200 py-1 w-48 animate-in fade-in zoom-in-95 duration-100"
            style={{ left: x, top: y }}
            onClick={(e) => e.stopPropagation()}
        >
            <button
                onClick={() => { onAction('new_folder'); onClose(); }}
                className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 text-sm text-slate-700 w-full text-left transition-colors"
            >
                <Plus className="w-4 h-4 text-slate-400" />
                <span>新規フォルダ作成</span>
            </button>

            {type === 'category' && (
                <>
                    <button
                        onClick={() => { onAction('rename'); onClose(); }}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 text-sm text-slate-700 w-full text-left transition-colors"
                    >
                        <Edit2 className="w-4 h-4 text-slate-400" />
                        <span>名前の変更</span>
                    </button>
                    <div className="h-px bg-slate-100 my-1" />
                    <button
                        onClick={() => { onAction('delete'); onClose(); }}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 text-sm text-red-600 w-full text-left transition-colors"
                    >
                        <Trash2 className="w-4 h-4 text-red-400" />
                        <span>削除</span>
                    </button>
                </>
            )}
        </div>
    );
};

interface InputModalProps {
    title: string;
    description: string;
    defaultValue?: string;
    onConfirm: (value: string) => void;
    onCancel: () => void;
}

const InputModal = ({ title, description, defaultValue = '', onConfirm, onCancel }: InputModalProps) => {
    const [value, setValue] = useState(defaultValue);
    const inputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[10001] animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-96 flex flex-col gap-4 border border-slate-200 scale-in-center">
                <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                <p className="text-sm text-slate-500">{description}</p>
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') onConfirm(value);
                        if (e.key === 'Escape') onCancel();
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-700"
                    placeholder="名前を入力..."
                />
                <div className="flex justify-end gap-2 mt-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={() => onConfirm(value)}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                    >
                        保存
                    </button>
                </div>
            </div>
        </div>
    );
};

interface ConfirmModalProps {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmModal = ({ title, message, onConfirm, onCancel }: ConfirmModalProps) => {
    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[10001] animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-96 flex flex-col gap-4 border border-slate-200 scale-in-center">
                <h3 className="text-lg font-bold text-red-600">{title}</h3>
                <p className="text-sm text-slate-500 whitespace-pre-wrap">{message}</p>
                <div className="flex justify-end gap-2 mt-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors"
                    >
                        削除する
                    </button>
                </div>
            </div>
        </div>
    );
};

const DropSelectionModal = ({ onSelect, onCancel, isFromUnassigned }: DropSelectionModalProps) => {
    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[9999] animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-80 flex flex-col gap-4 border border-slate-200 scale-in-center overflow-hidden">
                <div className="flex flex-col gap-1 items-center mb-2">
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                        <Move className="w-6 h-6 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">マニュアルの追加方法</h3>
                    <p className="text-xs text-slate-500 text-center px-4">どのような形式で追加しますか？</p>
                </div>

                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => onSelect('link')}
                        className="flex items-center gap-3 p-3 hover:bg-slate-50 border border-slate-100 rounded-lg transition-all group group-hover:border-blue-200"
                    >
                        <div className="bg-slate-100 p-2 rounded group-hover:bg-blue-50">
                            <Link className="w-4 h-4 text-slate-500 group-hover:text-blue-500" />
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-sm font-bold text-slate-700">追加登録 (リンク)</span>
                            <span className="text-[10px] text-slate-400">元のフォルダにも残します</span>
                        </div>
                    </button>

                    {!isFromUnassigned && (
                        <button
                            onClick={() => onSelect('move')}
                            className="flex items-center gap-3 p-3 hover:bg-slate-50 border border-slate-100 rounded-lg transition-all group group-hover:border-blue-200"
                        >
                            <div className="bg-slate-100 p-2 rounded group-hover:bg-blue-50">
                                <Move className="w-4 h-4 text-slate-500 group-hover:text-blue-500" />
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="text-sm font-bold text-slate-700">移動</span>
                                <span className="text-[10px] text-slate-400">元のフォルダから削除します</span>
                            </div>
                        </button>
                    )}
                </div>

                <button
                    onClick={onCancel}
                    className="text-xs text-slate-400 hover:text-slate-600 font-medium py-1 transition-colors"
                >
                    キャンセル
                </button>
            </div>
        </div>
    );
};

export const TreeItem = ({ category, allCategories, level, onManualSelect, onCategorySelect, isCollapsed }: TreeItemProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [manuals, setManuals] = useState<any[]>([]);
    const [loadingManuals, setLoadingManuals] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [pendingDrop, setPendingDrop] = useState<{ manualId: number; sourceCategoryId: number | 'unassigned' } | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
    const [modal, setModal] = useState<{ type: 'new_folder' | 'rename' | 'delete' } | null>(null);

    const addCategory = useCategoryStore((state) => state.addCategory);
    const updateCategory = useCategoryStore((state) => state.updateCategory);
    const deleteCategory = useCategoryStore((state) => state.deleteCategory);
    const getManualsByCategory = useCategoryStore((state) => state.getManualsByCategory);
    const linkCategory = useManualStore((state) => state.linkCategory);
    const unlinkCategory = useManualStore((state) => state.unlinkCategory);
    const moveManualToCategory = useManualStore((state) => state.moveManualToCategory);
    const manualRefreshCounter = useManualStore((state) => state.manualRefreshCounter);
    const acquireGlobalLock = useCategoryStore((state) => state.acquireGlobalLock);
    const releaseGlobalLock = useCategoryStore((state) => state.releaseGlobalLock);
    const forceReleaseGlobalLock = useCategoryStore((state) => state.forceReleaseGlobalLock);

    const subCategories = allCategories.filter(c => c.parent_id === category.id);

    useEffect(() => {
        if (isOpen && !isCollapsed) {
            loadManuals();
        }
    }, [isOpen, manualRefreshCounter, isCollapsed]);

    const loadManuals = async () => {
        setLoadingManuals(true);
        try {
            const result = await getManualsByCategory(category.id);
            setManuals(result);
        } catch (err) {
            console.error('Failed to load manuals for category:', err);
        } finally {
            setLoadingManuals(false);
        }
    };

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('type', 'category');
        e.dataTransfer.setData('categoryId', category.id.toString());
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleManualDragStart = (e: React.DragEvent, manualId: number) => {
        e.dataTransfer.setData('type', 'manual');
        e.dataTransfer.setData('manualId', manualId.toString());
        e.dataTransfer.setData('sourceCategoryId', category.id.toString());
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.stopPropagation();
        setIsDragOver(false);
    };

    const isDescendant = (parent: Category, targetId: number): boolean => {
        const children = allCategories.filter(c => c.parent_id === parent.id);
        if (children.some(c => c.id === targetId)) return true;
        return children.some(c => isDescendant(c, targetId));
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const type = e.dataTransfer.getData('type');

        if (type === 'category') {
            const draggedId = Number(e.dataTransfer.getData('categoryId'));
            if (isNaN(draggedId) || draggedId === category.id) return;

            // Prevent moving a category into its own descendant
            const draggedCategory = allCategories.find(c => c.id === draggedId);
            if (!draggedCategory) return;

            if (isDescendant(draggedCategory, category.id)) {
                console.warn('Cannot move a category into its own descendant');
                return;
            }

            try {
                let lockResult = await acquireGlobalLock();
                if (!lockResult.success) {
                    if (window.confirm(`他のスタッフ（${lockResult.lockedBy}）が現在カテゴリ構成を編集中のため、移動できません。\n\nもしロックが残っていると思われる場合は【OK】を押すと強制的に解除できます。強制解除しますか？`)) {
                        await forceReleaseGlobalLock();
                        lockResult = await acquireGlobalLock();
                    }
                }
                if (lockResult.success) {
                    await updateCategory(draggedId, { parent_id: category.id });
                    setIsOpen(true);
                }
            } catch (err) {
                console.error('Failed to move category:', err);
            } finally {
                await releaseGlobalLock();
            }
        } else if (type === 'manual') {
            const manualId = Number(e.dataTransfer.getData('manualId'));
            const sourceCategoryRaw = e.dataTransfer.getData('sourceCategoryId');
            const sourceCategoryId = sourceCategoryRaw === 'unassigned' ? 'unassigned' : Number(sourceCategoryRaw);

            if (isNaN(manualId) || (sourceCategoryId !== 'unassigned' && sourceCategoryId === category.id)) {
                return;
            }

            // From unassigned, we always just "link" (it's essentially a move but DB handles it as link)
            if (sourceCategoryId === 'unassigned') {
                try {
                    await linkCategory(manualId, category.id);
                    setIsOpen(true);
                } catch (err) {
                    console.error('Failed to link manual:', err);
                }
            } else {
                // Show choice modal
                setPendingDrop({ manualId, sourceCategoryId });
            }
        }
    };

    const handleChoiceSelect = async (choice: 'move' | 'link') => {
        if (!pendingDrop) return;
        const { manualId, sourceCategoryId } = pendingDrop;
        setPendingDrop(null);

        try {
            let lockResult = await acquireGlobalLock();
            if (!lockResult.success) {
                if (window.confirm(`他のスタッフ（${lockResult.lockedBy}）が現在カテゴリ構成を編集中のため、操作できません。\n\nロックを強制解除しますか？`)) {
                    await forceReleaseGlobalLock();
                    lockResult = await acquireGlobalLock();
                }
            }
            if (lockResult.success) {
                if (choice === 'move') {
                    await moveManualToCategory(manualId, sourceCategoryId as number, category.id);
                } else {
                    await linkCategory(manualId, category.id);
                }
                setIsOpen(true);
            }
        } catch (err) {
            console.error(`Failed to ${choice} manual:`, err);
        } finally {
            await releaseGlobalLock();
        }
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        if (isCollapsed) return;
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY });
    };

    const handleMenuAction = async (action: 'new_folder' | 'rename' | 'delete') => {
        setModal({ type: action });
    };

    const handleModalConfirm = async (value?: string) => {
        if (!modal) return;
        const type = modal.type;
        setModal(null);

        let lockResult = await acquireGlobalLock();
        if (!lockResult.success) {
            if (window.confirm(`他のスタッフ（${lockResult.lockedBy}）が現在カテゴリ構成を編集中のため、変更できません。\n\nロックを強制解除しますか？`)) {
                await forceReleaseGlobalLock();
                lockResult = await acquireGlobalLock();
            }
        }

        if (lockResult.success) {
            try {
                if (type === 'new_folder' && value) {
                    await addCategory({
                        name: value,
                        parent_id: category.id,
                        level: level + 1,
                        display_order: 0,
                        path: ''
                    });
                    setIsOpen(true);
                } else if (type === 'rename' && value && value !== category.name) {
                    await updateCategory(category.id, { name: value });
                } else if (type === 'delete') {
                    await deleteCategory(category.id);
                }
            } finally {
                await releaseGlobalLock();
            }
        }
    };

    const handleClick = () => {
        if (isCollapsed) {
            onCategorySelect(category.id);
            return;
        }
        setIsOpen(!isOpen);
        onCategorySelect(category.id);
    };

    return (
        <div
            className={`flex flex-col transition-colors ${isDragOver ? 'bg-blue-50/50 rounded-lg outline-2 outline-dashed outline-blue-300' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {pendingDrop && (
                <DropSelectionModal
                    onSelect={handleChoiceSelect}
                    onCancel={() => setPendingDrop(null)}
                    isFromUnassigned={pendingDrop.sourceCategoryId === 'unassigned'}
                />
            )}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    onAction={handleMenuAction}
                    type="category"
                />
            )}
            {modal?.type === 'new_folder' && (
                <InputModal
                    title="新規フォルダ作成"
                    description={`「${category.name}」の中に作成する新しいフォルダの名前を入力してください`}
                    onConfirm={handleModalConfirm}
                    onCancel={() => setModal(null)}
                />
            )}
            {modal?.type === 'rename' && (
                <InputModal
                    title="名前の変更"
                    description="新しいフォルダ名を入力してください"
                    defaultValue={category.name}
                    onConfirm={handleModalConfirm}
                    onCancel={() => setModal(null)}
                />
            )}
            {modal?.type === 'delete' && (
                <ConfirmModal
                    title="フォルダの削除"
                    message={`フォルダ「${category.name}」を削除しますか？\n中のマニュアル自体は削除されず「未分類」に移動します。`}
                    onConfirm={() => handleModalConfirm()}
                    onCancel={() => setModal(null)}
                />
            )}
            <button
                draggable={!isCollapsed}
                onDragStart={handleDragStart}
                onContextMenu={handleContextMenu}
                onClick={handleClick}
                className={`flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 rounded text-sm w-full text-left transition-all group ${isOpen && !isCollapsed ? 'bg-slate-50' : ''} ${isDragOver ? 'translate-x-1' : ''} ${isCollapsed ? 'justify-center px-0' : ''}`}
                style={{ paddingLeft: isCollapsed ? '0' : `${level * 24}px` }}
                title={isCollapsed ? category.name : ''}
            >
                {/* Slot 1: Expand/Collapse */}
                {!isCollapsed && (
                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                        {isOpen ? (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500" />
                        ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500" />
                        )}
                    </div>
                )}
                {/* Slot 2: Icon */}
                {(() => {
                    const IconComponent = IconMap[category.icon || 'Folder'] || Folder;
                    return <IconComponent className={`w-4 h-4 shrink-0 ${(isOpen && !isCollapsed) ? 'text-blue-600 fill-blue-600/10' : 'text-slate-400'}`} />;
                })()}
                {/* Slot 3: Text */}
                {!isCollapsed && <span className={`truncate ${isOpen ? 'font-bold text-slate-900' : 'text-slate-600 font-medium'}`}>{category.name}</span>}
            </button>

            {(isOpen && !isCollapsed) && (
                <div className="flex flex-col relative ml-[11px] border-l border-slate-100">
                    {/* Subcategories FIRST for intuitive hierarchy */}
                    {subCategories.map(sub => (
                        <TreeItem
                            key={sub.id}
                            category={sub}
                            allCategories={allCategories}
                            level={level + 1}
                            onManualSelect={onManualSelect}
                            onCategorySelect={onCategorySelect}
                            isCollapsed={isCollapsed}
                        />
                    ))}

                    {/* Then render Manuals */}
                    {!loadingManuals && manuals.map(manual => (
                        <div
                            key={`m-${category.id}-${manual.id}`}
                            draggable
                            onDragStart={(e) => handleManualDragStart(e, manual.id)}
                            className="flex items-center gap-0 group/manual-container"
                            style={{ paddingLeft: `${(level + 1) * 24 - 11}px` }}
                        >
                            <button
                                onClick={() => onManualSelect(manual.id, category.id)}
                                className="flex items-center gap-2 px-2 py-1.5 hover:bg-blue-50 hover:text-blue-600 rounded text-sm text-slate-500 flex-1 text-left transition-colors group/manual truncate"
                            >
                                <div className="w-5 h-5 shrink-0" />
                                <FileText className="w-4 h-4 text-slate-300 group-hover/manual:text-blue-400 shrink-0" />
                                <span className="truncate">{manual.title}</span>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm(`このカテゴリーからマニュアルを外しますか？\n(マニュアル自体は削除されません)`)) {
                                        unlinkCategory(manual.id, category.id);
                                    }
                                }}
                                title="カテゴリーから外す"
                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover/manual-container:opacity-100 mr-1"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}

                    {loadingManuals && (
                        <div className="flex items-center gap-2 px-2 py-1.5 animate-pulse" style={{ paddingLeft: `${(level + 1) * 24 - 11}px` }}>
                            <div className="w-5 h-5 shrink-0" />
                            <Loader2 className="w-3 h-3 animate-spin text-slate-300" />
                            <span className="text-xs text-slate-400 italic">読込中...</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const UnassignedManualsItem = ({ onManualSelect, isCollapsed }: { onManualSelect: (id: number, categoryId: number) => void, isCollapsed?: boolean }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [manuals, setManuals] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const getUnassignedManuals = useManualStore((state) => state.getUnassignedManuals);
    const manualRefreshCounter = useManualStore((state) => state.manualRefreshCounter);

    const loadManuals = async () => {
        setLoading(true);
        try {
            const result = await getUnassignedManuals();
            setManuals(result);
        } catch (err) {
            console.error('Failed to load unassigned manuals:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && !isCollapsed) {
            loadManuals();
        }
    }, [isOpen, manualRefreshCounter, isCollapsed]);

    const handleManualDragStart = (e: React.DragEvent, manualId: number) => {
        e.dataTransfer.setData('type', 'manual');
        e.dataTransfer.setData('manualId', manualId.toString());
        e.dataTransfer.setData('sourceCategoryId', 'unassigned');
        e.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div
            className={`flex flex-col mt-2 pt-2 border-t border-slate-100 transition-colors ${isDragOver ? 'bg-amber-50/30 outline-2 outline-dashed outline-amber-200 rounded-lg' : ''} ${isCollapsed ? 'items-center' : ''}`}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragOver(false);
            }}
        >
            <button
                onClick={() => !isCollapsed && setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 rounded text-sm w-full text-left transition-all group ${isOpen && !isCollapsed ? 'bg-slate-50' : ''} ${isCollapsed ? 'justify-center px-0' : ''}`}
                title={isCollapsed ? "未分類のマニュアル" : ""}
            >
                {!isCollapsed && (
                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                        {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                    </div>
                )}
                <Folder className={`w-4 h-4 shrink-0 ${(isOpen && !isCollapsed) ? 'text-amber-500 fill-amber-500/10' : 'text-slate-400'}`} />
                {!isCollapsed && (
                    <>
                        <span className={`truncate ${isOpen ? 'font-bold text-slate-900' : 'text-slate-600 font-medium'}`}>未分類のマニュアル</span>
                        {manuals.length > 0 && !loading && (
                            <span className="ml-auto bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded-full min-w-[1.2rem] text-center">
                                {manuals.length}
                            </span>
                        )}
                    </>
                )}
            </button>

            {(isOpen && !isCollapsed) && (
                <div className="flex flex-col relative ml-[11px] border-l border-slate-100">
                    {loading ? (
                        <div className="flex items-center gap-2 px-2 py-1.5 animate-pulse pl-6">
                            <div className="w-5 h-5 shrink-0" />
                            <Loader2 className="w-3 h-3 animate-spin text-slate-300" />
                            <span className="text-xs text-slate-400 italic">読み込み中...</span>
                        </div>
                    ) : manuals.length === 0 ? (
                        <div className="px-8 py-2 text-[11px] text-slate-400 italic">
                            未分類のマニュアルはありません
                        </div>
                    ) : (
                        manuals.map(manual => (
                            <div
                                key={`unassigned-${manual.id}`}
                                draggable
                                onDragStart={(e) => handleManualDragStart(e, manual.id)}
                                className="flex items-center gap-0 group/manual-container"
                                style={{ paddingLeft: `${24 - 11}px` }}
                            >
                                <button
                                    onClick={() => onManualSelect(manual.id, -1)}
                                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-blue-50 hover:text-blue-600 rounded text-sm text-slate-500 flex-1 text-left transition-colors group/manual truncate"
                                >
                                    <div className="w-5 h-5 shrink-0" />
                                    <FileText className="w-4 h-4 text-slate-300 group-hover/manual:text-blue-400 shrink-0" />
                                    <span className="truncate">{manual.title}</span>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

// Update root component props
export const CategoryTree = ({ onManualSelect, onCategorySelect, isCollapsed }: {
    onManualSelect: (id: number, categoryId: number) => void;
    onCategorySelect: (categoryId: number | null) => void;
    isCollapsed?: boolean;
}) => {
    const { categories, fetchCategories, isLoading } = useCategoryStore();
    const [isDragOverRoot, setIsDragOverRoot] = useState(false);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
    const [showNewFolderModal, setShowNewFolderModal] = useState(false);

    const addCategory = useCategoryStore((state) => state.addCategory);
    const updateCategory = useCategoryStore((state) => state.updateCategory);
    const acquireGlobalLock = useCategoryStore((state) => state.acquireGlobalLock);
    const releaseGlobalLock = useCategoryStore((state) => state.releaseGlobalLock);
    const forceReleaseGlobalLock = useCategoryStore((state) => state.forceReleaseGlobalLock);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleDragOverRoot = (e: React.DragEvent) => {
        if (isCollapsed) return;
        e.preventDefault();
        setIsDragOverRoot(true);
    };

    const handleDropOnRoot = async (e: React.DragEvent) => {
        if (isCollapsed) return;
        e.preventDefault();
        setIsDragOverRoot(false);
        const type = e.dataTransfer.getData('type');
        if (type !== 'category') return;

        const draggedId = Number(e.dataTransfer.getData('categoryId'));
        if (isNaN(draggedId)) return;

        try {
            let lockResult = await acquireGlobalLock();
            if (!lockResult.success) {
                if (window.confirm(`他のスタッフ（${lockResult.lockedBy}）が現在カテゴリ構成を編集中のため、移動できません。\n\nロックを強制解除しますか？`)) {
                    await forceReleaseGlobalLock();
                    lockResult = await acquireGlobalLock();
                }
            }
            if (lockResult.success) {
                await updateCategory(draggedId, { parent_id: null });
            }
        } catch (err) {
            console.error('Failed to move category to root:', err);
        } finally {
            await releaseGlobalLock();
        }
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        if (isCollapsed) return;
        e.preventDefault();
        if (e.target === e.currentTarget) {
            setContextMenu({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMenuAction = async (action: string) => {
        if (action === 'new_folder') {
            setShowNewFolderModal(true);
        }
    };

    const handleNewFolderConfirm = async (name: string) => {
        setShowNewFolderModal(false);
        let lockResult = await acquireGlobalLock();
        if (!lockResult.success) {
            if (window.confirm(`他のスタッフ（${lockResult.lockedBy}）が現在カテゴリ構成を編集中のため、追加できません。\n\nロックを強制解除しますか？`)) {
                await forceReleaseGlobalLock();
                lockResult = await acquireGlobalLock();
            }
        }

        if (lockResult.success) {
            try {
                if (name) {
                    await addCategory({
                        name,
                        parent_id: null,
                        level: 0,
                        display_order: 0,
                        path: ''
                    });
                }
            } finally {
                await releaseGlobalLock();
            }
        }
    };

    const rootCategories = categories.filter(c => !c.parent_id);

    if (isLoading && categories.length === 0) {
        return (
            <div className="p-4 flex flex-col gap-2 items-center justify-center h-full text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin" />
                {!isCollapsed && <span className="text-xs font-medium">カテゴリ読込中...</span>}
            </div>
        );
    }

    return (
        <div
            className={`flex-1 overflow-auto custom-scrollbar p-2 transition-colors ${isDragOverRoot ? 'bg-slate-100/50' : ''} ${isCollapsed ? 'px-0' : ''}`}
            onDragOver={handleDragOverRoot}
            onDragLeave={() => setIsDragOverRoot(false)}
            onDrop={handleDropOnRoot}
            onContextMenu={handleContextMenu}
        >
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    onAction={handleMenuAction}
                    type="root"
                />
            )}
            {showNewFolderModal && (
                <InputModal
                    title="新規フォルダ作成"
                    description="ルート階層に作成する新しいフォルダの名前を入力してください"
                    onConfirm={handleNewFolderConfirm}
                    onCancel={() => setShowNewFolderModal(false)}
                />
            )}
            {rootCategories.length === 0 && !isLoading && !isCollapsed && (
                <div className="p-8 text-center text-xs text-slate-400 italic border-2 border-dashed border-slate-200 rounded-lg">
                    カテゴリーをここにドラッグして整理
                </div>
            )}
            {rootCategories.map(cat => (
                <TreeItem
                    key={cat.id}
                    category={cat}
                    allCategories={categories}
                    level={0}
                    onManualSelect={onManualSelect}
                    onCategorySelect={onCategorySelect}
                    isCollapsed={isCollapsed}
                />
            ))}
            <div onClick={() => onCategorySelect(null)}>
                <UnassignedManualsItem onManualSelect={onManualSelect} isCollapsed={isCollapsed} />
            </div>
            {isDragOverRoot && !isCollapsed && (
                <div className="p-4 mt-2 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 text-center text-xs text-blue-500 font-bold animate-pulse">
                    ルート階層に移動
                </div>
            )}
        </div>
    );
};
