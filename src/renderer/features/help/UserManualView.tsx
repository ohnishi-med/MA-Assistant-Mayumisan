import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { BookOpen, Edit3, Settings, HelpCircle, ChevronRight, Menu, X, ChevronDown } from 'lucide-react';

// Import markdown content directly using Vite's ?raw suffix
import manualViewing from '../../assets/docs/manual-viewing.md?raw';
import manualEditing from '../../assets/docs/manual-editing.md?raw';
import manualSettings from '../../assets/docs/manual-settings.md?raw';

interface UserManualViewProps {
    onClose: () => void;
}

type SectionKey = 'viewing' | 'editing' | 'settings';

interface NavItem {
    id: string; // Scroll target ID
    title: string;
}

interface NavSection {
    key: SectionKey;
    title: string;
    icon: React.ReactNode;
    items: NavItem[];
}

const UserManualView: React.FC<UserManualViewProps> = ({ onClose }) => {
    const [activeSection, setActiveSection] = useState<SectionKey>('viewing');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [targetScrollId, setTargetScrollId] = useState<string | null>(null);
    const [expandedSection, setExpandedSection] = useState<SectionKey | null>('viewing');

    const contentRef = useRef<HTMLDivElement>(null);

    const navSections: NavSection[] = [
        {
            key: 'viewing',
            title: '1. マニュアルの閲覧',
            icon: <BookOpen className="w-4 h-4" />,
            items: [
                { id: 'section-1-1', title: '1.1 ホーム画面から探す' },
                { id: 'section-1-2', title: '1.2 サイドバーから探す' },
                { id: 'section-1-3', title: '1.3 全文検索機能' },
                { id: 'section-1-4', title: '1.4 閲覧モード' },
                { id: 'section-1-5', title: '1.5 お気に入り登録' },
            ]
        },
        {
            key: 'editing',
            title: '2. マニュアルの編集',
            icon: <Edit3 className="w-4 h-4" />,
            items: [
                { id: 'section-2-1', title: '2.1 新規作成' },
                { id: 'section-2-2', title: '2.2 編集モードへの切り替え' },
                { id: 'section-2-3', title: '2.3 内容の編集' },
                { id: 'section-2-4', title: '2.4 ステップの追加・削除' },
                { id: 'section-2-5', title: '2.5 保存' },
            ]
        },
        {
            key: 'settings',
            title: '3. 設定・バックアップ',
            icon: <Settings className="w-4 h-4" />,
            items: [
                { id: 'section-3-1', title: '3.1 保存先フォルダの設定' },
                { id: 'section-3-2', title: '3.2 自動保存' },
                { id: 'section-3-3', title: '3.3 手動バックアップ' },
            ]
        },
    ];

    const handleNavClick = (sectionKey: SectionKey, scrollId?: string) => {
        setActiveSection(sectionKey);
        setExpandedSection(sectionKey);
        if (scrollId) {
            setTargetScrollId(scrollId);
        } else {
            // If main section clicked, scroll to top
            if (contentRef.current) {
                contentRef.current.scrollTop = 0;
            }
        }
        setIsMobileMenuOpen(false);
    };

    // Handle scrolling after content render
    useEffect(() => {
        if (targetScrollId) {
            // Small delay to ensure markdown is rendered
            const timer = setTimeout(() => {
                const element = document.getElementById(targetScrollId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                setTargetScrollId(null);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [activeSection, targetScrollId]);

    const getCurrentContent = () => {
        switch (activeSection) {
            case 'viewing': return manualViewing;
            case 'editing': return manualEditing;
            case 'settings': return manualSettings;
            default: return manualViewing;
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 relative overflow-hidden">
            {/* Header / Toolbar */}
            <div className="bg-white border-b px-6 py-3 flex items-center justify-between shadow-sm z-20 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg">
                        <HelpCircle className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="font-bold text-lg text-slate-800">使い方ガイド</h1>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full font-bold text-sm transition-colors"
                    >
                        <X className="w-4 h-4" />
                        アプリに戻る
                    </button>
                    <button
                        className="md:hidden p-2 text-slate-600"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Sidebar Navigation */}
                <aside className={`
                    absolute md:relative z-10 h-full w-72 bg-white border-r shadow-sm flex flex-col transition-transform duration-300
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                `}>
                    <div className="p-4 border-b bg-slate-50/50">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Table of Contents</p>
                    </div>
                    <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                        {navSections.map((section) => (
                            <div key={section.key} className="mb-2">
                                <button
                                    onClick={() => handleNavClick(section.key)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all text-left mb-1 ${activeSection === section.key
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-slate-700 hover:bg-slate-50'
                                        }`}
                                >
                                    {section.icon}
                                    {section.title}
                                    {activeSection === section.key ?
                                        <ChevronDown className="w-4 h-4 ml-auto" /> :
                                        <ChevronRight className="w-4 h-4 ml-auto text-slate-400" />
                                    }
                                </button>

                                {expandedSection === section.key && (
                                    <div className="ml-4 border-l-2 border-slate-100 pl-2 space-y-1">
                                        {section.items.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleNavClick(section.key, item.id);
                                                }}
                                                className="w-full text-left px-3 py-2 text-sm text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-md transition-colors truncate"
                                                title={item.title}
                                            >
                                                {item.title}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main ref={contentRef} className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8 scroll-smooth" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 min-h-full p-8 md:p-12">
                        <div className="prose prose-slate max-w-none 
                            prose-headings:font-bold prose-headings:text-slate-800
                            prose-h1:text-3xl prose-h1:mb-8 prose-h1:border-b-2 prose-h1:pb-4 prose-h1:border-blue-500
                            prose-h2:text-xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:bg-slate-50 prose-h2:p-4 prose-h2:rounded-lg prose-h2:border-l-4 prose-h2:border-blue-500
                            prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-4 prose-h3:text-blue-700
                            prose-p:leading-relaxed prose-p:text-slate-600
                            prose-strong:text-slate-900 prose-strong:font-black prose-strong:bg-yellow-50 prose-strong:px-1 prose-strong:rounded
                            prose-ul:my-4 prose-li:my-1
                            prose-a:text-blue-600 hover:prose-a:text-blue-700">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm, remarkBreaks]}
                                components={{
                                    h2: ({ ...props }) => {
                                        // Generate ID from content
                                        let id = '';
                                        const text = props.children?.toString() || '';

                                        // Simple mapping based on numbering
                                        if (text.includes('1.1')) id = 'section-1-1';
                                        else if (text.includes('1.2')) id = 'section-1-2';
                                        else if (text.includes('1.3')) id = 'section-1-3';
                                        else if (text.includes('1.4')) id = 'section-1-4';
                                        else if (text.includes('1.5')) id = 'section-1-5';
                                        else if (text.includes('2.1')) id = 'section-2-1';
                                        else if (text.includes('2.2')) id = 'section-2-2';
                                        else if (text.includes('2.3')) id = 'section-2-3';
                                        else if (text.includes('2.4')) id = 'section-2-4';
                                        else if (text.includes('2.5')) id = 'section-2-5';
                                        else if (text.includes('3.1')) id = 'section-3-1';
                                        else if (text.includes('3.2')) id = 'section-3-2';
                                        else if (text.includes('3.3')) id = 'section-3-3';

                                        return <h2 id={id} className="scroll-mt-6" {...props} />;
                                    },
                                    table: ({ ...props }) => (
                                        <div className="overflow-x-auto my-6 border rounded-lg bg-slate-50">
                                            <table className="min-w-full divide-y divide-slate-200 text-sm" {...props} />
                                        </div>
                                    ),
                                    thead: ({ ...props }) => <thead className="bg-blue-50 text-blue-900" {...props} />,
                                    th: ({ ...props }) => <th className="px-4 py-2 text-left font-bold border-b border-blue-100" {...props} />,
                                    td: ({ ...props }) => <td className="px-4 py-2 border-b border-slate-100 last:border-0" {...props} />,
                                    img: ({ ...props }) => <img className="rounded-lg shadow-md border my-4" {...props} alt={props.alt || ''} />,
                                }}
                            >
                                {getCurrentContent()}
                            </ReactMarkdown>
                        </div>

                        <div className="mt-24 pt-8 border-t text-center text-slate-400 text-sm">
                            &copy; 2026 MA-Assistant Mayumisan <br />
                            Ver. 1.0.0
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default UserManualView;
