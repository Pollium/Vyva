import type { Content } from '@pollium/vyva-core/content';
import { useCallback, useEffect, useRef, useState } from 'react';

const SAVE_DELAY_MS = 1200;

export type SaveState = 'saved' | 'pending' | 'saving' | 'conflict' | 'failed';

export class SaveConflict extends Error{}

export class SaveBlocked extends Error{}

export interface SaveFailure{
    message: string;
    canRetry: boolean;
}

export interface Snapshot{
    content: Content;
    revision: number;
}

export type Draft<Fields> = Partial<Fields> & { content?: Content | (() => Content) };

export type SessionChange<Fields> = Partial<Fields> & { content?: Content };

export interface SessionOptions<Fields>{
    initial: Snapshot;
    save: (change: SessionChange<Fields>, baseRevision: number) => Promise<Snapshot>;
    load: () => Promise<Snapshot>;
}

export interface VyvaSession<Fields>{
    content: Content;
    saveState: SaveState;
    failure: SaveFailure | null;
    remoteVersion: number;
    change: (draft: Draft<Fields>) => void;
    flush: () => Promise<boolean>;
    revision: () => number;
    hasUnsavedChanges: () => boolean;
    reload: () => Promise<void>;
    keepMine: () => Promise<boolean>;
    replace: (snapshot: Snapshot) => void;
}

const resolved = <Fields>(draft: Draft<Fields>): SessionChange<Fields> =>
    ({ ...draft, content: typeof draft.content === 'function' ? draft.content() : draft.content });

const failureOf = (cause: unknown): SaveFailure => ({
    message: cause instanceof Error ? cause.message : String(cause),
    canRetry: !(cause instanceof SaveBlocked)
});

export const useVyvaSession = <Fields extends object = Record<never, never>>({ initial, save: persist, load }: SessionOptions<Fields>): VyvaSession<Fields> => {
    const [snapshot, setSnapshot] = useState(initial);
    const [saveState, setSaveState] = useState<SaveState>('saved');
    const [failure, setFailure] = useState<SaveFailure | null>(null);
    const [remoteVersion, setRemoteVersion] = useState(0);
    const latest = useRef(initial);
    const draft = useRef<Draft<Fields> | null>(null);
    const timer = useRef<number | null>(null);
    const saving = useRef<Promise<boolean> | null>(null);
    const blocked = useRef(false);
    const persistLatest = useRef(persist);
    const loadLatest = useRef(load);

    useEffect(() => {
        persistLatest.current = persist;
        loadLatest.current = load;
    });

    const adopt = useCallback((next: Snapshot, isRemote: boolean) => {
        latest.current = next;
        setSnapshot(next);
        if(isRemote) setRemoteVersion((version) => version + 1);
    }, []);

    const settle = useCallback(() => {
        draft.current = null;
        blocked.current = false;
        setFailure(null);
        setSaveState('saved');
    }, []);

    const fail = useCallback((pending: Draft<Fields>, cause: unknown) => {
        draft.current = { ...pending, ...draft.current };
        if(cause instanceof SaveConflict){
            blocked.current = true;
            setFailure(null);
            setSaveState('conflict');
            return;
        }

        const reason = failureOf(cause);
        blocked.current = !reason.canRetry;
        setFailure(reason);
        setSaveState('failed');
    }, []);

    const save = useCallback(async (): Promise<boolean> => {
        if(timer.current !== null){
            window.clearTimeout(timer.current);
            timer.current = null;
        }
        if(saving.current !== null) await saving.current;

        const pending = draft.current;
        if(pending === null) return true;

        draft.current = null;
        setSaveState('saving');
        const work = (async () => {
            try{
                adopt(await persistLatest.current(resolved(pending), latest.current.revision), false);
                blocked.current = false;
                setFailure(null);
                setSaveState(draft.current === null ? 'saved' : 'pending');
                return true;
            }catch(cause: unknown){
                fail(pending, cause);
                return false;
            }
        })();
        saving.current = work;
        const isSaved = await work;
        saving.current = null;

        return isSaved;
    }, [adopt, fail]);

    const change = useCallback((next: Draft<Fields>) => {
        draft.current = { ...draft.current, ...next };
        if(blocked.current) return;

        setSaveState('pending');
        if(timer.current !== null) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => void save(), SAVE_DELAY_MS);
    }, [save]);

    const flush = useCallback(() => {
        blocked.current = false;
        return save();
    }, [save]);

    const reload = useCallback(async () => {
        const fresh = await loadLatest.current();
        settle();
        adopt(fresh, true);
    }, [adopt, settle]);

    const keepMine = useCallback(async (): Promise<boolean> => {
        const fresh = await loadLatest.current();
        latest.current = { ...latest.current, revision: fresh.revision };
        blocked.current = false;
        if(draft.current === null){
            settle();
            adopt(fresh, true);
            return true;
        }

        return save();
    }, [adopt, save, settle]);

    const replace = useCallback((next: Snapshot) => {
        settle();
        adopt(next, true);
    }, [adopt, settle]);

    useEffect(() => {
        const warn = (event: BeforeUnloadEvent) => {
            if(draft.current === null && saving.current === null) return;

            if(!blocked.current) void save();
            event.preventDefault();
        };
        window.addEventListener('beforeunload', warn);

        return () => {
            window.removeEventListener('beforeunload', warn);
            if(draft.current !== null && !blocked.current) void save();
        };
    }, [save]);

    const revision = useCallback(() => latest.current.revision, []);
    const hasUnsavedChanges = useCallback(() => draft.current !== null || saving.current !== null, []);

    return {
        content: snapshot.content,
        saveState,
        failure,
        remoteVersion,
        change,
        flush,
        revision,
        hasUnsavedChanges,
        reload,
        keepMine,
        replace
    };
};
