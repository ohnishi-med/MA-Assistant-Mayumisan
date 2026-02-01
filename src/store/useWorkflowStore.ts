import { create } from 'zustand';
import {
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
    type Node,
    type Edge,
    type OnNodesChange,
    type OnEdgesChange,
    type OnConnect,
    type Connection
} from '@xyflow/react';

interface FlowData {
    nodes: Node[];
    edges: Edge[];
}

interface WorkflowState {
    flows: Record<string, FlowData>; // 各階層ごとのデータ
    activeFlowId: string;           // 現在表示中の階層ID
    activeFlowPath: string[];       // パンくずリスト用のパス

    // Getters for current flow
    getNodes: () => Node[];
    getEdges: () => Edge[];

    // Actions
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    setNodes: (nodes: Node[]) => void;
    setEdges: (edges: Edge[]) => void;
    updateNodeData: (nodeId: string, data: any) => void;

    // Navigation
    enterSubFlow: (flowId: string) => void;
    backToFlow: (index: number) => void;
    loadFlows: (flows: Record<string, FlowData>, activeFlowId: string, activeFlowPath: string[]) => void;
}

// 初期プリセットデータ（メイン階層）
const initialMainNodes: Node[] = [
    {
        id: 'root-1',
        type: 'input',
        data: { label: '業務開始' },
        position: { x: 350, y: 0 },
    },
    { id: 'cat-1', data: { label: '受付', comment: '受付業務全般', hasSubFlow: true }, position: { x: 0, y: 150 } },
    { id: 'cat-2', data: { label: '診療補助', comment: '診察室での補助業務', hasSubFlow: true }, position: { x: 180, y: 150 } },
    { id: 'cat-3', data: { label: '算定', comment: '診療報酬の算定', hasSubFlow: true }, position: { x: 360, y: 150 } },
    { id: 'cat-4', data: { label: '会計', comment: '窓口会計・レジ業務', hasSubFlow: true }, position: { x: 540, y: 150 } },
    { id: 'cat-5', data: { label: '書類', comment: '診断書・証明書等の作成依頼受取', hasSubFlow: true }, position: { x: 720, y: 150 } },
    { id: 'cat-6', data: { label: '物品管理', comment: '備品・消耗品の管理', hasSubFlow: true }, position: { x: 0, y: 300 } },
    { id: 'cat-7', data: { label: '発注', comment: '薬品・備品の発注業務', hasSubFlow: true }, position: { x: 180, y: 300 } },
    { id: 'cat-8', data: { label: '検査', comment: '各種検査の案内・補助', hasSubFlow: true }, position: { x: 360, y: 300 } },
    { id: 'cat-9', data: { label: '総務', comment: '院内管理・事務全般', hasSubFlow: true }, position: { x: 540, y: 300 } },
    { id: 'cat-10', data: { label: '連携', comment: '他院・地域連携業務', hasSubFlow: true }, position: { x: 720, y: 300 } },
];

const initialMainEdges: Edge[] = [
    { id: 'e-r1', source: 'root-1', target: 'cat-1' },
    { id: 'e-r2', source: 'root-1', target: 'cat-2' },
    { id: 'e-r3', source: 'root-1', target: 'cat-3' },
    { id: 'e-r4', source: 'root-1', target: 'cat-4' },
    { id: 'e-r5', source: 'root-1', target: 'cat-5' },
    { id: 'e-r6', source: 'root-1', target: 'cat-6' },
    { id: 'e-r7', source: 'root-1', target: 'cat-7' },
    { id: 'e-r8', source: 'root-1', target: 'cat-8' },
    { id: 'e-r9', source: 'root-1', target: 'cat-9' },
    { id: 'e-r10', source: 'root-1', target: 'cat-10' },
];

// 初期設定のサブフロー群
const initialSubFlows: Record<string, FlowData> = {};
const categoryNames = ['受付', '診療補助', '算定', '会計', '書類', '物品管理', '発注', '検査', '総務', '連携'];

categoryNames.forEach((name, i) => {
    const flowId = `cat-${i + 1}`;
    initialSubFlows[flowId] = {
        nodes: [
            {
                id: `sub-${i + 1}-root`,
                type: 'input',
                data: { label: `${name}開始` },
                position: { x: 350, y: 0 },
            },
            ...Array.from({ length: 3 }).map((_, j) => ({
                id: `sub-${i + 1}-${j + 1}`,
                data: { label: `${name}手順${j + 1}`, comment: '詳細な手順をここに記載してください' },
                position: { x: j * 200, y: 150 },
            }))
        ],
        edges: [
            { id: `sub-e-${i + 1}-r1`, source: `sub-${i + 1}-root`, target: `sub-${i + 1}-1` },
            { id: `sub-e-${i + 1}-r2`, source: `sub-${i + 1}-root`, target: `sub-${i + 1}-2` },
            { id: `sub-e-${i + 1}-r3`, source: `sub-${i + 1}-root`, target: `sub-${i + 1}-3` },
        ]
    };
});

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
    flows: {
        main: { nodes: initialMainNodes, edges: initialMainEdges },
        ...initialSubFlows
    },
    activeFlowId: 'main',
    activeFlowPath: ['main'],

    getNodes: () => {
        const { flows, activeFlowId } = get();
        return flows[activeFlowId]?.nodes || [];
    },

    getEdges: () => {
        const { flows, activeFlowId } = get();
        return flows[activeFlowId]?.edges || [];
    },

    onNodesChange: (changes) => {
        const { flows, activeFlowId } = get();
        const currentFlow = flows[activeFlowId];
        if (!currentFlow) return;

        set({
            flows: {
                ...flows,
                [activeFlowId]: {
                    ...currentFlow,
                    nodes: applyNodeChanges(changes, currentFlow.nodes),
                }
            }
        });
    },

    onEdgesChange: (changes) => {
        const { flows, activeFlowId } = get();
        const currentFlow = flows[activeFlowId];
        if (!currentFlow) return;

        set({
            flows: {
                ...flows,
                [activeFlowId]: {
                    ...currentFlow,
                    edges: applyEdgeChanges(changes, currentFlow.edges),
                }
            }
        });
    },

    onConnect: (connection: Connection) => {
        const { flows, activeFlowId } = get();
        const currentFlow = flows[activeFlowId];
        if (!currentFlow) return;

        set({
            flows: {
                ...flows,
                [activeFlowId]: {
                    ...currentFlow,
                    edges: addEdge(connection, currentFlow.edges),
                }
            }
        });
    },

    setNodes: (nodes) => {
        const { flows, activeFlowId } = get();
        set({
            flows: {
                ...flows,
                [activeFlowId]: { ...flows[activeFlowId], nodes }
            }
        });
    },

    setEdges: (edges) => {
        const { flows, activeFlowId } = get();
        set({
            flows: {
                ...flows,
                [activeFlowId]: { ...flows[activeFlowId], edges }
            }
        });
    },

    updateNodeData: (nodeId, data) => {
        const { flows, activeFlowId } = get();
        const currentFlow = flows[activeFlowId];
        if (!currentFlow) return;

        set({
            flows: {
                ...flows,
                [activeFlowId]: {
                    ...currentFlow,
                    nodes: currentFlow.nodes.map((node) =>
                        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
                    ),
                }
            }
        });
    },

    enterSubFlow: (flowId) => {
        const { flows, activeFlowPath } = get();
        // もしサブフローが存在しなければ新規作成
        if (!flows[flowId]) {
            // 親階層からラベルを取得
            const parentFlowId = activeFlowPath[activeFlowPath.length - 1];
            const parentNode = flows[parentFlowId]?.nodes.find(n => n.id === flowId);
            const label = parentNode?.data.label || '新規サブフロー';

            set({
                flows: {
                    ...flows,
                    [flowId]: {
                        nodes: [
                            {
                                id: `${flowId}-root`,
                                type: 'input',
                                data: { label: `${label}開始` },
                                position: { x: 350, y: 0 }
                            },
                            ...Array.from({ length: 3 }).map((_, j) => ({
                                id: `${flowId}-${j + 1}`,
                                data: { label: `${label}手順${j + 1}`, comment: '指示を記載してください' },
                                position: { x: j * 200, y: 150 },
                            }))
                        ],
                        edges: [
                            { id: `${flowId}-e-r1`, source: `${flowId}-root`, target: `${flowId}-1` },
                            { id: `${flowId}-e-r2`, source: `${flowId}-root`, target: `${flowId}-2` },
                            { id: `${flowId}-e-r3`, source: `${flowId}-root`, target: `${flowId}-3` },
                        ]
                    }
                }
            });
        }
        set({
            activeFlowId: flowId,
            activeFlowPath: [...activeFlowPath, flowId]
        });
    },

    backToFlow: (index) => {
        const { activeFlowPath } = get();
        const newPath = activeFlowPath.slice(0, index + 1);
        const newId = newPath[newPath.length - 1];
        set({
            activeFlowId: newId,
            activeFlowPath: newPath
        });
    },

    loadFlows: (flows, activeFlowId, activeFlowPath) => {
        set({ flows, activeFlowId, activeFlowPath });
    }
}));
