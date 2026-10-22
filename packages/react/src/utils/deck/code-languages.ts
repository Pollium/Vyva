import type { SelectOption } from '../../components/ui/SelectInput';
import type { Messages } from '../../messages/en';
import { CODE_LANGUAGES, type CodeLanguage } from '@pollium/vyva-core/content';

const NAMES: Record<Exclude<CodeLanguage, 'plaintext'>, string> = {
    sql: 'SQL',
    python: 'Python',
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    java: 'Java',
    c: 'C',
    cpp: 'C++',
    csharp: 'C#',
    bash: 'Terminal (bash)',
    html: 'HTML',
    css: 'CSS',
    json: 'JSON'
};

export const codeLanguageOptions = (t: Messages): SelectOption<CodeLanguage>[] =>
    CODE_LANGUAGES.map((language) => ({ value: language, label: language === 'plaintext' ? t.editor.plainText : NAMES[language] }));
