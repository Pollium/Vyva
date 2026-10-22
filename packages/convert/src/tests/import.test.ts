import { exportContent } from '../export';
import { importFile } from '../import';
import type { NewImage } from '../import/images';
import { FILE_ID, pdfWith, readImage, SAMPLE_DOCUMENT } from './fixtures';
import type { Content } from '@pollium/vyva-core/content';
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

    it('refuses files it cannot read safely', async () => {
        const options = keep();

        await expect(importFile(Buffer.from('MZ\x90\x00binary'), 'virus.exe', options)).rejects.toMatchObject({ code: 'unsupported' });
        await expect(importFile(Buffer.from('not a zip'), 'fake.docx', options)).rejects.toMatchObject({ code: 'unsupported' });
        await expect(importFile(Buffer.from([0x00, 0xff, 0xfe, 0x00]), 'binary.txt', options)).rejects.toMatchObject({ code: 'unsupported' });
        await expect(importFile(Buffer.from('Name;Grade\nAna;6,5\n'), 'list.csv', options)).rejects.toMatchObject({ code: 'unsupported' });
        await expect(importFile(Buffer.from('   \n\n'), 'empty.md', options)).rejects.toMatchObject({ code: 'empty' });
        await expect(importFile(Buffer.from('# Too long'), 'long.md', { ...options, maxBytes: 4 })).rejects.toMatchObject({ code: 'too-large' });
    });
});
