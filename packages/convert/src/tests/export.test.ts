import { contentDisposition } from '../attachment';
import { ConvertError } from '../errors';
import { exportContent, isExportFormat } from '../export';
import type { PdfJob } from '../export/pdf';
import { FAKE_PDF, FILE_ID, readImage, SAMPLE_DECK, SAMPLE_DOCUMENT } from './fixtures';
import { DEFAULT_DOCUMENT_DESIGN } from '@vyva/core/themes';
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

    it('hands the pdf engine a document with its fonts, images, margins and page numbers', async () => {
        const jobs: PdfJob[] = [];
        const pdfEngine = async (job: PdfJob) => { jobs.push(job); return FAKE_PDF; };

        const file = await exportContent(SAMPLE_DOCUMENT, 'pdf', { title: 'Subnetting guide', readImage, pdfEngine });
        expect(file).toEqual({ data: FAKE_PDF, contentType: 'application/pdf', extension: 'pdf' });

        const [job] = jobs;
        expect(job.page).toMatchObject({ width: 8.27, height: 11.69, margins: { top: DEFAULT_DOCUMENT_DESIGN.margins.top / 25.4 } });
        expect(job.files.map((part) => part.name)).toEqual(expect.arrayContaining([`${FILE_ID}.png`, 'lora-latin-wght-normal.woff2', 'jetbrains-mono-latin-wght-normal.woff2']));
        expect(job.files.map((part) => part.name)).not.toContain('open-sans-latin-wght-normal.woff2');
        expect(job.html).toContain(`src="${FILE_ID}.png"`);
        expect(job.html).toContain("@font-face{font-family:'Lora'");
        expect(job.html).not.toMatch(/https?:\/\/(?!example\.org)/);
        expect(job.footerHtml).toContain('class="pageNumber"');
        expect(job.footerHtml).toContain('Internal use');
    });

    it('prints a deck as one page per slide with no margins', async () => {
        const jobs: PdfJob[] = [];
        await exportContent(SAMPLE_DECK, 'pdf', { title: 'Subnetting', readImage, pdfEngine: async (job) => { jobs.push(job); return FAKE_PDF; } });

        const [job] = jobs;
        expect(job.page).toEqual({ width: 1920 / 144, height: 1080 / 144, margins: { top: 0, right: 0, bottom: 0, left: 0 } });
        expect(job.html.match(/class="vy-print-slide"/g)).toHaveLength(SAMPLE_DECK.slides.length);
        expect(job.footerHtml).toBeNull();
    });

    it('needs a pdf engine to export as pdf', async () => {
        await expect(exportContent(SAMPLE_DOCUMENT, 'pdf', { title: 'x', readImage })).rejects.toBeInstanceOf(TypeError);
    });

    it('exports a document to one HTML file with its images and fonts inside', async () => {
        const file = await exportContent(SAMPLE_DOCUMENT, 'html', { title: 'Guía <1>', readImage, language: 'es' });
        const html = Buffer.from(file.data).toString('utf8');

        expect(file.contentType).toContain('text/html');
        expect(html).toContain('<html lang="es">');
        expect(html).toContain('<title>Guía &lt;1&gt;</title>');
        expect(html).toContain('data:image/png;base64,');
        expect(html).toContain('data:font/woff2;base64,');
        expect(html).not.toContain(`src="${FILE_ID}`);
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
