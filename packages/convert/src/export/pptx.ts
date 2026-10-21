import type { ExportBundle, ExportedFile } from './bundle';
import { blocksOfHtml, type Run } from './html-blocks';
import { CODE_FONT, CODE_LINE_HEIGHT, CODE_PALETTES, codeLines } from '@vyva/core/code';
import type { CodeElement, DeckContent, ImageElement, ShapeElement, Slide, TableElement, TextElement, TextStyle } from '@vyva/core/content';
import { DECK_SIZES, TEXT_SHAPES } from '@vyva/core/content';
import { bandHeight, footerHeight, footerSegments, hasBand, hasFooter, inkOn } from '@vyva/core/deck-frame';
import PptxGenJS from 'pptxgenjs';

const PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
const LAYOUT = 'VYVA';
const PX_PER_INCH = 144;
const PT_PER_PX = 72 / PX_PER_INCH;
const CODE_PADDING_EMS = 0.8;

const inch = (px: number): number => Number((px / PX_PER_INCH).toFixed(4));
const hex = (color: string): string => color.replace('#', '').toUpperCase();
const transparency = (opacity: number): number => Math.round((1 - Math.min(1, Math.max(0, opacity))) * 100);
const dataUrl = (contentType: string, data: Buffer): string => `${contentType};base64,${data.toString('base64')}`;

type TextRuns = PptxGenJS.TextProps[];

const runProps = (run: Run, style: TextStyle): PptxGenJS.TextPropsOptions => ({
    bold: run.bold || style.isBold,
    italic: run.italic,
    ...(run.underline ? { underline: { style: 'sng' } } : {}),
    ...(run.strike ? { strike: 'sngStrike' } : {}),
    ...(run.color === null ? {} : { color: hex(run.color) }),
    ...(run.highlight === null ? {} : { highlight: hex(run.highlight) }),
    ...(run.code ? { fontFace: CODE_FONT } : {}),
    ...(run.sizePx === null ? {} : { fontSize: Math.max(6, Math.round(run.sizePx * PT_PER_PX)) }),
    ...(run.link !== null && /^(https?:|mailto:)/i.test(run.link) ? { hyperlink: { url: run.link } } : {})
});

const textRuns = (html: string, style: TextStyle): TextRuns => {
    const out: TextRuns = [];
    const push = (runs: Run[], paragraph: PptxGenJS.TextPropsOptions) => {
        const visible = runs.filter((run) => run.isBreak !== true);
        if(visible.length === 0){
            out.push({ text: '', options: { ...paragraph, breakLine: true } });
            return;
        }
        visible.forEach((run, index) => out.push({ text: run.text, options: { ...runProps(run, style), ...(index === 0 ? paragraph : {}), ...(index === visible.length - 1 ? { breakLine: true } : {}) } }));
    };

    for(const block of blocksOfHtml(html)){
        if(block.kind === 'paragraph' || block.kind === 'heading') push(block.runs, block.align === null ? {} : { align: block.align });
        else if(block.kind === 'list') block.items.forEach((item) => push(item.runs, { bullet: block.ordered ? { type: 'number' } : true, indentLevel: item.level }));
        else if(block.kind === 'code') block.text.split('\n').forEach((line) => out.push({ text: line, options: { fontFace: CODE_FONT, breakLine: true } }));
    }

    const last = out.at(-1);
    if(last?.options !== undefined) last.options.breakLine = false;

    return out;
};

const textOptions = (style: TextStyle, deck: DeckContent): PptxGenJS.TextPropsOptions => ({
    fontFace: deck.theme.font,
    fontSize: Math.max(6, Math.round(style.fontSize * PT_PER_PX)),
    color: hex(style.color),
    align: style.align,
    valign: style.verticalAlign,
    lineSpacingMultiple: style.lineHeight
});

const addText = (slide: PptxGenJS.Slide, element: TextElement, deck: DeckContent) => {
    slide.addText(textRuns(element.html, element.style), {
        x: inch(element.x),
        y: inch(element.y),
        w: inch(element.w),
        h: inch(element.h),
        ...textOptions(element.style, deck),
        margin: 0,
        rotate: element.rotation,
        transparency: transparency(element.opacity),
        ...(element.fill === null ? {} : { fill: { color: hex(element.fill) } })
    });
};

const addImage = (slide: PptxGenJS.Slide, element: ImageElement, bundle: ExportBundle) => {
    const image = bundle.images.get(element.fileId);
    if(image === undefined) return;

    slide.addImage({
        data: dataUrl(image.contentType, image.data),
        x: inch(element.x),
        y: inch(element.y),
        w: inch(element.w),
        h: inch(element.h),
        rotate: element.rotation,
        transparency: transparency(element.opacity),
        rounding: element.radius >= Math.min(element.w, element.h) / 2,
        altText: element.alt,
        sizing: { type: element.fit === 'contain' ? 'contain' : 'cover', w: inch(element.w), h: inch(element.h) }
    });
};

const SHAPES = {
    rect: 'rect',
    rounded: 'roundRect',
    ellipse: 'ellipse',
    triangle: 'triangle',
    line: 'line',
    arrow: 'line'
} as const satisfies Record<ShapeElement['shape'], PptxGenJS.SHAPE_NAME>;

const addShape = (slide: PptxGenJS.Slide, element: ShapeElement, deck: DeckContent) => {
    const isLine = element.shape === 'line' || element.shape === 'arrow';
    const lineColor = element.stroke ?? element.fill;
    const box = { x: inch(element.x), y: inch(isLine ? element.y + element.h / 2 : element.y), w: inch(element.w), h: isLine ? 0 : inch(element.h) };
    const paint = {
        rotate: element.rotation,
        ...(isLine || element.fill === null ? { fill: { type: 'none' as const } } : { fill: { color: hex(element.fill), transparency: transparency(element.opacity) } }),
        ...(lineColor === null || (element.strokeWidth === 0 && !isLine)
            ? { line: { type: 'none' as const } }
            : { line: { color: hex(lineColor), width: Math.max(0.5, element.strokeWidth * PT_PER_PX), ...(element.shape === 'arrow' ? { endArrowType: 'triangle' as const } : {}) } }),
        ...(element.shape === 'rounded' ? { rectRadius: 0.18 } : {})
    };

    if(element.text !== undefined && TEXT_SHAPES.includes(element.shape) && element.text.html.trim() !== ''){
        slide.addText(textRuns(element.text.html, element.text.style), {
            ...box,
            ...paint,
            ...textOptions(element.text.style, deck),
            shape: SHAPES[element.shape],
            margin: 6
        });
        return;
    }

    slide.addShape(SHAPES[element.shape], { ...box, ...paint });
};

const addCode = (slide: PptxGenJS.Slide, element: CodeElement) => {
    const palette = CODE_PALETTES[element.colorScheme];
    const lines = codeLines(element.code, element.language, element.colorScheme);
    const runs: TextRuns = lines.flatMap((line, index) => {
        const tokens = line.length === 0 ? [{ text: ' ', color: palette.foreground }] : line;
        return tokens.map((token, at) => ({ text: token.text, options: { color: hex(token.color), ...(at === tokens.length - 1 && index < lines.length - 1 ? { breakLine: true } : {}) } }));
    });
    const padding = Math.round(element.fontSize * CODE_PADDING_EMS * PT_PER_PX);

    slide.addText(runs, {
        x: inch(element.x),
        y: inch(element.y),
        w: inch(element.w),
        h: inch(element.h),
        fontFace: CODE_FONT,
        fontSize: Math.max(6, Math.round(element.fontSize * PT_PER_PX)),
        color: hex(palette.foreground),
        fill: { color: hex(palette.background) },
        rectRadius: 0.08,
        shape: 'roundRect',
        valign: 'top',
        align: 'left',
        lineSpacingMultiple: CODE_LINE_HEIGHT,
        margin: [padding, padding, padding, padding],
        wrap: false,
        rotate: element.rotation,
        transparency: transparency(element.opacity)
    });
};

const addTable = (slide: PptxGenJS.Slide, element: TableElement, deck: DeckContent) => {
    const columns = Math.max(1, ...element.rows.map((row) => row.length));
    const rows: PptxGenJS.TableRow[] = element.rows.map((row, index) => Array.from({ length: columns }, (_, column) => {
        const isHeader = element.hasHeader && index === 0;
        return {
            text: row[column] ?? '',
            options: isHeader ? { bold: true, color: 'FFFFFF', fill: { color: hex(element.headerFill) } } : { color: hex(deck.theme.text) }
        };
    }));

    slide.addTable(rows, {
        x: inch(element.x),
        y: inch(element.y),
        w: inch(element.w),
        colW: Array.from({ length: columns }, () => inch(element.w / columns)),
        fontFace: deck.theme.font,
        fontSize: Math.max(6, Math.round(element.fontSize * PT_PER_PX)),
        border: { type: 'solid', color: hex(element.borderColor), pt: 1 },
        valign: 'middle',
        margin: 0.06
    });
};

const addBackground = (slide: PptxGenJS.Slide, background: Slide['background'], deck: DeckContent, bundle: ExportBundle) => {
    if(background?.type === 'image'){
        const image = bundle.images.get(background.fileId);
        if(image !== undefined){
            slide.background = { data: dataUrl(image.contentType, image.data) };
            if(background.dim > 0){
                const { width, height } = DECK_SIZES[deck.format];
                slide.addShape('rect', { x: 0, y: 0, w: inch(width), h: inch(height), fill: { color: '000000', transparency: transparency(background.dim) }, line: { type: 'none' } });
            }
            return;
        }
    }

    slide.background = { color: hex(background?.type === 'color' ? background.color : deck.theme.background) };
};

const addBand = (slide: PptxGenJS.Slide, source: Slide, deck: DeckContent) => {
    if(!hasBand(deck.theme, source)) return;

    const { width } = DECK_SIZES[deck.format];
    slide.addShape('rect', { x: 0, y: 0, w: inch(width), h: inch(bandHeight(deck.format)), fill: { color: hex(deck.theme.accent) }, line: { type: 'none' } });
};

const addFooter = (slide: PptxGenJS.Slide, source: Slide, deck: DeckContent) => {
    if(!hasFooter(deck.theme, source)) return;

    const { width, height } = DECK_SIZES[deck.format];
    const tall = footerHeight(deck.format);
    const third = width / 3;
    footerSegments(source, deck).forEach((segment, index) => {
        slide.addText(segment.text, {
            x: inch(third * index), y: inch(height - tall), w: inch(third), h: inch(tall),
            fill: { color: hex(segment.fill) }, color: hex(inkOn(segment.fill)), fontFace: deck.theme.font,
            fontSize: Math.round(tall * 0.48 * PT_PER_PX), align: segment.align, valign: 'middle', margin: Math.round(tall * 0.5 * PT_PER_PX)
        });
    });
};

export const buildPptx = async (deck: DeckContent, bundle: ExportBundle): Promise<ExportedFile> => {
    const { width, height } = DECK_SIZES[deck.format];
    const pptx = new PptxGenJS();
    pptx.defineLayout({ name: LAYOUT, width: inch(width), height: inch(height) });
    pptx.layout = LAYOUT;
    pptx.title = bundle.title;

    for(const source of deck.slides){
        const slide = pptx.addSlide();
        addBackground(slide, source.background, deck, bundle);
        addBand(slide, source, deck);

        for(const element of source.elements){
            if(element.type === 'text') addText(slide, element, deck);
            else if(element.type === 'image') addImage(slide, element, bundle);
            else if(element.type === 'shape') addShape(slide, element, deck);
            else if(element.type === 'code') addCode(slide, element);
            else addTable(slide, element, deck);
        }
        addFooter(slide, source, deck);
    }

    const data = await pptx.write({ outputType: 'uint8array' });
    if(!(data instanceof Uint8Array)) throw new TypeError('PptxGenJS did not write the presentation as bytes');

    return { data, contentType: PPTX_MIME, extension: 'pptx' };
};
