import { create } from 'zustand';
import type { Manual, ManualImage } from '../types/manual';
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
    activeCategoryId: number | null;
    activeEntryPoint: string | null;
    linkedCategories: any[]; // Categories linked to the current manual
    manualImages: ManualImage[]; // Images associated with the current manual
    versions: Manual[]; // Version history for the current manual
    isLoading: boolean;
    error: string | null;
    manualRefreshCounter: number;

    // Actions
    fetchManuals: () => Promise<void>;
    getUnassignedManuals: () => Promise<Partial<Manual>[]>;
    loadManual: (id: number, categoryId?: number) => Promise<void>;
    saveManual: (manual: Partial<Manual>) => Promise<void>;
    deleteManual: (id: number) => Promise<void>;
    saveNewVersion: () => Promise<void>;
    toggleFavorite: (id: number, isFavorite: boolean) => Promise<void>;
    linkCategory: (manualId: number, categoryId: number, entryPoint?: string) => Promise<void>;
    unlinkCategory: (manualId: number, categoryId: number) => Promise<void>;
    moveManualToCategory: (manualId: number, oldCategoryId: number, newCategoryId: number) => Promise<void>;

    // Media Actions
    fetchImages: (manualId: number) => Promise<void>;
    uploadImage: (manualId: number, fileName: string, buffer: ArrayBuffer) => Promise<any>;
    deleteImage: (imageId: number) => Promise<void>;

    updateNodeData: (nodeId: string, data: any) => void;

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
    activeCategoryId: null,
    activeEntryPoint: null,
    linkedCategories: [],
    manualImages: [],
    versions: [],
    isLoading: false,
    error: null,
    manualRefreshCounter: 0,

    fetchManuals: async () => {
        console.log('[ManualStore] Fetching all manuals...');
        set({ isLoading: true });
        try {
            const rows = await window.electron.ipcRenderer.invoke('manuals:getAll');
            console.log('[ManualStore] Fetched manuals:', rows);
            set({ manuals: rows, isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },

    getUnassignedManuals: async () => {
        try {
            return await window.electron.ipcRenderer.invoke('manuals:getUnassigned');
        } catch (err: any) {
            set({ error: err.message });
            return [];
        }
    },

    loadManual: async (id, categoryId) => {
        console.log('[ManualStore] Loading manual:', id, 'categoryId:', categoryId);
        set({ isLoading: true, activeCategoryId: categoryId || null, activeEntryPoint: null });
        try {
            const manual = await window.electron.ipcRenderer.invoke('manuals:getById', id);
            console.log('[ManualStore] IPC manuals:getById result:', manual);
            if (manual && manual.flowchart_data) {
                try {
                    if (typeof manual.flowchart_data === 'string') {
                        manual.flowchart_data = JSON.parse(manual.flowchart_data);
                    }
                    console.log('[ManualStore] Parsed flowchart_data:', manual.flowchart_data);
                } catch (pe) {
                    console.error('[ManualStore] Failed to parse flowchart_data:', pe);
                    manual.flowchart_data = { nodes: [], edges: [] };
                }
            } else if (manual) {
                manual.flowchart_data = { nodes: [], edges: [] };
            }

            // Fetch linked categories
            console.log('[ManualStore] Fetching linked categories for manual:', id);
            const categories = await window.electron.ipcRenderer.invoke('manuals:getCategories', id).catch(e => {
                console.error('[ManualStore] Failed to fetch categories:', e);
                return [];
            });

            // If categoryId is provided, find the entry point
            let entryPoint = null;
            if (categoryId && categories.length > 0) {
                const link = categories.find((c: any) => c.id === categoryId);
                if (link) {
                    entryPoint = link.entry_point || null;
                }
            }

            // Fetch images
            console.log('[ManualStore] Fetching images for manual:', id);
            const images = await window.electron.ipcRenderer.invoke('media:list', id).catch(e => {
                console.error('[ManualStore] Failed to fetch images:', e);
                return [];
            });

            // Fetch versions
            console.log('[ManualStore] Fetching versions for manual:', id);
            const parentId = manual.parent_id || manual.id;
            const versions = await window.electron.ipcRenderer.invoke('manuals:getVersions', parentId).catch(e => {
                console.error('[ManualStore] Failed to fetch versions:', e);
                return [];
            });

            console.log('[ManualStore] Loading complete. Updating state.', { entryPoint, versionsCount: versions.length });
            set({
                currentManual: manual,
                linkedCategories: categories,
                activeEntryPoint: entryPoint,
                manualImages: images,
                versions: versions,
                isLoading: false,
                error: null
            });
        } catch (err: any) {
            console.error('[ManualStore] Fatal error in loadManual:', err);
            set({ error: err.message, isLoading: false });
        }
    },

    fetchImages: async (manualId) => {
        try {
            const images = await window.electron.ipcRenderer.invoke('media:list', manualId);
            set({ manualImages: images });
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    uploadImage: async (manualId, fileName, buffer) => {
        try {
            const newImage = await window.electron.ipcRenderer.invoke('media:upload', manualId, fileName, buffer);
            await get().fetchImages(manualId);
            return newImage;
        } catch (err: any) {
            set({ error: err.message });
            throw err;
        }
    },

    deleteImage: async (imageId) => {
        try {
            const { currentManual } = get();
            await window.electron.ipcRenderer.invoke('media:delete', imageId);
            if (currentManual) {
                await get().fetchImages(currentManual.id);
            }
        } catch (err: any) {
            set({ error: err.message });
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

    saveNewVersion: async () => {
        const { currentManual } = get();
        if (!currentManual) return;

        try {
            set({ isLoading: true });
            const nextVersion = (currentManual.version || 1) + 1;
            const versionData = {
                ...currentManual,
                version: nextVersion,
                parent_id: currentManual.parent_id || currentManual.id,
                status: 'draft' // New versions start as draft
            };

            const newId = await window.electron.ipcRenderer.invoke('manuals:saveVersion', versionData);
            console.log('[ManualStore] New version saved with ID:', newId);

            // Reload the new version
            await get().loadManual(newId, get().activeCategoryId || undefined);
            await get().fetchManuals();
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },

    toggleFavorite: async (id, isFavorite) => {
        try {
            await window.electron.ipcRenderer.invoke('manuals:toggleFavorite', id, isFavorite);
            set((state) => ({
                manuals: state.manuals.map((m) =>
                    m.id === id ? { ...m, is_favorite: isFavorite } : m
                ),
                currentManual: state.currentManual?.id === id
                    ? { ...state.currentManual, is_favorite: isFavorite }
                    : state.currentManual
            }));
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
            set(state => ({ manualRefreshCounter: state.manualRefreshCounter + 1 }));
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
            set(state => ({ manualRefreshCounter: state.manualRefreshCounter + 1 }));
            // Refresh linked categories
            const categories = await window.electron.ipcRenderer.invoke('manuals:getCategories', manualId);
            set({ linkedCategories: categories });
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    moveManualToCategory: async (manualId, oldCategoryId, newCategoryId) => {
        try {
            await window.electron.ipcRenderer.invoke('manuals:moveCategory', manualId, oldCategoryId, newCategoryId);
            set(state => ({ manualRefreshCounter: state.manualRefreshCounter + 1 }));
            await get().fetchManuals();
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
    updateNodeData: (nodeId, data) => {
        const { currentManual } = get();
        if (!currentManual) return;

        const newNodes = currentManual.flowchart_data.nodes.map((node) => {
            if (node.id === nodeId) {
                return { ...node, data: { ...node.data, ...data } };
            }
            return node;
        });

        set({
            currentManual: {
                ...currentManual,
                flowchart_data: { ...currentManual.flowchart_data, nodes: newNodes },
            }
        });
    },
}));
