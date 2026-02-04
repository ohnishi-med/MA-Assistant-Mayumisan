import React, { useState, useEffect } from 'react';
import { Layout, ClipboardList, Settings, Eye, Home } from 'lucide-react';
import FlowEditor from './features/editor/FlowEditor';
import GuidePlayer from './features/player/GuidePlayer';
import MermaidView from './features/mermaid/MermaidView';
import MasterTableView from './features/master/MasterTableView';
import SettingsView from './features/settings/SettingsView';
import UserManualView from './features/help/UserManualView';
import { CategoryGridView } from './features/home/CategoryGridView';
import { useManualStore } from './store/useManualStore';
import { CategoryTree } from './features/sidebar/CategoryTree';
import { Breadcrumbs } from './components/Breadcrumbs';

const App: React.FC = () => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const [activeTab, setActiveTab] = useState<'home' | 'editor' | 'player' | 'mermaid' | 'master' | 'settings' | 'help'>('home');
  const [lastActiveTab, setLastActiveTab] = useState<'home' | 'editor' | 'player' | 'mermaid' | 'master' | 'settings'>('home');
  const [homeCategoryId, setHomeCategoryId] = useState<number | null>(null);

  const fetchManuals = useManualStore((state: any) => state.fetchManuals);
  const loadManual = useManualStore((state: any) => state.loadManual);
  /* eslint-enable @typescript-eslint/no-explicit-any */

  useEffect(() => {
    fetchManuals();
  }, [fetchManuals]);

  const handleManualSelect = async (id: number, categoryId: number) => {
    console.log('[App] Manual selected:', id, 'categoryId:', categoryId);
    await loadManual(id, categoryId);
    setHomeCategoryId(categoryId);
    console.log('[App] Manual loaded, switching to player tab');
    setActiveTab('player');
  };

  const handleBreadcrumbNavigate = (type: 'home' | 'category', id?: number) => {
    if (type === 'home') {
      setHomeCategoryId(null);
      setActiveTab('home');
    } else {
      setHomeCategoryId(id ?? null);
      setActiveTab('home');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 relative">
      {/* Fullscreen Help Overlay */}
      {activeTab === 'help' && (
        <div className="fixed inset-0 z-50 bg-white">
          <UserManualView onClose={() => setActiveTab(lastActiveTab)} />
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('home')}
            className="bg-blue-600 p-2 rounded-lg hover:bg-blue-700 transition-colors shadow-blue-200 shadow-lg"
          >
            <Home className="text-white w-6 h-6" />
          </button>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">医療事務サポート まゆみさん</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (activeTab !== 'help') {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setLastActiveTab(activeTab as any);
                setActiveTab('help');
              }
            }}
            className={`px-4 py-2 rounded-full transition-colors font-bold text-sm flex items-center gap-2 ${activeTab === 'help' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'
              }`}
          >
            使い方
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 bg-white border-r flex flex-col shadow-sm">
          <nav className="p-4 flex flex-col gap-1 border-b">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${activeTab === 'home'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-100'
                : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              <Home className="w-4 h-4" />
              <span className="text-sm">ホーム</span>
            </button>
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
            <CategoryTree
              onManualSelect={handleManualSelect}
              onCategorySelect={(categoryId) => {
                setHomeCategoryId(categoryId);
                setActiveTab('home');
              }}
            />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden flex flex-col bg-slate-50/30">
          <Breadcrumbs onNavigate={handleBreadcrumbNavigate} />
          <div className="flex-1 overflow-auto">
            {activeTab === 'home' && (
              <CategoryGridView
                onManualSelect={handleManualSelect}
                currentId={homeCategoryId}
                onIdChange={setHomeCategoryId}
              />
            )}
            {activeTab === 'editor' && <div className="p-6 h-full"><FlowEditor /></div>}
            {activeTab === 'player' && <div className="p-6 h-full"><GuidePlayer /></div>}
            {activeTab === 'mermaid' && <div className="p-6 h-full"><MermaidView /></div>}
            {activeTab === 'master' && <div className="p-6 h-full"><MasterTableView /></div>}
            {activeTab === 'settings' && <div className="p-6 h-full"><SettingsView /></div>}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
