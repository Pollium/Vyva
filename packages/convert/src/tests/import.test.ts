import { exportContent } from '../export';
import { importFile } from '../import';
import type { NewImage } from '../import/images';
import type { OfficeJob } from '../import/office';
import { FILE_ID, PNG_BYTES, pdfWith, pptxOfLines, readImage, SAMPLE_DOCUMENT } from './fixtures';
import type { Content } from '@pollium/vyva-core/content';
import { strToU8, zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';

const STORED_ID = '01a14188-5cb4-776b-815b-c6e977d07bbf';

const keep = () => {
    const saved: NewImage[] = [];
    const saveImage = async (image: NewImage) => {
        saved.push(image);
        return STORED_ID;
    };
    return { saved, saveImage };
};

const blocksOf = (content: Content): string[] => content.kind === 'document' ? content.blocks.map((block) => block.html) : [];

const JPEG_1600_BY_900 = Buffer.from('ffd8ffc00011080384064003012200021101031101ffd9', 'hex');

const oleFile = (stream: string): Buffer => Buffer.concat([Buffer.from('d0cf11e0a1b11ae1', 'hex'), Buffer.alloc(504), Buffer.from(stream, 'utf16le')]);

const openDocument = (mimetype: string): Buffer => Buffer.from(zipSync({ mimetype: strToU8(mimetype), 'content.xml': strToU8('<office:document-content/>') }));

const recording = (answer: () => Promise<Uint8Array>) => {
    const jobs: Array<Omit<OfficeJob, 'file'>> = [];
    const officeEngine = async ({ from, to }: OfficeJob) => {
        jobs.push({ from, to });
        return answer();
    };
    return { jobs, officeEngine };
};

describe('importFile', () => {
    it('imports a Word file with its formatting, and stores its images through the host', async () => {
        const word = await exportContent(SAMPLE_DOCUMENT, 'docx', { title: 'Guide', readImage });
        const { saved, saveImage } = keep();

        const imported = await importFile(word.data, 'guide.docx', { saveImage });
        expect(imported.title).toBe('Subnetting IPv4');
        expect(blocksOf(imported.content).join('')).toContain('<strong>/24</strong>');
        expect(blocksOf(imported.content).join('')).toContain('<td><p>254</p></td>');
        expect(blocksOf(imported.content).some((html) => html.includes(`data-file-id="${STORED_ID}"`))).toBe(true);
        expect(blocksOf(imported.content).join('')).not.toContain(FILE_ID);
        expect(saved).toEqual([expect.objectContaining({ name: 'guide (image 1).png', contentType: 'image/png' })]);
    });

    it('leaves out an image the host does not store, and lets the host\'s own failure through', async () => {
        const word = await exportContent(SAMPLE_DOCUMENT, 'docx', { title: 'Guide', readImage });

        const imported = await importFile(word.data, 'guide.docx', { saveImage: async () => null });
        expect(blocksOf(imported.content).join('')).not.toContain('<img');

        const full = new Error('The storage is full');
        await expect(importFile(word.data, 'guide.docx', { saveImage: async () => { throw full; } })).rejects.toBe(full);
    });

    it('imports Markdown with its checklists and without running its scripts', async () => {
        const imported = await importFile(Buffer.from('﻿# Notes\n\n- [x] Review\n\n<script>alert(1)</script>'), 'notes.md', keep());

        expect(imported.title).toBe('Notes');
        expect(JSON.stringify(imported.content)).toContain('taskItem');
        expect(JSON.stringify(imported.content)).not.toContain('<script>');
    });

    it('imports plain text as paragraphs, titled after the file', async () => {
        const imported = await importFile(Buffer.from('First idea\ngoes on here\n\nSecond <idea>'), 'class_notes.txt', keep());

        expect(imported.title).toBe('class notes');
        expect(blocksOf(imported.content)).toEqual(['<p>First idea<br />goes on here</p>', '<p>Second &lt;idea&gt;</p>']);
    });

    it('imports a PDF page by page', async () => {
        const imported = await importFile(pdfWith(['First page', 'Second page']), 'slides.pdf', keep());

        expect(imported.title).toBe('slides');
        expect(blocksOf(imported.content)).toEqual(['<p>First page</p>', '<div data-type="page-break"></div>', '<p>Second page</p>']);
    });

    it('imports a picture as one slide shaped like it, stored through the host', async () => {
        const { saved, saveImage } = keep();

        const square = await importFile(PNG_BYTES, 'logo.png', { saveImage });
        const wide = await importFile(JPEG_1600_BY_900, 'IMG_2034.jpg', { saveImage });

        expect(square.title).toBe('logo');
        expect(square.content).toMatchObject({ kind: 'deck', format: '1:1', slides: [{ elements: [{ type: 'image', fileId: STORED_ID, fit: 'contain', x: 0, y: 0, w: 1080, h: 1080 }] }] });
        expect(wide.content).toMatchObject({ format: '16:9', slides: [{ elements: [{ x: 0, y: 0, w: 1920, h: 1080 }] }] });
        expect(saved.map(({ name, contentType }) => ({ name, contentType }))).toEqual([
            { name: 'logo (image 1).png', contentType: 'image/png' },
            { name: 'IMG_2034 (image 1).jpg', contentType: 'image/jpeg' }
        ]);
        await expect(importFile(PNG_BYTES, 'logo.png', { saveImage: async () => null })).rejects.toMatchObject({ code: 'empty' });
    });

    it('imports old Word, OpenDocument and RTF files through the office engine as Word', async () => {
        const word = await exportContent(SAMPLE_DOCUMENT, 'docx', { title: 'Guide', readImage });
        const { jobs, officeEngine } = recording(async () => word.data);

        const imported = await Promise.all([
            importFile(oleFile('WordDocument'), 'guide.doc', { ...keep(), officeEngine }),
            importFile(openDocument('application/vnd.oasis.opendocument.text'), 'guide.odt', { ...keep(), officeEngine }),
            importFile(Buffer.from('{\\rtf1\\ansi Subnetting}'), 'guide.rtf', { ...keep(), officeEngine })
        ]);

        expect(jobs).toEqual([{ from: 'doc', to: 'docx' }, { from: 'odt', to: 'docx' }, { from: 'rtf', to: 'docx' }]);
        expect(imported.map(({ content }) => blocksOf(content).join(''))).toEqual(Array(3).fill(expect.stringContaining('<strong>/24</strong>')));
    });

    it('imports old PowerPoint and OpenDocument presentations through the office engine as slides', async () => {
        const { jobs, officeEngine } = recording(() => pptxOfLines([{ text: 'Potencial de accion', x: 1, y: 1, w: 6 }]));

        const imported = await Promise.all([
            importFile(oleFile('PowerPoint Document'), 'clase.ppt', { ...keep(), officeEngine }),
            importFile(openDocument('application/vnd.oasis.opendocument.presentation'), 'clase.odp', { ...keep(), officeEngine })
        ]);

        expect(jobs).toEqual([{ from: 'ppt', to: 'pptx' }, { from: 'odp', to: 'pptx' }]);
        expect(imported.map(({ content }) => content.kind)).toEqual(['deck', 'deck']);
    });

    it('refuses an old office file without an engine, and an engine that answers with something else', async () => {
        const options = keep();
        const { officeEngine } = recording(async () => Buffer.from('not a word file'));

        await expect(importFile(oleFile('WordDocument'), 'guide.doc', options)).rejects.toMatchObject({ code: 'unsupported' });
        await expect(importFile(oleFile('WordDocument'), 'guide.doc', { ...options, officeEngine })).rejects.toMatchObject({ code: 'office-failed' });
    });

    it('refuses files it cannot read safely', async () => {
        const options = keep();

        await expect(importFile(Buffer.from('MZ\x90\x00binary'), 'virus.exe', options)).rejects.toMatchObject({ code: 'unsupported' });
        await expect(importFile(Buffer.from('not a zip'), 'fake.docx', options)).rejects.toMatchObject({ code: 'unsupported' });
        await expect(importFile(Buffer.from([0x00, 0xff, 0xfe, 0x00]), 'binary.txt', options)).rejects.toMatchObject({ code: 'unsupported' });
        await expect(importFile(Buffer.from('Name;Grade\nAna;6,5\n'), 'list.csv', options)).rejects.toMatchObject({ code: 'unsupported' });
        await expect(importFile(oleFile('Workbook'), 'grades.xls', options)).rejects.toMatchObject({ code: 'unsupported' });
        await expect(importFile(openDocument('application/vnd.oasis.opendocument.spreadsheet'), 'grades.ods', options)).rejects.toMatchObject({ code: 'unsupported' });
        await expect(importFile(Buffer.from('   \n\n'), 'empty.md', options)).rejects.toMatchObject({ code: 'empty' });
        await expect(importFile(Buffer.from('# Too long'), 'long.md', { ...options, maxBytes: 4 })).rejects.toMatchObject({ code: 'too-large' });
    });
});
