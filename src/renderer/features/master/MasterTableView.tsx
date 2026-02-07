import React, { useState, useEffect } from 'react';
import { useCategoryStore } from '../../store/useCategoryStore';
import type { Category } from '../../types/category';
import {
    Plus, Edit2, Trash2, Search, FolderTree, Folder,
    UserCheck, Calculator, BadgeJapaneseYen, Stethoscope,
    FileText, Microscope, ShoppingCart, Package, Car,
    MoreHorizontal, HeartPulse, Thermometer, Briefcase,
    Users, Mail, Phone, Bell, Calendar, Info,
    TestTube2, Syringe, Pill, Tablets, Dna, FlaskConical, Activity, Clipboard, History,
    Inbox, Download, Heart, Star, Flag, Tag, CreditCard, Printer, Settings, MessageCircle, Image, Video, Music
} from 'lucide-react';

const ICON_LIST = [
    { name: 'Folder', Icon: Folder },
    { name: 'Inbox', Icon: Inbox },
    { name: 'Download', Icon: Download },
    { name: 'UserCheck', Icon: UserCheck },
    { name: 'Calculator', Icon: Calculator },
    { name: 'BadgeJapaneseYen', Icon: BadgeJapaneseYen },
    { name: 'Stethoscope', Icon: Stethoscope },
    { name: 'FileText', Icon: FileText },
    { name: 'Microscope', Icon: Microscope },
    { name: 'ShoppingCart', Icon: ShoppingCart },
    { name: 'Package', Icon: Package },
    { name: 'Car', Icon: Car },
    { name: 'MoreHorizontal', Icon: MoreHorizontal },
    { name: 'HeartPulse', Icon: HeartPulse },
    { name: 'Thermometer', Icon: Thermometer },
    { name: 'Briefcase', Icon: Briefcase },
    { name: 'Users', Icon: Users },
    { name: 'Mail', Icon: Mail },
    { name: 'Phone', Icon: Phone },
    { name: 'Bell', Icon: Bell },
    { name: 'Calendar', Icon: Calendar },
    { name: 'Info', Icon: Info },
    { name: 'TestTube2', Icon: TestTube2 },
    { name: 'Syringe', Icon: Syringe },
    { name: 'Pill', Icon: Pill },
    { name: 'Tablets', Icon: Tablets },
    { name: 'Dna', Icon: Dna },
    { name: 'FlaskConical', Icon: FlaskConical },
    { name: 'Activity', Icon: Activity },
    { name: 'Clipboard', Icon: Clipboard },
    { name: 'History', Icon: History },
    { name: 'Heart', Icon: Heart },
    { name: 'Star', Icon: Star },
    { name: 'Flag', Icon: Flag },
    { name: 'Tag', Icon: Tag },
    { name: 'CreditCard', Icon: CreditCard },
    { name: 'Printer', Icon: Printer },
    { name: 'Settings', Icon: Settings },
    { name: 'MessageCircle', Icon: MessageCircle },
    { name: 'Image', Icon: Image },
    { name: 'Video', Icon: Video },
    { name: 'Music', Icon: Music },
];

const MasterTableView: React.FC = () => {
    const { categories, fetchCategories, addCategory, updateCategory, deleteCategory, isLoading } = useCategoryStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [editingItem, setEditingItem] = useState<Category | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [selectedIcon, setSelectedIcon] = useState<string>('Folder');
    const [draggedItem, setDraggedItem] = useState<Category | null>(null);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        if (editingItem) {
            setSelectedIcon(editingItem.icon || 'Folder');
        } else {
            setSelectedIcon('Folder');
        }
    }, [editingItem, isAdding]);

    // Helper function to recursively get categories in hierarchical order
    const getHierarchicalCategories = (parentId: number | null = null, depth: number = 0): Category[] => {
        const children = categories
            .filter(c => c.parent_id === parentId && c.name.includes(searchTerm))
            .sort((a, b) => a.display_order - b.display_order);

        const result: Category[] = [];
        for (const child of children) {
            result.push(child);
            result.push(...getHierarchicalCategories(child.id, depth + 1));
        }
        return result;
    };

    const filteredCategories = getHierarchicalCategories();

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const parent_id = formData.get('parent_id') ? Number(formData.get('parent_id')) : null;
        const icon = selectedIcon;

        if (editingItem) {
            await updateCategory(editingItem.id, { name, parent_id, icon });
            setEditingItem(null);
        } else {
            await addCategory({
                name,
                parent_id,
                icon,
                level: parent_id ? (categories.find(c => c.id === parent_id)?.level || 0) + 1 : 1,
                path: '',
                display_order: 0
            });
            setIsAdding(false);
        }
    };

    const getIconComponent = (iconName: string | undefined) => {
        const item = ICON_LIST.find(i => i.name === iconName);
        const IconComponent = item ? item.Icon : Folder;
        return <IconComponent className="w-4 h-4" />;
    };

    const handleDragStart = (e: React.DragEvent, category: Category) => {
        setDraggedItem(category);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, targetCategory: Category) => {
        e.preventDefault();
        if (!draggedItem || draggedItem.id === targetCategory.id) {
            setDraggedItem(null);
            return;
        }

        // Get all categories at the same level (same parent_id)
        const sameLevelCategories = filteredCategories
            .filter(c => c.parent_id === targetCategory.parent_id)
            .sort((a, b) => a.display_order - b.display_order);

        // Find indices
        const draggedIndex = sameLevelCategories.findIndex(c => c.id === draggedItem.id);
        const targetIndex = sameLevelCategories.findIndex(c => c.id === targetCategory.id);

        if (draggedIndex === -1 || targetIndex === -1) {
            setDraggedItem(null);
            return;
        }

        // Reorder the array
        const reordered = [...sameLevelCategories];
        const [removed] = reordered.splice(draggedIndex, 1);
        reordered.splice(targetIndex, 0, removed);

        // Update display_order for all affected categories
        for (let i = 0; i < reordered.length; i++) {
            await updateCategory(reordered[i].id, { display_order: i });
        }

        setDraggedItem(null);
        await fetchCategories();
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500">読み込み中...</div>;

    return (
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <FolderTree className="w-5 h-5 text-blue-600" />
                        カテゴリー管理
                    </h2>
                    <p className="text-sm text-slate-500">マニュアルを分類するカテゴリーを管理します</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-md shadow-blue-100"
                >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">新規カテゴリー</span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="カテゴリー名で検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                />
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto border rounded-xl shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">アイコン</th>
                            <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">カテゴリー名</th>
                            <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">親カテゴリー</th>
                            <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b w-24 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 italic-last-row">
                        {filteredCategories.map((item) => (
                            <tr
                                key={item.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, item)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, item)}
                                className={`hover:bg-slate-50/80 transition-colors group cursor-move ${draggedItem?.id === item.id ? 'opacity-50' : ''}`}
                            >
                                <td className="px-4 py-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.parent_id ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-600'}`}>
                                        {getIconComponent(item.icon)}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-sm font-bold text-slate-800">
                                    <div style={{ paddingLeft: `${(item.level - 1) * 24}px` }} className="flex items-center gap-2">
                                        {item.parent_id && <span className="text-slate-300">└</span>}
                                        <span>{item.name}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-400 font-medium">
                                    {item.parent_id ? (categories.find(c => c.id === item.parent_id)?.name || item.parent_id) : '-'}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setEditingItem(item)}
                                            className="p-1.5 hover:bg-white hover:text-blue-600 rounded-lg text-slate-400 transition-all hover:shadow-sm"
                                            title="編集"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm(`カテゴリー「${item.name}」を削除しますか？\n中のマニュアルは未分類に移動します。`)) {
                                                    deleteCategory(item.id);
                                                }
                                            }}
                                            className="p-1.5 hover:bg-white hover:text-red-500 rounded-lg text-slate-400 transition-all hover:shadow-sm"
                                            title="削除"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredCategories.length === 0 && (
                    <div className="p-12 text-center text-slate-400 italic text-sm">
                        カテゴリーが見つかりませんでした。
                    </div>
                )}
            </div>

            {/* Edit/Add Modal */}
            {(isAdding || editingItem) && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <form
                        onSubmit={handleSave}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
                    >
                        <div className="px-6 py-4 bg-slate-50/50 border-b flex justify-between items-center">
                            <h3 className="font-bold text-slate-800">
                                {editingItem ? 'カテゴリーの編集' : '新規カテゴリーの追加'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => { setIsAdding(false); setEditingItem(null); }}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors text-slate-400"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">アイコンを選択</label>
                                <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                                    {ICON_LIST.map(({ name, Icon }) => (
                                        <button
                                            key={name}
                                            type="button"
                                            onClick={() => setSelectedIcon(name)}
                                            className={`p-3 rounded-xl flex items-center justify-center transition-all ${selectedIcon === name
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110 z-10'
                                                : 'bg-white border border-slate-100 text-slate-400 hover:border-blue-200 hover:text-blue-500 hover:bg-blue-50/30'
                                                }`}
                                            title={name}
                                        >
                                            <Icon className="w-5 h-5" />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">カテゴリー名</label>
                                    <input
                                        name="name"
                                        defaultValue={editingItem?.name}
                                        placeholder="カテゴリーの名前を入力..."
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 transition-all focus:bg-white"
                                        required
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">親カテゴリー (任意)</label>
                                    <select
                                        name="parent_id"
                                        defaultValue={editingItem?.parent_id || ''}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-slate-600 appearance-none transition-all focus:bg-white"
                                    >
                                        <option value="">なし (ルート階層)</option>
                                        {categories
                                            .filter(c => c.id !== editingItem?.id) // Prevent self-parenting
                                            .map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name}
                                                </option>
                                            ))
                                        }
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t flex gap-3">
                            <button
                                type="button"
                                onClick={() => { setIsAdding(false); setEditingItem(null); }}
                                className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors"
                            >
                                キャンセル
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
                            >
                                {editingItem ? '更新する' : '保存する'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default MasterTableView;
