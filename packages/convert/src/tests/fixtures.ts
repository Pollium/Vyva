import type { StoredImage } from '../export/bundle';
import type { DeckContent, DocumentContent } from '@vyva/core/content';
import { layoutSlide } from '@vyva/core/slide-layouts';
import { DECK_THEME, DEFAULT_DOCUMENT_DESIGN } from '@vyva/core/themes';

export const PNG_BYTES = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c636000000000050001a5f645400000000049454e44ae426082', 'hex');

export const FILE_ID = '01a14188-5cb4-776b-815b-c6e977d07bbe';

export const readImage = async (fileId: string): Promise<StoredImage | null> =>
    fileId === FILE_ID ? { data: PNG_BYTES, contentType: 'image/png' } : null;

export const SAMPLE_DOCUMENT: DocumentContent = {
    kind: 'document',
    design: { ...DEFAULT_DOCUMENT_DESIGN, font: 'Lora', headerText: 'Networks · Unit 1', footerText: 'Internal use', showPageNumbers: true },
    blocks: [
        { id: 'a', html: '<h1>Subnetting IPv4</h1>' },
        { id: 'b', html: '<p>A <strong>/24</strong> network has <span style="color:#d1242f">254</span> hosts. <a href="https://example.org">More</a></p>' },
        { id: 'c', html: '<ul><li><p>Class A</p></li><li><p>Class B</p></li></ul>' },
        { id: 'd', html: '<table><tbody><tr><th><p>Prefix</p></th><th><p>Hosts</p></th></tr><tr><td><p>/24</p></td><td><p>254</p></td></tr></tbody></table>' },
        { id: 'e', html: '<pre><code class="language-bash">ip addr show</code></pre>' },
        { id: 'f', html: `<p><img alt="Topology" data-file-id="${FILE_ID}"></p>` },
        { id: 'g', html: '<div data-type="page-break"></div>' },
        { id: 'h', html: '<h2>Appendix</h2>' }
    ]
};

export const SAMPLE_DECK: DeckContent = {
    kind: 'deck',
    format: '16:9',
    theme: DECK_THEME,
    slides: [
        layoutSlide({ layout: 'title', title: 'Subnetting IPv4', subtitle: 'Unit 1' }, '16:9', DECK_THEME),
        layoutSlide({ layout: 'image-right', title: 'Topology', bullets: ['Router', 'Switch'], imageFileId: FILE_ID, imageAlt: 'Topology' }, '16:9', DECK_THEME),
        layoutSlide({ layout: 'table', title: 'Prefixes', rows: [['Prefix', 'Hosts'], ['/24', '254']] }, '16:9', DECK_THEME)
    ]
};
