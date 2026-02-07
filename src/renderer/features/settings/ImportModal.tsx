import { useState } from 'react';
import { FolderInput, X, Upload, CheckCircle, AlertCircle, Loader2, FileJson, Clipboard, ExternalLink } from 'lucide-react';

interface ImportModalProps {
    onClose: () => void;
    onImportComplete: () => void;
}

export const ImportModal = ({ onClose, onImportComplete }: ImportModalProps) => {
    const [importType, setImportType] = useState<'folder' | 'json' | 'json-paste'>('json-paste');
    const [selectedPath, setSelectedPath] = useState<string | null>(null);
    const [jsonContent, setJsonContent] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSelectDirectory = async () => {
        try {
            const path = await window.electron.ipcRenderer.invoke('ui:selectDirectory');
            if (path) {
                setSelectedPath(path);
                setStatus('idle');
                setErrorMessage('');
            }
        } catch (error) {
            console.error('Failed to select directory:', error);
        }
    };

    const handleSelectJsonFile = async () => {
        try {
            const path = await window.electron.ipcRenderer.invoke('ui:selectFile', {
                filters: [{ name: 'JSON Files', extensions: ['json'] }]
            });
            if (path) {
                setSelectedPath(path);
                setStatus('idle');
                setErrorMessage('');
            }
        } catch (error) {
            console.error('Failed to select JSON file:', error);
        }
    };

    const handleImport = async () => {
        if (importType !== 'json-paste' && !selectedPath) return;
        if (importType === 'json-paste' && !jsonContent.trim()) return;

        setIsImporting(true);
        setStatus('idle');

        try {
            let result;
            if (importType === 'folder') {
                result = await window.electron.ipcRenderer.invoke('manuals:importFromDirectory', selectedPath);
            } else if (importType === 'json') {
                result = await window.electron.ipcRenderer.invoke('manuals:importFromJson', selectedPath);
            } else {
                result = await window.electron.ipcRenderer.invoke('manuals:importFromJsonString', jsonContent);
            }

            if (result.success) {
                setStatus('success');
                setTimeout(() => {
                    onImportComplete();
                    onClose();
                }, 1500);
            } else {
                setStatus('error');
                setErrorMessage(result.error || 'インポート中にエラーが発生しました');
            }
        } catch (error: any) {
            setStatus('error');
            setErrorMessage(error.message || '予期せぬエラーが発生しました');
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[9999] animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col scale-in-center">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                            {importType === 'json-paste' ? (
                                <Clipboard className="w-5 h-5 text-indigo-600" />
                            ) : importType === 'folder' ? (
                                <FolderInput className="w-5 h-5 text-indigo-600" />
                            ) : (
                                <FileJson className="w-5 h-5 text-indigo-600" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">データ取り込み</h2>
                            <p className="text-xs text-slate-500">外部データをマニュアルとして登録します</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 flex flex-col gap-6">

                    {/* Import Type Selection */}
                    <div className="bg-slate-50 p-1 rounded-lg flex">
                        <button
                            onClick={() => { setImportType('json-paste'); setSelectedPath(null); setStatus('idle'); }}
                            className={`flex-1 py-1.5 text-sm font-bold rounded-md flex items-center justify-center gap-2 transition-all ${importType === 'json-paste' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Clipboard className="w-4 h-4" />
                            JSON貼付
                        </button>
                        <button
                            onClick={() => { setImportType('folder'); setSelectedPath(null); setStatus('idle'); }}
                            className={`flex-1 py-1.5 text-sm font-bold rounded-md flex items-center justify-center gap-2 transition-all ${importType === 'folder' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <FolderInput className="w-4 h-4" />
                            フォルダから
                        </button>
                        <button
                            onClick={() => { setImportType('json'); setSelectedPath(null); setStatus('idle'); }}
                            className={`flex-1 py-1.5 text-sm font-bold rounded-md flex items-center justify-center gap-2 transition-all ${importType === 'json' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <FileJson className="w-4 h-4" />
                            JSONファイルから
                        </button>
                    </div>

                    {/* Step 1: Select Folder/File or Paste JSON */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-xs">1</span>
                                {importType === 'json-paste' ? 'JSONテキストを貼り付け' : importType === 'folder' ? '取り込むフォルダを選択' : 'JSONファイルを選択'}
                            </label>
                            {importType === 'json-paste' && (
                                <a
                                    href="https://chatgpt.com/g/g-6986af2830908191b39f36d51465d970-mayumisan-maniyuaruzuo-cheng"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full transition-colors"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span>JSON作成AI</span>
                                </a>
                            )}
                        </div>

                        {importType === 'json-paste' ? (
                            <textarea
                                value={jsonContent}
                                onChange={(e) => setJsonContent(e.target.value)}
                                placeholder='[ { "title": "...", "content": "..." } ]'
                                className="w-full h-80 p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none resize-none"
                            />
                        ) : (
                            <div className="flex gap-2">
                                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-600 flex items-center truncate">
                                    {selectedPath || <span className="text-slate-400">未選択</span>}
                                </div>
                                <button
                                    onClick={importType === 'folder' ? handleSelectDirectory : handleSelectJsonFile}
                                    disabled={isImporting}
                                    className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                >
                                    参照...
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-700 space-y-1">
                        <p className="font-bold flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            取り込みのルール
                        </p>
                        {importType === 'folder' ? (
                            <ul className="list-disc list-inside opacity-80 pl-1 space-y-0.5 text-xs">
                                <li>フォルダは「カテゴリ」として登録されます</li>
                                <li>Markdown (.md) または Text (.txt) ファイルが「マニュアル」になります</li>
                                <li>画像ファイルなどは現在は無視されます</li>
                            </ul>
                        ) : (
                            <ul className="list-disc list-inside opacity-80 pl-1 space-y-0.5 text-xs">
                                <li>指定のJSONフォーマットに従ってください</li>
                                <li>categoryにパス("親/子")を指定すると階層が作成されます</li>
                                <li>同名のマニュアルは追加登録されます</li>
                            </ul>
                        )}
                    </div>

                    {/* Status Display */}
                    {status === 'success' && (
                        <div className="bg-emerald-50 text-emerald-600 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <CheckCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm font-bold">インポートが完了しました！</span>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <div>
                                <span className="text-sm font-bold">インポートに失敗しました</span>
                                <p className="text-xs opacity-80 mt-1">{errorMessage}</p>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50 flex items-center justify-end gap-3 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        disabled={isImporting}
                        className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={(importType !== 'json-paste' && !selectedPath) || (importType === 'json-paste' && !jsonContent.trim()) || isImporting || status === 'success'}
                        className={`px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg shadow-indigo-200 transition-all flex items-center gap-2
                            ${(importType !== 'json-paste' && !selectedPath) || (importType === 'json-paste' && !jsonContent.trim()) || isImporting || status === 'success' ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98]'}
                        `}
                    >
                        {isImporting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                インポート中...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4" />
                                取り込み開始
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
