import { EditRefused } from './errors';
import { htmlToMarkdown } from './html-markdown';
import type { DocumentBlock, DocumentContent } from '@vyva/core/content';
import { newId } from '@vyva/core/ids';
import { markdownToBlocks } from '@vyva/core/markdown-blocks';

export type DocumentOperation =
    | { op: 'replace'; blockId: string; markdown: string }
    | { op: 'insert_after'; blockId: string | null; markdown: string }
    | { op: 'append'; markdown: string }
    | { op: 'delete'; blockId: string };

export interface DocumentForModel{
    blocks: Array<{ id: string; markdown: string }>;
    totalBlocks: number;
    isTruncated: boolean;
}

const PAGE_BREAK_LINE = /^\s*\[page break\]\s*$/gim;

export const documentBlocksFrom = (markdown: string): DocumentBlock[] =>
    markdown.split(PAGE_BREAK_LINE).flatMap((part, index) => [
        ...(index === 0 ? [] : [{ id: newId(), html: '<div data-type="page-break"></div>' }]),
        ...markdownToBlocks(part)
    ]);

const indexOf = (blocks: DocumentBlock[], blockId: string): number => {
    const index = blocks.findIndex((block) => block.id === blockId);
    if(index === -1) throw new EditRefused(`There is no block "${blockId}". Read the document again to get the current block ids.`);

    return index;
};

const applyOne = (blocks: DocumentBlock[], operation: DocumentOperation): DocumentBlock[] => {
    if(operation.op === 'append') return [...blocks, ...documentBlocksFrom(operation.markdown)];
    if(operation.op === 'insert_after'){
        const at = operation.blockId === null ? 0 : indexOf(blocks, operation.blockId) + 1;
        return [...blocks.slice(0, at), ...documentBlocksFrom(operation.markdown), ...blocks.slice(at)];
    }

    const at = indexOf(blocks, operation.blockId);
    const replacement = operation.op === 'delete' ? [] : documentBlocksFrom(operation.markdown);
    return [...blocks.slice(0, at), ...replacement, ...blocks.slice(at + 1)];
};

export const applyDocumentOperations = (content: DocumentContent, operations: DocumentOperation[]): DocumentContent =>
    ({ ...content, blocks: operations.reduce(applyOne, content.blocks) });

export const documentForModel = (content: DocumentContent, maxChars: number): DocumentForModel => {
    let used = 0;
    const blocks: DocumentForModel['blocks'] = [];
    for(const block of content.blocks){
        const markdown = htmlToMarkdown(block.html);
        if(used + markdown.length > maxChars && blocks.length > 0) break;

        used += markdown.length;
        blocks.push({ id: block.id, markdown });
    }

    return { blocks, totalBlocks: content.blocks.length, isTruncated: blocks.length < content.blocks.length };
};
