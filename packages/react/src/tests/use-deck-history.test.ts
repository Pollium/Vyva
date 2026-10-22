import { act, renderHook } from '@testing-library/react';
import type { DeckContent } from '@pollium/vyva-core/content';
import { DECK_THEME } from '@pollium/vyva-core/themes';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDeckHistory } from '../hooks/use-deck-history';
import { useLiveEdit } from '../hooks/use-live-edit';

const deckTitled = (id: string): DeckContent => ({ kind: 'deck', format: '16:9', theme: DECK_THEME, slides: [{ id, background: null, elements: [] }] });

const titleOf = (deck: DeckContent) => deck.slides[0].id;

const historyWith = (initial = deckTitled('first')) => {
    const onChange = vi.fn<(deck: DeckContent) => void>();
    const hook = renderHook(() => useDeckHistory(initial, onChange));

    return { hook, onChange };
};

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe('useDeckHistory', () => {
    it('undoes and redoes commits, and reports every change', () => {
        const { hook, onChange } = historyWith();

        act(() => hook.result.current.commit(deckTitled('second')));
        act(() => {
            hook.result.current.undo();
        });

        expect(titleOf(hook.result.current.deck)).toBe('first');
        expect(hook.result.current.canRedo).toBe(true);

        act(() => {
            hook.result.current.redo();
        });

        expect(titleOf(hook.result.current.deck)).toBe('second');
        expect(onChange.mock.calls.map(([deck]) => titleOf(deck))).toEqual(['second', 'first', 'second']);
    });

    it('shows previews without reporting them, and settles them into one undo step', () => {
        const { hook, onChange } = historyWith();
        const before = hook.result.current.snapshot();

        act(() => hook.result.current.preview(deckTitled('dragging')));
        act(() => hook.result.current.preview(deckTitled('dropped')));

        expect(onChange).not.toHaveBeenCalled();

        act(() => hook.result.current.settle(before));
        act(() => {
            hook.result.current.undo();
        });

        expect(titleOf(hook.result.current.deck)).toBe('first');
    });

    it('adopts a remote version without reporting it back', () => {
        const { hook, onChange } = historyWith();

        act(() => hook.result.current.adopt(deckTitled('remote')));

        expect(titleOf(hook.result.current.deck)).toBe('remote');
        expect(onChange).not.toHaveBeenCalled();
    });
});

describe('useLiveEdit', () => {
    it('folds a burst of changes into one undo step once they go idle', () => {
        const onChange = vi.fn<(deck: DeckContent) => void>();
        const hook = renderHook(() => {
            const history = useDeckHistory(deckTitled('first'), onChange);

            return { history, live: useLiveEdit(history) };
        });

        act(() => hook.result.current.live.change(() => deckTitled('one')));
        act(() => hook.result.current.live.change(() => deckTitled('two')));

        expect(titleOf(hook.result.current.history.deck)).toBe('two');
        expect(onChange).not.toHaveBeenCalled();

        act(() => {
            vi.runOnlyPendingTimers();
        });

        expect(onChange).toHaveBeenCalledTimes(1);

        act(() => {
            hook.result.current.history.undo();
        });

        expect(titleOf(hook.result.current.history.deck)).toBe('first');
    });
});
