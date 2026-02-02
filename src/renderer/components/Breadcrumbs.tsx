import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useManualStore } from '../store/useManualStore';
import { useCategoryStore } from '../store/useCategoryStore';

export const Breadcrumbs: React.FC = () => {
    const { currentManual, activeCategoryId } = useManualStore();
    const { categories } = useCategoryStore();

    if (!currentManual) return null;

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
            <div className="flex items-center gap-1.5 hover:text-blue-600 transition-colors cursor-default">
                <Home className="w-3.5 h-3.5" />
            </div>

            {path.map((item) => (
                <React.Fragment key={item.id}>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    <span className="hover:text-slate-800 transition-colors cursor-default">
                        {item.name}
                    </span>
                </React.Fragment>
            ))}

            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <span className="text-slate-900 font-bold truncate">
                {currentManual.title}
            </span>
        </nav>
    );
};
