import React from 'react';
import {
    MDXEditor,
    headingsPlugin,
    listsPlugin,
    quotePlugin,
    thematicBreakPlugin,
    markdownShortcutPlugin,
    toolbarPlugin,
    BoldItalicUnderlineToggles,
    ListsToggle,
    BlockTypeSelect,
    CreateLink,
    InsertTable,
    tablePlugin,
    ButtonWithTooltip
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import { Image as ImageIcon } from 'lucide-react';

interface MarkdownEditorProps {
    markdown: string;
    onChange: (markdown: string) => void;
    onAddImage?: () => void;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ markdown, onChange, onAddImage }) => {
    return (
        <div className="mdx-editor-wrapper bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
            <MDXEditor
                markdown={markdown}
                onChange={onChange}
                contentEditableClassName="prose prose-slate max-w-none p-4 min-h-[300px] focus:outline-none"
                plugins={[
                    headingsPlugin(),
                    listsPlugin(),
                    quotePlugin(),
                    thematicBreakPlugin(),
                    tablePlugin(),
                    markdownShortcutPlugin(),
                    toolbarPlugin({
                        toolbarContents: () => (
                            <>
                                <BoldItalicUnderlineToggles />
                                <div className="mx-1 w-px h-4 bg-slate-200" />
                                <ListsToggle />
                                <div className="mx-1 w-px h-4 bg-slate-200" />
                                <BlockTypeSelect />
                                <div className="mx-1 w-px h-4 bg-slate-200" />
                                <InsertTable />
                                <div className="mx-1 w-px h-4 bg-slate-200" />
                                {onAddImage && (
                                    <ButtonWithTooltip
                                        title="画像を追加"
                                        onClick={onAddImage}
                                    >
                                        <ImageIcon className="w-4 h-4" />
                                    </ButtonWithTooltip>
                                )}
                            </>
                        )
                    })
                ]}
            />
        </div>
    );
};

export default MarkdownEditor;
