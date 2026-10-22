import { describe, expect, it } from 'vitest';
import { DECK_SIZES, type DeckContent, type DeckFormat, type DeckTheme, type DocumentContent } from '../content';
import { bandHeight } from '../deck-frame';
import { reformat, retheme } from '../deck-theme';
import { withoutInlineStyles } from '../inline-style';
import { markdownToBlocks } from '../markdown-blocks';
import { fileIdsOf, previewOf, renderDocument, renderSlide, withImageSources } from '../render';
import { SLIDE_LAYOUTS, layoutSlide } from '../slide-layouts';
import { relayoutSlide } from '../slide-relayout';
import { DECK_THEME, DEFAULT_DOCUMENT_DESIGN } from '../themes';

const FILE = '01a14188-5cb4-776b-815b-c6e977d07bbe';
const noFiles = () => null;
const PLAIN: DeckTheme = { font: 'Open Sans', background: '#ffffff', text: '#1d2433', accent: '#1f4e9a', muted: '#5b6475' };
const DARK: DeckTheme = { font: 'Inter', background: '#14181f', text: '#f2f4f8', accent: '#5cc8ff', muted: '#9aa4b2' };

const sampleDeck = (): DeckContent => ({
    kind: 'deck',
    format: '16:9',
    theme: PLAIN,
    slides: [
        layoutSlide({ layout: 'title', title: 'Redes de computadores', subtitle: 'Unidad 1' }, '16:9', PLAIN),
        layoutSlide({ layout: 'bullets', title: 'Capas', bullets: ['Física', 'Enlace', 'Red'] }, '16:9', PLAIN)
    ]
});

describe('markdownToBlocks', () => {
    it('makes one block per top-level element with its own id', () => {
        const blocks = markdownToBlocks('# Subnetting\n\nUna red **/24** tiene 256 direcciones.\n\n- uno\n- dos\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n```bash\nip addr show\n```');

        expect(blocks.map((block) => block.html.slice(0, 4))).toEqual(['<h1>', '<p>U', '<ul>', '<tab', '<pre']);
        expect(new Set(blocks.map((block) => block.id)).size).toBe(5);
        expect(blocks[4].html).toContain('class="language-bash"');
    });

    it('turns checkbox lists into task lists the editor understands', () => {
        const [list] = markdownToBlocks('- [x] Revisar cables\n- [ ] Configurar VLAN');

        expect(list.html).toContain('<ul data-type="taskList">');
        expect(list.html).toContain('<li data-type="taskItem" data-checked="true">Revisar cables</li>');
        expect(list.html).toContain('<li data-type="taskItem" data-checked="false">Configurar VLAN</li>');
    });

    it('leaves ordinary lists alone and never lets raw HTML through', () => {
        const [list, paragraph] = markdownToBlocks('- normal\n- [x] mezcla\n\nHola <script>alert(1)</script>');

        expect(list.html).not.toContain('taskList');
        expect(paragraph.html).toContain('&lt;script&gt;');
    });

    it('refuses javascript: links and opens the others in a new tab without leaking the opener', () => {
        const [unsafe, safe] = markdownToBlocks('[clic](javascript:alert(1))\n\n[UCM](https://www.ucm.cl)');

        expect(unsafe.html).not.toContain('href="javascript:');
        expect(safe.html).toContain('href="https://www.ucm.cl"');
        expect(safe.html).toContain('rel="noopener noreferrer"');
        expect(safe.html).toContain('target="_blank"');
    });
});

describe('layoutSlide', () => {
    const formats = Object.keys(DECK_SIZES) as DeckFormat[];

    it('keeps every element of every layout inside the slide, in every format', () => {
        for(const format of formats){
            const { width, height } = DECK_SIZES[format];
            for(const layout of SLIDE_LAYOUTS){
                const slide = layoutSlide({
                    layout,
                    title: 'Direccionamiento IPv4',
                    subtitle: 'Unidad 2',
                    bullets: ['Clase A', 'Clase B', 'Clase C'],
                    left: { heading: 'IPv4', bullets: ['32 bits'] },
                    right: { heading: 'IPv6', bullets: ['128 bits'] },
                    imageFileId: FILE,
                    quote: 'La red es la computadora',
                    quoteAuthor: 'John Gage',
                    rows: [['Prefijo', 'Hosts'], ['/24', '254'], ['/25', '126']],
                    number: '4.300 M',
                    numberLabel: 'direcciones IPv4'
                }, format, PLAIN);

                expect(slide.elements.length, `${format} ${layout}`).toBeGreaterThan(0);
                for(const element of slide.elements){
                    expect(element.x, `${format} ${layout} x`).toBeGreaterThanOrEqual(0);
                    expect(element.y, `${format} ${layout} y`).toBeGreaterThanOrEqual(0);
                    expect(element.x + element.w, `${format} ${layout} right edge`).toBeLessThanOrEqual(width);
                    expect(element.y + element.h, `${format} ${layout} bottom edge`).toBeLessThanOrEqual(height);
                }
            }
        }
    });

    it('falls back to a text layout when an image layout has no image', () => {
        const slide = layoutSlide({ layout: 'image-right', title: 'Sin imagen', bullets: ['a'] }, '16:9', PLAIN);

        expect(slide.elements.some((element) => element.type === 'image')).toBe(false);
        expect(slide.elements.some((element) => element.type === 'text')).toBe(true);
    });
});

describe('rendering', () => {
    it('rejects colors and fonts that are not in the allowed format', () => {
        const deck: DeckContent = {
            kind: 'deck',
            format: '16:9',
            theme: { ...PLAIN, background: 'red;background-image:url(https://evil.example)' as `#${string}`, font: 'x;}' as 'Inter' },
            slides: []
        };
        const slide = layoutSlide({ layout: 'bullets', title: 'Hola', bullets: ['a'] }, '16:9', PLAIN);
        const html = renderSlide(slide, deck, noFiles);

        expect(html).not.toContain('evil.example');
        expect(html).not.toContain('x;}');
    });

    it('shows document images only through the file links it is given', () => {
        const html = `<p><img alt="Topología" data-file-id="${FILE}"></p>`;

        expect(withImageSources(html, (id) => `/api/file/${id}/raw?sig=1`)).toContain(`src="/api/file/${FILE}/raw?sig=1"`);
        expect(withImageSources(html, noFiles)).toBe('<p></p>');
        expect(renderDocument({ kind: 'document', design: { ...DEFAULT_DOCUMENT_DESIGN, headerText: '<i>UCM</i>' }, blocks: [{ id: 'a', html }] }, noFiles)).toContain('&lt;i&gt;UCM&lt;/i&gt;');
        expect(fileIdsOf({ kind: 'document', design: DEFAULT_DOCUMENT_DESIGN, blocks: [{ id: 'a', html }] })).toEqual([FILE]);
    });

    it('keeps previews small', () => {
        expect((previewOf(sampleDeck()) as DeckContent).slides).toHaveLength(1);

        const long: DocumentContent = { kind: 'document', design: DEFAULT_DOCUMENT_DESIGN, blocks: markdownToBlocks(Array.from({ length: 30 }, (_, index) => `Párrafo ${index + 1}`).join('\n\n')) };
        expect((previewOf(long) as DocumentContent).blocks).toHaveLength(14);
    });
});

describe('deck themes and formats', () => {
    const style = { fontSize: 40, color: PLAIN.text, align: 'left' as const, verticalAlign: 'top' as const, lineHeight: 1.2, isBold: false };
    const frame = { x: 0, y: 0, w: 400, h: 200, rotation: 0, opacity: 1, isLocked: false };

    it('recolors the theme colors of the deck and keeps the colors the teacher chose', () => {
        const deck = sampleDeck();
        const custom = { ...deck, slides: deck.slides.map((slide, index) => index === 0 ? { ...slide, background: { type: 'color' as const, color: '#123456' } } : slide) };
        const next = retheme(custom, DARK);
        const json = JSON.stringify(next.slides);

        expect(next.theme).toEqual(DARK);
        expect(json).toContain(DARK.accent);
        expect(json).not.toContain(`"${PLAIN.accent}"`);
        expect(next.slides[0].background).toEqual({ type: 'color', color: '#123456' });
    });

    it('recolors the theme colors written inside the text and the text of shapes', () => {
        const from = PLAIN;
        const to = DARK;
        const deck: DeckContent = {
            kind: 'deck',
            format: '16:9',
            theme: from,
            slides: [{ id: 's1', background: null, elements: [
                { ...frame, id: 't1', type: 'text', fill: null, style, html: `<p><span style="color:${from.accent};font-size:30px">Red</span> <span style="color:#29abe2">propia</span></p>` },
                { ...frame, id: 'f1', type: 'shape', shape: 'rect', fill: from.accent, stroke: null, strokeWidth: 0, text: { html: '<p>Forma</p>', style: { ...style, color: from.muted } } }
            ] }]
        };
        const [text, shape] = retheme(deck, to).slides[0].elements;

        expect(text).toMatchObject({ style: { color: to.text }, html: `<p><span style="color:${to.accent};font-size:30px">Red</span> <span style="color:#29abe2">propia</span></p>` });
        expect(shape).toMatchObject({ fill: to.accent, text: { style: { color: to.muted } } });
    });

    it('rescales positions and text when the format changes', () => {
        const deck = sampleDeck();
        const square = reformat(deck, '1:1');
        const { width, height } = DECK_SIZES['1:1'];

        expect(square.format).toBe('1:1');
        for(const element of square.slides.flatMap((slide) => slide.elements)){
            expect(element.x + element.w).toBeLessThanOrEqual(width + 1);
            expect(element.y + element.h).toBeLessThanOrEqual(height + 1);
        }
        expect(reformat(deck, '16:9')).toBe(deck);
    });

    it('rescales the font sizes written inside the text with the box', () => {
        const deck: DeckContent = { kind: 'deck', format: '16:9', theme: PLAIN, slides: [{ id: 's1', background: null, elements: [
            { ...frame, id: 't1', type: 'text', fill: null, style, html: '<p><span style="font-size:60px;color:#ffffff">Grande</span></p>' }
        ] }] };
        const [text] = reformat(deck, '1:1').slides[0].elements;

        expect(text).toMatchObject({ style: { fontSize: 23 }, html: '<p><span style="font-size:34px;color:#ffffff">Grande</span></p>' });
    });
});

describe('theme frames', () => {
    const academic = DECK_THEME;

    it('draws the band under a titled slide and numbers the footer, and a cover keeps only the footer', () => {
        const cover = layoutSlide({ layout: 'title', title: 'Control de inventario', subtitle: 'Patricio Rebolledo' }, '16:9', academic);
        const content = layoutSlide({ layout: 'bullets', title: 'Modelo EOQ', bullets: ['Costo total', 'Punto de reorden'] }, '16:9', academic);
        const deck: DeckContent = { kind: 'deck', format: '16:9', theme: academic, footer: { left: 'Patricio Rebolledo (UCM)', center: 'Control de inventario' }, slides: [cover, content] };

        const coverHtml = renderSlide(cover, deck, noFiles);
        const contentHtml = renderSlide(content, deck, noFiles);
        expect(coverHtml).not.toContain(`height:${bandHeight('16:9')}px;background:${academic.accent}`);
        expect(coverHtml).toContain('1 / 2');
        expect(contentHtml).toContain(`height:${bandHeight('16:9')}px;background:${academic.accent}`);
        expect(contentHtml).toContain('Patricio Rebolledo (UCM)');
        expect(contentHtml).toContain('2 / 2');
    });

    it('puts a slide title inside the band, in the band ink, with the content below it', () => {
        const slide = layoutSlide({ layout: 'bullets', title: 'Modelo EOQ', bullets: ['Costo total'] }, '16:9', academic);
        const [title, body] = slide.elements.filter((element) => element.type === 'text');

        expect(title.y + title.h).toBeLessThanOrEqual(bandHeight('16:9'));
        expect(title.type === 'text' ? title.style.color : '').toBe('#ffffff');
        expect(body.y).toBeGreaterThan(bandHeight('16:9'));
    });

    it('carries titles into the band and back out when the theme changes', () => {
        const plain = layoutSlide({ layout: 'bullets', title: 'Modelo EOQ', bullets: ['Costo total'] }, '16:9', PLAIN);
        const deck: DeckContent = { kind: 'deck', format: '16:9', theme: PLAIN, slides: [plain] };

        const banded = retheme(deck, academic);
        const title = banded.slides[0].elements.find((element) => element.type === 'text');
        expect(title !== undefined && title.y + title.h <= bandHeight('16:9')).toBe(true);
        expect(banded.slides[0].elements.some((element) => element.type === 'shape')).toBe(false);

        const back = retheme(banded, PLAIN).slides[0].elements.find((element) => element.type === 'text');
        expect(back?.y).toBeGreaterThan(bandHeight('16:9') / 2);
        expect(back?.type === 'text' ? back.style.color : '').toBe(PLAIN.text);
    });
});

describe('inline styles', () => {
    it('removes only the properties it is asked to and drops the style attributes left empty', () => {
        expect(withoutInlineStyles('<p style="text-align:center"><span style="color: #fff; font-size: 26px">a</span><span style="font-size:12px">b</span></p>', ['font-size']))
            .toBe('<p style="text-align:center"><span style="color:#fff">a</span><span>b</span></p>');
        expect(withoutInlineStyles('<span style="font-family: &quot;Inter&quot;, sans-serif;color:#000">c</span>', ['font-family'])).toBe('<span style="color:#000">c</span>');
    });
});

describe('manual slide editing', () => {
    const theme = PLAIN;
    const deckOf = (slides: DeckContent['slides']): DeckContent => ({ kind: 'deck', format: '16:9', theme, slides });
    const style = { fontSize: 40, color: '#ffffff', align: 'center' as const, verticalAlign: 'middle' as const, lineHeight: 1.2, isBold: false };
    const frame = { x: 100, y: 100, w: 400, h: 200, rotation: 0, opacity: 1, isLocked: false };

    it('draws text inside shapes that can hold it and never inside lines', () => {
        const box = { ...frame, id: 'caja', type: 'shape' as const, shape: 'ellipse' as const, fill: '#1f4e9a', stroke: null, strokeWidth: 0, text: { html: '<p>Sensor</p>', style } };
        const line = { ...box, id: 'linea', shape: 'line' as const };
        const html = renderSlide({ id: 's', background: null, elements: [box, line] }, deckOf([]), noFiles);

        expect(html).toContain('<div class="vy-shape">');
        expect(html.match(/Sensor/g)).toHaveLength(1);
    });

    it('draws a polygon through its points scaled to the box, and a plain box when it has none', () => {
        const stripe = { ...frame, id: 'franja', type: 'shape' as const, shape: 'polygon' as const, fill: '#117cc2', stroke: null, strokeWidth: 0, points: [{ x: 1, y: 0 }, { x: 1, y: 0.5 }, { x: 0, y: 1 }] };
        const html = renderSlide({ id: 's', background: null, elements: [stripe, { ...stripe, id: 'caja', points: undefined }] }, deckOf([]), noFiles);

        expect(html).toContain('<polygon points="400,0 400,100 0,200" fill="#117cc2"');
        expect(html).toContain('<rect width="400" height="200" fill="#117cc2"');
    });

    it('changes the layout of a slide and keeps its title, texts and image', () => {
        const source = layoutSlide({ layout: 'two-columns', title: 'IPv4 o IPv6', left: { text: 'Treinta y dos bits' }, right: { text: 'Ciento veintiocho bits' } }, '16:9', theme);
        const withImage = { ...source, elements: [...source.elements, { ...frame, id: 'foto', type: 'image' as const, fileId: FILE, fit: 'cover' as const, radius: 0, alt: 'Router', credit: null }] };

        const bullets = relayoutSlide(withImage, 'image-right', '16:9', theme);
        const html = renderSlide(bullets, deckOf([bullets]), (id) => `/f/${id}`);

        expect(bullets.id).toBe(source.id);
        expect(html).toContain('IPv4 o IPv6');
        expect(html).toContain('Treinta y dos bits');
        expect(html).toContain('Ciento veintiocho bits');
        expect(html).not.toContain('{{');
        expect(bullets.elements.filter((element) => element.type === 'image')).toHaveLength(1);

        const quote = relayoutSlide(bullets, 'quote', '16:9', theme);
        expect(renderSlide(quote, deckOf([quote]), (id) => `/f/${id}`)).toContain('IPv4 o IPv6');
    });
});
