import { importFile } from '../import';
import { joinLines } from '../import/pdf-lines';
import { libreOffice } from '../libreoffice';
import { pdfWith, pptxOfLines } from './fixtures';
import type { DeckContent, SlideElement, TextElement } from '@pollium/vyva-core/content';
import { DECK_THEME } from '@pollium/vyva-core/themes';
import { describe, expect, it } from 'vitest';

const LANDSCAPE = { width: 960, height: 540 };
const saveImage = async () => null;

const line = (id: string, html: string, x: number, y: number, w: number): TextElement => ({
    id, type: 'text', x, y, w, h: 43, rotation: 0, opacity: 1, isLocked: false, fill: null, html: `<p>${html}</p>`,
    style: { fontSize: 36, color: '#000000', align: 'left', verticalAlign: 'top', lineHeight: 1.2, isBold: false }
});

const box = (id: string, x: number, y: number, w: number, h: number): SlideElement => ({
    id, type: 'shape', shape: 'rect', x, y, w, h, rotation: 0, opacity: 1, isLocked: false, fill: '#cfd5ea', stroke: null, strokeWidth: 0
});

const joined = (elements: SlideElement[]): SlideElement[] => {
    const deck: DeckContent = { kind: 'deck', format: '16:9', theme: { ...DECK_THEME, font: 'Open Sans' }, slides: [{ id: 'one', background: null, elements }] };
    return joinLines(deck).slides[0].elements;
};

const texts = (elements: SlideElement[]): string[] => elements.flatMap((element) => element.type === 'text' ? [element.html] : []);

describe('importFile with PDF slides', () => {
    it('turns a landscape PDF into slides through the engine and joins its lines into paragraphs', async () => {
        const received: Uint8Array[] = [];
        const pdf = pdfWith(['Potencial de accion'], LANDSCAPE);
        const pdfSlides = async (data: Uint8Array) => {
            received.push(data);
            return pptxOfLines([
                { text: 'Introducción', x: 4.5, y: 0.6, w: 3, isBold: true },
                { text: 'La bomba de sodio y potasio sostiene la', x: 2, y: 2, w: 6 },
                { text: 'diferencia de concentraciones.', x: 2, y: 2.3, w: 4.5 }
            ]);
        };

        const { content } = await importFile(pdf, 'clase.pdf', { saveImage, pdfSlides });

        expect(Buffer.from(received[0])).toEqual(pdf);
        expect(content.kind).toBe('deck');
        expect(content.kind === 'deck' ? texts(content.slides[0].elements) : []).toEqual([
            '<p><strong>Introducción</strong></p>',
            '<p>La bomba de sodio y potasio sostiene la diferencia de concentraciones.</p>'
        ]);
    });

    it('keeps a portrait PDF as a document and never calls the engine', async () => {
        const pdfSlides = async (): Promise<Uint8Array> => {
            throw new Error('A portrait PDF went to the engine');
        };

        const { content } = await importFile(pdfWith(['First page']), 'notes.pdf', { saveImage, pdfSlides });

        expect(content.kind).toBe('document');
    });

    it('reports an engine that cannot make the slides', async () => {
        const pdf = pdfWith(['Slides'], LANDSCAPE);
        const failing = async (): Promise<Uint8Array> => {
            throw new Error('soffice crashed');
        };

        await expect(importFile(pdf, 'clase.pdf', { saveImage, pdfSlides: failing })).rejects.toMatchObject({ code: 'slides-failed' });
        await expect(importFile(pdf, 'clase.pdf', { saveImage, pdfSlides: libreOffice({ command: '/nonexistent/soffice' }) })).rejects.toMatchObject({ code: 'slides-failed' });
    });
});

describe('joinLines', () => {
    it('makes one list out of bullet and number markers that sit beside their lines', () => {
        const elements = joined([
            line('b1', '•', 240, 300, 20), line('t1', 'Despolarización: entra Na⁺', 300, 300, 600), line('t2', 'hasta +30 mV.', 300, 344, 260),
            line('b2', '•', 240, 400, 20), line('t3', 'Repolarización: sale K⁺', 300, 400, 500),
            line('n1', '1.', 240, 600, 30), line('t4', 'Umbral', 300, 600, 200)
        ]);

        expect(texts(elements)).toEqual([
            '<ul><li>Despolarización: entra Na⁺ hasta +30 mV.</li><li>Repolarización: sale K⁺</li></ul>',
            '<ol><li>Umbral</li></ol>'
        ]);
        expect(elements[0].x).toBeLessThan(300);
    });

    it('reads a marker written at the start of a line and rejoins a word broken with a hyphen', () => {
        const elements = joined([line('a', '➢ La mem-', 200, 300, 300), line('b', 'brana se despolariza', 200, 344, 400)]);

        expect(texts(elements)).toEqual(['<ul><li>La membrana se despolariza</li></ul>']);
    });

    it('keeps apart the lines of different cells and stops a paragraph before what sits to its right', () => {
        const map: SlideElement = { id: 'map', type: 'image', x: 1300, y: 250, w: 400, h: 600, rotation: 0, opacity: 1, isLocked: false, fileId: '01a14188-5cb4-776b-815b-c6e977d07bbe', fit: 'cover', radius: 0, alt: '', credit: null };
        const elements = joined([
            box('cell1', 200, 600, 300, 58), box('cell2', 200, 658, 300, 58),
            line('c1', '45', 220, 610, 44), line('c2', '50', 220, 668, 44),
            map, line('p1', 'El PNB incluye lo que los nacionales', 300, 300, 1100), line('p2', 'producen en el extranjero.', 300, 344, 600)
        ]);
        const paragraph = elements.find((element) => element.type === 'text' && element.html.includes('PNB'));

        expect(texts(elements)).toContain('<p>45</p>');
        expect(texts(elements)).toContain('<p>50</p>');
        expect(paragraph === undefined ? Infinity : paragraph.x + paragraph.w).toBeLessThanOrEqual(1300);
    });
});
