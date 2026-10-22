import type { StoredImage } from '../export/bundle';
import type { DeckContent, DocumentContent } from '@pollium/vyva-core/content';
import { layoutSlide } from '@pollium/vyva-core/slide-layouts';
import { DECK_THEME, DEFAULT_DOCUMENT_DESIGN } from '@pollium/vyva-core/themes';
import PptxGenJS from 'pptxgenjs';

export const PNG_BYTES = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c636000000000050001a5f645400000000049454e44ae426082', 'hex');

export const FILE_ID = '01a14188-5cb4-776b-815b-c6e977d07bbe';

export const FAKE_PDF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');

export const readImage = async (fileId: string): Promise<StoredImage | null> =>
    fileId === FILE_ID ? { data: PNG_BYTES, contentType: 'image/png' } : null;

export const pdfWith = (pages: string[]): Buffer => {
    const objects = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        `<< /Type /Pages /Kids [${pages.map((_, index) => `${4 + index * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`,
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        ...pages.flatMap((text, index) => {
            const stream = `BT /F1 24 Tf 72 720 Td (${text}) Tj ET`;
            return [
                `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${5 + index * 2} 0 R /Resources << /Font << /F1 3 0 R >> >> >>`,
                `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
            ];
        })
    ];
    let body = '%PDF-1.4\n';
    const offsets: number[] = [];
    for(const [index, object] of objects.entries()){
        offsets.push(body.length);
        body += `${index + 1} 0 obj\n${object}\nendobj\n`;
    }
    const table = offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');

    return Buffer.from(`${body}xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${table}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${body.length}\n%%EOF\n`, 'latin1');
};

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

const written = async (deck: PptxGenJS): Promise<Uint8Array> => {
    const data = await deck.write({ outputType: 'uint8array' });
    if(!(data instanceof Uint8Array)) throw new TypeError('PptxGenJS did not write the presentation as bytes');
    return data;
};

export const pptxWithNotes = (text: string, notes: string): Promise<Uint8Array> => {
    const deck = new PptxGenJS();
    const slide = deck.addSlide();
    slide.addText(text, { x: 1, y: 1, w: 8, h: 1 });
    slide.addNotes(notes);
    return written(deck);
};

export const pptxTemplate = (): Promise<Uint8Array> => {
    const deck = new PptxGenJS();
    deck.layout = 'LAYOUT_WIDE';
    deck.defineSlideMaster({
        title: 'SCHOOL',
        background: { color: '0F2A52' },
        objects: [
            { rect: { x: 0, y: 6.8, w: 13.33, h: 0.7, fill: { color: 'C4572E' } } },
            { image: { x: 11.5, y: 0.3, w: 1.2, h: 1.2, data: `image/png;base64,${PNG_BYTES.toString('base64')}` } },
            { text: { text: 'Vyva University', options: { x: 0.4, y: 6.9, w: 6, h: 0.5, fontSize: 12, color: 'FFFFFF' } } },
            { placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 0.5, w: 10, h: 1.2, fontSize: 40, color: 'FFFFFF' }, text: '' } },
            { placeholder: { options: { name: 'body', type: 'body', x: 0.6, y: 2, w: 10, h: 4 }, text: '' } }
        ]
    });

    const cover = deck.addSlide({ masterName: 'SCHOOL' });
    cover.addText('Computer networks', { placeholder: 'title' });
    cover.addText('Unit 1', { placeholder: 'body' });

    const goals = deck.addSlide({ masterName: 'SCHOOL' });
    goals.addText('Goals of the class', { placeholder: 'title' });
    goals.addText('First goal\nSecond goal', { placeholder: 'body' });
    goals.addShape(deck.ShapeType.rect, { x: 11, y: 2, w: 1.5, h: 1.5, fill: { color: deck.SchemeColor.accent1 } });

    return written(deck);
};
