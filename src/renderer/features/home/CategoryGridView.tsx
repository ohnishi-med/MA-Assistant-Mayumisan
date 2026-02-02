import { useState, useEffect, useMemo } from 'react';
import { Folder, ChevronRight, FileText, ArrowLeft, Home, Star } from 'lucide-react';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useManualStore } from '../../store/useManualStore';
import type { Category } from '../../types/category';
import type { Manual } from '../../types/manual';

interface CategoryGridViewProps {
    onManualSelect: (manualId: number, categoryId: number) => void;
    currentId: number | null;
    onIdChange: (id: number | null) => void;
}

const CategoryCard = ({ category, onClick }: { category: Category; onClick: () => void }) => {
    return (
        <button
            onClick={onClick}
            className="group relative bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300 text-left flex flex-col gap-4 overflow-hidden h-full"
        >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full -mr-8 -mt-8 group-hover:bg-blue-100/50 transition-colors duration-300" />

            <div className="relative flex items-start justify-between">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
                    <Folder className="w-6 h-6 text-blue-600" />
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300" />
            </div>

            <div className="relative space-y-1">
                <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-700 transition-colors line-clamp-2">
                    {category.name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                    <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">フォルダ</span>
                    <span>開いて中身を表示</span>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
        </button>
    );
};

const ManualCard = ({ title, isFavorite, onClick, onFavoriteToggle }: {
    title: string;
    isFavorite?: boolean;
    onClick: () => void;
    onFavoriteToggle?: (e: React.MouseEvent) => void;
}) => {
    return (
        <button
            onClick={onClick}
            className="group relative bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-300 text-left flex flex-col gap-4 overflow-hidden h-full"
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
        </button>
    );
};

export const CategoryGridView = ({ onManualSelect, currentId, onIdChange }: CategoryGridViewProps) => {
    const { categories, getManualsByCategory } = useCategoryStore();
    const { manuals: allManuals, fetchManuals, toggleFavorite } = useManualStore();
    const [manuals, setManuals] = useState<Manual[]>([]);
    const [loadingManuals, setLoadingManuals] = useState(false);

    const favoriteManuals = useMemo(() => {
        return allManuals.filter(m => m.is_favorite);
    }, [allManuals]);

    const currentPath = useMemo(() => {
        if (currentId === null) return [];
        const path = [];
        let curr = categories.find(c => c.id === currentId);
        while (curr) {
            path.unshift(curr);
            curr = categories.find(c => c.id === curr?.parent_id);
        }
        return path;
    }, [currentId, categories]);

    const activeCategories = categories.filter(c => c.parent_id === currentId);

    useEffect(() => {
        // Ensure manual store is synced
        fetchManuals();
    }, [fetchManuals]);

    useEffect(() => {
        if (currentId !== null) {
            setLoadingManuals(true);
            getManualsByCategory(currentId)
                .then(setManuals)
                .finally(() => setLoadingManuals(false));
        } else {
            setManuals([]);
        }
    }, [currentId, getManualsByCategory]);

    const handleBack = () => {
        if (currentId === null) return;
        const currentCategory = categories.find(c => c.id === currentId);
        onIdChange(currentCategory?.parent_id ?? null);
    };

    const handleToggleFavorite = async (manualId: number, currentIsFavorite: boolean, e: React.MouseEvent) => {
        e.stopPropagation();
        await toggleFavorite(manualId, !currentIsFavorite);
        // If we are viewing a specific category, we might need to update the local 'manuals' state too
        // although useManualStore update should technically be enough if we derived 'manuals' from it
        if (currentId !== null) {
            setManuals(prev => prev.map(m => m.id === manualId ? { ...m, is_favorite: !currentIsFavorite } : m));
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <div className="mb-10 space-y-4">
                <div className="flex items-center gap-4">
                    {currentId !== null && (
                        <button
                            onClick={handleBack}
                            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-600 group"
                            title="戻る"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                    )}
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        {currentId === null ? (
                            <>
                                <Home className="w-8 h-8 text-blue-600" />
                                <span>ナビゲーション</span>
                            </>
                        ) : (
                            <span>{categories.find(c => c.id === currentId)?.name}</span>
                        )}
                    </h1>
                </div>

                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-sm">
                    <button
                        onClick={() => onIdChange(null)}
                        className={`hover:text-blue-600 transition-colors ${currentId === null ? 'text-blue-600 font-bold' : 'text-slate-400'}`}
                    >
                        ホーム
                    </button>
                    {currentPath.map((cat, idx) => (
                        <div key={cat.id} className="flex items-center gap-2">
                            <ChevronRight className="w-4 h-4 text-slate-300" />
                            <button
                                onClick={() => onIdChange(cat.id)}
                                className={`hover:text-blue-600 transition-colors ${idx === currentPath.length - 1 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}
                            >
                                {cat.name}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="w-20 h-1.5 bg-blue-600 rounded-full" />
            </div>

            {activeCategories.length === 0 && manuals.length === 0 && !loadingManuals && favoriteManuals.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <Folder className="w-16 h-16 text-slate-200 mb-4" />
                    <p className="text-slate-400 font-bold">このカテゴリーは空です</p>
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
                                {favoriteManuals.map(manual => (
                                    <ManualCard
                                        key={`fav-${manual.id}`}
                                        title={manual.title}
                                        isFavorite={true}
                                        onClick={() => onManualSelect(manual.id, -1)}
                                        onFavoriteToggle={(e) => handleToggleFavorite(manual.id, true, e)}
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
    );
};
