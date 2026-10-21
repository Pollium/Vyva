import type { Editor } from '@tiptap/react';

export const BLOCK_STYLES = ['paragraph', 'h1', 'h2', 'h3', 'h4', 'quote', 'code'] as const;

export type BlockStyle = typeof BLOCK_STYLES[number];

const HEADING_LEVELS = [1, 2, 3, 4] as const;

type HeadingLevel = typeof HEADING_LEVELS[number];

export const headingLevelOf = (style: BlockStyle): HeadingLevel | undefined => HEADING_LEVELS.find((level) => style === `h${level}`);

export const blockStyleOf = (editor: Editor): BlockStyle => {
    const level = HEADING_LEVELS.find((value) => editor.isActive('heading', { level: value }));
    if(level !== undefined) return `h${level}`;
    if(editor.isActive('blockquote')) return 'quote';
    if(editor.isActive('codeBlock')) return 'code';

    return 'paragraph';
};

export const settleSelection = (editor: Editor) => {
    const { to } = editor.state.selection;
    editor.chain().setTextSelection(to).run();
};
