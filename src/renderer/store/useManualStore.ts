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

    // Node Operations
    addNode: (targetNodeId: string, position: 'before' | 'after') => void;
    deleteNode: (nodeId: string) => void;
    updateNodeData: (nodeId: string, data: any) => void;
    updateTitle: (title: string) => void;

    // Flowchart Actions (for the active manual)
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    setNodes: (nodes: Node[]) => void;
    setEdges: (edges: Edge[]) => void;
    setActiveCategoryId: (id: number | null) => void;
    clearCurrentManual: () => void;
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

            // If nodes are empty (new manual), initialize with 3 default steps
            if (manual && manual.flowchart_data && (!manual.flowchart_data.nodes || manual.flowchart_data.nodes.length === 0)) {
                console.log('[ManualStore] Empty manual detected, initializing with default steps');
                const defaultNodes = [
                    { id: 'step_1', type: 'step', position: { x: 100, y: 100 }, data: { label: '手順1', comment: '' } },
                    { id: 'step_2', type: 'step', position: { x: 100, y: 200 }, data: { label: '手順2', comment: '' } },
                    { id: 'step_3', type: 'step', position: { x: 100, y: 300 }, data: { label: '手順3', comment: '' } }
                ];
                const defaultEdges = [
                    { id: 'e_1_2', source: 'step_1', target: 'step_2', type: 'smoothstep' },
                    { id: 'e_2_3', source: 'step_2', target: 'step_3', type: 'smoothstep' }
                ];
                manual.flowchart_data = { nodes: defaultNodes, edges: defaultEdges };

                // Immediately save this initialization to DB so it persists
                // We use update inside loadManual, so be careful about infinite loops, 
                // but here we just want to ensure if user refreshes they see the steps.
                // However, user might cancel. Logic says "create a new manual... data is empty... becomes uneditable".
                // If we interpret the user request: "When creating a new manual... initialize with 3 flows".
                // Doing it here covers both creation (if it loads immediately) and opening an empty one.
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

    addNode: (targetNodeId, position) => {
        const { currentManual } = get();
        if (!currentManual) return;

        const nodes = currentManual.flowchart_data.nodes;
        const edges = currentManual.flowchart_data.edges;
        const targetIndex = nodes.findIndex(n => n.id === targetNodeId);
        if (targetIndex === -1) return;

        const newNodeId = `node_${Date.now()}`;
        const newNode: Node = {
            id: newNodeId,
            type: 'step',
            position: { x: 0, y: 0 }, // Position will be calculated by layout
            data: { label: 'New Step', comment: '' }
        };

        const newNodes = [...nodes];
        const newEdges = [...edges];

        if (position === 'after') {
            newNodes.splice(targetIndex + 1, 0, newNode);
            // Reconnect edges likely not needed for linear list view, but essential for graph validity
            // Valid logic would be: Target -> New -> Target's old Next
            const outgoingEdges = edges.filter(e => e.source === targetNodeId);

            // Remove old outgoing edges from target
            for (const edge of outgoingEdges) {
                const edgeIndex = newEdges.findIndex(e => e.id === edge.id);
                if (edgeIndex !== -1) newEdges.splice(edgeIndex, 1);

                // Connect New -> Old Target's Destination
                newEdges.push({
                    id: `e_${newNodeId}_${edge.target}`,
                    source: newNodeId,
                    target: edge.target,
                    type: 'smoothstep'
                });
            }

            // Connect Target -> New
            newEdges.push({
                id: `e_${targetNodeId}_${newNodeId}`,
                source: targetNodeId,
                target: newNodeId,
                type: 'smoothstep'
            });

        } else { // before
            newNodes.splice(targetIndex, 0, newNode);

            // Logic: Target's old Previous -> New -> Target
            const incomingEdges = edges.filter(e => e.target === targetNodeId);

            // Remove old incoming edges to target
            for (const edge of incomingEdges) {
                const edgeIndex = newEdges.findIndex(e => e.id === edge.id);
                if (edgeIndex !== -1) newEdges.splice(edgeIndex, 1);

                // Connect Old Source -> New
                newEdges.push({
                    id: `e_${edge.source}_${newNodeId}`,
                    source: edge.source,
                    target: newNodeId,
                    type: 'smoothstep'
                });
            }

            // Connect New -> Target
            newEdges.push({
                id: `e_${newNodeId}_${targetNodeId}`,
                source: newNodeId,
                target: targetNodeId,
                type: 'smoothstep'
            });
        }

        set({
            currentManual: {
                ...currentManual,
                flowchart_data: {
                    nodes: newNodes,
                    edges: newEdges
                }
            }
        });
    },

    deleteNode: (nodeId) => {
        const { currentManual } = get();
        if (!currentManual) return;

        const nodes = currentManual.flowchart_data.nodes;
        const edges = currentManual.flowchart_data.edges;

        // Simple deletion: Remove node and all connected edges
        // Ideally we should reconnect Pre -> Next

        const incomingEdges = edges.filter(e => e.target === nodeId);
        const outgoingEdges = edges.filter(e => e.source === nodeId);

        const newEdges = edges.filter(e => e.source !== nodeId && e.target !== nodeId);

        // Reconnect: Source of incoming -> Target of outgoing (If 1-to-1 mapping exists)
        // This is a simplification. For linear flows it works.
        if (incomingEdges.length === 1 && outgoingEdges.length === 1) {
            newEdges.push({
                id: `e_${incomingEdges[0].source}_${outgoingEdges[0].target}`,
                source: incomingEdges[0].source,
                target: outgoingEdges[0].target,
                type: 'smoothstep'
            });
        }

        const newNodes = nodes.filter(n => n.id !== nodeId);

        set({
            currentManual: {
                ...currentManual,
                flowchart_data: {
                    nodes: newNodes,
                    edges: newEdges
                }
            }
        });
    },

    updateTitle: (title: string) => {
        const { currentManual } = get();
        if (!currentManual) return;
        set({
            currentManual: {
                ...currentManual,
                title: title
            }
        });
    },
    setActiveCategoryId: (id: number | null) => {
        set({ activeCategoryId: id });
    },
    clearCurrentManual: () => {
        set({ currentManual: null, activeEntryPoint: null, linkedCategories: [], manualImages: [], versions: [] });
    },
}));
