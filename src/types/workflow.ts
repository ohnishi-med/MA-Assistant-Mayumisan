export type NodeType = 'trigger' | 'step' | 'branch' | 'end';

export interface WorkflowNodeData {
    label: string;
    comment?: string;
    category?: string;
}

export interface WorkflowNode {
    id: string;
    type: NodeType;
    data: WorkflowNodeData;
    position: { x: number; y: number };
}

export interface WorkflowEdge {
    id: string;
    source: string;
    target: string;
    label?: string;
}

export interface Workflow {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
}
