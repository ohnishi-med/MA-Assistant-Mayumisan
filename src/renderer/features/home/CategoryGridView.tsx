import { useState, useEffect, useMemo, useRef } from 'react';
import {
    ChevronRight, FileText, ArrowLeft, Home, Star, Edit3, FolderPlus, PlusCircle,
    Folder, UserCheck, Calculator, BadgeJapaneseYen, Stethoscope, Microscope, ShoppingCart, Package,
    Car, MoreHorizontal, HeartPulse, Thermometer, Briefcase, Users, Mail, Phone, Bell, Calendar, Info,
    TestTube2, Syringe, Pill, Tablets, Dna, FlaskConical, Activity, Clipboard, History, Search
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
import type { Manual } from '../../types/manual';

interface CategoryGridViewProps {
    onManualSelect: (manualId: number, categoryId: number) => void;
    currentId: number | null;
    onIdChange: (id: number | null) => void;
    searchQuery?: string;
}

const CategoryCard = ({
    category,
    onClick,
    onContextMenu,
    isEditing,
    editingName,
    onEditChange,
    onEditSubmit,
    onEditCancel
}: {
    category: Category;
    onClick: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
    isEditing?: boolean;
    editingName?: string;
    onEditChange?: (val: string) => void;
    onEditSubmit?: () => void;
    onEditCancel?: () => void;
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    return (
        <div
            onClick={!isEditing ? onClick : undefined}
            onContextMenu={onContextMenu}
            className="group relative bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300 text-left flex flex-col gap-4 overflow-hidden h-full cursor-pointer"
        >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full -mr-8 -mt-8 group-hover:bg-blue-100/50 transition-colors duration-300" />

            <div className="relative flex items-start justify-between">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner ${category.parent_id ? 'bg-slate-50 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
                    {(() => {
                        const IconComponent = IconMap[category.icon || 'Folder'] || Folder;
                        return <IconComponent className="w-6 h-6" />;
                    })()}
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300" />
            </div>

            <div className="relative space-y-1">
                {isEditing ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={editingName}
                        onChange={(e) => onEditChange?.(e.target.value)}
                        onBlur={onEditSubmit}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') onEditSubmit?.();
                            if (e.key === 'Escape') onEditCancel?.();
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full text-lg font-bold text-slate-800 bg-white border-b-2 border-blue-500 focus:outline-none"
                    />
                ) : (
                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-700 transition-colors line-clamp-2">
                        {category.name}
                    </h3>
                )}
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                    <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">フォルダ</span>
                    <span>{isEditing ? 'Enterで保存' : '開いて中身を表示'}</span>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
        </div>
    );
};

const ManualCard = ({ title, isFavorite, onClick, onFavoriteToggle }: {
    title: string;
    isFavorite?: boolean;
    onClick: () => void;
    onFavoriteToggle?: (e: React.MouseEvent) => void;
}) => {
    return (
        <div
            onClick={onClick}
            className="group relative bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-300 text-left flex flex-col gap-4 overflow-hidden h-full cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                }
            }}
        >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-full -mr-8 -mt-8 group-hover:bg-emerald-100/50 transition-colors duration-300" />

            <div className="relative flex items-start justify-between">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
                    <FileText className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex items-center gap-2">
                    {onFavoriteToggle && (
                        <button
                            onClick={onFavoriteToggle}
                            className={`p-2 rounded-lg transition-colors ${isFavorite
                                ? 'bg-yellow-50 text-yellow-500 hover:bg-yellow-100'
                                : 'text-slate-300 hover:bg-slate-100'
                                }`}
                            title={isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}
                        >
                            <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                        </button>
                    )}
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all duration-300" />
                </div>
            </div>

            <div className="relative space-y-1">
                <h3 className="text-lg font-bold text-slate-800 group-hover:text-emerald-700 transition-colors line-clamp-2">
                    {title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                    <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded">マニュアル</span>
                    <span>ガイドを開始する</span>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
        </div>
    );
};

export const CategoryGridView = ({ onManualSelect, currentId, onIdChange, searchQuery }: CategoryGridViewProps) => {
    const { categories, getManualsByCategory, updateCategory, addCategory } = useCategoryStore();
    const { manuals: allManuals, fetchManuals, toggleFavorite, searchResults, clearSearch, manualRefreshCounter } = useManualStore();
    const [manuals, setManuals] = useState<Manual[]>([]);
    const [loadingManuals, setLoadingManuals] = useState(false);

    // Context Menu & Editing State
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; categoryId: number | null } | null>(null);
    const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
    const [editingName, setEditingName] = useState('');

    useEffect(() => {
        const loadManuals = async () => {
            if (currentId !== null) {
                setLoadingManuals(true);
                try {
                    const result = await getManualsByCategory(currentId);
                    setManuals(result);
                } catch (e) {
                    console.error(e);
                } finally {
                    setLoadingManuals(false);
                }
            } else {
                setManuals([]);
            }
        };
        loadManuals();
    }, [currentId, getManualsByCategory, manualRefreshCounter]);

    const activeCategories = useMemo(() => {
        return categories
            .filter(c => {
                const matchesParent = c.parent_id === (currentId === null ? undefined : currentId) || (currentId === null && !c.parent_id);
                if (!matchesParent) return false;

                // Hide system folders from main view at root level
                if (currentId === null) {
                    return c.name !== '未分類' && c.name !== '取込';
                }
                return true;
            })
            .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    }, [categories, currentId]);

    const favoriteManuals = useMemo(() => {
        return allManuals.filter(m => m.is_favorite);
    }, [allManuals]);

    const handleToggleFavorite = async (manualId: number, currentStatus: boolean, e: React.MouseEvent) => {
        e.stopPropagation();
        const nextStatus = !currentStatus;
        await toggleFavorite(manualId, nextStatus);
        // Also update local state to reflect change immediately in category view
        setManuals(prev => prev.map(m => m.id === manualId ? { ...m, is_favorite: nextStatus } : m));
    };

    const handleBack = () => {
        if (searchQuery) {
            clearSearch();
            // We should also ideally clear the input in App, but that's handled by clearSearch in state if shared
            // For now, let's assume the user wants to go back to category view
            return;
        }
        if (currentId !== null) {
            const current = categories.find(c => c.id === currentId);
            onIdChange(current?.parent_id || null);
        }
    };

    const handleContextMenu = (e: React.MouseEvent, categoryId: number | null) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, categoryId });
    };

    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const startEditing = (categoryId: number, currentName: string) => {
        setEditingCategoryId(categoryId);
        setEditingName(currentName);
        if (contextMenu) setContextMenu(null);
    };

    const submitEdit = async () => {
        if (editingCategoryId !== null && editingName.trim()) {
            await updateCategory(editingCategoryId, { name: editingName.trim() });
            setEditingCategoryId(null);
            setEditingName('');
        } else {
            setEditingCategoryId(null);
        }
    };

    const createNewFolder = async () => {
        if (contextMenu) setContextMenu(null);

        const parentCategory = currentId ? categories.find(c => c.id === currentId) : null;
        const newLevel = (parentCategory?.level ?? 0) + 1;
        const currentItems = categories.filter(c => c.parent_id === currentId);
        const maxOrder = Math.max(0, ...currentItems.map(c => c.display_order || 0));

        await addCategory({
            name: '新しいフォルダ',
            parent_id: currentId ?? null,
            level: newLevel,
            display_order: maxOrder + 1,
            path: ''
        });
    };

    const handleCreateManual = async () => {
        if (contextMenu) setContextMenu(null);

        try {
            await window.electron.ipcRenderer.invoke('manuals:create', {
                title: '新しいマニュアル',
                flowchart_data: { nodes: [], edges: [] },
                is_favorite: false,
                category_id: currentId
            });

            // Link logic is now handled in manuals:create if category_id is provided
            // Re-fetch to update UI
            await fetchManuals();
            if (currentId) {
                const updatedManuals = await getManualsByCategory(currentId);
                setManuals(updatedManuals);
            }
        } catch (e: any) {
            console.error('Failed to create manual:', e);
            alert('マニュアル作成に失敗しました: ' + (e.message || e));
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 relative">
            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="fixed bg-white rounded-lg shadow-xl border border-slate-100 py-1 z-50 min-w-[160px] animate-in fade-in zoom-in-95 duration-100"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {contextMenu.categoryId !== null ? (
                        <button
                            onClick={() => {
                                const cat = categories.find(c => c.id === contextMenu.categoryId);
                                if (cat) startEditing(cat.id, cat.name);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2"
                        >
                            <Edit3 className="w-4 h-4" />
                            名前を変更
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={createNewFolder}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2"
                            >
                                <FolderPlus className="w-4 h-4" />
                                新規フォルダ作成
                            </button>
                            <button
                                onClick={handleCreateManual}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2"
                            >
                                <PlusCircle className="w-4 h-4" />
                                新規マニュアル作成
                            </button>
                        </>
                    )}
                </div>
            )}

            <div className="mb-10 space-y-4">
                <div className="flex items-center gap-4">
                    {(currentId !== null || (searchQuery && searchQuery.trim() !== '')) && (
                        <button
                            onClick={handleBack}
                            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-600 group"
                            title="戻る"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                    )}
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        {searchQuery && searchQuery.trim() !== '' ? (
                            <>
                                <Search className="w-8 h-8 text-blue-600" />
                                <span>「{searchQuery}」の検索結果</span>
                                <span className="text-sm font-medium text-slate-400 ml-2">{searchResults.length} 件見つかりました</span>
                            </>
                        ) : currentId === null ? (
                            <>
                                <Home className="w-8 h-8 text-blue-600" />
                                <span>ナビゲーション</span>
                            </>
                        ) : (
                            <span>{categories.find(c => c.id === currentId)?.name}</span>
                        )}
                    </h1>
                </div>
                <div className="w-20 h-1.5 bg-blue-600 rounded-full" />
            </div>

            <div
                className="flex-1 min-h-[500px]" // Ensure minimum height to make background clickable
                onContextMenu={(e) => handleContextMenu(e, null)}
            >
                {searchQuery && searchQuery.trim() !== '' ? (
                    searchResults.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                            <Search className="w-16 h-16 text-slate-200 mb-4" />
                            <p className="text-slate-400 font-bold">一致するマニュアルが見つかりませんでした</p>
                            <p className="text-slate-300 text-sm mt-2">キーワードを変えて再度お試しください</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {(searchResults as Manual[]).map(manual => (
                                <ManualCard
                                    key={`search-${manual.id}`}
                                    title={manual.title}
                                    isFavorite={manual.is_favorite}
                                    onClick={() => onManualSelect(manual.id, -1)}
                                    onFavoriteToggle={(e) => handleToggleFavorite(manual.id, !!manual.is_favorite, e)}
                                />
                            ))}
                        </div>
                    )
                ) : activeCategories.length === 0 && manuals.length === 0 && !loadingManuals && (currentId !== null || favoriteManuals.length === 0) ? (
                    <div className="flex flex-col items-center justify-center p-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        <Folder className="w-16 h-16 text-slate-200 mb-4" />
                        <p className="text-slate-400 font-bold">このカテゴリーは空です</p>
                        <p className="text-slate-300 text-sm mt-2">右クリックしてフォルダを作成できます</p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* Favorites Section - Only on Home */}
                        {currentId === null && favoriteManuals.length > 0 && (
                            <section className="space-y-6">
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <Star className="w-6 h-6 text-yellow-500 fill-current" />
                                    <span>よく使うマニュアル (ピン留め)</span>
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {favoriteManuals.map((manual: any) => (
                                        <ManualCard
                                            key={`fav-${manual.id}`}
                                            title={manual.title || '無題'}
                                            isFavorite={true}
                                            onClick={() => onManualSelect(manual.id!, -1)}
                                            onFavoriteToggle={(e) => handleToggleFavorite(manual.id!, true, e)}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Navigation Grid */}
                        <section className="space-y-6">
                            {currentId === null && (
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <Folder className="w-6 h-6 text-blue-500" />
                                    <span>カテゴリー一覧</span>
                                </h2>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {activeCategories.map(category => (
                                    <CategoryCard
                                        key={category.id}
                                        category={category}
                                        onClick={() => onIdChange(category.id)}
                                        onContextMenu={(e) => handleContextMenu(e, category.id)}
                                        isEditing={editingCategoryId === category.id}
                                        editingName={editingName}
                                        onEditChange={setEditingName}
                                        onEditSubmit={submitEdit}
                                        onEditCancel={() => setEditingCategoryId(null)}
                                    />
                                ))}
                                {manuals.map(manual => (
                                    <ManualCard
                                        key={manual.id}
                                        title={manual.title}
                                        isFavorite={manual.is_favorite}
                                        onClick={() => onManualSelect(manual.id, currentId || -1)}
                                        onFavoriteToggle={(e) => handleToggleFavorite(manual.id, !!manual.is_favorite, e)}
                                    />
                                ))}
                                {loadingManuals && Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="bg-slate-100 animate-pulse rounded-2xl h-40" />
                                ))}
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
};
