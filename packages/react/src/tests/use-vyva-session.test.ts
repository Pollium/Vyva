import { act, renderHook } from '@testing-library/react';
import type { Content, DocumentContent } from '@vyva/core/content';
import { DEFAULT_DOCUMENT_DESIGN } from '@vyva/core/themes';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SaveBlocked, SaveConflict, useVyvaSession, type SessionChange, type Snapshot } from '../hooks/use-vyva-session';

const documentWith = (text: string): DocumentContent => ({ kind: 'document', design: DEFAULT_DOCUMENT_DESIGN, blocks: [{ id: 'b1', html: `<p>${text}</p>` }] });

const INITIAL: Snapshot = { content: documentWith('first'), revision: 3 };

type Save = (change: SessionChange<object>, baseRevision: number) => Promise<Snapshot>;

const accepted: Save = async (change, baseRevision) => ({ content: change.content ?? INITIAL.content, revision: baseRevision + 1 });

const sessionWith = (save: Save, load: () => Promise<Snapshot> = async () => INITIAL) => {
    const saveMock = vi.fn(save);
    const loadMock = vi.fn(load);
    const hook = renderHook(() => useVyvaSession({ initial: INITIAL, save: saveMock, load: loadMock }));

    return { hook, saveMock, loadMock };
};

const waitForSaves = () => act(() => vi.runOnlyPendingTimersAsync());

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe('useVyvaSession', () => {
    it('saves once after the edits stop, on top of the revision they were based on', async () => {
        const { hook, saveMock } = sessionWith(accepted);

        act(() => {
            hook.result.current.change({ content: documentWith('second') });
            hook.result.current.change({ content: () => documentWith('third') });
        });
        expect(saveMock).not.toHaveBeenCalled();
        expect(hook.result.current.saveState).toBe('pending');

        await waitForSaves();

        expect(saveMock).toHaveBeenCalledTimes(1);
        expect(saveMock).toHaveBeenCalledWith({ content: documentWith('third') }, 3);
        expect(hook.result.current.saveState).toBe('saved');
        expect(hook.result.current.revision()).toBe(4);
        expect(hook.result.current.remoteVersion).toBe(0);
    });

    it('stops saving on a conflict and takes the newer version when asked to', async () => {
        const newer: Snapshot = { content: documentWith('theirs'), revision: 7 };
        const { hook, saveMock } = sessionWith(async () => {
            throw new SaveConflict('changed meanwhile');
        }, async () => newer);

        act(() => hook.result.current.change({ content: documentWith('mine') }));
        await waitForSaves();
        expect(hook.result.current.saveState).toBe('conflict');

        act(() => hook.result.current.change({ content: documentWith('mine again') }));
        await waitForSaves();
        expect(saveMock).toHaveBeenCalledTimes(1);

        await act(() => hook.result.current.reload());

        expect(hook.result.current.saveState).toBe('saved');
        expect(hook.result.current.content).toEqual(newer.content);
        expect(hook.result.current.remoteVersion).toBe(1);
        expect(hook.result.current.hasUnsavedChanges()).toBe(false);
    });

    it('keeps mine by saving the latest draft on top of the newest revision', async () => {
        let isFirst = true;
        const { hook, saveMock } = sessionWith(async (change, baseRevision) => {
            if(isFirst){
                isFirst = false;
                throw new SaveConflict('changed meanwhile');
            }

            return accepted(change, baseRevision);
        }, async () => ({ content: documentWith('theirs'), revision: 9 }));

        act(() => hook.result.current.change({ content: documentWith('mine') }));
        await waitForSaves();
        act(() => hook.result.current.change({ content: documentWith('mine, edited') }));

        await act(() => hook.result.current.keepMine());

        expect(saveMock).toHaveBeenLastCalledWith({ content: documentWith('mine, edited') }, 9);
        expect(hook.result.current.saveState).toBe('saved');
        expect(hook.result.current.revision()).toBe(10);
    });

    it('waits after a blocked save until it is flushed', async () => {
        let isBlocked = true;
        const { hook, saveMock } = sessionWith(async (change, baseRevision) => {
            if(isBlocked) throw new SaveBlocked('someone else holds the turn');

            return accepted(change, baseRevision);
        });

        act(() => hook.result.current.change({ content: documentWith('mine') }));
        await waitForSaves();
        expect(hook.result.current.saveState).toBe('failed');
        expect(hook.result.current.failure).toEqual({ message: 'someone else holds the turn', canRetry: false });

        act(() => hook.result.current.change({ content: documentWith('mine, edited') }));
        await waitForSaves();
        expect(saveMock).toHaveBeenCalledTimes(1);

        isBlocked = false;
        await act(() => hook.result.current.flush());

        expect(saveMock).toHaveBeenLastCalledWith({ content: documentWith('mine, edited') }, 3);
        expect(hook.result.current.saveState).toBe('saved');
    });

    it('saves the edits made while a save is in flight right after it', async () => {
        const pending: Array<() => void> = [];
        const { hook, saveMock } = sessionWith((change, baseRevision) => new Promise((resolve) => {
            pending.push(() => resolve({ content: change.content ?? INITIAL.content, revision: baseRevision + 1 }));
        }));

        act(() => hook.result.current.change({ content: documentWith('one') }));
        await waitForSaves();
        act(() => hook.result.current.change({ content: documentWith('two') }));
        await act(async () => pending.shift()?.());

        expect(hook.result.current.saveState).toBe('pending');

        await waitForSaves();
        await act(async () => pending.shift()?.());

        expect(saveMock).toHaveBeenCalledTimes(2);
        expect(saveMock).toHaveBeenLastCalledWith({ content: documentWith('two') }, 4);
        expect(hook.result.current.saveState).toBe('saved');
    });

    it('adopts a replaced version as a remote change', () => {
        const { hook } = sessionWith(accepted);
        const restored: Content = documentWith('restored');

        act(() => hook.result.current.replace({ content: restored, revision: 12 }));

        expect(hook.result.current.content).toEqual(restored);
        expect(hook.result.current.remoteVersion).toBe(1);
        expect(hook.result.current.revision()).toBe(12);
    });
});
