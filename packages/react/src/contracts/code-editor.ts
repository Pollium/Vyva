import type { CodeElement, CodeLanguage } from '@pollium/vyva-core/content';
import type { ComponentType } from 'react';

export interface CodeEditorProps{
    value: string;
    language: CodeLanguage;
    colorScheme: CodeElement['colorScheme'];
    readOnly: boolean;
    label: string;
    onChange: (value: string) => void;
}

export type CodeEditor = ComponentType<CodeEditorProps>;
