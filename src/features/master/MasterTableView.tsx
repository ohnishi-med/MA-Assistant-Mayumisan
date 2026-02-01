import React, { useState } from 'react';
import { useMasterStore } from '../../store/useMasterStore';
import type { MasterItem } from '../../types/master';
import { Plus, Edit2, Trash2, Search, Table as TableIcon } from 'lucide-react';

const MasterTableView: React.FC = () => {
    const { items, addItem, updateItem, deleteItem } = useMasterStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [editingItem, setEditingItem] = useState<MasterItem | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    const filteredItems = items.filter(item =>
        item.name.includes(searchTerm) ||
        item.code.includes(searchTerm) ||
        item.description.includes(searchTerm)
    );

    const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            code: formData.get('code') as string,
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            category: formData.get('category') as string,
        };

        if (editingItem) {
            updateItem(editingItem.id, data);
            setEditingItem(null);
        } else {
            addItem(data);
            setIsAdding(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-white rounded-lg border shadow-sm p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <TableIcon className="w-5 h-5 text-blue-600" />
                        マスターデータ管理
                    </h2>
                    <p className="text-sm text-slate-500">算定項目や書類の解説一覧を管理します</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">新規追加</span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="名前、番号、解説で検索..."
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
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b">番号</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b">項目名</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b">カテゴリ</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b">解説</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b w-24">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredItems.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 text-sm font-mono text-slate-600">{item.code}</td>
                                <td className="px-4 py-3 text-sm font-bold text-slate-800">{item.name}</td>
                                <td className="px-4 py-3">
                                    <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700">
                                        {item.category}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-500 max-w-md truncate">{item.description}</td>
                                <td className="px-4 py-3 text-sm">
                                    <div className="flex gap-2 text-slate-400">
                                        <button onClick={() => setEditingItem(item)} className="hover:text-blue-600">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => deleteItem(item.id)} className="hover:text-red-500">
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
                                {editingItem ? '項目の編集' : '新規項目の追加'}
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
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">算定番号</label>
                                    <input name="code" defaultValue={editingItem?.code} className="w-full px-3 py-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">カテゴリ</label>
                                    <select name="category" defaultValue={editingItem?.category || '算定'} className="w-full px-3 py-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-500 outline-none">
                                        <option>算定</option>
                                        <option>書類</option>
                                        <option>会計</option>
                                        <option>その他</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">項目名</label>
                                <input name="name" defaultValue={editingItem?.name} className="w-full px-3 py-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">解説</label>
                                <textarea name="description" defaultValue={editingItem?.description} rows={4} className="w-full px-3 py-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-500 outline-none" />
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
