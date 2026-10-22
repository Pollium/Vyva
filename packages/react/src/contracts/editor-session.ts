import type { Content } from '@pollium/vyva-core/content';

export interface ContentDraft{
    content: Content | (() => Content);
}

export interface EditorSession{
    content: Content;
    remoteVersion: number;
    change: (draft: ContentDraft) => void;
}
