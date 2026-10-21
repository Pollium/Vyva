import type { DeckTheme, DocumentDesign, FontFamily } from './content';

export const DECK_THEME: DeckTheme = { font: 'Open Sans', background: '#ffffff', text: '#1d2433', accent: '#3333b2', muted: '#5b6475', frame: { header: 'band', footer: true } };

export const DEFAULT_DOCUMENT_DESIGN: DocumentDesign = {
    font: 'Open Sans',
    baseSize: 11,
    textColor: '#1d2433',
    accentColor: '#1f4e9a',
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    headerText: '',
    headerLogoFileId: null,
    footerText: '',
    showPageNumbers: true
};

const SERIF: readonly FontFamily[] = ['Lora', 'Merriweather', 'Playfair Display'];

export const fontStack = (font: FontFamily): string => {
    if(font === 'JetBrains Mono') return `'JetBrains Mono', 'JetBrains Mono Variable', ui-monospace, SFMono-Regular, Menlo, monospace`;
    if(SERIF.includes(font)) return `'${font}', '${font} Variable', Georgia, 'Times New Roman', serif`;

    return `'${font}', '${font} Variable', system-ui, -apple-system, 'Segoe UI', sans-serif`;
};
