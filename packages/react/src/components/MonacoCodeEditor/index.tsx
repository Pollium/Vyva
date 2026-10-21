import type { CodeEditorProps } from '../../contracts/code-editor';
import { useMessages } from '../../messages/context';
import type { CodeLanguage } from '@vyva/core/content';
import { CODE_FONT } from '@vyva/core/code';
import { fontStack } from '@vyva/core/themes';
import Editor from '@monaco-editor/react';

const MONACO_LANGUAGES: Record<CodeLanguage, string> = {
    sql: 'sql',
    python: 'python',
    javascript: 'javascript',
    typescript: 'typescript',
    java: 'java',
    c: 'cpp',
    cpp: 'cpp',
    csharp: 'csharp',
    bash: 'shell',
    html: 'html',
    css: 'css',
    json: 'javascript',
    plaintext: 'plaintext'
};

const OPTIONS = {
    fontFamily: fontStack(CODE_FONT),
    fontSize: 14,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    tabSize: 4,
    automaticLayout: true,
    padding: { top: 12 }
};

const MonacoCodeEditor = ({ value, language, colorScheme, readOnly, label, onChange }: CodeEditorProps) => {
    const t = useMessages();

    return (
        <Editor
            value={value}
            language={MONACO_LANGUAGES[language]}
            theme={colorScheme === 'light' ? 'vs' : 'vs-dark'}
            onChange={(next) => onChange(next ?? '')}
            loading={<span className='vy:text-[0.8125rem] vy:text-muted'>{t.deck.loadingEditor}</span>}
            options={{ ...OPTIONS, readOnly, ariaLabel: label }}
        />
    );
};

export default MonacoCodeEditor;
