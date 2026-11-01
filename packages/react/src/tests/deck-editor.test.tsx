import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Content, DeckContent } from '@pollium/vyva-core/content';
import { layoutSlide } from '@pollium/vyva-core/slide-layouts';
import { DECK_THEME } from '@pollium/vyva-core/themes';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DeckEditor from '../components/deck/DeckEditor';
import type { ContentDraft } from '../contracts/editor-session';
import { PdfPageContext, type PdfPageProps } from '../contracts/pdf-page';

const deck: DeckContent = {
    kind: 'deck',
    format: '16:9',
    theme: DECK_THEME,
    slides: [
        layoutSlide({ layout: 'title', title: 'Redes', subtitle: 'Unidad 1' }, '16:9', DECK_THEME),
        { id: 'blank', background: null, elements: [] }
    ]
};

const PDF_ID = '01a14188-5cb4-776b-815b-c6e977d07bc0';

const pdfDeck: DeckContent = {
    kind: 'deck',
    format: { width: 1224, height: 1584 },
    theme: DECK_THEME,
    slides: [1, 2].map((page) => ({ id: `p${page}`, background: { type: 'pdf-page', fileId: PDF_ID, page }, elements: [] }))
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

    it('draws the page the host renders under a slide of a PDF, at the size of the page', () => {
        const drawn: PdfPageProps[] = [];
        const renderPdfPage = (props: PdfPageProps) => {
            drawn.push(props);
            return <div data-pdf-page={props.page} />;
        };
        render(
            <PdfPageContext.Provider value={renderPdfPage}>
                <DeckEditor session={{ content: pdfDeck, remoteVersion: 0, change: vi.fn() }} readOnly={false} fileUrl={(id) => id === PDF_ID ? '/files/lecture.pdf' : null} />
            </PdfPageContext.Provider>
        );

        const stage = screen.getByRole('region', { name: 'Canvas of slide 1' });
        expect(stage.querySelector('[data-pdf-page="1"]')).not.toBeNull();
        expect(drawn.at(-1)).toMatchObject({ url: '/files/lecture.pdf', page: 1, width: 1224, height: 1584, isSelectable: false });
    });

    it('does not change a read-only deck', () => {
        const { change } = editorWith(true);

        fireEvent.click(screen.getByRole('button', { name: 'Add text' }));

        expect(change).not.toHaveBeenCalled();
    });
});
