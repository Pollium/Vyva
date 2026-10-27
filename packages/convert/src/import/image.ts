import { ConvertError } from '../errors';
import { imageSize } from '../export/image-size';
import { formatFor } from './deck-format';
import { imageSaver, type SaveImage } from './images';
import type { ImportedDeck } from './pptx';
import { titleOf } from './titles';
import { DECK_SIZES } from '@pollium/vyva-core/content';
import { newId } from '@pollium/vyva-core/ids';
import { DECK_THEME } from '@pollium/vyva-core/themes';

export type ImageType = 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp';

const PNG_SIGNATURE = Buffer.from('89504e470d0a1a0a', 'hex');
const JPEG_SIGNATURE = Buffer.from('ffd8ff', 'hex');

export const imageTypeOf = (data: Buffer): ImageType | null => {
    if(data.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) return 'image/png';
    if(data.subarray(0, JPEG_SIGNATURE.length).equals(JPEG_SIGNATURE)) return 'image/jpeg';

    const head = data.toString('latin1', 0, 12);
    if(head.startsWith('GIF87a') || head.startsWith('GIF89a')) return 'image/gif';
    return head.startsWith('RIFF') && head.slice(8) === 'WEBP' ? 'image/webp' : null;
};

export const importImage = async (buffer: Buffer, filename: string, contentType: ImageType, saveImage: SaveImage): Promise<ImportedDeck> => {
    const fileId = await imageSaver(saveImage, filename, 1)(buffer, contentType);
    if(fileId === null) throw new ConvertError('empty', `${filename} was not stored, so there is nothing to show`);

    const size = imageSize(buffer, contentType);
    const format = formatFor(size.width, size.height);
    const slide = DECK_SIZES[format];
    const scale = Math.min(slide.width / size.width, slide.height / size.height);
    const w = Math.round(size.width * scale);
    const h = Math.round(size.height * scale);
    const { frame: _frame, ...theme } = DECK_THEME;

    return {
        title: titleOf('', filename),
        content: {
            kind: 'deck',
            format,
            theme,
            slides: [{
                id: newId(),
                background: null,
                elements: [{
                    id: newId(), type: 'image', x: Math.round((slide.width - w) / 2), y: Math.round((slide.height - h) / 2), w, h,
                    rotation: 0, opacity: 1, isLocked: false, fileId, fit: 'contain', radius: 0, alt: '', credit: null
                }]
            }]
        }
    };
};
