import { cleanHtml } from './clean-html';
import { textHeight } from './text-measure';
import type { Content, DeckContent, DocumentContent, FontFamily, Slide, SlideElement } from '@pollium/vyva-core/content';
import { TEXT_SHAPES } from '@pollium/vyva-core/content';
import { newId } from '@pollium/vyva-core/ids';
import { withTextHeight } from '@pollium/vyva-core/render';

const ID = /^[A-Za-z0-9_-]{1,40}$/;

const uniqueIds = <T extends { id: string }>(items: T[]): T[] => {
    const seen = new Set<string>();

    return items.map((item) => {
        const id = ID.test(item.id) && !seen.has(item.id) ? item.id : newId();
        seen.add(id);
        return id === item.id ? item : { ...item, id };
    });
};

const cleanElement = (element: SlideElement, font: FontFamily): SlideElement => {
    if(element.type === 'text'){
        const html = cleanHtml(element.html);
        const height = textHeight(html, element.style, font, element.w);
        return Number.isFinite(height) && height > 0 ? withTextHeight({ ...element, html }, height) : { ...element, html };
    }
    if(element.type !== 'shape' || element.text === undefined) return element;

    const { text, ...bare } = element;
    const html = TEXT_SHAPES.includes(element.shape) ? cleanHtml(text.html) : '';

    return html === '' ? bare : { ...bare, text: { ...text, html } };
};

export const cleanDocument = (content: DocumentContent): DocumentContent => ({
    ...content,
    blocks: uniqueIds(content.blocks)
        .map((block) => ({ id: block.id, html: cleanHtml(block.html) }))
        .filter((block) => block.html !== '')
});

export const cleanDeck = (content: DeckContent): DeckContent => ({
    ...content,
    slides: uniqueIds(content.slides).map((slide): Slide => ({
        ...slide,
        elements: uniqueIds(slide.elements).map((element) => cleanElement(element, content.theme.font))
    }))
});

export const cleanContent = (content: Content): Content =>
    content.kind === 'deck' ? cleanDeck(content) : cleanDocument(content);
