import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useManualStore } from '../store/useManualStore';
import { useCategoryStore } from '../store/useCategoryStore';

interface BreadcrumbsProps {
    onNavigate: (type: 'home' | 'category', id?: number) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ onNavigate }) => {
    const { currentManual, activeCategoryId } = useManualStore();
    const { categories } = useCategoryStore();

    // Build the path to the active category
    const buildPath = () => {
        if (!activeCategoryId) return [];

        const path: any[] = [];
        let currentId: number | null = activeCategoryId;

        while (currentId) {
            const category = categories.find(c => c.id === currentId);
            if (category) {
                path.unshift(category);
                currentId = category.parent_id;
            } else {
                break;
            }
        }
        return path;
    };

    const path = buildPath();

    return (
        <nav className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-500 overflow-x-auto no-scrollbar whitespace-nowrap">
            <button
                onClick={() => onNavigate('home')}
                className="flex items-center gap-1.5 hover:text-blue-600 transition-colors cursor-pointer p-1 rounded hover:bg-slate-100"
                title="ホームへ戻る"
            >
                <Home className="w-3.5 h-3.5" />
            </button>

            {path.map((item) => (
                <React.Fragment key={item.id}>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    <button
                        onClick={() => onNavigate('category', item.id)}
                        className="hover:text-blue-600 hover:bg-slate-100 p-1 px-1.5 rounded transition-colors cursor-pointer max-w-[120px] truncate"
                        title={`${item.name}へ戻る`}
                    >
                        {item.name}
                    </button>
                </React.Fragment>
            ))}

            {currentManual && (
                <>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    <span className="text-slate-900 font-bold truncate max-w-[200px] bg-slate-100 px-2 py-1 rounded">
                        {currentManual.title}
                    </span>
                </>
            )}
        </nav>
    );
};
