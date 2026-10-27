import type { DeckFormat } from '@pollium/vyva-core/content';
import { DECK_SIZES } from '@pollium/vyva-core/content';

const FORMATS = Object.entries(DECK_SIZES).map(([format, size]) => ({ format: format as DeckFormat, ratio: size.width / size.height }));

export const formatFor = (width: number, height: number): DeckFormat => {
    const ratio = width / Math.max(height, 1);
    return FORMATS.reduce((best, candidate) => Math.abs(candidate.ratio - ratio) < Math.abs(best.ratio - ratio) ? candidate : best).format;
};
