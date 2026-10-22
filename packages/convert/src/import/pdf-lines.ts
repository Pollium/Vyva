import { unwrappedWidth, textHeight } from '../text-measure';
import type { DeckContent, FontFamily, Slide, SlideElement, TextElement, TextStyle } from '@pollium/vyva-core/content';
import { DECK_SIZES } from '@pollium/vyva-core/content';
import { newId } from '@pollium/vyva-core/ids';

const BULLET = /^[•▪◦●○■□➢►▸✓✔\-–*]$/;
const NUMBER = /^(\d{1,3}|[a-zA-Z])[.)]$/;
const LEADING_BULLET = /^((?:<[^>]+>)*)\s*[•▪◦●○■□➢►▸✓✔\-–*]\s+(?=\S)/u;
const LEADING_NUMBER = /^((?:<[^>]+>)*)\s*(?:\d{1,3}|[a-z])[.)]\s+(?=\S)/u;
const MAX_CONTAINER_SHARE = 0.5;
const CONTAINER_SLACK = 2;
const PARAGRAPH = /^<p(?: style="[^"]*")?>([\s\S]*)<\/p>$/;
const MARKER_REACH_EMS = 3;
const SAME_EDGE_EMS = 0.5;
const SAME_SIZE = 0.1;
const MAX_LINE_GAP = 1;
const PARAGRAPH_GAP = 0.3;
const LIST_INDENT_EMS = 1.15;
const SLIDE_MARGIN = 16;
const SIDE_SHARE = 0.3;
const SPACED_END = /\s(?:<\/[^>]+>)*$/;

type Marker = 'bullet' | 'number';

interface Line{
    element: TextElement;
    inner: string;
    text: string;
    marker: Marker | null;
    left: number;
    container: SlideElement | null;
}

interface Block{
    lines: Line[];
    align: 'left' | 'center';
}

const plain = (html: string): string => html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();

const middle = (element: TextElement): number => element.y + element.h / 2;
const right = (element: TextElement): number => element.x + element.w;
const center = (element: TextElement): number => element.x + element.w / 2;
const area = (element: SlideElement): number => element.w * element.h;

const containerOf = (element: TextElement, boxes: SlideElement[]): SlideElement | null => boxes
    .filter((box) => box.x - CONTAINER_SLACK <= element.x && box.y - CONTAINER_SLACK <= element.y
        && box.x + box.w + CONTAINER_SLACK >= right(element) && box.y + box.h + CONTAINER_SLACK >= element.y + element.h)
    .sort((a, b) => area(a) - area(b))[0] ?? null;

const lineOf = (element: SlideElement, boxes: SlideElement[]): Line | null => {
    if(element.type !== 'text' || element.isLocked || element.rotation !== 0 || element.fill !== null) return null;

    const html = PARAGRAPH.exec(element.html)?.[1];
    if(html === undefined || html.includes('<p')) return null;

    const marker: Marker | null = LEADING_BULLET.test(html) ? 'bullet' : LEADING_NUMBER.test(html) ? 'number' : null;
    const inner = marker === null ? html : html.replace(marker === 'bullet' ? LEADING_BULLET : LEADING_NUMBER, '$1');

    return { element, inner, text: plain(inner), marker, left: element.x, container: containerOf(element, boxes) };
};

const markerOf = (line: Line): Marker | null => BULLET.test(line.text) ? 'bullet' : NUMBER.test(line.text) ? 'number' : null;


const ownerOf = (marker: Line, lines: Line[]): Line | undefined => lines.find((line) => {
    const { element } = line;
    const reach = MARKER_REACH_EMS * element.style.fontSize;
    const gap = element.x - right(marker.element);

    return line.marker === null && markerOf(line) === null && gap > -element.style.fontSize && gap < reach
        && Math.abs(middle(element) - middle(marker.element)) < element.h * 0.6;
});

const isSameSize = (a: TextStyle, b: TextStyle): boolean => Math.abs(a.fontSize - b.fontSize) <= Math.max(a.fontSize, b.fontSize) * SAME_SIZE;

const alignWith = (block: Block, line: Line): Block['align'] | null => {
    const last = block.lines.at(-1)?.element;
    if(last === undefined) return null;

    const { element } = line;
    const edge = SAME_EDGE_EMS * element.style.fontSize;
    const gap = element.y - (last.y + last.h);
    if(line.container !== block.lines[0].container) return null;
    if(!isSameSize(last.style, element.style) || element.y <= last.y || gap > last.h * MAX_LINE_GAP || gap < -last.h * 0.5) return null;
    if(gap > last.h * PARAGRAPH_GAP && (line.marker === null) !== (block.lines[0].marker === null)) return null;
    if(Math.abs(element.x - block.lines[0].element.x) < edge) return block.lines.length === 1 || block.align === 'left' ? 'left' : null;
    if(line.marker === null && Math.abs(center(element) - center(last)) < edge) return block.lines.length === 1 || block.align === 'center' ? 'center' : null;

    return null;
};

const joined = (lines: Line[]): string => lines.reduce((html, line, index) => {
    if(index === 0) return line.inner;

    const previous = lines[index - 1].text;
    const isBroken = /\p{L}-$/u.test(previous) && /^\p{Ll}/u.test(line.text);
    if(isBroken) return `${html.replace(/-((?:<\/[^>]+>)*)$/, '$1')}${line.inner}`;

    return SPACED_END.test(html) || /^\s/.test(line.inner) ? `${html}${line.inner}` : `${html} ${line.inner}`;
}, '');

const styled = (line: Line, base: TextStyle): Line => {
    const { style } = line.element;
    return style.color.toLowerCase() === base.color.toLowerCase() ? line : { ...line, inner: `<span style="color:${style.color}">${line.inner}</span>` };
};

const paragraphsOf = (lines: Line[]): Line[][] => lines.reduce<Line[][]>((paragraphs, line, index) => {
    const previous = lines[index - 1]?.element;
    const current = paragraphs.at(-1);
    const isNew = current === undefined || previous === undefined || line.marker !== null || line.element.y - (previous.y + previous.h) > previous.h * PARAGRAPH_GAP;
    if(isNew || current === undefined) paragraphs.push([line]);
    else current.push(line);

    return paragraphs;
}, []);

const listTag = (marker: Marker): string => marker === 'bullet' ? 'ul' : 'ol';

const htmlOf = (paragraphs: Line[][]): string => {
    let html = '';
    let open: Marker | null = null;
    for(const paragraph of paragraphs){
        const marker = paragraph[0].marker;
        if(open !== null && open !== marker){
            html += `</${listTag(open)}>`;
            open = null;
        }
        if(marker === null){
            html += `<p>${joined(paragraph)}</p>`;
            continue;
        }
        if(open === null) html += `<${listTag(marker)}>`;
        open = marker;
        html += `<li>${joined(paragraph)}</li>`;
    }

    return open === null ? html : `${html}</${listTag(open)}>`;
};

const lineHeightOf = (lines: Line[], fontSize: number, fallback: number): number => {
    const pitches = lines.slice(1).map((line, index) => line.element.y - lines[index].element.y).filter((pitch) => pitch < fontSize * 3);
    if(pitches.length === 0) return fallback;

    const sorted = pitches.sort((a, b) => a - b);
    return Math.min(3, Math.max(0.8, Number((sorted[Math.floor(sorted.length / 2)] / fontSize).toFixed(2))));
};

const merged = (block: Block, neighbours: SlideElement[], font: FontFamily, slideWidth: number): TextElement => {
    const [first] = block.lines;
    const base: TextStyle = { ...first.element.style, isBold: block.lines.every((line) => line.element.style.isBold), align: block.align, verticalAlign: 'top' };
    const lines = block.lines.map((line) => styled(line, base));
    const paragraphs = paragraphsOf(lines);
    const html = htmlOf(paragraphs);
    const indent = LIST_INDENT_EMS * base.fontSize;
    const left = Math.max(0, Math.min(...block.lines.map((line) => line.left)));
    const last = block.lines[block.lines.length - 1].element;
    const wanted = Math.max(...block.lines.map((line) => Math.max(right(line.element), left + (line.marker === null ? 0 : indent) + unwrappedWidth(`<p>${line.inner}</p>`, base, font)))) - left;
    const limit = Math.min(slideWidth - SLIDE_MARGIN, ...neighbours.filter((element) => isInTheWay(element, left, wanted, first.element.y, last.y + last.h)).map((element) => element.x - SLIDE_MARGIN));
    const w = Math.max(1, Math.round(Math.min(wanted, limit - left)));
    const style = { ...base, lineHeight: lineHeightOf(block.lines, base.fontSize, base.lineHeight) };
    const height = textHeight(html, style, font, w);

    return {
        id: newId(),
        type: 'text',
        x: Math.round(left),
        y: first.element.y,
        w,
        h: Math.max(1, Math.round(Number.isFinite(height) ? height : first.element.h * block.lines.length)),
        rotation: 0,
        opacity: first.element.opacity,
        isLocked: false,
        fill: null,
        html,
        style
    };
};

const isInTheWay = (element: SlideElement, left: number, width: number, top: number, bottom: number): boolean =>
    element.x > left + width * SIDE_SHARE && element.x < left + width && element.y < bottom && element.y + element.h > top;

const blocksOf = (lines: Line[]): Block[] => {
    const blocks: Block[] = [];
    const ordered = [...lines].sort((a, b) => a.element.y - b.element.y || a.element.x - b.element.x);
    for(const line of ordered){
        const matches = blocks.map((block) => ({ block, align: alignWith(block, line) }));
        const match = matches.find(({ align }) => align !== null);
        if(match === undefined || match.align === null){
            blocks.push({ lines: [line], align: 'left' });
            continue;
        }

        match.block.lines.push(line);
        match.block.align = match.align;
    }

    return blocks;
};

const joinSlide = (slide: Slide, font: FontFamily, slideWidth: number, slideHeight: number): Slide => {
    const boxes = slide.elements.filter((element) => element.type === 'shape' && element.fill !== null && element.shape !== 'line'
        && area(element) < slideWidth * slideHeight * MAX_CONTAINER_SHARE);
    const lines = slide.elements.map((element) => lineOf(element, boxes)).filter((line): line is Line => line !== null);
    const markers = lines.filter((line) => markerOf(line) !== null);
    const owned = new Set<Line>();
    for(const marker of markers){
        const owner = ownerOf(marker, lines);
        if(owner === undefined) continue;

        owner.marker = markerOf(marker);
        owner.left = marker.element.x;
        owned.add(marker);
    }

    const blocks = blocksOf(lines.filter((line) => !owned.has(line)));
    const replaced = new Map<SlideElement, TextElement | null>();
    for(const block of blocks){
        if(block.lines.length === 1 && block.lines[0].marker === null) continue;

        const [head, ...rest] = block.lines;
        const own = new Set<SlideElement>([...block.lines.map((line) => line.element), ...[...owned].map((marker) => marker.element)]);
        replaced.set(head.element, merged(block, slide.elements.filter((element) => !own.has(element)), font, slideWidth));
        for(const line of rest) replaced.set(line.element, null);
    }
    for(const marker of owned) replaced.set(marker.element, null);

    const elements = slide.elements.flatMap((element) => {
        const replacement = replaced.get(element);
        return replacement === undefined ? [element] : replacement === null ? [] : [replacement];
    });

    return { ...slide, elements };
};

export const joinLines = (deck: DeckContent): DeckContent => {
    const { width, height } = DECK_SIZES[deck.format];

    return { ...deck, slides: deck.slides.map((slide) => joinSlide(slide, deck.theme.font, width, height)) };
};
