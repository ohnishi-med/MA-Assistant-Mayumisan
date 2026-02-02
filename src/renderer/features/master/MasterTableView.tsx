import React, { useState, useEffect } from 'react';
import { useCategoryStore } from '../../store/useCategoryStore';
import type { Category } from '../../types/category';
import { Plus, Edit2, Trash2, Search, FolderTree } from 'lucide-react';

const MasterTableView: React.FC = () => {
    const { categories, fetchCategories, addCategory, updateCategory, deleteCategory, isLoading } = useCategoryStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [editingItem, setEditingItem] = useState<Category | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const filteredCategories = categories.filter(c =>
        c.name.includes(searchTerm)
    );

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const parent_id = formData.get('parent_id') ? Number(formData.get('parent_id')) : null;

        if (editingItem) {
            await updateCategory(editingItem.id, { name, parent_id });
            setEditingItem(null);
        } else {
            await addCategory({
                name,
                parent_id,
                level: parent_id ? (categories.find(c => c.id === parent_id)?.level || 0) + 1 : 1,
                path: '',
                display_order: 0
            });
            setIsAdding(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500">読み込み中...</div>;

    return (
        <div className="flex-1 flex flex-col bg-white rounded-lg border shadow-sm p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <FolderTree className="w-5 h-5 text-blue-600" />
                        カテゴリ管理
                    </h2>
                    <p className="text-sm text-slate-500">マニュアルを分類するカテゴリを管理します</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">新規カテゴリ</span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="カテゴリ名で検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto border rounded-lg">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 sticky top-0">
                        <tr>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b">ID</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b">カテゴリ名</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b">親カテゴリ</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b w-24">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredCategories.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 text-sm font-mono text-slate-600">{item.id}</td>
                                <td className="px-4 py-3 text-sm font-bold text-slate-800">{item.name}</td>
                                <td className="px-4 py-3 text-sm text-slate-500">
                                    {item.parent_id ? (categories.find(c => c.id === item.parent_id)?.name || item.parent_id) : 'なし'}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    <div className="flex gap-2 text-slate-400">
                                        <button onClick={() => setEditingItem(item)} className="hover:text-blue-600">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => deleteCategory(item.id)} className="hover:text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit/Add Modal */}
            {(isAdding || editingItem) && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <form
                        onSubmit={handleSave}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                    >
                        <div className="px-6 py-4 bg-slate-50 border-b flex justify-between items-center">
                            <h3 className="font-bold text-slate-800">
                                {editingItem ? 'カテゴリの編集' : '新規カテゴリの追加'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => { setIsAdding(false); setEditingItem(null); }}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">カテゴリ名</label>
                                <input name="name" defaultValue={editingItem?.name} className="w-full px-3 py-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">親カテゴリ (任意)</label>
                                <select
                                    name="parent_id"
                                    defaultValue={editingItem?.parent_id || ''}
                                    className="w-full px-3 py-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                                >
                                    <option value="">なし (ルート)</option>
                                    {categories
                                        .filter(c => c.id !== editingItem?.id) // Prevent self-parenting
                                        .map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} (ID: {c.id})
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t flex gap-3">
                            <button
                                type="button"
                                onClick={() => { setIsAdding(false); setEditingItem(null); }}
                                className="flex-1 px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
                            >
                                キャンセル
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md"
                            >
                                保存する
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default MasterTableView;

