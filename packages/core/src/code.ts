import type { CodeElement, CodeLanguage, TextElement } from './content';
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import csharp from 'highlight.js/lib/languages/csharp';
import css from 'highlight.js/lib/languages/css';
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import python from 'highlight.js/lib/languages/python';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import { escapeHtml } from './escape';

export const CODE_FONT = 'JetBrains Mono';
export const CODE_LINE_HEIGHT = 1.45;

const GRAMMARS = { sql, python, javascript, typescript, java, c, cpp, csharp, bash, html: xml, css, json } as const;
for(const [name, grammar] of Object.entries(GRAMMARS)) hljs.registerLanguage(name, grammar);

const CHAR_WIDTH_EMS = 0.6;
const PADDING_LINES = 1.4;
const PADDING_COLUMNS = 1.8;
const TAB = '    ';
const MIN_FONT_SIZE = 10;
const FENCE = /```([^\n`]*)\n([\s\S]*?)\n?```/;
const TOKEN = /<span class="([^"]+)">|<\/span>|([^<]+)/g;
const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#x27;': '\'', '&#39;': '\'' };

const ALIASES: Record<string, CodeLanguage> = {
    sql: 'sql', tsql: 'sql', 't-sql': 'sql', mysql: 'sql', postgres: 'sql', postgresql: 'sql', plsql: 'sql', sqlite: 'sql',
    python: 'python', py: 'python',
    javascript: 'javascript', js: 'javascript', jsx: 'javascript', node: 'javascript',
    typescript: 'typescript', ts: 'typescript', tsx: 'typescript',
    java: 'java', c: 'c', h: 'c', cpp: 'cpp', 'c++': 'cpp', hpp: 'cpp', csharp: 'csharp', cs: 'csharp', 'c#': 'csharp',
    bash: 'bash', sh: 'bash', shell: 'bash', zsh: 'bash', console: 'bash', terminal: 'bash',
    html: 'html', xml: 'html', css: 'css', json: 'json'
};

export interface CodePalette{
    background: string;
    foreground: string;
    scopes: Record<string, string>;
}

export const CODE_PALETTES: Record<CodeElement['colorScheme'], CodePalette> = {
    dark: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        scopes: {
            keyword: '#569cd6', literal: '#569cd6', tag: '#569cd6', 'selector-tag': '#d7ba7d', type: '#4ec9b0', built_in: '#4ec9b0',
            string: '#ce9178', regexp: '#d16969', number: '#b5cea8', symbol: '#b5cea8', comment: '#6a9955', quote: '#6a9955',
            title: '#dcdcaa', variable: '#9cdcfe', attr: '#9cdcfe', attribute: '#9cdcfe', property: '#9cdcfe', params: '#9cdcfe',
            meta: '#c586c0', name: '#569cd6', 'selector-class': '#d7ba7d', 'selector-id': '#d7ba7d'
        }
    },
    light: {
        background: '#f6f8fa',
        foreground: '#1f2328',
        scopes: {
            keyword: '#0000ff', literal: '#0000ff', tag: '#800000', 'selector-tag': '#800000', type: '#267f99', built_in: '#267f99',
            string: '#a31515', regexp: '#811f3f', number: '#098658', symbol: '#098658', comment: '#008000', quote: '#008000',
            title: '#795e26', variable: '#001080', attr: '#e50000', attribute: '#e50000', property: '#001080', params: '#001080',
            meta: '#af00db', name: '#800000', 'selector-class': '#800000', 'selector-id': '#800000'
        }
    }
};

export interface CodeToken{
    text: string;
    color: string;
}

export interface CodeFence{
    before: string;
    language: CodeLanguage;
    code: string;
    after: string;
}

export const codeLanguageOf = (tag: string): CodeLanguage => ALIASES[tag.trim().toLowerCase()] ?? 'plaintext';

export const codeFenceOf = (markdown: string): CodeFence | null => {
    const match = FENCE.exec(markdown);
    if(match === null) return null;

    return {
        before: markdown.slice(0, match.index).trim(),
        language: codeLanguageOf(match[1].split(/\s/)[0] ?? ''),
        code: match[2].replace(/\s+$/, ''),
        after: markdown.slice(match.index + match[0].length).trim()
    };
};

const decoded = (text: string): string => text.replace(/&(?:amp|lt|gt|quot|#x27|#39);/g, (entity) => ENTITIES[entity] ?? entity);

const highlighted = (code: string, language: CodeLanguage): string =>
    language === 'plaintext' ? escapeHtml(code) : hljs.highlight(code, { language, ignoreIllegals: true }).value;

export const codeLines = (code: string, language: CodeLanguage, colorScheme: CodeElement['colorScheme']): CodeToken[][] => {
    const palette = CODE_PALETTES[colorScheme];
    const lines: CodeToken[][] = [[]];
    const colors: string[] = [palette.foreground];
    for(const [, scope, text] of highlighted(code.replace(/\t/g, TAB), language).matchAll(TOKEN)){
        if(scope !== undefined){
            const base = scope.split(' ')[0].replace(/^hljs-/, '');
            colors.push(palette.scopes[base] ?? colors[colors.length - 1]);
            continue;
        }
        if(text === undefined){
            if(colors.length > 1) colors.pop();
            continue;
        }

        decoded(text).split('\n').forEach((part, index) => {
            if(index > 0) lines.push([]);
            if(part !== '') lines[lines.length - 1].push({ text: part, color: colors[colors.length - 1] });
        });
    }

    return lines;
};

export const codeHtml = (element: CodeElement): string => {
    const palette = CODE_PALETTES[element.colorScheme] ?? CODE_PALETTES.dark;
    const body = codeLines(element.code, element.language, element.colorScheme)
        .map((line) => line.map((token) => `<span style="color:${token.color}">${escapeHtml(token.text)}</span>`).join(''))
        .join('\n');

    return `<pre class="vy-code" style="font-size:${element.fontSize}px;background:${palette.background};color:${palette.foreground}"><code>${body}</code></pre>`;
};

export const codeHeight = (code: string, fontSize: number): number =>
    Math.ceil((code.split('\n').length * CODE_LINE_HEIGHT + PADDING_LINES) * fontSize);

export const fitCodeSize = (code: string, box: { w: number; h: number }, largest: number): number => {
    const lines = code.replace(/\t/g, TAB).split('\n');
    const columns = Math.max(1, ...lines.map((line) => line.length));
    const byHeight = box.h / (lines.length * CODE_LINE_HEIGHT + PADDING_LINES);
    const byWidth = box.w / (columns * CHAR_WIDTH_EMS + PADDING_COLUMNS);

    return Math.max(MIN_FONT_SIZE, Math.floor(Math.min(largest, byHeight, byWidth)));
};

const MIN_GUESS_RELEVANCE = 2;

export const guessCodeLanguage = (code: string): CodeLanguage => {
    const guess = hljs.highlightAuto(code, Object.keys(GRAMMARS));

    return guess.relevance >= MIN_GUESS_RELEVANCE && guess.language !== undefined ? codeLanguageOf(guess.language) : 'plaintext';
};

const textOf = (html: string): string => decoded(html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ''))
    .replace(/\u00a0/g, ' ')
    .replace(/\n+$/, '');

export const textToCode = (element: TextElement): CodeElement => {
    const { id, x, y, w, rotation, opacity, isLocked } = element;
    const code = textOf(element.html);
    const fontSize = fitCodeSize(code, { w, h: Number.POSITIVE_INFINITY }, element.style.fontSize);

    return { id, x, y, w, h: codeHeight(code, fontSize), rotation, opacity, isLocked, type: 'code', code, language: guessCodeLanguage(code), colorScheme: 'dark', fontSize };
};
