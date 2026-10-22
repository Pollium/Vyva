import { exportContent } from '../export';
import { importFile } from '../import';
import type { NewImage } from '../import/images';
import { pptxTemplate, pptxWithNotes, readImage, SAMPLE_DECK } from './fixtures';
import type { DeckContent, ShapeElement, TextStyle } from '@pollium/vyva-core/content';
import { layoutSlide } from '@pollium/vyva-core/slide-layouts';
import { DECK_THEME } from '@pollium/vyva-core/themes';
import { describe, expect, it } from 'vitest';

const storing = () => {
    const saved: NewImage[] = [];
    const saveImage = async (image: NewImage) => {
        saved.push(image);
        return `01a14188-5cb4-776b-815b-c6e977d07c${String(saved.length).padStart(2, '0')}`;
    };
    return { saved, saveImage };
};

const importDeck = async (data: Uint8Array, filename: string, saveImage = storing().saveImage): Promise<{ title: string; content: DeckContent }> => {
    const { title, content } = await importFile(data, filename, { saveImage });
    if(content.kind !== 'deck') throw new TypeError(`${filename} came back as a ${content.kind}`);
    return { title, content };
};

describe('importFile with PowerPoint', () => {
    it('exports a deck to PowerPoint and back with its slides, text and image', async () => {
        const pptx = await exportContent(SAMPLE_DECK, 'pptx', { title: 'Subnetting', readImage });
        const { saved, saveImage } = storing();

        const { title, content } = await importDeck(pptx.data, 'class.pptx', saveImage);
        expect(title).toBe('Subnetting IPv4');
        expect(content.format).toBe('16:9');
        expect(content.slides).toHaveLength(3);

        const heading = content.slides[0].elements.find((element) => element.type === 'text' && element.html.includes('Subnetting IPv4'));
        expect(heading?.type === 'text' ? heading.html : '').not.toMatch(/font-(family|size)/);
        expect(JSON.stringify(content.slides[1])).toContain('Router');
        expect(JSON.stringify(content.slides[2])).toContain('254');

        const picture = content.slides[1].elements.find((element) => element.type === 'image');
        const original = SAMPLE_DECK.slides[1].elements.find((element) => element.type === 'image');
        expect(Math.abs((picture?.x ?? 0) - (original?.x ?? 0))).toBeLessThan(3);
        expect(Math.abs((picture?.w ?? 0) - (original?.w ?? 0))).toBeLessThan(3);
        expect(saved).toEqual([expect.objectContaining({ name: 'class (image 1).png', contentType: 'image/png' })]);
        expect(picture?.type === 'image' ? picture.fileId : '').toBe('01a14188-5cb4-776b-815b-c6e977d07c01');
    });

    it('leaves out the speaker notes', async () => {
        const { content } = await importDeck(await pptxWithNotes('Sensor networks', 'Greet and present the goals.'), 'class.pptx');
        const [slide] = content.slides;

        expect(JSON.stringify(slide)).toContain('Sensor networks');
        expect(JSON.stringify(slide)).not.toContain('Greet');
    });

    it('keeps the design a PowerPoint inherits from its slide master, locked, with theme colors', async () => {
        const { saved, saveImage } = storing();
        const { content } = await importDeck(await pptxTemplate(), 'template.pptx', saveImage);
        expect(content.slides).toHaveLength(2);

        const [cover, goals] = content.slides;
        expect(cover.background).toEqual({ type: 'color', color: '#0f2a52' });
        const locked = cover.elements.filter((element) => element.isLocked);
        expect(locked.map((element) => element.type)).toEqual(['shape', 'image', 'text']);
        expect(locked[0]).toMatchObject({ type: 'shape', fill: '#c4572e', y: 979 });
        expect(saved).toHaveLength(1);
        expect(locked[2].type === 'text' ? locked[2].html : '').toContain('Vyva University');
        expect(cover.elements.findIndex((element) => !element.isLocked)).toBe(locked.length);

        const title = cover.elements.find((element) => element.type === 'text' && element.html.includes('Computer networks'));
        expect(title).toMatchObject({ isLocked: false, x: 86, y: 72, style: { color: '#ffffff', fontSize: 80 } });
        const square = goals.elements.find((element) => element.type === 'shape' && !element.isLocked && element.shape === 'rect');
        expect(square).toMatchObject({ fill: '#4472c4' });
        expect(goals.elements.filter((element) => element.isLocked)).toHaveLength(3);
        expect(content.theme.accent).toBe('#4472c4');
    });

    it('keeps text inside shapes', async () => {
        const style: TextStyle = { fontSize: 36, color: '#ffffff', align: 'center', verticalAlign: 'middle', lineHeight: 1.2, isBold: false };
        const step: ShapeElement = { id: 'step', type: 'shape', shape: 'ellipse', x: 1200, y: 600, w: 480, h: 260, rotation: 0, opacity: 1, isLocked: false, fill: '#1f4e9a', stroke: '#0f2a52', strokeWidth: 4, text: { html: '<p>Read the <strong>DHT22</strong></p>', style } };
        const slide = layoutSlide({ layout: 'title', title: 'Sensor flow' }, '16:9', DECK_THEME);
        const deck: DeckContent = { kind: 'deck', format: '16:9', theme: DECK_THEME, slides: [{ ...slide, elements: [...slide.elements, step] }] };

        const pptx = await exportContent(deck, 'pptx', { title: 'Flow', readImage });
        const { content } = await importDeck(pptx.data, 'flow.pptx');
        const shape = content.slides[0].elements.find((element) => element.type === 'shape' && element.shape === 'ellipse');

        expect(shape?.type === 'shape' ? shape.text?.html : '').toContain('DHT22');
        expect(shape?.type === 'shape' ? shape.text?.style.verticalAlign : '').toBe('middle');
    });
});
