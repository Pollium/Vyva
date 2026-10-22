import { ConvertError } from '../errors';
import type { SaveImage } from './images';
import { joinLines } from './pdf-lines';
import { importPptx, type ImportedDeck } from './pptx';
import { getDocumentProxy } from 'unpdf';

export type PdfSlides = (pdf: Uint8Array) => Promise<Uint8Array>;

export const isLandscapePdf = async (buffer: Buffer): Promise<boolean> => {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { width, height } = (await pdf.getPage(1)).getViewport({ scale: 1 });

    return width > height;
};

export const importPdfSlides = async (buffer: Buffer, filename: string, saveImage: SaveImage, pdfSlides: PdfSlides): Promise<ImportedDeck> => {
    const pptx = await pdfSlides(new Uint8Array(buffer)).catch((error: unknown) => {
        throw error instanceof ConvertError ? error : new ConvertError('slides-failed', `${filename} could not be turned into slides`, { cause: error });
    });
    const { title, content } = await importPptx(Buffer.from(pptx), filename, saveImage);

    return { title, content: joinLines(content) };
};
