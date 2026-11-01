import type { DeckTheme } from '@pollium/vyva-core/content';
import { DECK_THEME } from '@pollium/vyva-core/themes';

const { frame: _frame, ...unframed } = DECK_THEME;

export const PLAIN_THEME: DeckTheme = unframed;
