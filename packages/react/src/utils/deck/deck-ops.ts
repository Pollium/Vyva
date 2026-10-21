import type { CodeElement, DeckContent, DeckTheme, ImageElement, ShapeElement, ShapeKind, Slide, SlideElement, TableElement, TextElement, TextStyle } from '@vyva/core/content';
import { DECK_SIZES, MAX_ALT_TEXT, TEXT_SHAPES } from '@vyva/core/content';
import { escapeHtml } from '@vyva/core/escape';
import { newId } from '@vyva/core/ids';
import { withoutInlineStyles } from '@vyva/core/inline-style';
import { shapeTextStyle } from '@vyva/core/slide-layouts';
import { MIN_SIZE, boundsOf } from './geometry';

export type Arrange = 'front' | 'forward' | 'backward' | 'back';
export type Align = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';

export const MIN_STROKE = 4;

const PASTE_OFFSET = 24;
const NEW_TABLE_BODY_ROWS = 2;
const BASE_SIZE = DECK_SIZES['16:9'];
const NEW_TEXT_SIZE = 44;
const NEW_GRID_TEXT_SIZE = 28;
const LINE_STROKE = 6;
const FALLBACK_RATIO = 4 / 3;

export const holdsText = (element: SlideElement): boolean =>
    element.type === 'text' || (element.type === 'shape' && TEXT_SHAPES.includes(element.shape));

export const textStyleOf = (element: SlideElement, theme: DeckTheme): TextStyle | null => {
    if(element.type === 'text') return element.style;
    if(element.type === 'shape' && TEXT_SHAPES.includes(element.shape)) return element.text?.style ?? shapeTextStyle(element, theme);

    return null;
};

export const withText = (element: SlideElement, html: string, theme: DeckTheme): SlideElement => {
    if(element.type === 'text') return { ...element, html };
    if(element.type !== 'shape' || !TEXT_SHAPES.includes(element.shape)) return element;
    if(html === '') return { ...element, text: undefined };

    return { ...element, text: { html, style: element.text?.style ?? shapeTextStyle(element, theme) } };
};

const BOX_WIDE: Array<[key: keyof TextStyle, property: string]> = [['fontSize', 'font-size'], ['color', 'color']];

const restyled = (text: { html: string; style: TextStyle }, change: (style: TextStyle) => TextStyle) => {
    const style = change(text.style);
    const changed = BOX_WIDE.filter(([key]) => style[key] !== text.style[key]).map(([, property]) => property);

    return { html: changed.length === 0 ? text.html : withoutInlineStyles(text.html, changed), style };
};

export const withTextStyle = (element: SlideElement, change: (style: TextStyle) => TextStyle, theme: DeckTheme): SlideElement => {
    if(element.type === 'text') return { ...element, ...restyled(element, change) };
    if(element.type !== 'shape' || !TEXT_SHAPES.includes(element.shape)) return element;

    return { ...element, text: restyled(element.text ?? { html: '', style: shapeTextStyle(element, theme) }, change) };
};

export const sizeOf = (deck: DeckContent) => DECK_SIZES[deck.format];
const unitOf = (deck: DeckContent) => Math.min(sizeOf(deck).width / BASE_SIZE.width, sizeOf(deck).height / BASE_SIZE.height);

export const withSlide = (deck: DeckContent, index: number, change: (slide: Slide) => Slide): DeckContent => ({
    ...deck,
    slides: deck.slides.map((slide, at) => at === index ? change(slide) : slide)
});

export const updateElements = (deck: DeckContent, index: number, ids: readonly string[], change: (element: SlideElement) => SlideElement): DeckContent =>
    withSlide(deck, index, (slide) => ({ ...slide, elements: slide.elements.map((element) => ids.includes(element.id) ? change(element) : element) }));

export const removeElements = (deck: DeckContent, index: number, ids: readonly string[]): DeckContent =>
    withSlide(deck, index, (slide) => ({ ...slide, elements: slide.elements.filter((element) => !ids.includes(element.id) || element.isLocked) }));

export const cloneElements = (elements: SlideElement[], offset = PASTE_OFFSET): SlideElement[] =>
    elements.map((element) => ({ ...element, id: newId(), x: element.x + offset, y: element.y + offset, isLocked: false }));

export const insertElements = (deck: DeckContent, index: number, elements: SlideElement[]): DeckContent =>
    withSlide(deck, index, (slide) => ({ ...slide, elements: [...slide.elements, ...elements] }));

export const arrange = (deck: DeckContent, index: number, ids: readonly string[], how: Arrange): DeckContent => withSlide(deck, index, (slide) => {
    const chosen = slide.elements.filter((element) => ids.includes(element.id));
    const rest = slide.elements.filter((element) => !ids.includes(element.id));
    if(how === 'front') return { ...slide, elements: [...rest, ...chosen] };
    if(how === 'back') return { ...slide, elements: [...chosen, ...rest] };

    const elements = [...slide.elements];
    const order = how === 'forward' ? [...elements.keys()].reverse() : [...elements.keys()];
    for(const at of order){
        if(!ids.includes(elements[at].id)) continue;

        const target = how === 'forward' ? at + 1 : at - 1;
        if(target < 0 || target >= elements.length || ids.includes(elements[target].id)) continue;
        [elements[at], elements[target]] = [elements[target], elements[at]];
    }

    return { ...slide, elements };
});

export const align = (deck: DeckContent, index: number, ids: readonly string[], how: Align): DeckContent => {
    const slide = deck.slides[index];
    const chosen = slide.elements.filter((element) => ids.includes(element.id) && !element.isLocked);
    if(chosen.length === 0) return deck;

    const { width, height } = sizeOf(deck);
    const area = chosen.length === 1 ? { x: 0, y: 0, w: width, h: height } : boundsOf(chosen);

    return updateElements(deck, index, chosen.map((element) => element.id), (element) => {
        if(how === 'left') return { ...element, x: area.x };
        if(how === 'center') return { ...element, x: Math.round(area.x + (area.w - element.w) / 2) };
        if(how === 'right') return { ...element, x: area.x + area.w - element.w };
        if(how === 'top') return { ...element, y: area.y };
        if(how === 'middle') return { ...element, y: Math.round(area.y + (area.h - element.h) / 2) };
        return { ...element, y: area.y + area.h - element.h };
    });
};

const centered = (deck: DeckContent, w: number, h: number) => {
    const { width, height } = sizeOf(deck);

    return { id: newId(), x: Math.round((width - w) / 2), y: Math.round((height - h) / 2), w: Math.round(w), h: Math.round(h), rotation: 0, opacity: 1, isLocked: false };
};

export const newText = (deck: DeckContent, text: string): TextElement => {
    const { width } = sizeOf(deck);
    const unit = unitOf(deck);
    const fontSize = Math.round(NEW_TEXT_SIZE * unit);

    return {
        ...centered(deck, width * 0.5, fontSize * 1.3),
        type: 'text',
        html: `<p>${escapeHtml(text)}</p>`,
        fill: null,
        style: { fontSize, color: deck.theme.text, align: 'left', verticalAlign: 'top', lineHeight: 1.3, isBold: false }
    };
};

export const newShape = (deck: DeckContent, shape: ShapeKind): ShapeElement => {
    const { width, height } = sizeOf(deck);
    const isLine = shape === 'line' || shape === 'arrow';
    const side = Math.min(width, height) * 0.28;

    return {
        ...centered(deck, isLine ? width * 0.3 : side, isLine ? Math.max(MIN_SIZE, height * 0.03) : side),
        type: 'shape',
        shape,
        fill: isLine ? null : deck.theme.accent,
        stroke: isLine ? deck.theme.accent : null,
        strokeWidth: isLine ? Math.max(MIN_STROKE, Math.round(LINE_STROKE * unitOf(deck))) : 0
    };
};

export const newImage = (deck: DeckContent, fileId: string, natural: { width: number; height: number }, alt: string, credit: string | null): ImageElement => {
    const { width, height } = sizeOf(deck);
    const ratio = natural.width > 0 && natural.height > 0 ? natural.width / natural.height : FALLBACK_RATIO;
    const maxW = width * 0.5;
    const maxH = height * 0.6;
    const w = Math.min(maxW, maxH * ratio);

    return { ...centered(deck, w, w / ratio), type: 'image', fileId, fit: 'cover', radius: 0, alt: alt.slice(0, MAX_ALT_TEXT), credit: credit?.slice(0, MAX_ALT_TEXT) ?? null };
};

export const newTable = (deck: DeckContent, header: string[]): TableElement => {
    const { width, height } = sizeOf(deck);
    const unit = unitOf(deck);

    return {
        ...centered(deck, width * 0.7, height * 0.36),
        type: 'table',
        rows: [header, ...Array.from({ length: NEW_TABLE_BODY_ROWS }, () => header.map(() => ''))],
        hasHeader: true,
        fontSize: Math.round(NEW_GRID_TEXT_SIZE * unit),
        headerFill: deck.theme.accent,
        borderColor: deck.theme.muted
    };
};

export const newCode = (deck: DeckContent, code: string): CodeElement => {
    const { width, height } = sizeOf(deck);
    const unit = unitOf(deck);

    return {
        ...centered(deck, width * 0.6, height * 0.4),
        type: 'code',
        code,
        language: 'sql',
        fontSize: Math.round(NEW_GRID_TEXT_SIZE * unit),
        colorScheme: 'dark'
    };
};

export const insertSlide = (deck: DeckContent, at: number, slide: Slide): DeckContent => ({
    ...deck,
    slides: [...deck.slides.slice(0, at), slide, ...deck.slides.slice(at)]
});

export const duplicateSlide = (deck: DeckContent, index: number): DeckContent => {
    const slide = deck.slides[index];

    return insertSlide(deck, index + 1, { ...slide, id: newId(), elements: cloneElements(slide.elements, 0) });
};

export const removeSlide = (deck: DeckContent, index: number): DeckContent =>
    deck.slides.length <= 1 ? deck : { ...deck, slides: deck.slides.filter((_slide, at) => at !== index) };

export const moveSlide = (deck: DeckContent, from: number, to: number): DeckContent => {
    if(from === to) return deck;

    const slides = [...deck.slides];
    const [moved] = slides.splice(from, 1);
    slides.splice(to, 0, moved);

    return { ...deck, slides };
};
