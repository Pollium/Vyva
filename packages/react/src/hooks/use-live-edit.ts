import type { DeckContent } from '@vyva/core/content';
import type { DeckHistory } from './use-deck-history';
import { useCallback, useEffect, useRef } from 'react';

const IDLE_MS = 900;
const TYPING_MS = 250;

type DeckChange = (deck: DeckContent) => DeckContent;

export interface LiveEdit{
    change: (next: DeckChange) => void;
    type: (next: DeckChange) => void;
    finish: () => void;
}

export const useLiveEdit = (history: DeckHistory): LiveEdit => {
    const latest = useRef(history);
    const before = useRef<DeckContent | null>(null);
    const timer = useRef<number | null>(null);
    const typed = useRef<DeckChange | null>(null);
    const typingTimer = useRef<number | null>(null);

    useEffect(() => {
        latest.current = history;
    });

    const apply = useCallback((next: DeckChange) => {
        const current = latest.current.snapshot();
        if(before.current === null) before.current = current;

        latest.current.preview(next(current));
    }, []);

    const flushTyped = useCallback(() => {
        if(typingTimer.current !== null){
            window.clearTimeout(typingTimer.current);
            typingTimer.current = null;
        }
        const pending = typed.current;
        typed.current = null;
        if(pending !== null) apply(pending);
    }, [apply]);

    const settle = useCallback(() => {
        flushTyped();
        if(timer.current !== null){
            window.clearTimeout(timer.current);
            timer.current = null;
        }
        if(before.current === null) return;

        latest.current.settle(before.current);
        before.current = latest.current.snapshot();
    }, [flushTyped]);

    const restartIdle = useCallback(() => {
        if(timer.current !== null) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(settle, IDLE_MS);
    }, [settle]);

    const change = useCallback((next: DeckChange) => {
        flushTyped();
        apply(next);
        restartIdle();
    }, [apply, flushTyped, restartIdle]);

    const type = useCallback((next: DeckChange) => {
        const pending = typed.current;
        typed.current = pending === null ? next : (deck) => next(pending(deck));
        if(typingTimer.current === null) typingTimer.current = window.setTimeout(flushTyped, TYPING_MS);
        restartIdle();
    }, [flushTyped, restartIdle]);

    const finish = useCallback(() => {
        settle();
        before.current = null;
    }, [settle]);

    useEffect(() => {
        window.addEventListener('pagehide', finish);
        window.addEventListener('beforeunload', finish);

        return () => {
            window.removeEventListener('pagehide', finish);
            window.removeEventListener('beforeunload', finish);
            finish();
        };
    }, [finish]);

    return { change, type, finish };
};
