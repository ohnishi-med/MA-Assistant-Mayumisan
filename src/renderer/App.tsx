import React, { useState, useEffect } from 'react';
import { Layout, ClipboardList, Settings, Eye } from 'lucide-react';
import FlowEditor from './features/editor/FlowEditor';
import GuidePlayer from './features/player/GuidePlayer';
import MermaidView from './features/mermaid/MermaidView';
import MasterTableView from './features/master/MasterTableView';
import SettingsView from './features/settings/SettingsView';
import { useManualStore } from './store/useManualStore';
import { CategoryTree } from './features/sidebar/CategoryTree';
import { Breadcrumbs } from './components/Breadcrumbs';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'editor' | 'player' | 'mermaid' | 'master' | 'settings'>('editor');
  const fetchManuals = useManualStore((state: any) => state.fetchManuals);
  const loadManual = useManualStore((state: any) => state.loadManual);

  useEffect(() => {
    fetchManuals();
  }, [fetchManuals]);

  const handleManualSelect = async (id: number, categoryId: number) => {
    console.log('[App] Manual selected:', id, 'categoryId:', categoryId);
    await loadManual(id, categoryId);
    console.log('[App] Manual loaded, switching to player tab');
    setActiveTab('player');
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <ClipboardList className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">医療事務サポート まゆみさん</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('settings')}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <Settings className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 bg-white border-r flex flex-col shadow-sm">
          <nav className="p-4 flex flex-col gap-1 border-b">
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${activeTab === 'editor'
                ? 'bg-blue-50 text-blue-700 font-bold'
                : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              <Layout className="w-4 h-4" />
              <span className="text-sm">フロー編集</span>
            </button>
            <button
              onClick={() => setActiveTab('player')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${activeTab === 'player'
                ? 'bg-blue-50 text-blue-700 font-bold'
                : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              <Eye className="w-4 h-4" />
              <span className="text-sm">ガイド実行</span>
            </button>
            <button
              onClick={() => setActiveTab('master')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${activeTab === 'master'
                ? 'bg-blue-50 text-blue-700 font-bold'
                : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span className="text-sm">カテゴリ管理</span>
            </button>
          </nav>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-3 bg-slate-50/50 border-b flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Navigation</span>
            </div>
            <CategoryTree onManualSelect={handleManualSelect} />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-hidden flex flex-col">
          {(activeTab === 'editor' || activeTab === 'player') && <Breadcrumbs />}
          {activeTab === 'editor' && <FlowEditor />}
          {activeTab === 'player' && <GuidePlayer />}
          {activeTab === 'mermaid' && <MermaidView />}
          {activeTab === 'master' && <MasterTableView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
};

export default App;
