import { ConvertError } from '../errors';
import { imageSaver, type SaveImage } from './images';
import PptxPackage from './pptx-package';
import SlideReader from './pptx-slide';
import { all, attr, first, num } from './pptx-xml';
import { titleOf } from './titles';
import type { DeckContent, DeckFormat, Slide, TextElement } from '@pollium/vyva-core/content';
import { DECK_SIZES } from '@pollium/vyva-core/content';
import { unzipSync } from 'fflate';
import { posix } from 'node:path';

const EMU_PER_INCH = 914400;
const PX_PER_INCH = 144;
const DEFAULT_WIDTH = 12192000;
const DEFAULT_HEIGHT = 6858000;
const MAX_SLIDES = 300;
const MAX_IMAGES = 80;
const MAX_UNZIPPED_BYTES = 120 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' };

const FORMATS: Array<{ format: DeckFormat; ratio: number }> = [
    { format: '16:9', ratio: 16 / 9 },
    { format: '4:3', ratio: 4 / 3 },
    { format: '1:1', ratio: 1 },
    { format: 'a4-landscape', ratio: 1527 / 1080 },
    { format: 'a4-portrait', ratio: 1080 / 1527 }
];

export interface ImportedDeck{
    title: string;
    content: DeckContent;
}

const formatFor = (cx: number, cy: number): DeckFormat => {
    const ratio = cx / Math.max(cy, 1);
    return FORMATS.reduce((best, candidate) => Math.abs(candidate.ratio - ratio) < Math.abs(best.ratio - ratio) ? candidate : best).format;
};

const plainText = (html: string): string => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const deckTitle = (titles: string[], slides: Slide[], filename: string): string => {
    const biggest = slides[0]?.elements
        .filter((element): element is TextElement => element.type === 'text' && !element.isLocked)
        .sort((a, b) => b.style.fontSize - a.style.fontSize)[0];
    const title = titles.find((candidate) => candidate !== '') ?? (biggest === undefined ? '' : plainText(biggest.html));

    return titleOf(title, filename);
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
    const theme = allParts[0]?.slide.palette.deckTheme();
    if(theme === undefined) throw new ConvertError('empty', `${filename} has no slides`);

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
