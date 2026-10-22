import { EditRefused } from './errors';
import { htmlToMarkdown } from './html-markdown';
import { codeFenceOf, fitCodeSize } from '@pollium/vyva-core/code';
import type { DeckContent, DeckTheme, Slide, SlideElement } from '@pollium/vyva-core/content';
import { TEXT_SHAPES } from '@pollium/vyva-core/content';
import { inlineMarkdown } from '@pollium/vyva-core/markdown-blocks';
import { layoutSlide, shapeTextStyle, type SlideSpec } from '@pollium/vyva-core/slide-layouts';

export type DeckOperation =
    | { op: 'add_slide'; afterSlideId: string | null; slide: SlideSpec }
    | { op: 'insert_slide'; afterSlideId: string | null; slide: Slide }
    | { op: 'replace_slide'; slideId: string; slide: SlideSpec }
    | { op: 'delete_slide'; slideId: string }
    | { op: 'move_slide'; slideId: string; afterSlideId: string | null }
    | { op: 'set_text'; slideId: string; elementId: string; markdown: string };

export interface DeckElementForModel{
    id: string;
    type: SlideElement['type'];
    text?: string;
    rows?: string[][];
    alt?: string;
    shape?: string;
    box: { x: number; y: number; w: number; h: number };
}

export interface DeckForModel{
    format: DeckContent['format'];
    theme: DeckTheme;
    slides: Array<{ id: string; number: number; elements: DeckElementForModel[] }>;
}

const BULLET = /^[-*•]\s+/;

const slideIndex = (slides: Slide[], slideId: string): number => {
    const index = slides.findIndex((slide) => slide.id === slideId);
    if(index === -1) throw new EditRefused(`There is no slide "${slideId}". Read the deck again to get the current slide ids.`);

    return index;
};

export const markdownToTextHtml = (markdown: string): string => {
    const lines = markdown.split('\n').map((line) => line.trim()).filter((line) => line !== '');
    const item = (line: string) => `<li>${inlineMarkdown(line.replace(BULLET, ''))}</li>`;
    if(lines.length > 0 && lines.every((line) => BULLET.test(line))) return `<ul>${lines.map(item).join('')}</ul>`;

    return lines.map((line) => BULLET.test(line) ? `<ul>${item(line)}</ul>` : `<p>${inlineMarkdown(line)}</p>`).join('');
};

const withText = (element: SlideElement | undefined, markdown: string, theme: DeckTheme): SlideElement | null => {
    const fence = codeFenceOf(markdown);
    if(element?.type === 'code') return fence === null ? { ...element, code: markdown } : { ...element, code: fence.code, language: fence.language };
    if(element?.type === 'text' && fence !== null && fence.before === '' && fence.after === ''){
        const { id, x, y, w, h, rotation, opacity, isLocked } = element;
        return { id, x, y, w, h, rotation, opacity, isLocked, type: 'code', code: fence.code, language: fence.language, colorScheme: 'dark', fontSize: fitCodeSize(fence.code, element, element.style.fontSize) };
    }
    if(element?.type === 'text') return { ...element, html: markdownToTextHtml(markdown) };
    if(element?.type === 'shape' && TEXT_SHAPES.includes(element.shape)){
        return { ...element, text: { html: markdownToTextHtml(markdown), style: element.text?.style ?? shapeTextStyle(element, theme) } };
    }

    return null;
};

const applyOne = (slides: Slide[], operation: DeckOperation, { format, theme }: DeckContent): Slide[] => {
    if(operation.op === 'add_slide' || operation.op === 'insert_slide'){
        const at = operation.afterSlideId === null ? slides.length : slideIndex(slides, operation.afterSlideId) + 1;
        const slide = operation.op === 'add_slide' ? layoutSlide(operation.slide, format, theme) : operation.slide;
        return [...slides.slice(0, at), slide, ...slides.slice(at)];
    }

    const at = slideIndex(slides, operation.slideId);
    const current = slides[at];
    if(operation.op === 'delete_slide') return [...slides.slice(0, at), ...slides.slice(at + 1)];
    if(operation.op === 'replace_slide') return slides.map((slide, index) => index === at ? { ...layoutSlide(operation.slide, format, theme), id: current.id } : slide);
    if(operation.op === 'move_slide'){
        const rest = [...slides.slice(0, at), ...slides.slice(at + 1)];
        const target = operation.afterSlideId === null ? 0 : slideIndex(rest, operation.afterSlideId) + 1;
        return [...rest.slice(0, target), current, ...rest.slice(target)];
    }

    const updated = withText(current.elements.find((element) => element.id === operation.elementId), operation.markdown, theme);
    if(updated === null) throw new EditRefused(`Slide "${operation.slideId}" has no text element, code block or text shape "${operation.elementId}".`);

    return slides.map((slide, index) => index === at
        ? { ...slide, elements: slide.elements.map((element) => element.id === updated.id ? updated : element) }
        : slide);
};

export const applyDeckOperations = (content: DeckContent, operations: DeckOperation[]): DeckContent => ({
    ...content,
    slides: operations.reduce((slides, operation) => applyOne(slides, operation, content), content.slides)
});

const elementForModel = (element: SlideElement): DeckElementForModel => ({
    id: element.id,
    type: element.type,
    ...(element.type === 'text' ? { text: htmlToMarkdown(element.html) } : {}),
    ...(element.type === 'shape' && element.text !== undefined ? { text: htmlToMarkdown(element.text.html) } : {}),
    ...(element.type === 'table' ? { rows: element.rows } : {}),
    ...(element.type === 'code' ? { text: ['```' + element.language, element.code, '```'].join('\n') } : {}),
    ...(element.type === 'image' ? { alt: element.alt } : {}),
    ...(element.type === 'shape' ? { shape: element.shape } : {}),
    box: { x: element.x, y: element.y, w: element.w, h: element.h }
});

export const deckForModel = (content: DeckContent): DeckForModel => ({
    format: content.format,
    theme: content.theme,
    slides: content.slides.map((slide, index) => ({ id: slide.id, number: index + 1, elements: slide.elements.map(elementForModel) }))
});
