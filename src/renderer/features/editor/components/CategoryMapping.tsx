import React, { useState } from 'react';
import { useCategoryStore } from '../../../store/useCategoryStore';
import { useManualStore } from '../../../store/useManualStore';
import { Plus, X, Tag, Folder } from 'lucide-react';

export const CategoryMapping: React.FC = () => {
    const { categories } = useCategoryStore();
    const { currentManual, linkedCategories, linkCategory, unlinkCategory } = useManualStore();
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('');

    if (!currentManual) return null;

    const handleLink = async () => {
        if (selectedCategoryId !== '') {
            await linkCategory(currentManual.id, Number(selectedCategoryId));
            setSelectedCategoryId('');
        }
    };

    // Filter out already linked categories
    const availableCategories = categories.filter(
        cat => !linkedCategories.some(linked => linked.id === cat.id)
    );

    return (
        <div className="flex flex-col gap-4 p-4 bg-white border rounded-xl shadow-sm">
            <div className="flex items-center gap-2 border-b pb-2">
                <Tag className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-700 text-sm">カテゴリ紐付け</h3>
            </div>

            {/* Current Links */}
            <div className="flex flex-wrap gap-2">
                {linkedCategories.length === 0 && (
                    <span className="text-xs text-slate-400 italic">カテゴリ未選択</span>
                )}
                {linkedCategories.map(cat => (
                    <div
                        key={cat.id}
                        className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-xs font-medium group"
                    >
                        <Folder className="w-3 h-3" />
                        <span>{cat.name}</span>
                        <button
                            onClick={() => unlinkCategory(currentManual.id, cat.id)}
                            className="hover:text-red-500 ml-1 transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Add Link */}
            <div className="flex gap-2 items-center mt-2 pt-4 border-t border-dashed">
                <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : '')}
                    className="flex-1 text-xs border rounded px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">カテゴリを選択...</option>
                    {availableCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
                <button
                    onClick={handleLink}
                    disabled={selectedCategoryId === ''}
                    className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
