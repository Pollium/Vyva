import type { Content } from '@vyva/core/content';
import { useVyvaSession, type Snapshot } from '@vyva/react/use-vyva-session';
import { useRef, useState } from 'react';

const SAVE_DELAY_MS = 400;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const useMemorySession = (content: Content) => {
    const [initial] = useState<Snapshot>({ content, revision: 1 });
    const stored = useRef(initial);

    return useVyvaSession({
        initial,
        save: async (change, baseRevision) => {
            await wait(SAVE_DELAY_MS);
            stored.current = { content: change.content ?? stored.current.content, revision: baseRevision + 1 };
            return stored.current;
        },
        load: async () => stored.current
    });
};
