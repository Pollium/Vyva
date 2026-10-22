import type { DocumentBlock } from '@pollium/vyva-core/content';
import { withImageSources, type FileUrl } from '@pollium/vyva-core/render';

const BLOCK_ID = 'data-block-id';
const OPENING_TAG = /^<([a-z][a-z0-9]*)(\s|>)/i;

export const blocksToEditorHtml = (blocks: DocumentBlock[], fileUrl: FileUrl): string => blocks
    .map((block) => withImageSources(block.html, fileUrl).replace(OPENING_TAG, (_match, tag: string, after: string) => `<${tag} ${BLOCK_ID}="${block.id}"${after}`))
    .join('');

export const editorHtmlToBlocks = (html: string): DocumentBlock[] => {
    const body = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html').body;
    const seen = new Set<string>();

    return [...body.children].map((element) => {
        const given = element.getAttribute(BLOCK_ID) ?? '';
        element.removeAttribute(BLOCK_ID);
        element.querySelectorAll('img[src]').forEach((image) => image.removeAttribute('src'));

        const id = given !== '' && !seen.has(given) ? given : '';
        if(id !== '') seen.add(id);

        return { id: id === '' ? `n${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}` : id, html: element.outerHTML };
    });
};
