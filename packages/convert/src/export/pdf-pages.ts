import { ConvertError } from '../errors';
import type { ExportBundle } from './bundle';
import type { DeckContent, PdfPageBackground, Slide } from '@pollium/vyva-core/content';
import { frameLayers } from '@pollium/vyva-core/deck-frame';
import { concatTransformationMatrix, drawObject, PDFDocument, popGraphicsState, pushGraphicsState, type PDFEmbeddedPage, type PDFPage } from 'pdf-lib';

type Matrix = [number, number, number, number, number, number];

interface SourcePage{
    slide: number;
    fileId: string;
    page: number;
}

interface Placed{
    slide: number;
    page: PDFPage;
}

const pdfPageOf = (slide: Slide): PdfPageBackground | null => slide.background?.type === 'pdf-page' ? slide.background : null;

const drawsOver = (slide: Slide, deck: DeckContent): boolean => {
    const { under, over } = frameLayers(slide, deck);
    return slide.elements.length > 0 || under !== '' || over !== '';
};

const loaded = (data: Uint8Array, what: string): Promise<PDFDocument> => PDFDocument.load(data).catch((error: unknown) => {
    throw new ConvertError('unsupported', `${what} cannot be copied into the exported PDF`, { cause: error });
});

const placement = (page: PDFPage, overlay: PDFEmbeddedPage): Matrix => {
    const { x, y, width, height } = page.getCropBox();
    const rotation = ((page.getRotation().angle % 360) + 360) % 360;
    const isTurned = rotation === 90 || rotation === 270;
    const visibleWidth = isTurned ? height : width;
    const visibleHeight = isTurned ? width : height;
    const scale = Math.min(visibleWidth / overlay.width, visibleHeight / overlay.height);
    const left = (visibleWidth - overlay.width * scale) / 2;
    const top = (visibleHeight - overlay.height * scale) / 2;
    const tall = overlay.height * scale;

    if(rotation === 90) return [0, scale, -scale, 0, x + top + tall, y + left];
    if(rotation === 180) return [-scale, 0, 0, -scale, x + width - left, y + top + tall];
    if(rotation === 270) return [0, -scale, scale, 0, x + width - top - tall, y + height - left];

    return [scale, 0, 0, scale, x + left, y + height - top - tall];
};

const stamp = (page: PDFPage, overlay: PDFEmbeddedPage) => {
    const { context } = page.doc;
    page.node.normalize();
    page.node.wrapContentStreams(context.register(context.contentStream([pushGraphicsState()])), context.register(context.contentStream([popGraphicsState()])));

    const name = page.node.newXObject('VyvaOverlay', overlay.ref);
    page.pushOperators(pushGraphicsState(), concatTransformationMatrix(...placement(page, overlay)), drawObject(name), popGraphicsState());
};

const sourcePagesOf = (deck: DeckContent, pdfs: Map<string, Buffer>): SourcePage[] => deck.slides.flatMap((slide, index) => {
    const background = pdfPageOf(slide);
    return background !== null && pdfs.has(background.fileId) ? [{ slide: index, fileId: background.fileId, page: background.page }] : [];
});

const copySources = async (output: PDFDocument, wanted: SourcePage[], pdfs: Map<string, Buffer>): Promise<Placed[]> => {
    const placed: Placed[] = [];
    for(const [fileId, data] of pdfs){
        const pages = wanted.filter((source) => source.fileId === fileId);
        if(pages.length === 0) continue;

        const source = await loaded(data, `The PDF ${fileId}`);
        if(pages.some(({ page }) => page > source.getPageCount())) throw new ConvertError('unsupported', `The PDF ${fileId} has fewer pages than the deck shows`);

        const copied = await output.copyPages(source, pages.map(({ page }) => page - 1));
        placed.push(...copied.map((page, at) => ({ slide: pages[at].slide, page })));
    }

    return placed;
};

const copyPrinted = async (output: PDFDocument, printed: PDFDocument, slides: number[]): Promise<Placed[]> => {
    const copied = await output.copyPages(printed, slides);
    return copied.map((page, at) => ({ slide: slides[at], page }));
};

const stampAll = async (output: PDFDocument, printed: PDFDocument, sources: Placed[], deck: DeckContent) => {
    const stamped = sources.filter(({ slide }) => drawsOver(deck.slides[slide], deck));
    const overlays = await output.embedPages(stamped.map(({ slide }) => printed.getPage(slide)));
    stamped.forEach(({ page }, index) => stamp(page, overlays[index]));
};

export const onPdfPages = async (deck: DeckContent, bundle: ExportBundle, print: () => Promise<Uint8Array>): Promise<Uint8Array> => {
    const wanted = sourcePagesOf(deck, bundle.pdfs);
    const fromSource = new Set(wanted.map(({ slide }) => slide));
    const isPrinted = deck.slides.some((slide, index) => !fromSource.has(index) || drawsOver(slide, deck));
    const printed = isPrinted ? await loaded(await print(), 'The printed slides') : null;

    const output = await PDFDocument.create();
    output.setTitle(bundle.title);
    const sources = await copySources(output, wanted, bundle.pdfs);
    const others = printed === null ? [] : await copyPrinted(output, printed, deck.slides.map((_, index) => index).filter((index) => !fromSource.has(index)));
    if(printed !== null) await stampAll(output, printed, sources, deck);

    for(const { page } of [...sources, ...others].sort((a, b) => a.slide - b.slide)) output.addPage(page);

    return output.save();
};
