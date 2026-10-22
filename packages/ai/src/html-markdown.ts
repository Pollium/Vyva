import { ASSET_SCHEME } from '@pollium/vyva-core/markdown-blocks';
import { protectMath } from '@pollium/vyva-core/math';
import { gfm } from '@joplin/turndown-plugin-gfm';
import TurndownService from 'turndown';

export const PAGE_BREAK_MARKER = '[page break]';

const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': '\'' };

const isPageBreak = (node: HTMLElement): boolean => node.nodeName === 'DIV' && node.getAttribute('data-type') === 'page-break';
const isBlock = (node: HTMLElement): boolean => 'isBlock' in node && node.isBlock === true;

const turndown = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    strongDelimiter: '**',
    blankReplacement: (_content, node) => isPageBreak(node) ? `\n\n${PAGE_BREAK_MARKER}\n\n` : isBlock(node) ? '\n\n' : ''
});

turndown.use(gfm);

turndown.addRule('fileImage', {
    filter: (node) => node.nodeName === 'IMG' && node.getAttribute('data-file-id') !== null,
    replacement: (_content, node) => `![${node.getAttribute('alt') ?? ''}](${ASSET_SCHEME}${node.getAttribute('data-file-id') ?? ''})`
});

turndown.addRule('taskItem', {
    filter: (node) => node.nodeName === 'LI' && node.getAttribute('data-type') === 'taskItem',
    replacement: (content, node) => `- [${node.getAttribute('data-checked') === 'true' ? 'x' : ' '}] ${content.trim()}\n`
});

const unescaped = (source: string): string => source.replace(/&(?:amp|lt|gt|quot|#39);/g, (entity) => ENTITIES[entity] ?? entity);

export const htmlToMarkdown = (html: string): string => {
    const math = protectMath(html);

    return math.restore(turndown.turndown(math.text), unescaped).trim();
};
