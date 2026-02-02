import React, { useState, useEffect } from 'react';
import type { Node } from '@xyflow/react';
// Node/Edge types are used implicitly through the store
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { X, Save, ArrowRight } from 'lucide-react';

interface NodePropertiesProps {
    node: Node;
    onClose: () => void;
}

const NodeProperties: React.FC<NodePropertiesProps> = ({ node, onClose }) => {
    const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
    const [label, setLabel] = useState(node.data.label as string);
    const [comment, setComment] = useState((node.data.comment as string) || '');
    const [hasSubFlow, setHasSubFlow] = useState(!!node.data.hasSubFlow);
    const enterSubFlow = useWorkflowStore((state) => state.enterSubFlow);

    useEffect(() => {
        setLabel(node.data.label as string);
        setComment((node.data.comment as string) || '');
        setHasSubFlow(!!node.data.hasSubFlow);
    }, [node]);

    const handleSave = () => {
        updateNodeData(node.id, { label, comment, hasSubFlow });
        onClose();
    };

    const handleEnterSubFlow = () => {
        updateNodeData(node.id, { label, comment, hasSubFlow: true });
        enterSubFlow(node.id);
        onClose();
    };

    return (
        <div className="absolute top-4 right-4 w-80 bg-white border rounded-lg shadow-xl z-50 p-4 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800">ステップ編集</h3>
                <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
                    <X className="w-4 h-4 text-slate-500" />
                </button>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                        タイトル（ボタン名）
                    </label>
                    <input
                        type="text"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        className="w-full px-3 py-2 border rounded text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                        作業指示・コメント
                    </label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border rounded text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="このステップでやるべきことを記載してください"
                    />
                </div>

                <div className="flex items-center gap-2 py-2 border-y border-slate-50">
                    <input
                        type="checkbox"
                        id="hasSubFlow"
                        checked={hasSubFlow}
                        onChange={(e) => setHasSubFlow(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="hasSubFlow" className="text-sm font-medium text-slate-700 cursor-pointer">
                        サブフロー（詳細手順）を持つ
                    </label>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                    <button
                        onClick={handleSave}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 flex items-center justify-center gap-2 shadow-sm transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        <span>保存して閉じる</span>
                    </button>
                    {hasSubFlow && (
                        <button
                            onClick={handleEnterSubFlow}
                            className="w-full bg-white border border-blue-600 text-blue-600 px-4 py-2 rounded font-medium hover:bg-blue-50 flex items-center justify-center gap-2 transition-colors"
                        >
                            <span>詳細手順を編集する</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="pt-2 border-t mt-4">
                    <p className="text-[10px] text-slate-400">ID: {node.id}</p>
                </div>
            </div>
        </div>
    );
};

export default NodeProperties;
