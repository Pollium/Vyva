import { contentDisposition } from '../attachment';
import { ConvertError } from '../errors';
import { exportContent, isExportFormat } from '../export';
import { FILE_ID, readImage, SAMPLE_DECK, SAMPLE_DOCUMENT } from './fixtures';
import { strFromU8, unzipSync } from 'fflate';
import mammoth from 'mammoth';
import { describe, expect, it } from 'vitest';

const wordHtml = async (data: Uint8Array): Promise<string> => (await mammoth.convertToHtml({ buffer: Buffer.from(data) })).value;

describe('exportContent', () => {
    it('exports a document to Word with its headings, styles, table and image', async () => {
        const file = await exportContent(SAMPLE_DOCUMENT, 'docx', { title: 'Subnetting guide', readImage });
        expect(file).toMatchObject({ extension: 'docx', contentType: expect.stringContaining('wordprocessingml') });

        const html = await wordHtml(file.data);
        expect(html).toContain('<h1>Subnetting IPv4</h1>');
        expect(html).toContain('<strong>/24</strong>');
        expect(html).toContain('<table>');
        expect(html).toContain('<li>Class A</li>');
        expect(html).toContain('<img');
        expect(html).toContain('ip addr show');
    });

    it('leaves out the images the host cannot find', async () => {
        const file = await exportContent(SAMPLE_DOCUMENT, 'docx', { title: 'Subnetting guide', readImage: async () => null });

        expect(await wordHtml(file.data)).not.toContain('<img');
    });

    it('exports a deck to PowerPoint with each slide, its text and its image', async () => {
        const file = await exportContent(SAMPLE_DECK, 'pptx', { title: 'Subnetting', readImage });
        expect(file).toMatchObject({ extension: 'pptx', contentType: expect.stringContaining('presentationml') });

        const parts = unzipSync(file.data);
        const slides = Object.keys(parts).filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name));
        expect(slides).toHaveLength(3);
        expect(strFromU8(parts['ppt/slides/slide1.xml'])).toContain('Subnetting IPv4');
        expect(strFromU8(parts['ppt/slides/slide3.xml'])).toContain('254');
        expect(Object.keys(parts).some((name) => name.startsWith('ppt/media/') && name.endsWith('.png'))).toBe(true);
    });

    it('refuses formats that do not fit the content', async () => {
        await expect(exportContent(SAMPLE_DOCUMENT, 'pptx', { title: 'x', readImage })).rejects.toMatchObject({ code: 'unsupported' });
        await expect(exportContent(SAMPLE_DECK, 'docx', { title: 'x', readImage })).rejects.toBeInstanceOf(ConvertError);
        expect(isExportFormat('docx')).toBe(true);
        expect(isExportFormat('exe')).toBe(false);
    });

    it('reads each image the content uses once', async () => {
        const read: string[] = [];
        await exportContent(SAMPLE_DOCUMENT, 'docx', { title: 'x', readImage: async (fileId) => { read.push(fileId); return readImage(fileId); } });

        expect(read).toEqual([FILE_ID]);
    });
});

describe('contentDisposition', () => {
    it('names the download after the title, in ASCII and in UTF-8', () => {
        const header = contentDisposition('Guía de subnetting', 'docx');

        expect(header).toContain('filename="guia-de-subnetting.docx"');
        expect(header).toContain("filename*=UTF-8''Gu%C3%ADa%20de%20subnetting.docx");
        expect(contentDisposition('???', 'pdf')).toContain('filename="download.pdf"');
    });
});
