import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Folder, FileText, Loader2 } from 'lucide-react';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useManualStore } from '../../store/useManualStore';
import type { Category } from '../../types/category';

interface TreeItemProps {
    category: Category;
    allCategories: Category[];
    level: number;
    onManualSelect: (id: number) => void;
}

const TreeItem: React.FC<TreeItemProps> = ({ category, allCategories, level, onManualSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [manuals, setManuals] = useState<any[]>([]);
    const [loadingManuals, setLoadingManuals] = useState(false);
    const getManualsByCategory = useCategoryStore((state) => state.getManualsByCategory);

    const subCategories = allCategories.filter(c => c.parent_id === category.id);

    useEffect(() => {
        if (isOpen && manuals.length === 0) {
            loadManuals();
        }
    }, [isOpen]);

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

    return (
        <div className="flex flex-col">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 rounded text-sm text-slate-700 w-full text-left"
                style={{ paddingLeft: `${level * 12 + 12}px` }}
            >
                {subCategories.length > 0 || manuals.length > 0 ? (
                    isOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                    <div className="w-3.5 h-3.5" />
                )}
                <Folder className="w-4 h-4 text-blue-500 fill-blue-500/10" />
                <span className="truncate">{category.name}</span>
            </button>

            {isOpen && (
                <div className="flex flex-col">
                    {/* Subcategories */}
                    {subCategories.map(sub => (
                        <TreeItem
                            key={sub.id}
                            category={sub}
                            allCategories={allCategories}
                            level={level + 1}
                            onManualSelect={onManualSelect}
                        />
                    ))}

                    {/* Manuals */}
                    {loadingManuals ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 animate-pulse" style={{ paddingLeft: `${(level + 1) * 12 + 12}px` }}>
                            <Loader2 className="w-3 h-3 animate-spin text-slate-300" />
                            <span className="text-xs text-slate-400 italic">読み込み中...</span>
                        </div>
                    ) : (
                        manuals.map(manual => (
                            <button
                                key={manual.id}
                                onClick={() => onManualSelect(manual.id)}
                                className="flex items-center gap-2 px-3 py-1.5 hover:bg-blue-50 hover:text-blue-600 rounded text-sm text-slate-600 w-full text-left"
                                style={{ paddingLeft: `${(level + 1) * 12 + 12}px` }}
                            >
                                <FileText className="w-3.5 h-3.5 text-slate-400" />
                                <span className="truncate">{manual.title}</span>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export const CategoryTree: React.FC<{ onManualSelect: (id: number) => void }> = ({ onManualSelect }) => {
    const { categories, fetchCategories, isLoading } = useCategoryStore();

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const rootCategories = categories.filter(c => !c.parent_id);

    if (isLoading && categories.length === 0) {
        return (
            <div className="p-4 flex flex-col gap-2 items-center justify-center h-full text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-xs font-medium">カテゴリ読込中...</span>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto custom-scrollbar p-2">
            {rootCategories.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-400 italic">
                    カテゴリがありません
                </div>
            )}
            {rootCategories.map(cat => (
                <TreeItem
                    key={cat.id}
                    category={cat}
                    allCategories={categories}
                    level={0}
                    onManualSelect={onManualSelect}
                />
            ))}
        </div>
    );
};
