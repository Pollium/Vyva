import { ConvertError } from '../errors';
import type { SaveImage } from './images';
import { runOffice, type OfficeEngine } from './office';
import { joinLines } from './pdf-lines';
import { importPptx, MAX_SLIDES, type ImportedDeck } from './pptx';
import { getDocumentProxy } from 'unpdf';

export const importPdfSlides = async (buffer: Buffer, filename: string, saveImage: SaveImage, officeEngine: OfficeEngine): Promise<ImportedDeck> => {
    const { numPages } = await getDocumentProxy(new Uint8Array(buffer));
    if(numPages > MAX_SLIDES) throw new ConvertError('too-large', `${filename} has ${numPages} pages, more than the ${MAX_SLIDES} slides a deck holds`);

    const pptx = await runOffice(officeEngine, { file: buffer, from: 'pdf', to: 'pptx' }, filename);
    const { title, content } = await importPptx(pptx, filename, saveImage);

    return { title, content: joinLines(content) };
};
