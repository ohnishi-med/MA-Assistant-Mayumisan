export interface MasterItem {
    id: string;
    code: string;       // 算定番号
    name: string;       // 項目名
    description: string; // 解説
    category: string;    // カテゴリ（書類、算定、会計等）
}

export type MasterCategory = '書類' | '会計' | '算定' | 'その他';
