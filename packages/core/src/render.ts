import type {
    DeckContent,
    DocumentContent,
    FontFamily,
    Content,
    ShapeElement,
    Slide,
    SlideBackground,
    SlideElement,
    TextStyle
} from './content';
import { DECK_SIZES, FONT_FAMILIES, TEXT_SHAPES } from './content';
import { escapeHtml } from './escape';
import { frameLayers } from './deck-frame';
import { withMath } from './math';
import { codeHtml } from './code';
import { fontStack } from './themes';

export type FileUrl = (fileId: string) => string | null;

export const A4 = { width: 794, height: 1123 } as const;

const COLOR = /^#[0-9a-fA-F]{6}$/;
const FILE_IMAGE = /<img\b([^>]*?)\sdata-file-id="([0-9a-f-]{36})"([^>]*)>/g;
const FILE_ID = /data-file-id="([0-9a-f-]{36})"/g;

const color = (value: string | null | undefined, fallback: string): string => value !== null && value !== undefined && COLOR.test(value) ? value : fallback;
const font = (value: string): string => fontStack((FONT_FAMILIES as readonly string[]).includes(value) ? value as FontFamily : 'Inter');
const number = (value: unknown, min: number, max: number, fallback: number): number =>
    typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
const attr = (value: string): string => escapeHtml(value);

export const withImageSources = (html: string, fileUrl: FileUrl): string =>
    html.replace(FILE_IMAGE, (_match, before: string, id: string, after: string) => {
        const url = fileUrl(id);
        return url === null ? '' : `<img${before} data-file-id="${id}" src="${attr(url)}"${after}>`;
    });

export const CONTENT_CSS = `
.vy-doc{box-sizing:border-box;width:${A4.width}px;min-height:${A4.height}px;background:#fff;color:var(--vy-doc-text);font-family:var(--vy-doc-font);font-size:var(--vy-doc-size);line-height:1.55;padding:var(--vy-doc-pad-top) var(--vy-doc-pad-right) var(--vy-doc-pad-bottom) var(--vy-doc-pad-left);overflow-wrap:break-word}
.vy-doc *{box-sizing:border-box}
.vy-doc h1,.vy-doc h2,.vy-doc h3,.vy-doc h4{color:var(--vy-doc-accent);font-weight:700;line-height:1.2;margin:1.1em 0 .45em}
.vy-doc h1{font-size:2em;margin-top:0}.vy-doc h2{font-size:1.5em}.vy-doc h3{font-size:1.2em}.vy-doc h4{font-size:1.05em}
.vy-doc p{margin:0 0 .7em}.vy-doc ul,.vy-doc ol{margin:0 0 .8em;padding-left:1.4em}.vy-doc ul{list-style:disc}.vy-doc ol{list-style:decimal}.vy-doc li{margin:.15em 0}.vy-doc li>p{margin:0}
.vy-doc ul[data-type="taskList"]{list-style:none;padding-left:.2em}.vy-doc li[data-type="taskItem"]{display:flex;gap:.5em}
.vy-doc li[data-type="taskItem"]:not(:has(>label))::before{content:'';flex:none;width:.9em;height:.9em;margin-top:.3em;border:1.5px solid var(--vy-doc-accent);border-radius:.2em}
.vy-doc li[data-type="taskItem"][data-checked="true"]:not(:has(>label))::before{background:var(--vy-doc-accent)}
.vy-doc li[data-type="taskItem"]>label{flex:none;margin-top:.2em}.vy-doc li[data-type="taskItem"]>label input{accent-color:var(--vy-doc-accent);width:.95em;height:.95em}
.vy-doc li[data-type="taskItem"]>label span{display:none}.vy-doc li[data-type="taskItem"]>div{flex:1;min-width:0}
.vy-doc blockquote{margin:0 0 .8em;padding:.2em 0 .2em 1em;border-left:3px solid var(--vy-doc-accent);color:#555}
.vy-doc table{width:100%;border-collapse:collapse;margin:0 0 1em;font-size:.95em}
.vy-doc th,.vy-doc td{border:1px solid #c9ced6;padding:.4em .6em;text-align:left;vertical-align:top}
.vy-doc th{background:color-mix(in srgb,var(--vy-doc-accent) 12%,#fff);font-weight:600}
.vy-doc pre{margin:0 0 1em;padding:.8em 1em;border-radius:6px;background:#0f1720;color:#e6edf3;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:.88em;white-space:pre-wrap}
.vy-doc :not(pre)>code{padding:.1em .3em;border-radius:4px;background:#eef0f3;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:.9em}
.vy-doc a{color:var(--vy-doc-accent);text-decoration:underline}.vy-doc img{max-width:100%;height:auto}.vy-doc hr{border:0;border-top:1px solid #d5d9e0;margin:1.2em 0}
.vy-doc img[data-align]{display:block}.vy-doc img[data-align="center"]{margin-left:auto;margin-right:auto}.vy-doc img[data-align="right"]{margin-left:auto}
.vy-doc mark{padding:0 .1em}
.vy-doc div[data-type="page-break"]{height:0;margin:1.5em 0;border-top:1px dashed #c9ced6;break-after:page}
.vy-doc .vy-doc-header,.vy-doc .vy-doc-footer{display:flex;align-items:center;gap:12px;color:#6b7280;font-size:.8em}
.vy-doc .vy-doc-header{margin-bottom:1.6em;padding-bottom:.6em;border-bottom:1px solid #e5e7eb}
.vy-doc .vy-doc-footer{margin-top:2em;padding-top:.6em;border-top:1px solid #e5e7eb}
.vy-doc .vy-doc-header img{height:32px;width:auto}
.vy-slide{position:relative;overflow:hidden;box-sizing:border-box}
.vy-slide *{box-sizing:border-box}
.vy-el{position:absolute}
.vy-text{display:flex;flex-direction:column;width:100%;height:100%;overflow:hidden;overflow-wrap:break-word}
.vy-text:empty{min-height:1lh}
.vy-text p{margin:0 0 .35em}.vy-text p:last-child{margin-bottom:0}
.vy-text ul,.vy-text ol{margin:0;padding-left:1.15em}.vy-text ul{list-style:disc}.vy-text ol{list-style:decimal}.vy-text li{margin:0 0 .35em}.vy-text li>p{margin:0}
.vy-text a{color:inherit;text-decoration:underline}
.vy-table{width:100%;height:100%;border-collapse:collapse;table-layout:fixed}
.vy-code{margin:0;width:100%;height:100%;overflow:hidden;padding:.7em .9em;border-radius:12px;font-family:'JetBrains Mono','JetBrains Mono Variable',ui-monospace,SFMono-Regular,Menlo,monospace;line-height:1.45;white-space:pre;tab-size:4;text-align:left;font-variant-ligatures:none}
.vy-code code{font:inherit}
.vy-table td,.vy-table th{padding:.35em .5em;text-align:left;vertical-align:middle;overflow-wrap:break-word;white-space:pre-line}
.vy-shape{position:relative;width:100%;height:100%}
.vy-shape>svg{position:absolute;inset:0}
.vy-shape>.vy-text{position:absolute;inset:0}
.vy-frame{position:absolute;left:0;width:100%;pointer-events:none}
.vy-slide math,.vy-doc math{font-size:1.1em}.vy-slide math[display="block"],.vy-doc math[display="block"]{margin:.35em 0;font-size:1.2em}
.vy-frame-footer{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))}
.vy-frame-footer>span{display:block;padding:0 1.2em;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
`;

const designVariables = (content: DocumentContent): string => {
    const { design } = content;
    const margin = (value: number) => `${(number(value, 0, 60, 20) * 3.78).toFixed(1)}px`;

    return [
        `--vy-doc-font:${font(design.font)}`,
        `--vy-doc-size:${number(design.baseSize, 8, 24, 11)}pt`,
        `--vy-doc-text:${color(design.textColor, '#1d2433')}`,
        `--vy-doc-accent:${color(design.accentColor, '#1f4e9a')}`,
        `--vy-doc-pad-top:${margin(design.margins.top)}`,
        `--vy-doc-pad-right:${margin(design.margins.right)}`,
        `--vy-doc-pad-bottom:${margin(design.margins.bottom)}`,
        `--vy-doc-pad-left:${margin(design.margins.left)}`
    ].join(';');
};

export const renderDocument = (content: DocumentContent, fileUrl: FileUrl): string => {
    const { design } = content;
    const logo = design.headerLogoFileId === null ? null : fileUrl(design.headerLogoFileId);
    const hasHeader = logo !== null || design.headerText.trim() !== '';
    const hasFooter = design.footerText.trim() !== '';
    const header = hasHeader
        ? `<header class="vy-doc-header">${logo === null ? '' : `<img src="${attr(logo)}" alt="">`}<span>${escapeHtml(design.headerText)}</span></header>`
        : '';
    const footer = hasFooter ? `<footer class="vy-doc-footer"><span>${escapeHtml(design.footerText)}</span></footer>` : '';
    const body = content.blocks.map((block) => withMath(withImageSources(block.html, fileUrl))).join('\n');

    return `<article class="vy-doc" style="${attr(designVariables(content))}">${header}${body}${footer}</article>`;
};

export const backgroundStyle = (background: SlideBackground | null, fallback: string, fileUrl: FileUrl): string => {
    if(background === null) return `background:${fallback}`;
    if(background.type === 'color') return `background:${color(background.color, fallback)}`;

    const url = fileUrl(background.fileId);
    if(url === null) return `background:${fallback}`;

    const dim = number(background.dim, 0, 0.9, 0);
    const fit = background.fit === 'contain' ? 'contain' : 'cover';
    return `background:linear-gradient(rgba(0,0,0,${dim}),rgba(0,0,0,${dim})),url("${encodeURI(url)}") center/${fit} no-repeat ${fallback}`;
};

const JUSTIFY = { top: 'flex-start', middle: 'center', bottom: 'flex-end' } as const;

export const shapeSvg = (element: Extract<SlideElement, { type: 'shape' }>): string => {
    const fill = element.fill === null ? 'none' : color(element.fill, '#1f4e9a');
    const stroke = element.stroke === null ? 'none' : color(element.stroke, '#1f4e9a');
    const width = number(element.strokeWidth, 0, 80, 0);
    const { w, h } = element;
    const paint = `fill="${fill}" stroke="${stroke}" stroke-width="${width}"`;
    const inset = width / 2;
    const points = (element.points ?? []).map((point) => `${number(point.x, 0, 1, 0) * w},${number(point.y, 0, 1, 0) * h}`).join(' ');
    const shapes: Record<typeof element.shape, string> = {
        rect: `<rect x="${inset}" y="${inset}" width="${Math.max(0, w - width)}" height="${Math.max(0, h - width)}" ${paint}/>`,
        rounded: `<rect x="${inset}" y="${inset}" width="${Math.max(0, w - width)}" height="${Math.max(0, h - width)}" rx="${Math.min(w, h) * 0.18}" ${paint}/>`,
        ellipse: `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${Math.max(0, w / 2 - inset)}" ry="${Math.max(0, h / 2 - inset)}" ${paint}/>`,
        triangle: `<polygon points="${w / 2},${inset} ${w - inset},${h - inset} ${inset},${h - inset}" ${paint}/>`,
        line: `<line x1="0" y1="${h / 2}" x2="${w}" y2="${h / 2}" stroke="${stroke === 'none' ? fill : stroke}" stroke-width="${Math.max(width, 2)}"/>`,
        arrow: `<line x1="0" y1="${h / 2}" x2="${w - Math.max(width, 2) * 3}" y2="${h / 2}" stroke="${stroke === 'none' ? fill : stroke}" stroke-width="${Math.max(width, 2)}"/><polygon points="${w},${h / 2} ${w - Math.max(width, 2) * 4},${h / 2 - Math.max(width, 2) * 2.5} ${w - Math.max(width, 2) * 4},${h / 2 + Math.max(width, 2) * 2.5}" fill="${stroke === 'none' ? fill : stroke}"/>`,
        polygon: points === '' ? `<rect width="${w}" height="${h}" ${paint}/>` : `<polygon points="${points}" ${paint}/>`
    };

    return `<svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">${shapes[element.shape] ?? shapes.rect}</svg>`;
};

export const tableHtml = (element: Extract<SlideElement, { type: 'table' }>, textColor: string, fontFamily: string): string => {
    const border = color(element.borderColor, '#9aa4b2');
    const header = color(element.headerFill, '#1f4e9a');
    const rows = element.rows.map((row, index) => {
        const isHeader = element.hasHeader && index === 0;
        const cells = row.map((cell) => isHeader
            ? `<th style="border:1px solid ${border};background:${header};color:#fff;font-weight:600">${escapeHtml(cell)}</th>`
            : `<td style="border:1px solid ${border}">${escapeHtml(cell)}</td>`).join('');
        return `<tr>${cells}</tr>`;
    }).join('');

    return `<table class="vy-table" style="font-size:${number(element.fontSize, 6, 120, 24)}px;color:${textColor};font-family:${attr(fontFamily)}">${rows}</table>`;
};

const TEXT_ANCHOR = { top: 'margin-bottom:auto', middle: 'margin-block:auto', bottom: 'margin-top:auto' } as const;

const verticalCss = (element: SlideElement, slideHeight: number): string[] => {
    const y = number(element.y, -20000, 20000, 0);
    const h = number(element.h, 1, 20000, 100);
    if(element.type !== 'text') return [`top:${y}px`, `height:${h}px`];

    return [`top:${y}px`, `bottom:${slideHeight - y - h}px`, 'height:max-content', TEXT_ANCHOR[element.style.verticalAlign] ?? TEXT_ANCHOR.top];
};

export const frameCss = (element: SlideElement, slideHeight: number): string => [
    `left:${number(element.x, -20000, 20000, 0)}px`,
    ...verticalCss(element, slideHeight),
    `width:${number(element.w, 1, 20000, 100)}px`,
    `opacity:${number(element.opacity, 0, 1, 1)}`,
    element.rotation === 0 ? '' : `transform:rotate(${number(element.rotation, -360, 360, 0)}deg)`
].filter((part) => part !== '').join(';');

export const withTextHeight = <T extends Extract<SlideElement, { type: 'text' }>>(element: T, height: number): T => {
    const h = Math.max(1, Math.round(height));
    if(h === element.h) return element;

    const shift = { top: 0, middle: (element.h - h) / 2, bottom: element.h - h }[element.style.verticalAlign] ?? 0;
    return { ...element, y: Math.round(element.y + shift), h };
};

export const textStyleCss = (style: TextStyle, deck: DeckContent): string => [
    `font-size:${number(style.fontSize, 6, 400, 32)}px`,
    `color:${color(style.color, deck.theme.text)}`,
    `text-align:${['left', 'center', 'right', 'justify'].includes(style.align) ? style.align : 'left'}`,
    `line-height:${number(style.lineHeight, 0.8, 3, 1.3)}`,
    `font-weight:${style.isBold ? 700 : 400}`,
    `justify-content:${JUSTIFY[style.verticalAlign] ?? 'flex-start'}`
].join(';');

export const textCss = (element: Extract<SlideElement, { type: 'text' }>, deck: DeckContent): string =>
    element.fill === null ? textStyleCss(element.style, deck) : `${textStyleCss(element.style, deck)};background:${color(element.fill, 'transparent')}`;

const shapePadding = (element: ShapeElement): string => {
    const { w, h } = element;
    if(element.shape === 'ellipse') return `${Math.round(h * 0.15)}px ${Math.round(w * 0.15)}px`;
    if(element.shape === 'triangle') return `${Math.round(h * 0.42)}px ${Math.round(w * 0.22)}px ${Math.round(h * 0.06)}px`;

    return `${Math.max(8, Math.round(Math.min(w, h) * 0.07))}px`;
};

export const hasShapeText = (element: ShapeElement): element is ShapeElement & { text: NonNullable<ShapeElement['text']> } =>
    element.text !== undefined && TEXT_SHAPES.includes(element.shape);

export const shapeTextCss = (element: ShapeElement & { text: NonNullable<ShapeElement['text']> }, deck: DeckContent): string =>
    `${textStyleCss(element.text.style, deck)};padding:${shapePadding(element)}`;

export const shapeHtml = (element: ShapeElement, deck: DeckContent): string => hasShapeText(element)
    ? `<div class="vy-shape">${shapeSvg(element)}<div class="vy-text" style="${attr(shapeTextCss(element, deck))}">${withMath(element.text.html)}</div></div>`
    : shapeSvg(element);

export const imageCss = (element: Extract<SlideElement, { type: 'image' }>): string =>
    `width:100%;height:100%;object-fit:${element.fit === 'contain' ? 'contain' : 'cover'};border-radius:${number(element.radius, 0, 2000, 0)}px;display:block`;

export const deckTextColor = (deck: DeckContent): string => color(deck.theme.text, '#1d2433');
export const deckFont = (deck: DeckContent): string => font(deck.theme.font);

export const MISSING_IMAGE_FILL = '#e5e7eb';

const elementHtml = (element: SlideElement, deck: DeckContent, fileUrl: FileUrl, slideHeight: number): string => {
    let inner = '';
    if(element.type === 'text'){
        inner = `<div class="vy-text" style="${attr(textCss(element, deck))}">${withMath(withImageSources(element.html, fileUrl))}</div>`;
    }else if(element.type === 'image'){
        const url = fileUrl(element.fileId);
        inner = url === null
            ? `<div style="width:100%;height:100%;background:${MISSING_IMAGE_FILL}"></div>`
            : `<img src="${attr(url)}" alt="${attr(element.alt)}" style="${imageCss(element)}">`;
    }else if(element.type === 'shape'){
        inner = shapeHtml(element, deck);
    }else if(element.type === 'code'){
        inner = codeHtml(element);
    }else{
        inner = tableHtml(element, deckTextColor(deck), deckFont(deck));
    }

    return `<div class="vy-el" data-element-id="${attr(element.id)}" style="${attr(frameCss(element, slideHeight))}">${inner}</div>`;
};

export const slideCss = (slide: Slide, deck: DeckContent, fileUrl: FileUrl): string => {
    const { width, height } = DECK_SIZES[deck.format] ?? DECK_SIZES['16:9'];

    return `width:${width}px;height:${height}px;${backgroundStyle(slide.background, color(deck.theme.background, '#ffffff'), fileUrl)};font-family:${deckFont(deck)};color:${color(deck.theme.text, '#1d2433')}`;
};

export const renderSlide = (slide: Slide, deck: DeckContent, fileUrl: FileUrl): string => {
    const style = slideCss(slide, deck, fileUrl);
    const { height } = DECK_SIZES[deck.format] ?? DECK_SIZES['16:9'];
    const frame = frameLayers(slide, deck);

    return `<section class="vy-slide" style="${attr(style)}">${frame.under}${slide.elements.map((element) => elementHtml(element, deck, fileUrl, height)).join('')}${frame.over}</section>`;
};

export const fileIdsOf = (content: Content): string[] => {
    const ids = new Set<string>();
    if(content.kind === 'document'){
        if(content.design.headerLogoFileId !== null) ids.add(content.design.headerLogoFileId);
        for(const block of content.blocks){
            for(const match of block.html.matchAll(FILE_ID)) ids.add(match[1]);
        }
    }
    if(content.kind === 'deck'){
        for(const slide of content.slides){
            if(slide.background?.type === 'image') ids.add(slide.background.fileId);
            for(const element of slide.elements){
                if(element.type === 'image') ids.add(element.fileId);
                if(element.type === 'text') for(const match of element.html.matchAll(FILE_ID)) ids.add(match[1]);
            }
        }
    }

    return [...ids];
};

const PREVIEW_BLOCKS = 14;

export const previewOf = (content: Content): Content => {
    if(content.kind === 'deck') return { ...content, slides: content.slides.slice(0, 1) };

    return { ...content, blocks: content.blocks.slice(0, PREVIEW_BLOCKS) };
};
