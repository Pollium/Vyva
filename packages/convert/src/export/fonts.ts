import type { FontFamily } from '@vyva/core/content';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const PACKAGES: Record<FontFamily, string> = {
    Inter: 'inter',
    Roboto: 'roboto',
    'Open Sans': 'open-sans',
    Montserrat: 'montserrat',
    Lora: 'lora',
    Merriweather: 'merriweather',
    'Playfair Display': 'playfair-display',
    'JetBrains Mono': 'jetbrains-mono'
};

const SUBSETS = ['latin', 'latin-ext'] as const;
const STYLES = ['normal', 'italic'] as const;

type Subset = typeof SUBSETS[number];
type Style = typeof STYLES[number];

const RANGES: Record<Subset, string> = {
    latin: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
    'latin-ext': 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF'
};

export interface FontFile{
    family: FontFamily;
    name: string;
    style: Style;
    subset: Subset;
    data: Buffer;
}

const require = createRequire(import.meta.url);

const filesOf = (family: FontFamily): Promise<FontFile[]> => {
    const slug = PACKAGES[family];

    return Promise.all(SUBSETS.flatMap((subset) => STYLES.map(async (style) => {
        const name = `${slug}-${subset}-wght-${style}.woff2`;
        const data = await readFile(require.resolve(`@fontsource-variable/${slug}/files/${name}`));
        return { family, name, style, subset, data };
    })));
};

export const fontFilesOf = async (families: Iterable<FontFamily>): Promise<FontFile[]> =>
    (await Promise.all([...new Set(families)].map(filesOf))).flat();

export const fontFaces = (files: FontFile[], urlOf: (file: FontFile) => string): string => files
    .map((file) => `@font-face{font-family:'${file.family}';font-style:${file.style};font-weight:100 900;font-display:block;src:url('${urlOf(file)}') format('woff2');unicode-range:${RANGES[file.subset]}}`)
    .join('\n');
