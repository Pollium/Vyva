import type { DeckContent } from '@vyva/core/content';
import { useCallback, useRef, useState } from 'react';

const LIMIT = 100;

interface History{
    past: DeckContent[];
    present: DeckContent;
    future: DeckContent[];
}

export interface DeckHistory{
    deck: DeckContent;
    canUndo: boolean;
    canRedo: boolean;
    snapshot: () => DeckContent;
    commit: (next: DeckContent) => void;
    preview: (next: DeckContent) => void;
    settle: (before: DeckContent) => void;
    adopt: (next: DeckContent) => void;
    undo: () => DeckContent | null;
    redo: () => DeckContent | null;
}

export const useDeckHistory = (initial: DeckContent, onChange: (deck: DeckContent) => void): DeckHistory => {
    const [history, setHistory] = useState<History>({ past: [], present: initial, future: [] });
    const current = useRef(history);

    const set = useCallback((next: History) => {
        current.current = next;
        setHistory(next);
    }, []);

    const snapshot = useCallback(() => current.current.present, []);

    const commit = useCallback((next: DeckContent) => {
        const { past, present } = current.current;
        if(next === present) return;

        set({ past: [...past, present].slice(-LIMIT), present: next, future: [] });
        onChange(next);
    }, [onChange, set]);

    const preview = useCallback((next: DeckContent) => {
        set({ ...current.current, present: next });
    }, [set]);

    const settle = useCallback((before: DeckContent) => {
        const { past, present } = current.current;
        if(present === before) return;

        set({ past: [...past, before].slice(-LIMIT), present, future: [] });
        onChange(present);
    }, [onChange, set]);

    const adopt = useCallback((next: DeckContent) => {
        const { past, present } = current.current;
        set({ past: [...past, present].slice(-LIMIT), present: next, future: [] });
    }, [set]);

    const undo = useCallback(() => {
        const { past, present, future } = current.current;
        const previous = past.at(-1);
        if(previous === undefined) return null;

        set({ past: past.slice(0, -1), present: previous, future: [present, ...future] });
        onChange(previous);
        return previous;
    }, [onChange, set]);

    const redo = useCallback(() => {
        const { past, present, future } = current.current;
        const [next, ...rest] = future;
        if(next === undefined) return null;

        set({ past: [...past, present], present: next, future: rest });
        onChange(next);
        return next;
    }, [onChange, set]);

    return {
        deck: history.present,
        canUndo: history.past.length > 0,
        canRedo: history.future.length > 0,
        snapshot,
        commit,
        preview,
        settle,
        adopt,
        undo,
        redo
    };
};
