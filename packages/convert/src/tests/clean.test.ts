import { cleanContent, cleanDeck } from '../clean-content';
import { cleanHtml } from '../clean-html';
import { textHeight } from '../text-measure';
import type { DeckContent, ShapeElement, TextElement, TextStyle } from '@pollium/vyva-core/content';
import { DECK_THEME, DEFAULT_DOCUMENT_DESIGN } from '@pollium/vyva-core/themes';
import { describe, expect, it } from 'vitest';

const STYLE: TextStyle = { fontSize: 32, color: '#ffffff', align: 'center', verticalAlign: 'middle', lineHeight: 1.2, isBold: false };

const deckWith = (elements: DeckContent['slides'][number]['elements']): DeckContent => ({
    kind: 'deck',
    format: '16:9',
    theme: DECK_THEME,
    footer: { left: 'Unit 1', center: '' },
    slides: [{ id: 'cover', background: null, elements }]
});

const box: ShapeElement = { id: 'box', type: 'shape', shape: 'rounded', x: 10, y: 10, w: 400, h: 200, rotation: 0, opacity: 1, isLocked: false, fill: '#1f4e9a', stroke: null, strokeWidth: 0 };

describe('cleanHtml', () => {
    it('keeps the editor\'s formatting and removes anything that could run code', () => {
        expect(cleanHtml('<p style="text-align:center;color:rgb(10, 20, 30);position:fixed">x</p>')).toBe('<p style="text-align:center;color:rgb(10, 20, 30)">x</p>');
        expect(cleanHtml('<ul data-type="taskList"><li data-type="taskItem" data-checked="true">a</li></ul>')).toBe('<ul data-type="taskList"><li data-type="taskItem" data-checked="true">a</li></ul>');
        expect(cleanHtml('<pre class="language-bash"><code class="language-bash">ls -la</code></pre>')).toBe('<pre class="language-bash"><code class="language-bash">ls -la</code></pre>');
        expect(cleanHtml('<div data-type="page-break"></div><div data-type="evil">x</div>')).toBe('<div data-type="page-break"></div>');
        expect(cleanHtml('<p><input type="text" value="x"><input type="checkbox" checked onclick="x()"></p>')).toBe('<p><input type="checkbox" checked="checked" disabled="disabled" /></p>');
        expect(cleanHtml('<a href="//evil.example">x</a><a href="data:text/html,x">y</a>')).toBe('<a target="_blank" rel="noopener noreferrer">x</a><a target="_blank" rel="noopener noreferrer">y</a>');
        expect(cleanHtml('<style>body{display:none}</style><p>ok</p>')).toBe('<p>ok</p>');
    });

    it('keeps only the images that point at a stored file', () => {
        expect(cleanHtml('<p><img data-file-id="01a14188-5cb4-776b-815b-c6e977d07bbe" alt="Map" src="https://evil.example/x.png"></p>')).toBe('<p><img data-file-id="01a14188-5cb4-776b-815b-c6e977d07bbe" alt="Map" /></p>');
        expect(cleanHtml('<p><img src="https://evil.example/x.png"></p>')).toBe('<p></p>');
    });
});

describe('cleanContent', () => {
    it('cleans the blocks of a document, drops the empty ones and gives repeated ids new ones', () => {
        const cleaned = cleanContent({
            kind: 'document',
            design: DEFAULT_DOCUMENT_DESIGN,
            blocks: [{ id: 'a', html: '<p onclick="x()">One</p>' }, { id: 'a', html: '<p>Two</p>' }, { id: 'c', html: '<script>alert(1)</script>' }]
        });

        expect(cleaned.kind === 'document' ? cleaned.blocks.map((block) => block.html) : []).toEqual(['<p>One</p>', '<p>Two</p>']);
        expect(cleaned.kind === 'document' ? new Set(cleaned.blocks.map((block) => block.id)).size : 0).toBe(2);
    });

    it('cleans the text inside shapes and drops it from shapes that cannot hold it', () => {
        const line: ShapeElement = { ...box, id: 'line', shape: 'line', text: { html: '<p>on a line</p>', style: STYLE } };
        const cleaned = cleanDeck(deckWith([{ ...box, text: { html: '<p onclick="x()">Hello<script>alert(1)</script></p>', style: STYLE } }, line]));
        const [cleanBox, cleanLine] = cleaned.slides[0].elements;

        expect(cleanBox.type === 'shape' ? cleanBox.text?.html : '').toBe('<p>Hello</p>');
        expect(cleanLine).not.toHaveProperty('text');
        expect(cleaned.footer).toEqual({ left: 'Unit 1', center: '' });
    });

    it('keeps the points of a polygon and drops them from a shape that was changed to another kind', () => {
        const points = [{ x: 0, y: 0 }, { x: 1, y: 0.5 }, { x: 0, y: 1 }];
        const cleaned = cleanDeck(deckWith([{ ...box, id: 'stripe', shape: 'polygon', points }, { ...box, id: 'was', shape: 'rect', points }]));
        const [stripe, changed] = cleaned.slides[0].elements;

        expect(stripe).toMatchObject({ shape: 'polygon', points });
        expect(changed).not.toHaveProperty('points');
    });

    it('saves a text box as tall as its text, keeping the edge its vertical alignment anchors to', () => {
        const style: TextStyle = { fontSize: 54, color: '#e6edf3', align: 'left', verticalAlign: 'bottom', lineHeight: 1.1, isBold: true };
        const title: TextElement = { id: 'title', type: 'text', x: 108, y: 364, w: 1705, h: 260, rotation: 0, opacity: 1, isLocked: false, fill: null, html: '<p>SQL from scratch</p>', style };

        const [saved] = cleanDeck(deckWith([title])).slides[0].elements;
        expect(saved.h).toBe(Math.round(54 * 1.1));
        expect(saved.y + saved.h).toBe(364 + 260);
    });
});

describe('textHeight', () => {
    it('wraps long text onto more lines and indents list items', () => {
        const oneLine = textHeight('<p>Short</p>', STYLE, 'Inter', 800);
        const wrapped = textHeight(`<p>${'word '.repeat(60)}</p>`, STYLE, 'Inter', 800);

        expect(oneLine).toBe(32 * 1.2);
        expect(wrapped).toBeGreaterThan(oneLine * 3);
        expect(textHeight('<ul><li>One</li><li>Two</li></ul>', STYLE, 'Inter', 800)).toBeCloseTo(2 * (32 * 1.2 + 0.35 * 32));
    });

    it('cannot fit a word wider than the box', () => {
        expect(textHeight(`<p>${'x'.repeat(200)}</p>`, STYLE, 'Inter', 100)).toBe(Infinity);
    });
});
