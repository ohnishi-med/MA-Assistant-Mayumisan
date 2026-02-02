import type { Node, Edge } from '@xyflow/react';

export interface Manual {
    id: number;
    title: string;
    content: string;
    flowchart_data: {
        nodes: Node[];
        edges: Edge[];
    };
    version: number;
    status: 'draft' | 'published' | 'archived';
    created_at?: string;
    updated_at?: string;
}

export interface CategoryManualLink {
    category_id: number;
    manual_id: number;
    entry_point?: string;
    display_order: number;
}
