import React, { useState } from 'react';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useManualStore } from '../../store/useManualStore';
import { FolderOpen, Save, HardDrive, ShieldCheck, AlertCircle, FolderTree } from 'lucide-react';
import MasterTableView from '../master/MasterTableView';

const SettingsView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'storage' | 'categories'>('storage');
    const fetchCategories = useCategoryStore(state => state.fetchCategories);
    const fetchManuals = useManualStore(state => state.fetchManuals);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'idle', message: string }>({ type: 'idle', message: '' });



    const handleManualSave = async () => {
        try {
            setStatus({ type: 'idle', message: '保存中...' });

            // Generate default filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const defaultFileName = `mayumisan_backup_${timestamp}.db`;

            // Show save dialog
            const savePath = await window.electron.ipcRenderer.invoke('ui:saveFile', {
                title: 'バックアップを保存',
                defaultPath: defaultFileName,
                filters: [
                    { name: 'SQLite Database', extensions: ['db'] }
                ]
            });

            if (!savePath) return;

            // Backup to the selected path
            const success = await window.electron.ipcRenderer.invoke('db:backup', savePath);

            if (success) {
                setStatus({ type: 'success', message: `データベースを保存しました: ${savePath}` });
            } else {
                setStatus({ type: 'error', message: '保存中にエラーが発生しました。' });
            }
        } catch (error) {
            console.error('Save error:', error);
            setStatus({ type: 'error', message: '保存に失敗しました。' });
        }
    };

    const handleManualLoad = async () => {
        try {
            // Use Electron's file dialog to get the file path
            const filePath = await window.electron.ipcRenderer.invoke('ui:selectFile', {
                title: 'バックアップファイルを選択',
                filters: [
                    { name: 'SQLite Database', extensions: ['db'] }
                ]
            });

            if (!filePath) return;

            setStatus({ type: 'idle', message: 'データベースを復元中...' });

            const success = await window.electron.ipcRenderer.invoke('db:restore', filePath);

            if (success) {
                await fetchCategories();
                await fetchManuals();
                setStatus({ type: 'success', message: 'データベースを復元しました（最新のデータが直ちに反映されました）。' });
            } else {
                setStatus({ type: 'error', message: '復元中にエラーが発生しました。' });
            }
        } catch (error: any) {
            if (error.name === 'AbortError') return;
            console.error('Restore error:', error);
            setStatus({ type: 'error', message: '読み込みに失敗しました。' });
        }
    };

    return (
        <div className="h-full flex flex-col bg-white rounded-2xl border shadow-sm overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b bg-slate-50/50 px-6 pt-4">
                <button
                    onClick={() => setActiveTab('storage')}
                    className={`px-6 py-3 text-sm font-bold transition-all border-b-2 -mb-px flex items-center gap-2 ${activeTab === 'storage'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                >
                    <HardDrive className="w-4 h-4" />
                    ストレージ設定
                </button>
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`px-6 py-3 text-sm font-bold transition-all border-b-2 -mb-px flex items-center gap-2 ${activeTab === 'categories'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                >
                    <FolderTree className="w-4 h-4" />
                    カテゴリー管理
                </button>
            </div>

            <div className="flex-1 overflow-auto p-4 sm:p-8">
                {activeTab === 'storage' && (
                    <div className="max-w-2xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <section>
                            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-2">
                                <HardDrive className="w-6 h-6 text-blue-600" />
                                ストレージ設定
                            </h2>
                            <p className="text-slate-500 text-sm">
                                マニュアルやカテゴリー情報の保存先（NASやローカルフォルダ）を設定します。
                            </p>
                        </section>

                        <section className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                <HardDrive className="w-4 h-4" />
                                データベースのバックアップ
                            </h3>
                            <p className="text-sm text-slate-600 mb-4">
                                データベースをファイルとして保存・復元できます。
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={handleManualSave}
                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-95"
                                >
                                    <Save className="w-5 h-5" />
                                    バックアップを保存
                                </button>
                                <button
                                    onClick={handleManualLoad}
                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all border border-slate-200"
                                >
                                    <FolderOpen className="w-5 h-5" />
                                    バックアップから復元
                                </button>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-orange-500" />
                                メンテナンス・トラブルシューティング
                            </h3>
                            <div className="p-6 bg-orange-50 rounded-xl border border-orange-100 space-y-4">
                                <p className="text-xs text-orange-700">
                                    アプリが強制終了した場合などに、編集権限（ロック）が残ってしまうことがあります。
                                    通常は各画面の警告から解除できますが、ここで一括解除することも可能です。
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={async () => {
                                            if (window.confirm('カテゴリ構成のロックを強制解除しますか？')) {
                                                await useCategoryStore.getState().forceReleaseGlobalLock();
                                                alert('解除しました。');
                                            }
                                        }}
                                        className="px-4 py-2 bg-white border border-orange-200 text-orange-700 rounded-lg text-sm font-bold hover:bg-orange-100 transition-colors"
                                    >
                                        カテゴリロックを解除
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (window.confirm('すべてのマニュアルの編集ロックを強制解除しますか？\\n（※現在誰かが本当に編集中の場合、その人の保存が失敗する可能性があります）')) {
                                                await window.electron.ipcRenderer.invoke('manuals:forceReleaseAllLocks');
                                                alert('すべてのマニュアルロックを解除しました。');
                                            }
                                        }}
                                        className="px-4 py-2 bg-white border border-orange-200 text-orange-700 rounded-lg text-sm font-bold hover:bg-orange-100 transition-colors"
                                    >
                                        全マニュアルロック解除
                                    </button>
                                </div>
                            </div>
                        </section>

                        {status.type !== 'idle' && (
                            <div className={`p-4 rounded-xl flex items-center gap-3 animate-in zoom-in-95 duration-200 ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                                }`}>
                                {status.type === 'success' ? <ShieldCheck className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                <span className="text-sm font-medium">{status.message}</span>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'categories' && (
                    <div className="h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <MasterTableView />
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsView;
