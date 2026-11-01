import type { DeckContent, DocumentContent, Content, Slide } from '@pollium/vyva-core/content';
import { deckSize } from '@pollium/vyva-core/content';
import { A4, CONTENT_CSS, renderDocument, renderSlide, type FileUrl } from '@pollium/vyva-core/render';

export interface PdfPageSource{
    url: string;
    page: number;
}

export interface PageMarkup{
    html: string;
    width: number;
    height: number | null;
    pdfPage: PdfPageSource | null;
}

export const pdfPageOf = (slide: Slide, fileUrl: FileUrl): PdfPageSource | null => {
    if(slide.background?.type !== 'pdf-page') return null;

    const url = fileUrl(slide.background.fileId);
    return url === null ? null : { url, page: slide.background.page };
};

export const slideMarkup = (deck: DeckContent, index: number, fileUrl: FileUrl): PageMarkup | null => {
    const slide = deck.slides[index];
    if(slide === undefined) return null;

    const { width, height } = deckSize(deck.format);

    return { html: renderSlide(slide, deck, fileUrl), width, height, pdfPage: pdfPageOf(slide, fileUrl) };
};

export const documentMarkup = (content: DocumentContent, fileUrl: FileUrl): PageMarkup =>
    ({ html: renderDocument(content, fileUrl), width: A4.width, height: null, pdfPage: null });

export const coverMarkup = (content: Content, fileUrl: FileUrl): PageMarkup | null => {
    if(content.kind === 'deck') return slideMarkup(content, 0, fileUrl);

    return documentMarkup(content, fileUrl);
};

export const SHADOW_CSS = `:host{all:initial;display:block}${CONTENT_CSS}`;
