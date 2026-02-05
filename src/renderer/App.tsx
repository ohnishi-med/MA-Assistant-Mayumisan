import React, { useState, useEffect } from 'react';
import { Settings, Home, PanelLeftClose, PanelLeft, Search, X } from 'lucide-react';
import SettingsView from './features/settings/SettingsView';
import UserManualView from './features/help/UserManualView';
import { CategoryGridView } from './features/home/CategoryGridView';
import { useManualStore } from './store/useManualStore';
import { CategoryTree } from './features/sidebar/CategoryTree';
import { Breadcrumbs } from './components/Breadcrumbs';
import GuidePlayer from './features/player/GuidePlayer';

const App: React.FC = () => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const [activeTab, setActiveTab] = useState<'home' | 'settings' | 'help' | 'player' | 'editor' | 'master'>('home');
  const [lastActiveTab, setLastActiveTab] = useState<'home' | 'settings'>('home');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchManuals = useManualStore((state: any) => state.fetchManuals);
  const loadManual = useManualStore((state: any) => state.loadManual);
  const searchManuals = useManualStore((state: any) => state.searchManuals);
  const clearSearch = useManualStore((state: any) => state.clearSearch);
  const activeCategoryId = useManualStore((state: any) => state.activeCategoryId);
  const setActiveCategoryId = useManualStore((state: any) => state.setActiveCategoryId);
  const clearCurrentManual = useManualStore((state: any) => state.clearCurrentManual);

  useEffect(() => {
    fetchManuals();
  }, [fetchManuals]);

  const handleManualSelect = async (id: number, categoryId: number) => {
    console.log('[App] Manual selected:', id, 'categoryId:', categoryId);
    await loadManual(id, categoryId);
    setActiveTab('player');
  };

  const handleSearchTrigger = () => {
    const query = inputValue.trim();
    setSearchQuery(query);
    if (query) {
      searchManuals(query);
      if (activeTab !== 'home') setActiveTab('home');
    } else {
      clearSearch();
    }
  };

  const handleBreadcrumbNavigate = (type: 'home' | 'category', id?: number) => {
    if (type === 'home') {
      setActiveCategoryId(null);
      clearCurrentManual();
    } else {
      setActiveCategoryId(id ?? null);
      clearCurrentManual();
    }
    setActiveTab('home');
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setActiveTab('home');
                setActiveCategoryId(null);
                clearCurrentManual();
              }}
              className="bg-blue-600 p-2 rounded-lg hover:bg-blue-700 transition-colors shadow-blue-200 shadow-lg"
            >
              <Home className="text-white w-6 h-6" />
            </button>
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">医療事務サポート まゆみさん</h1>
        </div>
        <div className="flex items-center gap-4 flex-1 justify-end">
          {/* Search Bar */}
          <div className="relative group max-w-xs w-full transition-all duration-300 focus-within:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="マニュアルを検索..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearchTrigger();
                }
              }}
              className="block w-full pl-10 pr-10 py-2 bg-slate-100 border-transparent border focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 rounded-full text-sm transition-all outline-none"
            />
            {inputValue && (
              <button
                onClick={() => {
                  setInputValue('');
                  setSearchQuery('');
                  clearSearch();
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => {
              if (activeTab !== 'help') {
                if (activeTab !== 'player') setLastActiveTab(activeTab as any);
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
            className={`p-2 hover:bg-slate-100 rounded-full transition-colors ${activeTab === 'settings' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`${isSidebarCollapsed ? 'w-16' : 'w-72'} bg-white border-r flex flex-col shadow-sm transition-all duration-300 overflow-hidden`}>
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className={`px-4 py-3 bg-slate-50/50 border-b flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
              {!isSidebarCollapsed ? (
                <>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Navigation</span>
                  <button
                    onClick={() => setIsSidebarCollapsed(true)}
                    className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors hover:text-blue-600"
                    title="サイドバーを折りたたむ"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-lg text-slate-400 transition-colors hover:text-blue-600"
                  title="サイドバーを広げる"
                >
                  <PanelLeft className="w-5 h-5" />
                </button>
              )}
            </div>
            <CategoryTree
              onManualSelect={handleManualSelect}
              onCategorySelect={(id) => {
                setActiveCategoryId(id);
                clearCurrentManual();
                setActiveTab('home');
              }}
              isCollapsed={isSidebarCollapsed}
            />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden flex flex-col bg-slate-50/30">
          {(activeTab === 'home' || activeTab === 'player') && (
            <Breadcrumbs onNavigate={handleBreadcrumbNavigate} />
          )}
          <div className="flex-1 overflow-auto">
            {activeTab === 'home' && (
              <CategoryGridView
                onManualSelect={handleManualSelect}
                currentId={activeCategoryId}
                onIdChange={(id) => {
                  setActiveCategoryId(id);
                  clearCurrentManual();
                }}
                searchQuery={searchQuery}
              />
            )}
            {activeTab === 'player' && <GuidePlayer />}
            {activeTab === 'settings' && <div className="p-6 h-full overflow-hidden"><SettingsView /></div>}
            {activeTab === 'help' && <UserManualView onClose={() => setActiveTab(lastActiveTab)} />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
