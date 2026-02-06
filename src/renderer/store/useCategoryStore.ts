import { create } from 'zustand';
import type { Category } from '../types/category';

interface CategoryState {
    categories: Category[];
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchCategories: () => Promise<void>;
    addCategory: (category: Omit<Category, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
    updateCategory: (id: number, updates: Partial<Category>) => Promise<void>;
    deleteCategory: (id: number) => Promise<void>;
    getManualsByCategory: (categoryId: number) => Promise<any[]>;
    acquireGlobalLock: () => Promise<{ success: boolean; lockedBy?: string }>;
    releaseGlobalLock: () => Promise<void>;
    forceReleaseGlobalLock: () => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
    // ... existing state ...
    categories: [],
    isLoading: false,
    error: null,

    fetchCategories: async () => {
        set({ isLoading: true });
        try {
            const rows = await window.electron.ipcRenderer.invoke('categories:getAll');
            set({ categories: rows, isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },

    addCategory: async (category) => {
        try {
            await window.electron.ipcRenderer.invoke('categories:create', category);
            await get().fetchCategories();
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    updateCategory: async (id, updates) => {
        try {
            await window.electron.ipcRenderer.invoke('categories:update', id, updates);
            await get().fetchCategories();
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    deleteCategory: async (id) => {
        try {
            await window.electron.ipcRenderer.invoke('categories:delete', id);
            await get().fetchCategories();
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    getManualsByCategory: async (categoryId) => {
        return window.electron.ipcRenderer.invoke('categories:getManuals', categoryId);
    },

    acquireGlobalLock: async () => {
        return await window.electron.ipcRenderer.invoke('categories:acquireGlobalLock');
    },

    releaseGlobalLock: async () => {
        await window.electron.ipcRenderer.invoke('categories:releaseGlobalLock');
    },

    forceReleaseGlobalLock: async () => {
        await window.electron.ipcRenderer.invoke('categories:forceReleaseGlobalLock');
    }
}));
