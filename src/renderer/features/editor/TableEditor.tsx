import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, MoveHorizontal, MoveVertical } from 'lucide-react';

interface TableEditorProps {
    initialMarkdown?: string;
    onSave: (markdown: string) => void;
    onCancel: () => void;
}

const TableEditor: React.FC<TableEditorProps> = ({ initialMarkdown = '', onSave, onCancel }) => {
    const [data, setData] = useState<string[][]>([['', ''], ['', '']]);

    useEffect(() => {
        if (initialMarkdown) {
            const lines = initialMarkdown.trim().split('\n');
            const parsedData = lines
                .filter(line => line.trim().startsWith('|'))
                .filter((_, index) => index !== 1) // Skip separator line
                .map(line => {
                    const cells = line.split('|').slice(1, -1);
                    return cells.map(cell => cell.trim());
                });

            if (parsedData.length > 0) {
                setData(parsedData);
            }
        }
    }, [initialMarkdown]);

    const addRow = () => {
        const newRow = new Array(data[0].length).fill('');
        setData([...data, newRow]);
    };

    const addColumn = () => {
        const newData = data.map(row => [...row, '']);
        setData(newData);
    };

    const removeRow = (index: number) => {
        if (data.length <= 1) return;
        const newData = data.filter((_, i) => i !== index);
        setData(newData);
    };

    const removeColumn = (index: number) => {
        if (data[0].length <= 1) return;
        const newData = data.map(row => row.filter((_, i) => i !== index));
        setData(newData);
    };

    const updateCell = (rowIndex: number, colIndex: number, value: string) => {
        const newData = [...data];
        newData[rowIndex] = [...newData[rowIndex]];
        newData[rowIndex][colIndex] = value;
        setData(newData);
    };

    const handleSave = () => {
        // Generate Markdown
        if (data.length === 0) {
            onSave('');
            return;
        }

        const header = `| ${data[0].join(' | ')} |`;
        const separator = `| ${data[0].map(() => '---').join(' | ')} |`;
        const body = data.slice(1).map(row => `| ${row.join(' | ')} |`).join('\n');

        const markdown = `${header}\n${separator}\n${body}`;
        onSave(markdown);
    };

    return (
        <div className="flex flex-col gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <MoveVertical className="w-4 h-4 text-blue-500" />
                    テーブルエディタ
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onCancel}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="キャンセル"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-bold"
                    >
                        <Save className="w-4 h-4" />
                        保存して挿入
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto pb-2">
                <div className="min-w-max">
                    <div className="flex gap-1 mb-2">
                        <div className="w-8"></div> {/* Row handle spacer */}
                        {data[0].map((_, colIndex) => (
                            <div key={`col-header-${colIndex}`} className="flex-1 flex justify-center min-w-[150px]">
                                <button
                                    onClick={() => removeColumn(colIndex)}
                                    className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                                    title="列を削除"
                                    disabled={data[0].length <= 1}
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        <div className="w-8"></div>
                    </div>

                    {data.map((row, rowIndex) => (
                        <div key={`row-${rowIndex}`} className="flex gap-1 mb-1 items-center">
                            <div className="w-8 flex justify-center">
                                <button
                                    onClick={() => removeRow(rowIndex)}
                                    className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                                    title="行を削除"
                                    disabled={data.length <= 1}
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>

                            {row.map((cell, colIndex) => (
                                <div key={`cell-${rowIndex}-${colIndex}`} className="min-w-[150px] flex-1">
                                    <input
                                        value={cell}
                                        onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                                        className={`w-full p-2 text-sm border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none rounded ${rowIndex === 0
                                                ? 'bg-slate-100 font-bold border-slate-300 text-slate-700'
                                                : 'bg-white border-slate-200 text-slate-600'
                                            }`}
                                        placeholder={rowIndex === 0 ? "ヘッダー" : "内容"}
                                    />
                                </div>
                            ))}

                            <div className="w-8"></div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex gap-2 mt-2">
                <button
                    onClick={addRow}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    行を追加
                </button>
                <button
                    onClick={addColumn}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    列を追加
                </button>
            </div>

            <p className="text-[10px] text-slate-400 mt-2 text-right">
                ※ 1行目はヘッダーとして扱われます。セル内で改行はできません。
            </p>
        </div>
    );
};

export default TableEditor;
