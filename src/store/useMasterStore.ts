import { create } from 'zustand';
import type { MasterItem } from '../types/master';

interface MasterState {
    items: MasterItem[];
    addItem: (item: Omit<MasterItem, 'id'>) => void;
    updateItem: (id: string, item: Partial<MasterItem>) => void;
    deleteItem: (id: string) => void;
    setItems: (items: MasterItem[]) => void;
}

const initialItems: MasterItem[] = [
    {
        id: 'm1',
        code: 'B001',
        name: '特定疾患管理料',
        description: '厚生労働大臣が定める特定疾患を主病とする患者に対して...',
        category: '算定',
    },
    {
        id: 'm2',
        code: 'D001',
        name: '診断書作成',
        description: '患者の依頼に基づき発行する診断書。原則実費。',
        category: '書類',
    },
];

export const useMasterStore = create<MasterState>((set) => ({
    items: initialItems,
    addItem: (item) => set((state) => ({
        items: [...state.items, { ...item, id: `m-${Date.now()}` }]
    })),
    updateItem: (id, updatedFields) => set((state) => ({
        items: state.items.map((item) => (item.id === id ? { ...item, ...updatedFields } : item))
    })),
    deleteItem: (id) => set((state) => ({
        items: state.items.filter((item) => item.id !== id)
    })),
    setItems: (items) => set({ items }),
}));
