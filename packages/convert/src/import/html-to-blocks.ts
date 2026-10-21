import { cleanHtml } from '../clean-html';
import { titleOf } from './titles';
import type { DocumentBlock } from '@vyva/core/content';
import { newId } from '@vyva/core/ids';
import { DomUtils, parseDocument } from 'htmlparser2';

type ChildNode = ReturnType<typeof parseDocument>['children'][number];

const BLOCK_TAGS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'table', 'pre', 'blockquote', 'hr', 'div', 'img']);
const HEADINGS = new Set(['h5', 'h6']);
const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': '\'' };

export const htmlToBlocks = (html: string): DocumentBlock[] => {
    const blocks: DocumentBlock[] = [];
    let loose: ChildNode[] = [];

    const push = (outer: string) => {
        const cleaned = cleanHtml(outer);
        if(cleaned !== '' && cleaned !== '<p></p>') blocks.push({ id: newId(), html: cleaned });
    };
    const flush = () => {
        const inner = loose.map((node) => DomUtils.getOuterHTML(node)).join('').trim();
        loose = [];
        if(inner !== '') push(`<p>${inner}</p>`);
    };

    for(const node of parseDocument(html).children){
        if(DomUtils.isTag(node) && (BLOCK_TAGS.has(node.name) || HEADINGS.has(node.name))){
            flush();
            push(HEADINGS.has(node.name) ? `<h4>${DomUtils.getInnerHTML(node)}</h4>` : DomUtils.getOuterHTML(node));
        }else{
            loose.push(node);
        }
    }
    flush();

    return blocks;
};

export const titleFrom = (blocks: DocumentBlock[], filename: string): string => {
    const heading = blocks.find((block) => /^<h[1-3]/.test(block.html));
    const text = heading === undefined ? '' : heading.html.replace(/<[^>]+>/g, '').replace(/&(?:amp|lt|gt|quot|#39);/g, (entity) => ENTITIES[entity] ?? entity);

    return titleOf(text, filename);
};

export const paragraphsHtml = (text: string): string => text
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter((part) => part !== '')
    .map((part) => `<p>${part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</p>`)
    .join('');
