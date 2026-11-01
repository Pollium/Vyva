import { ConvertError } from '../errors';
import type { SaveImage } from './images';
import { PLAIN_THEME } from './plain-theme';
import type { ImportedDeck } from './pptx';
import { titleOf } from './titles';
import { MAX_EXTENT, MAX_SLIDES, type DeckSize } from '@pollium/vyva-core/content';
import { newId } from '@pollium/vyva-core/ids';
import { getDocumentProxy } from 'unpdf';

const PX_PER_POINT = 2;
const PDF_TYPE = 'application/pdf';

const slideSizeOf = (width: number, height: number): DeckSize => {
    const scale = Math.min(PX_PER_POINT, MAX_EXTENT / Math.max(width, height));

    return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
};

const opened = (buffer: Buffer, filename: string) => getDocumentProxy(new Uint8Array(buffer)).catch((error: unknown) => {
    throw new ConvertError('unsupported', `${filename} is a PDF Vyva cannot open`, { cause: error });
});

export const importPdf = async (buffer: Buffer, filename: string, saveImage: SaveImage): Promise<ImportedDeck> => {
    const pdf = await opened(buffer, filename);
    if(pdf.numPages > MAX_SLIDES) throw new ConvertError('too-large', `${filename} has ${pdf.numPages} pages, more than the ${MAX_SLIDES} slides a deck holds`);

    const { width, height } = (await pdf.getPage(1)).getViewport({ scale: 1 });
    const fileId = await saveImage({ name: filename, data: buffer, contentType: PDF_TYPE });
    if(fileId === null) throw new ConvertError('empty', `${filename} was not stored, so there is nothing to show`);

    return {
        title: titleOf('', filename),
        content: {
            kind: 'deck',
            format: slideSizeOf(width, height),
            theme: PLAIN_THEME,
            slides: Array.from({ length: pdf.numPages }, (_, index) => ({ id: newId(), background: { type: 'pdf-page', fileId, page: index + 1 }, elements: [] }))
        }
    };
};
