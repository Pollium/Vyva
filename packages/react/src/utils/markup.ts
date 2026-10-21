import type { DeckContent, DocumentContent, Content } from '@vyva/core/content';
import { DECK_SIZES } from '@vyva/core/content';
import { A4, CONTENT_CSS, renderDocument, renderSlide, type FileUrl } from '@vyva/core/render';

export interface PageMarkup{
    html: string;
    width: number;
    height: number | null;
}

export const slideMarkup = (deck: DeckContent, index: number, fileUrl: FileUrl): PageMarkup | null => {
    const slide = deck.slides[index];
    if(slide === undefined) return null;

    const { width, height } = DECK_SIZES[deck.format];

    return { html: renderSlide(slide, deck, fileUrl), width, height };
};

export const documentMarkup = (content: DocumentContent, fileUrl: FileUrl): PageMarkup =>
    ({ html: renderDocument(content, fileUrl), width: A4.width, height: null });

export const coverMarkup = (content: Content, fileUrl: FileUrl): PageMarkup | null => {
    if(content.kind === 'deck') return slideMarkup(content, 0, fileUrl);

    return documentMarkup(content, fileUrl);
};

export const SHADOW_CSS = `:host{all:initial;display:block}${CONTENT_CSS}`;
