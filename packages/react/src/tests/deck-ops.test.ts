import { DECK_SIZES, MAX_TABLE_COLUMNS, type DeckContent, type SlideElement, type TextElement } from '@vyva/core/content';
import { DECK_THEME } from '@vyva/core/themes';
import { describe, expect, it } from 'vitest';
import { align, arrange, moveSlide, newText, removeElements, removeSlide, withTextStyle } from '../utils/deck/deck-ops';
import { insertColumn, insertRow, removeColumn, removeRow } from '../utils/deck/table-ops';

const box = (id: string, x: number, y: number, isLocked = false): SlideElement => ({
    id,
    type: 'shape',
    shape: 'rect',
    x,
    y,
    w: 100,
    h: 50,
    rotation: 0,
    opacity: 1,
    isLocked,
    fill: '#000000',
    stroke: null,
    strokeWidth: 0
});

const deckWith = (...elements: SlideElement[]): DeckContent => ({
    kind: 'deck',
    format: '16:9',
    theme: DECK_THEME,
    slides: [
        { id: 's1', background: null, elements },
        { id: 's2', background: null, elements: [] },
        { id: 's3', background: null, elements: [] }
    ]
});

const idsOf = (deck: DeckContent) => deck.slides[0].elements.map((element) => element.id);
const frameOf = (deck: DeckContent, id: string) => deck.slides[0].elements.find((element) => element.id === id);

describe('table operations', () => {
    it('pads ragged rows when a column goes in, and puts it where asked', () => {
        expect(insertColumn([['a', 'b'], ['c']], 1)).toEqual([['a', '', 'b'], ['c', '', '']]);
    });

    it('adds an empty row as wide as the widest one', () => {
        expect(insertRow([['a', 'b'], ['c']], 0)).toEqual([['', ''], ['a', 'b'], ['c', '']]);
    });

    it('keeps the last row and the last column', () => {
        expect(removeRow([['a', 'b']], 0)).toEqual([['a', 'b']]);
        expect(removeColumn([['a'], ['b']], 0)).toEqual([['a'], ['b']]);
        expect(removeColumn([['a', 'b'], ['c', 'd']], 0)).toEqual([['b'], ['d']]);
    });

    it('stops adding columns at the limit', () => {
        const full = [Array.from({ length: MAX_TABLE_COLUMNS }, () => 'x')];

        expect(insertColumn(full, 0)).toBe(full);
    });
});

describe('arrange', () => {
    it('moves a group forward one step together, past the next unselected element', () => {
        const deck = deckWith(box('a', 0, 0), box('b', 0, 0), box('c', 0, 0));

        expect(idsOf(arrange(deck, 0, ['a', 'b'], 'forward'))).toEqual(['c', 'a', 'b']);
    });

    it('sends the selection to the back in its own order', () => {
        const deck = deckWith(box('a', 0, 0), box('b', 0, 0), box('c', 0, 0));

        expect(idsOf(arrange(deck, 0, ['c', 'b'], 'back'))).toEqual(['b', 'c', 'a']);
    });
});

describe('align', () => {
    it('centers a single element on the slide', () => {
        const aligned = align(deckWith(box('a', 10, 10)), 0, ['a'], 'center');

        expect(frameOf(aligned, 'a')?.x).toBe((DECK_SIZES['16:9'].width - 100) / 2);
    });

    it('aligns several elements to the edge of the box around them and leaves locked ones alone', () => {
        const deck = deckWith(box('a', 300, 0), box('b', 120, 0), box('c', 40, 0, true));
        const aligned = align(deck, 0, ['a', 'b', 'c'], 'left');

        expect(frameOf(aligned, 'a')?.x).toBe(120);
        expect(frameOf(aligned, 'b')?.x).toBe(120);
        expect(frameOf(aligned, 'c')?.x).toBe(40);
    });
});

describe('elements and slides', () => {
    it('does not delete locked elements', () => {
        const deck = deckWith(box('a', 0, 0), box('b', 0, 0, true));

        expect(idsOf(removeElements(deck, 0, ['a', 'b']))).toEqual(['b']);
    });

    it('moves a slide to another position', () => {
        const moved = moveSlide(deckWith(), 0, 2);

        expect(moved.slides.map((slide) => slide.id)).toEqual(['s2', 's3', 's1']);
    });

    it('keeps the last slide', () => {
        const single: DeckContent = { ...deckWith(), slides: [deckWith().slides[0]] };

        expect(removeSlide(single, 0)).toBe(single);
    });

    it('escapes the text of a new text box', () => {
        expect(newText(deckWith(), '<b>&</b>').html).toBe('<p>&lt;b&gt;&amp;&lt;/b&gt;</p>');
    });
});

describe('withTextStyle', () => {
    it('drops the inline sizes a box-wide size would fight with, and keeps the rest', () => {
        const text: TextElement = { ...newText(deckWith(), ''), html: '<p><span style="font-size:20px;color:#ff0000">Hola</span></p>' };
        const resized = withTextStyle(text, (style) => ({ ...style, fontSize: 64 }), DECK_THEME);

        expect(resized.type === 'text' ? resized.html : null).toBe('<p><span style="color:#ff0000">Hola</span></p>');
    });
});
