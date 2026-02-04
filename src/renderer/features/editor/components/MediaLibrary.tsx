import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useManualStore } from '../../../store/useManualStore';
import { Image as ImageIcon, Trash2, Upload, Loader2, X } from 'lucide-react';

interface MediaLibraryProps {
    onClose: () => void;
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({ onClose }) => {
    const { currentManual, manualImages, uploadImage, deleteImage, isLoading } = useManualStore();

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (!currentManual) return;

        for (const file of acceptedFiles) {
            const buffer = await file.arrayBuffer();
            await uploadImage(currentManual.id, file.name, buffer);
        }
    }, [currentManual, uploadImage]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
        }
    });

    if (!currentManual) return null;

    return (
        <div className="flex flex-col h-full bg-white border-l border-slate-200 w-80 shadow-xl overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-slate-800">メディアライブラリ</h3>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
                    <X className="w-5 h-5 text-slate-500" />
                </button>
            </div>

            <div className="p-4 flex-1 overflow-auto custom-scrollbar">
                {/* Upload Area */}
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer mb-6 ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
                        }`}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-2">
                        <Upload className={`w-8 h-8 ${isDragActive ? 'text-blue-500 animate-bounce' : 'text-slate-400'}`} />
                        <p className="text-sm font-medium text-slate-600">
                            {isDragActive ? 'ファイルをドロップ' : '画像をドラッグ＆ドロップ'}
                        </p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">or click to browse</p>
                    </div>
                </div>

                {/* Image List */}
                <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">アップロード済み画像</p>
                    {manualImages.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 italic text-sm">
                            画像がありません
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {manualImages.map((image) => (
                                <div key={image.id} className="group relative aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                                    <img
                                        src={`file:///${image.file_path.replace(/\\/g, '/')}`}
                                        alt={image.file_name}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            onClick={() => deleteImage(image.id)}
                                            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                                            title="削除"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-1 bg-white/80 backdrop-blur-sm border-t border-slate-100">
                                        <p className="text-[9px] font-bold text-slate-600 truncate">{image.file_name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {isLoading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-50">
                    <div className="bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        <span className="text-sm font-bold text-slate-700">処理中...</span>
                    </div>
                </div>
            )}
        </div>
    );
};
