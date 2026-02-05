import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Download } from 'lucide-react';
import { useManualStore } from '../../store/useManualStore';

mermaid.initialize({
    startOnLoad: true,
    theme: 'base',
    themeVariables: {
        primaryColor: '#3b82f6',
        primaryTextColor: '#fff',
        lineColor: '#647482',
        secondaryColor: '#f8fafc',
        tertiaryColor: '#fff',
    }
});

const MermaidView: React.FC = () => {
    // const { getNodes, getEdges } = useWorkflowStore();
    const currentManual = useManualStore((state: any) => state.currentManual);
    const nodes = currentManual?.flowchart_data?.nodes || [];
    const edges = currentManual?.flowchart_data?.edges || [];
    const mermaidRef = useRef<HTMLDivElement>(null);

    const generateMermaidString = () => {
        let diagram = 'graph TD\n';

        // Add nodes
        nodes.forEach((node: any) => {
            const label = node.data.label as string;
            // Escape parentheses in labels for mermaid
            const safeLabel = label.replace(/\(/g, '[').replace(/\)/g, ']');
            diagram += `  ${node.id} ["${safeLabel}"]\n`;
        });

        // Add edges
        edges.forEach((edge: any) => {
            if (edge.label) {
                diagram += `  ${edge.source} -- "${edge.label}" --> ${edge.target} \n`;
            } else {
                diagram += `  ${edge.source} --> ${edge.target} \n`;
            }
        });

        return diagram;
    };

    useEffect(() => {
        const renderMermaid = async () => {
            if (mermaidRef.current) {
                mermaidRef.current.innerHTML = '';
                const diagram = generateMermaidString();
                try {
                    const { svg } = await mermaid.render(`mermaid - ${Date.now()} `, diagram);
                    mermaidRef.current.innerHTML = svg;
                } catch (error) {
                    console.error('Mermaid render error:', error);
                    mermaidRef.current.innerHTML = '<div class="text-red-500">図を生成できませんでした。フローの接続を確認してください。</div>';
                }
            }
        };

        renderMermaid();
    }, [nodes, edges]);

    return (
        <div className="flex-1 flex flex-col bg-white rounded-lg border shadow-sm p-6 overflow-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">全体俯瞰図</h2>
                    <p className="text-sm text-slate-500">Mermaid.js を使用して業務フローを自動生成しています</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors">
                    <Download className="w-4 h-4" />
                    <span className="text-sm font-medium">画像として保存</span>
                </button>
            </div>

            <div className="flex-1 flex items-center justify-center p-4 border rounded-lg bg-slate-50 min-h-[400px]">
                <div ref={mermaidRef} className="max-w-full overflow-auto"></div>
            </div>
        </div>
    );
};

export default MermaidView;
