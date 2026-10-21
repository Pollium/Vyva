import { attr, first, kid, kids, num, tags, type XmlDocument, type XmlElement } from './pptx-xml';
import type { DeckTheme, FontFamily } from '@vyva/core/content';
import { FONT_FAMILIES } from '@vyva/core/content';
import { DECK_THEME } from '@vyva/core/themes';
import { DomUtils } from 'htmlparser2';

const PERCENT = 100000;
const HEX = /^[0-9a-f]{6}$/i;
const COLOR_TAGS = new Set(['a:srgbClr', 'a:sysClr', 'a:schemeClr']);
const FILL_TAGS = new Set(['a:solidFill', 'a:gradFill', 'a:noFill', 'a:blipFill', 'a:pattFill', 'a:grpFill']);
const DEFAULT_COLOR_MAP: Record<string, string> = { bg1: 'lt1', tx1: 'dk1', bg2: 'lt2', tx2: 'dk2' };

const FONT_SUBSTITUTES: Record<string, FontFamily> = {
    arial: 'Inter',
    helvetica: 'Inter',
    'segoe ui': 'Inter',
    calibri: 'Open Sans',
    'calibri light': 'Open Sans',
    verdana: 'Open Sans',
    tahoma: 'Open Sans',
    'century gothic': 'Montserrat',
    'gill sans': 'Montserrat',
    'gill sans mt': 'Montserrat',
    georgia: 'Merriweather',
    cambria: 'Lora',
    'times new roman': 'Lora',
    garamond: 'Lora',
    'courier new': 'JetBrains Mono',
    consolas: 'JetBrains Mono'
};

export interface PptxTheme{
    colors: Record<string, string>;
    bodyFont: string | null;
}

type Rgb = [number, number, number];

const rgbOf = (hex: string): Rgb => {
    const channel = (at: number) => Number.parseInt(hex.slice(at, at + 2), 16) / 255;
    return [channel(0), channel(2), channel(4)];
};

const hexOf = (rgb: Rgb): string => `#${rgb.map((channel) => Math.round(Math.min(1, Math.max(0, channel)) * 255).toString(16).padStart(2, '0')).join('')}`;

const hueChannel = (p: number, q: number, at: number): number => {
    const t = at < 0 ? at + 1 : at > 1 ? at - 1 : at;
    if(t < 1 / 6) return p + (q - p) * 6 * t;
    if(t < 1 / 2) return q;
    if(t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
};

const withLuminance = (hex: string, mod: number, off: number): string => {
    const [r, g, b] = rgbOf(hex);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    const lightness = Math.min(1, Math.max(0, (max + min) / 2 * mod + off));
    if(delta === 0) return hexOf([lightness, lightness, lightness]);

    const saturation = (max + min) / 2 > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    const hue = (max === r ? (g - b) / delta + (g < b ? 6 : 0) : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4) / 6;
    const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
    const p = 2 * lightness - q;

    return hexOf([hueChannel(p, q, hue + 1 / 3), hueChannel(p, q, hue), hueChannel(p, q, hue - 1 / 3)]);
};

const literalOf = (color: XmlElement | undefined): string | null => {
    const value = color?.name === 'a:sysClr' ? attr(color, 'lastClr') : color?.name === 'a:srgbClr' ? attr(color, 'val') : undefined;
    return value !== undefined && HEX.test(value) ? value.toLowerCase() : null;
};

const fontName = (document: XmlDocument, scheme: string): string | null => {
    const font = first(document, scheme);
    return attr(font === undefined ? undefined : kid(font, 'a:latin'), 'typeface') ?? null;
};

export const themeOf = (document: XmlDocument | undefined): PptxTheme => {
    if(document === undefined) return { colors: {}, bodyFont: null };

    const scheme = first(document, 'a:clrScheme');
    const colors = scheme === undefined ? {} : Object.fromEntries(tags(scheme).flatMap((slot) => {
        const value = literalOf(tags(slot)[0]);
        return value === null ? [] : [[slot.name.replace(/^a:/, ''), value]];
    }));

    return { colors, bodyFont: fontName(document, 'a:minorFont') };
};

export default class Palette{
    #theme: PptxTheme;
    #colorMap: Record<string, string>;

    constructor(theme: PptxTheme, colorMap: XmlElement | undefined){
        this.#theme = theme;
        this.#colorMap = { ...DEFAULT_COLOR_MAP, ...colorMap?.attribs };
    }

    color(root: XmlElement | undefined): string | null{
        if(root === undefined) return null;

        const node = COLOR_TAGS.has(root.name) ? root : DomUtils.findOne((element) => COLOR_TAGS.has(element.name), root.children, true);
        if(node === null) return null;

        const base = node.name === 'a:schemeClr' ? this.#scheme(attr(node, 'val') ?? '') : literalOf(node);
        if(base === null) return null;

        const mod = kid(node, 'a:lumMod');
        const off = kid(node, 'a:lumOff');
        if(mod === undefined && off === undefined) return `#${base}`;

        return withLuminance(base, num(attr(mod, 'val'), PERCENT) / PERCENT, num(attr(off, 'val')) / PERCENT);
    }

    hasFill(props: XmlElement | undefined): boolean{
        return props !== undefined && tags(props).some((node) => FILL_TAGS.has(node.name));
    }

    fill(props: XmlElement | undefined): string | null{
        if(props === undefined) return null;

        const solid = kid(props, 'a:solidFill');
        if(solid !== undefined) return this.color(solid);

        const gradient = kid(props, 'a:gradFill');
        const stop = gradient === undefined ? undefined : first(gradient, 'a:gs');
        return stop === undefined ? null : this.color(stop);
    }

    #font(): FontFamily | null{
        const name = this.#theme.bodyFont;
        if(name === null) return null;

        return FONT_FAMILIES.find((font) => font.toLowerCase() === name.toLowerCase()) ?? FONT_SUBSTITUTES[name.toLowerCase()] ?? null;
    }

    deckTheme(): DeckTheme{
        const fallback = DECK_THEME;
        const slot = (name: string) => {
            const value = this.#scheme(name);
            return value === null ? null : `#${value}`;
        };

        return {
            font: this.#font() ?? fallback.font,
            background: slot('bg1') ?? fallback.background,
            text: slot('tx1') ?? fallback.text,
            accent: slot('accent1') ?? fallback.accent,
            muted: slot('tx2') ?? fallback.muted
        };
    }

    #scheme(name: string): string | null{
        return this.#theme.colors[this.#colorMap[name] ?? name] ?? null;
    }
}

export const colorMapOf = (master: XmlElement | undefined): XmlElement | undefined =>
    master === undefined ? undefined : kids(master, 'p:clrMap')[0];
