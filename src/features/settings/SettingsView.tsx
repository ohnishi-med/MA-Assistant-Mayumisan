import React, { useState } from 'react';
import { useStorageStore } from '../../store/useStorageStore';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { useMasterStore } from '../../store/useMasterStore';
import { StorageService } from '../../services/StorageService';
import { FolderOpen, Save, HardDrive, ShieldCheck, AlertCircle } from 'lucide-react';

const SettingsView: React.FC = () => {
    const { directoryHandle, setDirectoryHandle, isAutoSaveEnabled, toggleAutoSave } = useStorageStore();
    const workflowStore = useWorkflowStore();
    const masterStore = useMasterStore();
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'idle', message: string }>({ type: 'idle', message: '' });

    const handlePickDirectory = async () => {
        try {
            const handle = await window.showDirectoryPicker();
            setDirectoryHandle(handle);
            setStatus({ type: 'success', message: '保存フォルダを設定しました。' });
        } catch (error) {
            console.error('Directory picker error:', error);
            setStatus({ type: 'error', message: 'フォルダを選択できませんでした。' });
        }
    };

    const handleManualSave = async () => {
        if (!directoryHandle) {
            setStatus({ type: 'error', message: '保存フォルダが設定されていません。' });
            return;
        }

        const hasPermission = await StorageService.verifyPermission(directoryHandle, true);
        if (!hasPermission) {
            setStatus({ type: 'error', message: 'フォルダへの書き込み権限がありません。' });
            return;
        }

        const workflowData = JSON.stringify({ nodes: workflowStore.nodes, edges: workflowStore.edges }, null, 2);
        const masterData = JSON.stringify(masterStore.items, null, 2);

        const success1 = await StorageService.saveFile(directoryHandle, 'workflow_data.json', workflowData);
        const success2 = await StorageService.saveFile(directoryHandle, 'master_data.json', masterData);

        if (success1 && success2) {
            setStatus({ type: 'success', message: 'データを保存しました。' });
        } else {
            setStatus({ type: 'error', message: '保存中にエラーが発生しました。' });
        }
    };

    const handleManualLoad = async () => {
        if (!directoryHandle) {
            setStatus({ type: 'error', message: '保存フォルダが設定されていません。' });
            return;
        }

        const workflowJson = await StorageService.readFile(directoryHandle, 'workflow_data.json');
        if (workflowJson) {
            const data = JSON.parse(workflowJson);
            workflowStore.setNodes(data.nodes);
            workflowStore.setEdges(data.edges);
        }

        const masterJson = await StorageService.readFile(directoryHandle, 'master_data.json');
        if (masterJson) {
            const items = JSON.parse(masterJson);
            masterStore.setItems(items);
        }

        setStatus({ type: 'success', message: 'データを読み込みました。' });
    };

    return (
        <div className="flex-1 flex flex-col bg-white rounded-lg border shadow-sm p-8 max-w-2xl mx-auto w-full overflow-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-2">
                    <HardDrive className="w-6 h-6 text-blue-600" />
                    ストレージ設定
                </h2>
                <p className="text-slate-500 text-sm">
                    フローチャートやマスターデータの保存先（NASやローカルフォルダ）を設定します。
                </p>
            </div>

            <div className="space-y-8">
                {/* Directory Picker */}
                <section className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <FolderOpen className="w-4 h-4" />
                        保存先フォルダ
                    </h3>
                    <div className="flex flex-col gap-4">
                        <div className="bg-white p-3 rounded border text-sm font-mono text-slate-600 break-all">
                            {directoryHandle ? directoryHandle.name : '未設定（ブラウザのメモリのみ）'}
                        </div>
                        <button
                            onClick={handlePickDirectory}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-700 font-medium transition-colors shadow-sm"
                        >
                            フォルダを選択する
                        </button>
                        <p className="text-[10px] text-slate-400">
                            ※ NASを使用する場合は、PCにネットワークドライブとして割り当てたフォルダを選択してください。
                        </p>
                    </div>
                </section>

                {/* Persistence Controls */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-xl">
                        <div>
                            <p className="font-bold text-slate-700">自動保存を有効にする</p>
                            <p className="text-xs text-slate-500">変更時にバックグラウンドで保存します</p>
                        </div>
                        <button
                            onClick={toggleAutoSave}
                            className={`w-12 h-6 rounded-full transition-colors relative ${isAutoSaveEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isAutoSaveEnabled ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={handleManualSave}
                            disabled={!directoryHandle}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl font-bold transition-all shadow-md active:scale-95"
                        >
                            <Save className="w-5 h-5" />
                            今すぐ保存
                        </button>
                        <button
                            onClick={handleManualLoad}
                            disabled={!directoryHandle}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-300 text-slate-700 rounded-xl font-bold transition-all border border-slate-200"
                        >
                            <FolderOpen className="w-5 h-5" />
                            データを読み込む
                        </button>
                    </div>
                </section>

                {/* Status Messages */}
                {status.type !== 'idle' && (
                    <div className={`p-4 rounded-xl flex items-center gap-3 ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                        }`}>
                        {status.type === 'success' ? <ShieldCheck className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span className="text-sm font-medium">{status.message}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsView;
