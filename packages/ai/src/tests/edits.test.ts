import { applyDeckOperations, deckForModel, markdownToTextHtml } from '../deck-edits';
import { applyDocumentOperations, documentForModel } from '../document-edits';
import { EditRefused } from '../errors';
import { htmlToMarkdown, PAGE_BREAK_MARKER } from '../html-markdown';
import type { DeckContent, DocumentContent, ShapeElement } from '@vyva/core/content';
import { markdownToBlocks } from '@vyva/core/markdown-blocks';
import { layoutSlide } from '@vyva/core/slide-layouts';
import { DECK_THEME, DEFAULT_DOCUMENT_DESIGN } from '@vyva/core/themes';
import { describe, expect, it } from 'vitest';

const document = (): DocumentContent => ({ kind: 'document', design: DEFAULT_DOCUMENT_DESIGN, blocks: markdownToBlocks('# Worksheet\n\n## Goals\n\n## Steps\n\n## Delivery') });

const deck = (): DeckContent => ({
    kind: 'deck',
    format: '16:9',
    theme: DECK_THEME,
    slides: [
        layoutSlide({ layout: 'title', title: 'Subnetting', subtitle: 'Unit 1' }, '16:9', DECK_THEME),
        layoutSlide({ layout: 'bullets', title: 'Classes', bullets: ['Class A', 'Class B'] }, '16:9', DECK_THEME)
    ]
});

describe('document edits', () => {
    it('replaces, inserts and deletes blocks and keeps the other blocks untouched', () => {
        const content = document();
        const [first, second] = content.blocks;
        const edited = applyDocumentOperations(content, [
            { op: 'replace', blockId: first.id, markdown: '# Subnetting worksheet' },
            { op: 'insert_after', blockId: null, markdown: '**Draft**' },
            { op: 'delete', blockId: second.id },
            { op: 'append', markdown: `The end\n\n${PAGE_BREAK_MARKER}\n\nAppendix` }
        ]);

        expect(edited.blocks[0].html).toBe('<p><strong>Draft</strong></p>');
        expect(edited.blocks[1].html).toBe('<h1>Subnetting worksheet</h1>');
        expect(edited.blocks.some((block) => block.id === second.id)).toBe(false);
        expect(edited.blocks.slice(-3).map((block) => block.html)).toEqual(['<p>The end</p>', '<div data-type="page-break"></div>', '<p>Appendix</p>']);
        expect(edited.blocks.slice(2, -3)).toEqual(content.blocks.slice(2));
    });

    it('explains an unknown block id', () => {
        expect(() => applyDocumentOperations(document(), [{ op: 'delete', blockId: 'nope' }])).toThrow(EditRefused);
    });

    it('shows the model each block as Markdown, including checklists, tables, images and page breaks', () => {
        const html = [
            '<h2>Agreements</h2>',
            '<ul data-type="taskList"><li data-type="taskItem" data-checked="true">Review</li><li data-type="taskItem" data-checked="false">Send</li></ul>',
            '<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>',
            '<p><img alt="Topology" data-file-id="01a14188-5cb4-776b-815b-c6e977d07bbe"></p>',
            '<div data-type="page-break"></div>'
        ];
        const { blocks } = documentForModel({ ...document(), blocks: html.map((block, index) => ({ id: `b${index}`, html: block })) }, 10_000);

        expect(blocks.map((block) => block.markdown)).toEqual([
            '## Agreements',
            '- [x] Review\n- [ ] Send',
            '| A   | B   |\n| --- | --- |\n| 1   | 2   |',
            '![Topology](asset:01a14188-5cb4-776b-815b-c6e977d07bbe)',
            PAGE_BREAK_MARKER
        ]);
    });

    it('shows the model the first blocks that fit and says the rest was left out', () => {
        const view = documentForModel(document(), 12);

        expect(view.blocks.map((block) => block.markdown)).toEqual(['# Worksheet']);
        expect(view).toMatchObject({ totalBlocks: 4, isTruncated: true });
    });
});

describe('deck edits', () => {
    it('adds, moves, replaces and deletes slides by id', () => {
        const content = deck();
        const [title, bullets] = content.slides;
        const added = applyDeckOperations(content, [{ op: 'add_slide', afterSlideId: title.id, slide: { layout: 'quote', quote: 'Divide and conquer' } }]);
        expect(added.slides.map((slide) => slide.id)).toEqual([title.id, added.slides[1].id, bullets.id]);

        const moved = applyDeckOperations(added, [{ op: 'move_slide', slideId: bullets.id, afterSlideId: null }]);
        expect(moved.slides[0].id).toBe(bullets.id);

        const replaced = applyDeckOperations(moved, [{ op: 'replace_slide', slideId: bullets.id, slide: { layout: 'big-number', number: '42', numberLabel: 'subnets' } }]);
        expect(replaced.slides[0].id).toBe(bullets.id);
        expect(JSON.stringify(replaced.slides[0])).toContain('42');

        expect(applyDeckOperations(replaced, [{ op: 'delete_slide', slideId: title.id }]).slides).toHaveLength(2);
        expect(applyDeckOperations(content, [{ op: 'add_slide', afterSlideId: null, slide: { layout: 'closing', title: 'Thanks' } }]).slides).toHaveLength(3);
    });

    it('changes the text of one element and turns a lone code fence into a code block', () => {
        const content = deck();
        const slide = content.slides[1];
        const list = slide.elements.find((element) => element.type === 'text' && element.html.includes('<ul>'));
        const edited = applyDeckOperations(content, [{ op: 'set_text', slideId: slide.id, elementId: list?.id ?? '', markdown: '- One\n- **Two**' }]);
        const updated = edited.slides[1].elements.find((element) => element.id === list?.id);
        expect(updated?.type === 'text' && updated.html).toBe('<ul><li>One</li><li><strong>Two</strong></li></ul>');

        const coded = applyDeckOperations(content, [{ op: 'set_text', slideId: slide.id, elementId: list?.id ?? '', markdown: '```sql\nSELECT 1;\n```' }]);
        expect(coded.slides[1].elements.find((element) => element.id === list?.id)).toMatchObject({ type: 'code', code: 'SELECT 1;', language: 'sql' });
    });

    it('builds paragraphs and bullets from Markdown for text boxes', () => {
        expect(markdownToTextHtml('Hello *world*\n- point')).toBe('<p>Hello <em>world</em></p><ul><li>point</li></ul>');
    });

    it('writes text into shapes that can hold it and refuses lines', () => {
        const content = deck();
        const slide = content.slides[0];
        const box: ShapeElement = { id: 'box', type: 'shape', shape: 'rounded', x: 10, y: 10, w: 400, h: 200, rotation: 0, opacity: 1, isLocked: false, fill: '#1f4e9a', stroke: null, strokeWidth: 0 };
        const line: ShapeElement = { ...box, id: 'line', shape: 'line' };
        const withShapes: DeckContent = { ...content, slides: [{ ...slide, elements: [...slide.elements, box, line] }, ...content.slides.slice(1)] };

        const edited = applyDeckOperations(withShapes, [{ op: 'set_text', slideId: slide.id, elementId: 'box', markdown: 'Analog **input**' }]);
        const written = edited.slides[0].elements.find((element) => element.id === 'box');
        expect(written?.type === 'shape' ? written.text : null).toMatchObject({ html: '<p>Analog <strong>input</strong></p>', style: { color: '#ffffff', align: 'center', verticalAlign: 'middle' } });
        expect(deckForModel(edited).slides[0].elements.find((element) => element.id === 'box')?.text).toBe('Analog **input**');
        expect(() => applyDeckOperations(withShapes, [{ op: 'set_text', slideId: slide.id, elementId: 'line', markdown: 'x' }])).toThrow(EditRefused);
        expect(() => applyDeckOperations(withShapes, [{ op: 'delete_slide', slideId: 'nope' }])).toThrow(EditRefused);
    });
});

describe('math', () => {
    it('gives the model back the LaTeX it wrote, without Markdown escapes', () => {
        const html = markdownToTextHtml('Total cost: $CT = DC + \\frac{D}{Q}S + \\frac{Q}{2}H$ with $x_1 * y_2$');

        expect(htmlToMarkdown(html)).toBe('Total cost: $CT = DC + \\frac{D}{Q}S + \\frac{Q}{2}H$ with $x_1 * y_2$');
    });
});
