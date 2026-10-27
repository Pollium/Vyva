import { ConvertError } from '../errors';
import { formatFor } from './deck-format';
import { imageSaver, type SaveImage } from './images';
import PptxPackage, { type SlideParts } from './pptx-package';
import SlideReader from './pptx-slide';
import { familyOf } from './pptx-theme';
import { all, attr, first, num, textOf } from './pptx-xml';
import { titleOf } from './titles';
import type { DeckContent, FontFamily, Slide, TextElement } from '@pollium/vyva-core/content';
import { DECK_SIZES } from '@pollium/vyva-core/content';
import { unzipSync } from 'fflate';
import { posix } from 'node:path';

const EMU_PER_INCH = 914400;
const PX_PER_INCH = 144;
const DEFAULT_WIDTH = 12192000;
const DEFAULT_HEIGHT = 6858000;
export const MAX_SLIDES = 300;
const MAX_IMAGES = 80;
const MAX_UNZIPPED_BYTES = 120 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' };

export interface ImportedDeck{
    title: string;
    content: DeckContent;
}

const plainText = (html: string): string => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const deckTitle = (titles: string[], slides: Slide[], filename: string): string => {
    const biggest = slides[0]?.elements
        .filter((element): element is TextElement => element.type === 'text' && !element.isLocked)
        .sort((a, b) => b.style.fontSize - a.style.fontSize)[0];
    const title = titles.find((candidate) => candidate !== '') ?? (biggest === undefined ? '' : plainText(biggest.html));

    return titleOf(title, filename);
};

const dominantFont = (parts: SlideParts[], themeFont: FontFamily): FontFamily => {
    const counts = new Map<FontFamily, number>();
    for(const { slide } of parts){
        for(const run of all(slide.root, 'a:r')){
            const typeface = attr(first(run, 'a:latin'), 'typeface');
            const family = typeface === undefined || typeface.startsWith('+') ? themeFont : familyOf(typeface);
            if(family !== null) counts.set(family, (counts.get(family) ?? 0) + all(run, 'a:t').map(textOf).join('').length);
        }
    }

    return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? themeFont;
};

const unzipped = (buffer: Buffer): Record<string, Uint8Array> => {
    let total = 0;

    return unzipSync(buffer, {
        filter: (file) => {
            total += file.originalSize;
            if(total > MAX_UNZIPPED_BYTES) throw new ConvertError('too-large', `The presentation unzips to more than ${MAX_UNZIPPED_BYTES} bytes`);
            return file.name.startsWith('ppt/') || file.name === '[Content_Types].xml' || file.name.startsWith('docProps/');
        }
    });
};

export const importPptx = async (buffer: Buffer, filename: string, saveImage: SaveImage): Promise<ImportedDeck> => {
    const files = unzipped(buffer);
    const pptx = new PptxPackage(files);
    const presentation = pptx.document('ppt/presentation.xml');
    if(presentation === undefined) throw new ConvertError('unsupported', `${filename} has no presentation in it`);

    const size = first(presentation, 'p:sldSz');
    const cx = num(attr(size, 'cx'), DEFAULT_WIDTH);
    const cy = num(attr(size, 'cy'), DEFAULT_HEIGHT);
    const format = formatFor(cx, cy);
    const relations = pptx.relationsOf('ppt/presentation.xml');
    const order = all(presentation, 'p:sldId')
        .map((slide) => relations[attr(slide, 'r:id') ?? '']?.target)
        .filter((path): path is string => path !== undefined)
        .slice(0, MAX_SLIDES);
    const allParts = order.map((path) => pptx.parts(path)).filter((parts) => parts !== null);
    const themed = allParts[0]?.slide.palette.deckTheme();
    if(themed === undefined) throw new ConvertError('empty', `${filename} has no slides`);

    const theme = { ...themed, font: dominantFont(allParts, themed.font) };

    const save = imageSaver(saveImage, filename, MAX_IMAGES);
    const saved = new Map<string, Promise<string | null>>();
    const reader = new SlideReader({
        scale: DECK_SIZES[format].width / cx,
        fontScale: DECK_SIZES[format].width / (cx / EMU_PER_INCH * PX_PER_INCH),
        theme,
        image: (path) => {
            const known = saved.get(path);
            if(known !== undefined) return known;

            const data = files[path];
            const contentType = IMAGE_TYPES[posix.extname(path).slice(1).toLowerCase()];
            const fileId = data === undefined || contentType === undefined ? Promise.resolve(null) : save(data, contentType);
            saved.set(path, fileId);
            return fileId;
        }
    });

    const slides: Slide[] = [];
    const titles: string[] = [];
    for(const parts of allParts){
        const read = await reader.read(parts);
        slides.push(read.slide);
        titles.push(read.title);
    }

    return { title: deckTitle(titles, slides, filename), content: { kind: 'deck', format, theme, slides } };
};
