import React, { useState, useEffect } from 'react';
import type { Node } from '@xyflow/react';
import { useManualStore } from '../../store/useManualStore';
import { X, Save, ArrowRight, Check } from 'lucide-react';

interface NodePropertiesProps {
    node: Node;
    onClose: () => void;
}

const NodeProperties: React.FC<NodePropertiesProps> = ({ node, onClose }) => {
    const { updateNodeData, manualImages } = useManualStore();
    const [label, setLabel] = useState(node.data.label as string);
    const [comment, setComment] = useState((node.data.comment as string) || '');
    const [hasSubFlow, setHasSubFlow] = useState(!!node.data.hasSubFlow);
    const [selectedImageIds, setSelectedImageIds] = useState<number[]>((node.data.imageIds as number[]) || []);

    useEffect(() => {
        setLabel(node.data.label as string);
        setComment((node.data.comment as string) || '');
        setHasSubFlow(!!node.data.hasSubFlow);
        setSelectedImageIds((node.data.imageIds as number[]) || []);
    }, [node]);

    const handleSave = () => {
        updateNodeData(node.id, { label, comment, hasSubFlow, imageIds: selectedImageIds });
        onClose();
    };

    const toggleImage = (imageId: number) => {
        setSelectedImageIds(prev =>
            prev.includes(imageId)
                ? prev.filter(id => id !== imageId)
                : [...prev, imageId]
        );
    };

    return (
        <div className="absolute top-4 right-4 w-80 bg-white border rounded-lg shadow-xl z-50 p-4 border-l-4 border-l-blue-500 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800">ステップ編集</h3>
                <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
                    <X className="w-4 h-4 text-slate-500" />
                </button>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 tracking-wider">
                        タイトル（ボタン名）
                    </label>
                    <input
                        type="text"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        className="w-full px-3 py-2 border rounded text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 tracking-wider">
                        作業指示・コメント
                    </label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={12}
                        className="w-full px-3 py-2 border rounded text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-y"
                        placeholder="このステップでやるべきことを記載してください"
                    />
                </div>

                {/* Image Selection */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2 tracking-wider">
                        紐付け画像
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {manualImages.map((image) => {
                            const isSelected = selectedImageIds.includes(image.id);
                            return (
                                <button
                                    key={image.id}
                                    onClick={() => toggleImage(image.id)}
                                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-100 grayscale-[0.5] hover:grayscale-0'
                                        }`}
                                >
                                    <img
                                        src={`file:///${image.file_path.replace(/\\/g, '/')}`}
                                        alt={image.file_name}
                                        className="w-full h-full object-cover"
                                    />
                                    {isSelected && (
                                        <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                                            <div className="bg-blue-600 text-white rounded-full p-0.5">
                                                <Check className="w-3 h-3" />
                                            </div>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                        {manualImages.length === 0 && (
                            <div className="col-span-3 py-4 border-2 border-dashed border-slate-100 rounded-lg text-center">
                                <p className="text-[10px] text-slate-400 font-medium">画像がライブラリにありません</p>
                            </div>
                        )}
                    </div>
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
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                        <Save className="w-4 h-4" />
                        <span>保存して閉じる</span>
                    </button>
                    {hasSubFlow && (
                        <button
                            className="w-full bg-white border border-blue-600 text-blue-600 px-4 py-2 rounded font-bold hover:bg-blue-50 flex items-center justify-center gap-2 transition-all text-sm"
                        >
                            <span>詳細手順を編集する</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="pt-2 border-t mt-4">
                    <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Node ID: {node.id}</p>
                </div>
            </div>
        </div>
    );
};

export default NodeProperties;

