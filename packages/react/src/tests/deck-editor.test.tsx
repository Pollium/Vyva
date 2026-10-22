import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Content, DeckContent } from '@pollium/vyva-core/content';
import { layoutSlide } from '@pollium/vyva-core/slide-layouts';
import { DECK_THEME } from '@pollium/vyva-core/themes';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DeckEditor from '../components/deck/DeckEditor';
import type { ContentDraft } from '../contracts/editor-session';

const deck: DeckContent = {
    kind: 'deck',
    format: '16:9',
    theme: DECK_THEME,
    slides: [
        layoutSlide({ layout: 'title', title: 'Redes', subtitle: 'Unidad 1' }, '16:9', DECK_THEME),
        { id: 'blank', background: null, elements: [] }
    ]
};

const contentOf = (draft: ContentDraft): Content => typeof draft.content === 'function' ? draft.content() : draft.content;

const editorWith = (readOnly = false) => {
    const change = vi.fn<(draft: ContentDraft) => void>();
    const view = render(<DeckEditor session={{ content: deck, remoteVersion: 0, change }} readOnly={readOnly} fileUrl={() => null} />);
    const lastDeck = () => {
        const draft = change.mock.lastCall?.[0];
        return draft === undefined ? null : contentOf(draft);
    };

    return { view, change, lastDeck };
};

const elementsOf = (content: Content | null, slide: number) => content?.kind === 'deck' ? content.slides[slide].elements : [];

beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(document, 'fonts', { value: { ready: Promise.resolve() }, configurable: true });
});

afterEach(() => {
    cleanup();
    vi.useRealTimers();
});

describe('DeckEditor', () => {
    it('adds a text box from the toolbar and saves the deck with it', () => {
        const { lastDeck } = editorWith();
        const before = deck.slides[0].elements.length;

        fireEvent.click(screen.getByRole('button', { name: 'Add text' }));

        expect(elementsOf(lastDeck(), 0)).toHaveLength(before + 1);
        expect(elementsOf(lastDeck(), 0).at(-1)?.type).toBe('text');
    });

    it('deletes the selected elements with the keyboard and undoes it', () => {
        const { lastDeck } = editorWith();
        const stage = screen.getByRole('region', { name: 'Canvas of slide 1' });

        fireEvent.click(screen.getByRole('button', { name: 'Add a shape' }));
        fireEvent.click(screen.getByRole('button', { name: 'Rectangle' }));
        const withShape = elementsOf(lastDeck(), 0).length;

        fireEvent.keyDown(stage, { key: 'Delete' });
        expect(elementsOf(lastDeck(), 0)).toHaveLength(withShape - 1);

        fireEvent.keyDown(stage, { key: 'z', ctrlKey: true });
        expect(elementsOf(lastDeck(), 0)).toHaveLength(withShape);
    });

    it('steps through the slides with the arrow keys when nothing is selected', () => {
        editorWith();

        fireEvent.keyDown(screen.getByRole('region', { name: 'Canvas of slide 1' }), { key: 'ArrowRight' });

        expect(screen.getByRole('region', { name: 'Canvas of slide 2' })).toBeTruthy();
    });

    it('does not change a read-only deck', () => {
        const { change } = editorWith(true);

        fireEvent.click(screen.getByRole('button', { name: 'Add text' }));

        expect(change).not.toHaveBeenCalled();
    });
});
