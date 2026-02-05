export interface Category {
    id: number;
    name: string;
    icon?: string;
    parent_id: number | null;
    level: number;
    path: string;
    display_order: number;
    created_at?: string;
    updated_at?: string;
    // UI helper
    children?: Category[];
}
