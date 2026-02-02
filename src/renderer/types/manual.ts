import type { Node, Edge } from '@xyflow/react';

export interface Manual {
    id: number;
    title: string;
    content: string;
    flowchart_data: {
        nodes: Node[];
        edges: Edge[];
    };
    parent_id: number | null;
    version: number;
    status: 'draft' | 'published' | 'archived';
    is_favorite: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface CategoryManualLink {
    category_id: number;
    manual_id: number;
    entry_point?: string;
    display_order: number;
}
export interface ManualImage {
    id: number;
    manual_id: number;
    file_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    alt_text?: string;
    display_order: number;
    created_at?: string;
}
