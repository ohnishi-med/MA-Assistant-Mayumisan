import { create } from 'zustand';
import {
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
    Node,
    Edge,
    OnNodesChange,
    OnEdgesChange,
    OnConnect,
    Connection
} from '@xyflow/react';

interface WorkflowState {
    nodes: Node[];
    edges: Edge[];
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    setNodes: (nodes: Node[]) => void;
    setEdges: (edges: Edge[]) => void;
    updateNodeData: (nodeId: string, data: any) => void;
}

// 初期プリセットデータ
const initialNodes: Node[] = [
    {
        id: 'root-1',
        type: 'input',
        data: { label: '業務開始' },
        position: { x: 250, y: 0 },
    },
    {
        id: 'doc-1',
        data: { label: '書類依頼', comment: '患者さんから書類の依頼を受けた場合' },
        position: { x: 100, y: 100 },
    },
    {
        id: 'acc-1',
        data: { label: '会計業務', comment: '窓口での会計処理' },
        position: { x: 400, y: 100 },
    },
];

const initialEdges: Edge[] = [
    { id: 'e1-2', source: 'root-1', target: 'doc-1', label: '書類' },
    { id: 'e1-3', source: 'root-1', target: 'acc-1', label: '会計' },
];

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
    nodes: initialNodes,
    edges: initialEdges,
    onNodesChange: (changes) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes),
        });
    },
    onEdgesChange: (changes) => {
        set({
            edges: applyEdgeChanges(changes, get().edges),
        });
    },
    onConnect: (connection: Connection) => {
        set({
            edges: addEdge(connection, get().edges),
        });
    },
    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),
    updateNodeData: (nodeId, data) => {
        set({
            nodes: get().nodes.map((node) =>
                node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
            ),
        });
    },
}));
