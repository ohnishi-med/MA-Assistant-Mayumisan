import { create } from 'zustand';
import type { Manual } from '../types/manual';
import {
    applyNodeChanges,
    applyEdgeChanges,
    addEdge,
    type Node,
    type Edge,
    type OnNodesChange,
    type OnEdgesChange,
    type OnConnect,
} from '@xyflow/react';

interface ManualState {
    manuals: Partial<Manual>[]; // List for navigation
    currentManual: Manual | null;
    linkedCategories: any[]; // Categories linked to the current manual
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchManuals: () => Promise<void>;
    loadManual: (id: number) => Promise<void>;
    saveManual: (manual: Partial<Manual>) => Promise<void>;
    deleteManual: (id: number) => Promise<void>;
    linkCategory: (manualId: number, categoryId: number, entryPoint?: string) => Promise<void>;
    unlinkCategory: (manualId: number, categoryId: number) => Promise<void>;

    // Flowchart Actions (for the active manual)
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    setNodes: (nodes: Node[]) => void;
    setEdges: (edges: Edge[]) => void;
}

export const useManualStore = create<ManualState>((set, get) => ({
    manuals: [],
    currentManual: null,
    linkedCategories: [],
    isLoading: false,
    error: null,

    fetchManuals: async () => {
        set({ isLoading: true });
        try {
            const rows = await window.electron.ipcRenderer.invoke('manuals:getAll');
            set({ manuals: rows, isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },

    loadManual: async (id) => {
        set({ isLoading: true });
        try {
            const manual = await window.electron.ipcRenderer.invoke('manuals:getById', id);
            if (manual.flowchart_data) {
                manual.flowchart_data = JSON.parse(manual.flowchart_data);
            } else {
                manual.flowchart_data = { nodes: [], edges: [] };
            }

            // Fetch linked categories
            const categories = await window.electron.ipcRenderer.invoke('manuals:getCategories', id);

            set({ currentManual: manual, linkedCategories: categories, isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },

    saveManual: async (manualData) => {
        try {
            if (manualData.id) {
                await window.electron.ipcRenderer.invoke('manuals:update', manualData.id, manualData);
            } else {
                const newId = await window.electron.ipcRenderer.invoke('manuals:create', manualData);
                // If it's a new manual, load it
                await get().loadManual(newId);
            }
            await get().fetchManuals();
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    deleteManual: async (id) => {
        try {
            await window.electron.ipcRenderer.invoke('manuals:delete', id);
            await get().fetchManuals();
            if (get().currentManual?.id === id) {
                set({ currentManual: null, linkedCategories: [] });
            }
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    linkCategory: async (manualId, categoryId, entryPoint) => {
        try {
            await window.electron.ipcRenderer.invoke('manuals:linkCategory', manualId, categoryId, entryPoint);
            // Refresh linked categories
            const categories = await window.electron.ipcRenderer.invoke('manuals:getCategories', manualId);
            set({ linkedCategories: categories });
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    unlinkCategory: async (manualId, categoryId) => {
        try {
            await window.electron.ipcRenderer.invoke('manuals:unlinkCategory', manualId, categoryId);
            // Refresh linked categories
            const categories = await window.electron.ipcRenderer.invoke('manuals:getCategories', manualId);
            set({ linkedCategories: categories });
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    // Flowchart Integration
    onNodesChange: (changes) => {
        const { currentManual } = get();
        if (!currentManual) return;
        set({
            currentManual: {
                ...currentManual,
                flowchart_data: {
                    ...currentManual.flowchart_data,
                    nodes: applyNodeChanges(changes, currentManual.flowchart_data.nodes),
                }
            }
        });
    },

    onEdgesChange: (changes) => {
        const { currentManual } = get();
        if (!currentManual) return;
        set({
            currentManual: {
                ...currentManual,
                flowchart_data: {
                    ...currentManual.flowchart_data,
                    edges: applyEdgeChanges(changes, currentManual.flowchart_data.edges),
                }
            }
        });
    },

    onConnect: (connection) => {
        const { currentManual } = get();
        if (!currentManual) return;
        set({
            currentManual: {
                ...currentManual,
                flowchart_data: {
                    ...currentManual.flowchart_data,
                    edges: addEdge(connection, currentManual.flowchart_data.edges),
                }
            }
        });
    },

    setNodes: (nodes) => {
        const { currentManual } = get();
        if (!currentManual) return;
        set({
            currentManual: {
                ...currentManual,
                flowchart_data: { ...currentManual.flowchart_data, nodes }
            }
        });
    },

    setEdges: (edges) => {
        const { currentManual } = get();
        if (!currentManual) return;
        set({
            currentManual: {
                ...currentManual,
                flowchart_data: { ...currentManual.flowchart_data, edges }
            }
        });
    },
}));
