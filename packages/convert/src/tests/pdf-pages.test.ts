import { exportContent, exportFormatsOf } from '../export';
import type { PdfJob } from '../export/pdf';
import { LETTER, pdfWith } from './fixtures';
import type { DeckContent, Slide, TextElement } from '@pollium/vyva-core/content';
import { DECK_THEME } from '@pollium/vyva-core/themes';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { getDocumentProxy } from 'unpdf';
import { describe, expect, it } from 'vitest';

const PDF_ID = '01a14188-5cb4-776b-815b-c6e977d07bc0';
const POINTS_PER_INCH = 72;
const MARK_INSET = 36;
const { frame: _frame, ...plain } = DECK_THEME;

const note = (id: string): TextElement => ({
    id, type: 'text', x: 72, y: 72, w: 400, h: 60, rotation: 0, opacity: 1, isLocked: false, fill: null, html: '<p>Note</p>',
    style: { fontSize: 32, color: '#d1242f', align: 'left', verticalAlign: 'top', lineHeight: 1.2, isBold: false }
});

const page = (number: number, elements: TextElement[] = []): Slide => ({ id: `p${number}`, background: { type: 'pdf-page', fileId: PDF_ID, page: number }, elements });

const deckOf = (slides: Slide[], size = { width: LETTER.width * 2, height: LETTER.height * 2 }): DeckContent => ({ kind: 'deck', format: size, theme: plain, slides });

const marking = () => {
    const jobs: PdfJob[] = [];
    const pdfEngine = async (job: PdfJob) => {
        jobs.push(job);
        const printed = await PDFDocument.create();
        const font = await printed.embedFont(StandardFonts.Helvetica);
        const slides = job.html.match(/class="vy-print-slide"/g)?.length ?? 0;
        for(let index = 0; index < slides; index++){
            const sheet = printed.addPage([job.page.width * POINTS_PER_INCH, job.page.height * POINTS_PER_INCH]);
            sheet.drawText(`mark ${index + 1}`, { x: MARK_INSET, y: sheet.getHeight() - MARK_INSET, size: 12, font });
        }
        return printed.save();
    };
    return { jobs, pdfEngine };
};

const reading = (source: Buffer) => async (fileId: string) => fileId === PDF_ID ? { data: source, contentType: 'application/pdf' } : null;

const pagesOf = async (data: Uint8Array) => {
    const pdf = await getDocumentProxy(new Uint8Array(data));
    return Promise.all(Array.from({ length: pdf.numPages }, async (_, index) => {
        const sheet = await pdf.getPage(index + 1);
        const viewport = sheet.getViewport({ scale: 1 });
        const { items } = await sheet.getTextContent();
        const texts = items.flatMap((item) => 'str' in item && item.str !== '' ? [{ text: item.str, at: viewport.convertToViewportPoint(item.transform[4], item.transform[5]) }] : []);
        return { width: viewport.width, height: viewport.height, texts };
    }));
};

describe('exporting a deck of PDF pages', () => {
    it('keeps the original pages and draws on them only what the slides add', async () => {
        const source = pdfWith(['Page one', 'Page two']);
        const { jobs, pdfEngine } = marking();
        const deck = deckOf([page(1, [note('n1')]), page(2), { id: 'extra', background: null, elements: [note('n2')] }]);

        const file = await exportContent(deck, 'pdf', { title: 'Lecture', readImage: reading(source), pdfEngine });
        const pages = await pagesOf(file.data);

        expect(file).toMatchObject({ contentType: 'application/pdf', extension: 'pdf' });
        expect(jobs).toHaveLength(1);
        expect(pages.map(({ width, height }) => [width, height])).toEqual([[612, 792], [612, 792], [612, 792]]);
        expect(pages.map(({ texts }) => texts.map(({ text }) => text))).toEqual([['Page one', 'mark 1'], ['Page two'], ['mark 3']]);
    });

    it('copies an untouched PDF without printing anything', async () => {
        const { jobs, pdfEngine } = marking();

        const file = await exportContent(deckOf([page(2), page(1)]), 'pdf', { title: 'Lecture', readImage: reading(pdfWith(['Page one', 'Page two'])), pdfEngine });

        expect(jobs).toEqual([]);
        expect((await pagesOf(file.data)).map(({ texts }) => texts.map(({ text }) => text))).toEqual([['Page two'], ['Page one']]);
    });

    it('draws upright at the top left of a page the PDF shows turned', async () => {
        for(const rotate of [0, 90, 180, 270]){
            const source = pdfWith(['Turned'], { ...LETTER, rotate });
            const isTurned = rotate % 180 !== 0;
            const size = isTurned ? { width: LETTER.height * 2, height: LETTER.width * 2 } : { width: LETTER.width * 2, height: LETTER.height * 2 };
            const { pdfEngine } = marking();

            const file = await exportContent(deckOf([page(1, [note('n1')])], size), 'pdf', { title: 'Lecture', readImage: reading(source), pdfEngine });
            const [{ texts }] = await pagesOf(file.data);
            const mark = texts.find(({ text }) => text === 'mark 1');

            expect(mark?.at[0]).toBeCloseTo(MARK_INSET, 0);
            expect(mark?.at[1]).toBeCloseTo(MARK_INSET, 0);
        }
    });

    it('offers only PDF for a deck of PDF pages, and refuses PowerPoint', async () => {
        const deck = deckOf([page(1)]);

        expect(exportFormatsOf(deck)).toEqual(['pdf']);
        await expect(exportContent(deck, 'pptx', { title: 'Lecture', readImage: reading(pdfWith(['Page one'])) })).rejects.toMatchObject({ code: 'unsupported' });
    });

    it('refuses a deck that points past the last page of its PDF', async () => {
        const { pdfEngine } = marking();

        await expect(exportContent(deckOf([page(3)]), 'pdf', { title: 'Lecture', readImage: reading(pdfWith(['Page one'])), pdfEngine })).rejects.toMatchObject({ code: 'unsupported' });
    });
});
