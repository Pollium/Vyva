import type { DeckContent, DeckFormat, DeckTheme, Slide } from './content';
import { DECK_SIZES } from './content';
import { escapeHtml } from './escape';

const BAND = 150;
const FOOTER = 44;
const HEX = /^#[0-9a-f]{6}$/i;
const FALLBACK_ACCENT = '#3333b2';

const unitOf = (format: DeckFormat): number => {
    const { width, height } = DECK_SIZES[format] ?? DECK_SIZES['16:9'];

    return Math.min(width / 1920, height / 1080);
};

export const bandHeight = (format: DeckFormat): number => Math.round(BAND * unitOf(format));
export const footerHeight = (format: DeckFormat): number => Math.round(FOOTER * unitOf(format));

export const hasBand = (theme: DeckTheme, slide: Pick<Slide, 'frame'>): boolean =>
    theme.frame?.header === 'band' && (slide.frame ?? 'full') === 'full';

export const hasFooter = (theme: DeckTheme, slide: Pick<Slide, 'frame'>): boolean =>
    theme.frame?.footer === true && (slide.frame ?? 'full') !== 'none';

const channels = (hex: string): number[] => [1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16));

export const luminance = (hex: string): number => {
    const [r, g, b] = channels(hex).map((channel) => channel / 255);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const inkOn = (fill: string): string => luminance(fill) < 0.55 ? '#ffffff' : '#111111';

export const shade = (hex: string, amount: number): string =>
    `#${channels(hex).map((channel) => Math.round(channel * (1 - amount)).toString(16).padStart(2, '0')).join('')}`;

const accentOf = (theme: DeckTheme): string => HEX.test(theme.accent) ? theme.accent : FALLBACK_ACCENT;

export interface FooterSegment{
    text: string;
    fill: string;
    align: 'center' | 'right';
}

export const footerSegments = (slide: Slide, deck: DeckContent): FooterSegment[] => {
    const accent = accentOf(deck.theme);
    const number = deck.slides.findIndex((candidate) => candidate.id === slide.id) + 1;

    return [
        { text: deck.footer?.left ?? '', fill: shade(accent, 0.55), align: 'center' },
        { text: deck.footer?.center ?? '', fill: shade(accent, 0.3), align: 'center' },
        { text: number === 0 ? '' : `${number} / ${deck.slides.length}`, fill: accent, align: 'right' }
    ];
};

export interface FrameLayers{
    under: string;
    over: string;
}

export const frameLayers = (slide: Slide, deck: DeckContent): FrameLayers => {
    const accent = accentOf(deck.theme);
    const under = hasBand(deck.theme, slide)
        ? `<div class="vy-frame" style="top:0;height:${bandHeight(deck.format)}px;background:${accent}"></div>`
        : '';
    if(!hasFooter(deck.theme, slide)) return { under, over: '' };

    const height = footerHeight(deck.format);
    const segments = footerSegments(slide, deck).map((segment) =>
        `<span style="background:${segment.fill};color:${inkOn(segment.fill)};text-align:${segment.align}">${escapeHtml(segment.text)}</span>`).join('');

    return { under, over: `<div class="vy-frame vy-frame-footer" style="bottom:0;height:${height}px;line-height:${height}px;font-size:${Math.round(height * 0.48)}px">${segments}</div>` };
};
