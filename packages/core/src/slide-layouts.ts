import type {
    CodeElement,
    DeckFormat,
    DeckTheme,
    ImageElement,
    ShapeElement,
    Slide,
    SlideElement,
    TableElement,
    TextElement,
    TextStyle
} from './content';
import { DECK_SIZES } from './content';
import { bandHeight, inkOn } from './deck-frame';
import { newId } from './ids';
import { codeFenceOf, codeHeight, fitCodeSize, type CodeFence } from './code';
import { inlineMarkdown } from './markdown-blocks';

const CODE_FONT_SIZE = 30;
const CODE_GAP = 24;
const PROSE_SHARE = 0.4;
const PROSE_CHAR_EMS = 0.5;
const PROSE_LINE_HEIGHT = 1.4;

export const SLIDE_LAYOUTS = ['title', 'section', 'bullets', 'two-columns', 'image-left', 'image-right', 'image-full', 'quote', 'table', 'big-number', 'closing'] as const;
export type SlideLayout = typeof SLIDE_LAYOUTS[number];

export interface SlideColumnSpec{
    heading?: string;
    bullets?: string[];
    text?: string;
}

export interface SlideSpec{
    layout: SlideLayout;
    title?: string;
    subtitle?: string;
    bullets?: string[];
    text?: string;
    left?: SlideColumnSpec;
    right?: SlideColumnSpec;
    imageFileId?: string;
    imageAlt?: string;
    imageCredit?: string;
    quote?: string;
    quoteAuthor?: string;
    rows?: string[][];
    number?: string;
    numberLabel?: string;
}

interface Box{
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface Canvas{
    width: number;
    height: number;
    unit: number;
    margin: number;
    band: number;
    theme: DeckTheme;
}

const round = (box: Box): Box => ({ x: Math.round(box.x), y: Math.round(box.y), w: Math.max(1, Math.round(box.w)), h: Math.max(1, Math.round(box.h)) });

const frame = (box: Box) => ({ id: newId(), ...round(box), rotation: 0, opacity: 1, isLocked: false });

const paragraphs = (text: string): string => text.split(/\n{2,}/).map((part) => `<p>${inlineMarkdown(part.trim())}</p>`).join('');

const bulletList = (items: string[]): string => `<ul>${items.map((item) => `<li>${inlineMarkdown(item)}</li>`).join('')}</ul>`;

const bodyHtml = (bullets: string[] | undefined, text: string | undefined): string =>
    [text === undefined || text.trim() === '' ? '' : paragraphs(text), bullets === undefined || bullets.length === 0 ? '' : bulletList(bullets)].join('');

const codeBox = (canvas: Canvas, box: Box, fence: CodeFence): CodeElement => {
    const fontSize = fitCodeSize(fence.code, box, CODE_FONT_SIZE * canvas.unit);

    return { ...frame({ ...box, h: Math.min(box.h, codeHeight(fence.code, fontSize)) }), type: 'code', code: fence.code, language: fence.language, colorScheme: 'dark', fontSize };
};

const proseHeight = (html: string, box: Box, fontSize: number): number => {
    const perLine = Math.max(1, Math.floor(box.w / (fontSize * PROSE_CHAR_EMS)));
    const lines = html.split(/<\/(?:p|li)>/).map((part) => part.replace(/<[^>]+>/g, '').length).filter((length) => length > 0)
        .reduce((total, length) => total + Math.ceil(length / perLine), 0);

    return Math.min(box.h * PROSE_SHARE, lines * fontSize * PROSE_LINE_HEIGHT);
};

const body = (canvas: Canvas, box: Box, bullets: string[] | undefined, text: string | undefined, fontSize: number): SlideElement[] => {
    const fence = codeFenceOf(text ?? '');
    if(fence === null) return [textBox(canvas, box, bodyHtml(bullets, text), { fontSize })];

    const prose = [fence.before, fence.after].filter((part) => part !== '').join('\n\n');
    const html = bodyHtml(bullets, prose === '' ? undefined : prose);
    if(html === '') return [codeBox(canvas, box, fence)];

    const height = proseHeight(html, box, fontSize);
    const gap = CODE_GAP * canvas.unit;
    return [
        textBox(canvas, { ...box, h: height }, html, { fontSize }),
        codeBox(canvas, { ...box, y: box.y + height + gap, h: box.h - height - gap }, fence)
    ];
};

const textBox = (canvas: Canvas, box: Box, html: string, style: Partial<TextStyle> & { fontSize: number }): TextElement => ({
    ...frame(box),
    type: 'text',
    html,
    fill: null,
    style: {
        color: canvas.theme.text,
        align: 'left',
        verticalAlign: 'top',
        lineHeight: 1.3,
        isBold: false,
        ...style,
        fontSize: Math.round(style.fontSize)
    }
});

const heading = (canvas: Canvas, box: Box, text: string, fontSize: number, overrides: Partial<TextStyle> = {}): TextElement =>
    textBox(canvas, box, `<p>${inlineMarkdown(text)}</p>`, { isBold: true, lineHeight: 1.1, fontSize, ...overrides });

const accentBar = (canvas: Canvas, box: Box): ShapeElement => ({
    ...frame(box),
    type: 'shape',
    shape: 'rect',
    fill: canvas.theme.accent,
    stroke: null,
    strokeWidth: 0
});

const image = (box: Box, spec: SlideSpec, fit: ImageElement['fit'] = 'cover'): ImageElement | null =>
    spec.imageFileId === undefined
        ? null
        : { ...frame(box), type: 'image', fileId: spec.imageFileId, fit, radius: 0, alt: spec.imageAlt ?? '', credit: spec.imageCredit ?? null };

const titleBlock = (canvas: Canvas, title: string | undefined): SlideElement[] => {
    if(title === undefined || title.trim() === '') return [];

    const { width, unit, margin, band } = canvas;
    if(band > 0) return [bandTitle(canvas, title)];

    return [
        accentBar(canvas, { x: margin, y: margin * 0.62, w: 96 * unit, h: 8 * unit }),
        heading(canvas, { x: margin, y: margin * 0.62 + 24 * unit, w: width - margin * 2, h: 130 * unit }, title, 60 * unit, { verticalAlign: 'middle' })
    ];
};

const bandTitle = (canvas: Canvas, title: string): TextElement =>
    heading(canvas, { x: 56 * canvas.unit, y: 0, w: canvas.width - 112 * canvas.unit, h: canvas.band }, title, 54 * canvas.unit, { isBold: false, color: inkOn(canvas.theme.accent), verticalAlign: 'middle' });

const contentTop = (canvas: Canvas, title: string | undefined): number => {
    if(canvas.band > 0) return canvas.band + 56 * canvas.unit;

    return title === undefined || title.trim() === '' ? canvas.margin : canvas.margin * 0.62 + 24 * canvas.unit + 130 * canvas.unit + 36 * canvas.unit;
};

const bandCover = (canvas: Canvas, spec: SlideSpec): Pick<Slide, 'elements' | 'background' | 'frame'> => {
    const { width, height, unit, margin, theme } = canvas;
    const box = { x: width * 0.18, y: height * 0.34, w: width * 0.64, h: 180 * unit };
    const panel: ShapeElement = { ...frame(box), type: 'shape', shape: 'rounded', fill: theme.accent, stroke: null, strokeWidth: 0 };

    return {
        background: null,
        frame: 'footer',
        elements: [
            panel,
            heading(canvas, { ...box, x: box.x + 48 * unit, w: box.w - 96 * unit }, spec.title ?? '', 64 * unit, { isBold: false, align: 'center', verticalAlign: 'middle', color: inkOn(theme.accent) }),
            ...(spec.subtitle === undefined ? [] : [textBox(canvas, { x: margin, y: box.y + box.h + 64 * unit, w: width - margin * 2, h: 160 * unit }, paragraphs(spec.subtitle), { fontSize: 36 * unit, align: 'center' })])
        ]
    };
};

const column = (canvas: Canvas, box: Box, spec: SlideColumnSpec | undefined): SlideElement[] => {
    if(spec === undefined) return [];

    const { unit } = canvas;
    const hasHeading = spec.heading !== undefined && spec.heading.trim() !== '';
    const headingHeight = hasHeading ? 70 * unit : 0;

    return [
        ...(hasHeading ? [heading(canvas, { ...box, h: headingHeight }, spec.heading ?? '', 40 * unit, { color: canvas.theme.accent })] : []),
        ...body(canvas, { ...box, y: box.y + headingHeight, h: box.h - headingHeight }, spec.bullets, spec.text, 32 * unit)
    ];
};

const layouts: Record<SlideLayout, (canvas: Canvas, spec: SlideSpec) => Pick<Slide, 'elements' | 'background' | 'frame'>> = {
    title: (canvas, spec) => {
        if(canvas.band > 0) return bandCover(canvas, spec);

        const { width, height, unit, margin } = canvas;
        return {
            background: null,
            frame: 'footer',
            elements: [
                accentBar(canvas, { x: margin, y: height * 0.3, w: 120 * unit, h: 10 * unit }),
                heading(canvas, { x: margin, y: height * 0.3 + 40 * unit, w: width - margin * 2, h: 260 * unit }, spec.title ?? '', 96 * unit, { verticalAlign: 'bottom' }),
                ...(spec.subtitle === undefined ? [] : [textBox(canvas, { x: margin, y: height * 0.3 + 320 * unit, w: width - margin * 2, h: 140 * unit }, paragraphs(spec.subtitle), { fontSize: 40 * unit, color: canvas.theme.muted })])
            ]
        };
    },
    section: (canvas, spec) => {
        const { width, height, unit, margin } = canvas;
        const inverse = { color: canvas.theme.background };
        return {
            background: { type: 'color', color: canvas.theme.accent },
            frame: 'none',
            elements: [
                heading(canvas, { x: margin, y: height * 0.36, w: width - margin * 2, h: 200 * unit }, spec.title ?? '', 84 * unit, { ...inverse, verticalAlign: 'bottom' }),
                ...(spec.subtitle === undefined ? [] : [textBox(canvas, { x: margin, y: height * 0.36 + 220 * unit, w: width - margin * 2, h: 120 * unit }, paragraphs(spec.subtitle), { fontSize: 36 * unit, ...inverse })])
            ]
        };
    },
    bullets: (canvas, spec) => {
        const { width, height, margin } = canvas;
        const top = contentTop(canvas, spec.title);
        return {
            background: null,
            elements: [
                ...titleBlock(canvas, spec.title),
                ...body(canvas, { x: margin, y: top, w: width - margin * 2, h: height - top - margin }, spec.bullets, spec.text, 36 * canvas.unit)
            ]
        };
    },
    'two-columns': (canvas, spec) => {
        const { width, height, unit, margin } = canvas;
        const top = contentTop(canvas, spec.title);
        const gap = 64 * unit;
        const columnWidth = (width - margin * 2 - gap) / 2;
        const columnHeight = height - top - margin;
        return {
            background: null,
            elements: [
                ...titleBlock(canvas, spec.title),
                ...column(canvas, { x: margin, y: top, w: columnWidth, h: columnHeight }, spec.left),
                ...column(canvas, { x: margin + columnWidth + gap, y: top, w: columnWidth, h: columnHeight }, spec.right)
            ]
        };
    },
    'image-left': (canvas, spec) => imageBeside(canvas, spec, 'left'),
    'image-right': (canvas, spec) => imageBeside(canvas, spec, 'right'),
    'image-full': (canvas, spec) => {
        const { width, height, unit, margin } = canvas;
        if(spec.imageFileId === undefined) return layouts.title(canvas, spec);

        const light = { color: '#ffffff' };
        return {
            background: { type: 'image', fileId: spec.imageFileId, fit: 'cover', dim: 0.45 },
            frame: 'none',
            elements: [
                heading(canvas, { x: margin, y: height - margin - 300 * unit, w: width - margin * 2, h: 200 * unit }, spec.title ?? '', 80 * unit, { ...light, verticalAlign: 'bottom' }),
                ...(spec.subtitle === undefined ? [] : [textBox(canvas, { x: margin, y: height - margin - 90 * unit, w: width - margin * 2, h: 90 * unit }, paragraphs(spec.subtitle), { fontSize: 34 * unit, ...light })])
            ]
        };
    },
    quote: (canvas, spec) => {
        const { width, height, unit, margin } = canvas;
        return {
            background: null,
            elements: [
                heading(canvas, { x: margin, y: height * 0.14, w: 200 * unit, h: 200 * unit }, '“', 240 * unit, { color: canvas.theme.accent, lineHeight: 1 }),
                textBox(canvas, { x: margin + 40 * unit, y: height * 0.3, w: width - margin * 2 - 80 * unit, h: height * 0.4 }, paragraphs(spec.quote ?? spec.text ?? ''), { fontSize: 54 * unit, lineHeight: 1.25, verticalAlign: 'middle' }),
                ...(spec.quoteAuthor === undefined ? [] : [textBox(canvas, { x: margin + 40 * unit, y: height * 0.72, w: width - margin * 2 - 80 * unit, h: 80 * unit }, `<p>— ${inlineMarkdown(spec.quoteAuthor)}</p>`, { fontSize: 32 * unit, color: canvas.theme.muted })])
            ]
        };
    },
    table: (canvas, spec) => {
        const { width, height, unit, margin } = canvas;
        const top = contentTop(canvas, spec.title);
        const rows = (spec.rows ?? []).slice(0, 60).map((row) => row.slice(0, 20));
        const rowHeight = Math.min(90 * unit, (height - top - margin) / Math.max(rows.length, 1));
        const table: TableElement = {
            ...frame({ x: margin, y: top, w: width - margin * 2, h: rowHeight * Math.max(rows.length, 1) }),
            type: 'table',
            rows,
            hasHeader: true,
            fontSize: Math.round(Math.max(16 * unit, Math.min(30 * unit, rowHeight * 0.42))),
            headerFill: canvas.theme.accent,
            borderColor: canvas.theme.muted
        };
        return { background: null, elements: [...titleBlock(canvas, spec.title), table] };
    },
    'big-number': (canvas, spec) => {
        const { width, height, unit, margin } = canvas;
        return {
            background: null,
            elements: [
                ...titleBlock(canvas, spec.title),
                heading(canvas, { x: margin, y: height * 0.3, w: width - margin * 2, h: 280 * unit }, spec.number ?? '', 220 * unit, { color: canvas.theme.accent, align: 'center', verticalAlign: 'middle' }),
                textBox(canvas, { x: margin, y: height * 0.3 + 300 * unit, w: width - margin * 2, h: 160 * unit }, paragraphs(spec.numberLabel ?? spec.text ?? ''), { fontSize: 40 * unit, align: 'center' })
            ]
        };
    },
    closing: (canvas, spec) => {
        const { width, height, unit, margin } = canvas;
        return {
            background: null,
            frame: 'footer',
            elements: [
                heading(canvas, { x: margin, y: height * 0.32, w: width - margin * 2, h: 200 * unit }, spec.title ?? '', 96 * unit, { align: 'center', verticalAlign: 'middle' }),
                accentBar(canvas, { x: width / 2 - 60 * unit, y: height * 0.32 + 220 * unit, w: 120 * unit, h: 10 * unit }),
                ...(spec.subtitle === undefined ? [] : [textBox(canvas, { x: margin, y: height * 0.32 + 260 * unit, w: width - margin * 2, h: 140 * unit }, paragraphs(spec.subtitle), { fontSize: 38 * unit, color: canvas.theme.muted, align: 'center' })])
            ]
        };
    }
};

function imageBeside(canvas: Canvas, spec: SlideSpec, side: 'left' | 'right'): Pick<Slide, 'elements' | 'background' | 'frame'>{
    if(spec.imageFileId === undefined) return layouts.bullets(canvas, spec);

    const { width, height, unit, margin } = canvas;
    const top = contentTop(canvas, spec.title);
    const gap = 64 * unit;
    const imageWidth = (width - margin * 2 - gap) * 0.46;
    const textWidth = width - margin * 2 - gap - imageWidth;
    const imageX = side === 'left' ? margin : width - margin - imageWidth;
    const textX = side === 'left' ? margin + imageWidth + gap : margin;
    const picture = image({ x: imageX, y: top, w: imageWidth, h: height - top - margin }, spec);

    return {
        background: null,
        elements: [
            ...titleBlock(canvas, spec.title),
            ...(picture === null ? [] : [picture]),
            ...body(canvas, { x: textX, y: top, w: textWidth, h: height - top - margin }, spec.bullets, spec.text, 34 * unit)
        ]
    };
}

export const canvasOf = (format: DeckFormat, theme: DeckTheme): Canvas => {
    const { width, height } = DECK_SIZES[format];
    const unit = Math.min(width / 1920, height / 1080);

    return { width, height, unit, margin: Math.round(Math.min(width, height) * 0.1), band: theme.frame?.header === 'band' ? bandHeight(format) : 0, theme };
};

export const layoutSlide = (spec: SlideSpec, format: DeckFormat, theme: DeckTheme): Slide => {
    const { elements, background, frame: slideFrame } = layouts[spec.layout](canvasOf(format, theme), spec);

    return slideFrame === undefined ? { id: newId(), background, elements } : { id: newId(), background, elements, frame: slideFrame };
};

export const shapeTextStyle = (shape: ShapeElement, theme: DeckTheme): TextStyle => ({
    fontSize: Math.max(12, Math.min(72, Math.round(shape.h * 0.16))),
    color: shape.fill === null ? theme.text : inkOn(shape.fill),
    align: 'center',
    verticalAlign: 'middle',
    lineHeight: 1.2,
    isBold: false
});

export const isAccentBar = (element: SlideElement, canvas: Canvas): boolean =>
    element.type === 'shape' && element.shape === 'rect' && element.text === undefined
    && element.fill === canvas.theme.accent && element.h <= 16 * canvas.unit && element.w <= 140 * canvas.unit;

