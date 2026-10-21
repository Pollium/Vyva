import type { Editor } from '@tiptap/react';

export const textAttribute = (editor: Editor, type: string, name: string): string | null => {
    const value: unknown = editor.getAttributes(type)[name];

    return typeof value === 'string' ? value : null;
};
