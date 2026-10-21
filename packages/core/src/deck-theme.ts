import type { DeckContent, DeckFormat, DeckTheme, Slide, SlideElement, TextElement, TextStyle } from './content';
import { DECK_SIZES } from './content';
import { inkOn } from './deck-frame';
import { editInlineStyles } from './inline-style';
import { canvasOf, isAccentBar } from './slide-layouts';

type Swap = (color: string | null) => string | null;

const PIXELS = /^(\d+(?:\.\d+)?)px$/;

const swapColor = (from: DeckTheme, to: DeckTheme): Swap => (color) => {
    const value = color?.toLowerCase();
    if(value === from.text.toLowerCase()) return to.text;
    if(value === from.accent.toLowerCase()) return to.accent;
    if(value === from.muted.toLowerCase()) return to.muted;
    if(value === from.background.toLowerCase()) return to.background;

    return color;
};

const recolorHtml = (html: string, swap: Swap): string =>
    editInlineStyles(html, (property, value) => property === 'color' ? swap(value) ?? value : value);

const recolorStyle = (style: TextStyle, swap: Swap): TextStyle => ({ ...style, color: swap(style.color) ?? style.color });

const recolor = (element: SlideElement, swap: Swap): SlideElement => {
    if(element.type === 'text') return { ...element, fill: swap(element.fill), html: recolorHtml(element.html, swap), style: recolorStyle(element.style, swap) };
    if(element.type === 'shape'){
        const text = element.text === undefined ? {} : { text: { html: recolorHtml(element.text.html, swap), style: recolorStyle(element.text.style, swap) } };
        return { ...element, fill: swap(element.fill), stroke: swap(element.stroke), ...text };
    }
    if(element.type === 'table') return { ...element, headerFill: swap(element.headerFill) ?? element.headerFill, borderColor: swap(element.borderColor) ?? element.borderColor };

    return element;
};

const reframe = (slide: Slide, format: DeckFormat, from: DeckTheme, to: DeckTheme): Slide => {
    const isBand = to.frame?.header === 'band';
    if((from.frame?.header === 'band') === isBand || (slide.frame ?? 'full') !== 'full') return slide;

    const canvas = canvasOf(format, to);
    const above = isBand ? canvas.height * 0.3 : canvasOf(format, from).band;
    const title = slide.elements
        .filter((element): element is TextElement => element.type === 'text' && element.y < above)
        .sort((a, b) => b.style.fontSize - a.style.fontSize)[0];
    if(title === undefined) return slide;

    const { width, unit, margin, band } = canvas;
    const moved: TextElement = isBand
        ? { ...title, x: Math.round(56 * unit), w: Math.round(width - 112 * unit), y: Math.round((band - title.h) / 2), style: { ...title.style, verticalAlign: 'middle', color: inkOn(to.accent), fontSize: Math.min(title.style.fontSize, Math.round(54 * unit)) } }
        : { ...title, x: margin, w: width - margin * 2, y: Math.round(margin * 0.62 + 24 * unit), style: { ...title.style, verticalAlign: 'middle', color: to.text } };

    return {
        ...slide,
        elements: slide.elements.filter((element) => !isBand || !isAccentBar(element, canvas)).map((element) => element === title ? moved : element)
    };
};

export const retheme = (content: DeckContent, theme: DeckTheme): DeckContent => {
    const swap = swapColor(content.theme, theme);

    return {
        ...content,
        theme,
        slides: content.slides.map((slide) => reframe({
            ...slide,
            background: slide.background?.type === 'color'
                ? { type: 'color', color: swap(slide.background.color) ?? slide.background.color }
                : slide.background,
            elements: slide.elements.map((element) => recolor(element, swap))
        }, content.format, content.theme, theme))
    };
};

const scaleSize = (size: number, factor: number): number => Math.max(6, Math.round(size * factor));

const scaleHtml = (html: string, factor: number): string =>
    editInlineStyles(html, (property, value) => {
        const pixels = property === 'font-size' ? PIXELS.exec(value) : null;
        return pixels === null ? value : `${scaleSize(Number(pixels[1]), factor)}px`;
    });

const scaleText = (html: string, style: TextStyle, factor: number) => ({ html: scaleHtml(html, factor), style: { ...style, fontSize: scaleSize(style.fontSize, factor) } });

export const reformat = (content: DeckContent, format: DeckFormat): DeckContent => {
    if(format === content.format) return content;

    const from = DECK_SIZES[content.format];
    const to = DECK_SIZES[format];
    const sx = to.width / from.width;
    const sy = to.height / from.height;
    const factor = Math.min(sx, sy);
    const round = (value: number) => Math.round(value);

    return {
        ...content,
        format,
        slides: content.slides.map((slide) => ({
            ...slide,
            elements: slide.elements.map((element): SlideElement => {
                const frame = { x: round(element.x * sx), y: round(element.y * sy), w: Math.max(1, round(element.w * sx)), h: Math.max(1, round(element.h * sy)) };
                if(element.type === 'text') return { ...element, ...frame, ...scaleText(element.html, element.style, factor) };
                if(element.type === 'shape' && element.text !== undefined) return { ...element, ...frame, text: scaleText(element.text.html, element.text.style, factor) };
                if(element.type === 'table' || element.type === 'code') return { ...element, ...frame, fontSize: scaleSize(element.fontSize, factor) };

                return { ...element, ...frame };
            })
        }))
    };
};
