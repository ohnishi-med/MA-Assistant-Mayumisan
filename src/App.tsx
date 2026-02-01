import React, { useState } from 'react';
import { Layout, ClipboardList, Settings, Eye, Share2 } from 'lucide-react';
import FlowEditor from './features/editor/FlowEditor';
import GuidePlayer from './features/player/GuidePlayer';
import MermaidView from './features/mermaid/MermaidView';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'editor' | 'player' | 'mermaid'>('editor');

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
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <Share2 className="w-5 h-5 text-slate-600" />
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <Settings className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r flex flex-col shadow-sm">
          <nav className="flex-1 p-4 flex flex-col gap-2">
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'editor'
                ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-blue-600'
                : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              <Layout className="w-5 h-5" />
              <span>フロー編集</span>
            </button>
            <button
              onClick={() => setActiveTab('player')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'player'
                ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-blue-600'
                : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              <Eye className="w-5 h-5" />
              <span>ガイド実行</span>
            </button>
            <button
              onClick={() => setActiveTab('mermaid')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'mermaid'
                ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-blue-600'
                : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              <Share2 className="w-5 h-5" />
              <span>全体図 (Mermaid)</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-hidden flex flex-col">
          {activeTab === 'editor' && <FlowEditor />}
          {activeTab === 'player' && <GuidePlayer />}
          {activeTab === 'mermaid' && <MermaidView />}
        </main>
      </div>
    </div>
  );
};

export default App;
