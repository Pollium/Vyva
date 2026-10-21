import { htmlToBlocks, paragraphsHtml, titleFrom } from './html-to-blocks';
import { imageSaver, type SaveImage } from './images';
import type { DocumentBlock, DocumentContent } from '@vyva/core/content';
import { markdownToBlocks } from '@vyva/core/markdown-blocks';
import { DEFAULT_DOCUMENT_DESIGN } from '@vyva/core/themes';
import mammoth from 'mammoth';
import { extractText, getDocumentProxy } from 'unpdf';

const MAX_IMAGES = 60;
const PAGE_BREAK = '<div data-type="page-break"></div>';

export interface ImportedDocument{
    title: string;
    content: DocumentContent;
}

const documentOf = (blocks: DocumentBlock[], filename: string): ImportedDocument => ({
    title: titleFrom(blocks, filename),
    content: { kind: 'document', design: DEFAULT_DOCUMENT_DESIGN, blocks }
});

export const importDocx = async (buffer: Buffer, filename: string, saveImage: SaveImage): Promise<ImportedDocument> => {
    const save = imageSaver(saveImage, filename, MAX_IMAGES);
    const failures: unknown[] = [];
    const result = await mammoth.convertToHtml({ buffer }, {
        convertImage: mammoth.images.imgElement(async (image) => {
            const data = await image.readAsBuffer();
            const fileId = await save(data, image.contentType).catch((error: unknown) => {
                failures.push(error);
                return null;
            });
            const attributes = fileId === null ? { src: '' } : { src: '', 'data-file-id': fileId, alt: '' };
            return attributes;
        })
    });
    if(failures.length > 0) throw failures[0];

    return documentOf(htmlToBlocks(result.value), filename);
};

export const importMarkdown = (text: string, filename: string): ImportedDocument =>
    documentOf(markdownToBlocks(text), filename);

export const importPlainText = (text: string, filename: string): ImportedDocument =>
    documentOf(htmlToBlocks(paragraphsHtml(text)), filename);

export const importPdf = async (buffer: Buffer, filename: string): Promise<ImportedDocument> => {
    const { text } = await extractText(await getDocumentProxy(new Uint8Array(buffer)), { mergePages: false });
    const html = text.map((page) => paragraphsHtml(page)).filter((page) => page !== '').join(PAGE_BREAK);

    return documentOf(htmlToBlocks(html), filename);
};
