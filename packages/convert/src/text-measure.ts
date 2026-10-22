import { FONT_WIDTHS, MEASURED_CHARS } from './font-widths';
import { CODE_FONT } from '@pollium/vyva-core/code';
import type { FontFamily, TextStyle } from '@pollium/vyva-core/content';

const EM = 1000;
const BLOCK_GAP_EMS = 0.35;
const LIST_INDENT_EMS = 1.15;
const WIDTH_SAFETY = 0.97;
const BLOCK_END = /<\/(?:p|li|h[1-6])>/i;
const TAG = /<(\/?)([a-z0-9]+)[^>]*>|([^<]+)/gi;
const BOLD_TAGS = new Set(['strong', 'b', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: '\'', nbsp: ' ', '#39': '\'' };

interface Glyph{
    char: string;
    font: FontFamily;
    isBold: boolean;
}

interface Block{
    glyphs: Glyph[];
    isItem: boolean;
}

const INDEX = new Map([...MEASURED_CHARS].map((char, index) => [char, index]));
const FALLBACK = INDEX.get('n') ?? 0;

const decoded = (text: string): string => text.replace(/&(#?\w+);/g, (entity, name: string) =>
    ENTITIES[name] ?? (name.startsWith('#') ? String.fromCodePoint(Number(name.slice(1))) : entity));

const glyphsOf = (html: string, font: FontFamily, isBold: boolean): Glyph[] => {
    const glyphs: Glyph[] = [];
    let bold = 0;
    let code = 0;
    for(const [, closing, tag, text] of html.matchAll(TAG)){
        if(text !== undefined){
            for(const char of decoded(text).replace(/\s+/g, ' ')) glyphs.push({ char, font: code > 0 ? CODE_FONT : font, isBold: isBold || bold > 0 });
            continue;
        }

        const step = closing === '/' ? -1 : 1;
        const name = tag.toLowerCase();
        if(BOLD_TAGS.has(name)) bold = Math.max(0, bold + step);
        else if(name === 'code') code = Math.max(0, code + step);
    }

    return glyphs;
};

const blocksOf = (html: string, font: FontFamily, isBold: boolean): Block[] => html.split(BLOCK_END).flatMap((chunk) => {
    const glyphs = glyphsOf(chunk, font, isBold);
    while(glyphs[0]?.char === ' ') glyphs.shift();
    while(glyphs.at(-1)?.char === ' ') glyphs.pop();

    return glyphs.length === 0 ? [] : [{ glyphs, isItem: /<li\b/i.test(chunk) }];
});

const widthOf = (glyph: Glyph, fontSize: number): number => {
    const widths = FONT_WIDTHS[glyph.font][glyph.isBold ? 'bold' : 'regular'];

    return widths[INDEX.get(glyph.char) ?? FALLBACK] / EM * fontSize;
};

const linesOf = (glyphs: Glyph[], fontSize: number, width: number): number => {
    let lines = 1;
    let line = 0;
    let word = 0;
    let space = 0;
    const place = () => {
        if(word > width) lines = Infinity;
        if(line > 0 && line + space + word > width){
            lines += 1;
            line = 0;
        }
        line += (line === 0 ? 0 : space) + word;
        word = 0;
    };
    for(const glyph of glyphs){
        if(glyph.char !== ' '){
            word += widthOf(glyph, fontSize);
            continue;
        }

        place();
        space = widthOf(glyph, fontSize);
    }
    place();

    return lines;
};

export const textHeight = (html: string, style: TextStyle, font: FontFamily, width: number): number => {
    const blocks = blocksOf(html, font, style.isBold);

    return blocks.reduce((height, block, index) => {
        const indent = block.isItem ? LIST_INDENT_EMS * style.fontSize : 0;
        const isLastParagraph = !block.isItem && index === blocks.length - 1;
        const gap = isLastParagraph ? 0 : BLOCK_GAP_EMS * style.fontSize;

        return height + linesOf(block.glyphs, style.fontSize, (width - indent) * WIDTH_SAFETY) * style.fontSize * style.lineHeight + gap;
    }, 0);
};

export const unwrappedWidth = (html: string, style: TextStyle, font: FontFamily): number => {
    const widths = blocksOf(html, font, style.isBold).map((block) => block.glyphs.reduce(
        (width, glyph) => width + widthOf(glyph, style.fontSize),
        block.isItem ? LIST_INDENT_EMS * style.fontSize : 0
    ));

    return Math.ceil(Math.max(0, ...widths) / WIDTH_SAFETY) + 1;
};
