import { describe, expect, it } from 'vitest';
import type { CodeElement, TextElement } from '../content';
import { codeFenceOf, codeHtml, codeLines, CODE_PALETTES, fitCodeSize, textToCode } from '../code';
import { layoutSlide } from '../slide-layouts';
import { DECK_THEME } from '../themes';

const SQL = 'CREATE TABLE Estudiante (\n    nota DECIMAL(4,2) -- final\n);';

describe('code blocks', () => {
    it('reads a fenced block and the text around it, whatever the alias of its language', () => {
        expect(codeFenceOf(`Antes\n\n\`\`\`tsql\n${SQL}\n\`\`\`\n\nDespués`)).toEqual({ before: 'Antes', language: 'sql', code: SQL, after: 'Después' });
        expect(codeFenceOf('```\nplano\n```')?.language).toBe('plaintext');
        expect(codeFenceOf('sin código')).toBeNull();
    });

    it('colors each token and keeps the lines', () => {
        const lines = codeLines(SQL, 'sql', 'dark');
        const { scopes } = CODE_PALETTES.dark;

        expect(lines).toHaveLength(3);
        expect(lines[0][0]).toEqual({ text: 'CREATE TABLE', color: scopes.keyword });
        expect(lines[1].find((token) => token.text.includes('final'))?.color).toBe(scopes.comment);
        expect(lines.map((line) => line.map((token) => token.text).join('')).join('\n')).toBe(SQL);
    });

    it('escapes the code it draws', () => {
        const element = { type: 'code', code: '<script>alert(1)</script>', language: 'html', fontSize: 20, colorScheme: 'light' } as CodeElement;

        expect(codeHtml(element)).not.toContain('<script>');
        expect(codeHtml(element)).toContain('&lt;');
    });

    it('sizes the font so the longest line and every line fit the box', () => {
        const size = fitCodeSize('x'.repeat(80), { w: 800, h: 600 }, 40);

        expect(size * 0.6 * 80).toBeLessThanOrEqual(800);
        expect(fitCodeSize('a', { w: 800, h: 600 }, 28)).toBe(28);
    });

    it('turns a fence in a layout text into a code block below its prose', () => {
        const slide = layoutSlide({ layout: 'bullets', title: 'DDL', text: `Crea la tabla:\n\n\`\`\`sql\n${SQL}\n\`\`\`` }, '16:9', DECK_THEME);
        const code = slide.elements.find((element): element is CodeElement => element.type === 'code');
        const prose = slide.elements.filter((element): element is TextElement => element.type === 'text').find((element) => element.html.includes('Crea la tabla'));

        expect(code).toMatchObject({ code: SQL, language: 'sql' });
        expect(prose).toBeDefined();
        expect(prose === undefined || code === undefined ? false : prose.y + prose.h <= code.y).toBe(true);
        expect(slide.elements.some((element) => element.type === 'text' && element.html.includes('```'))).toBe(false);
    });
});

describe('textToCode', () => {
    it('turns a text box holding code into a code block in its place, keeping its lines and guessing the language', () => {
        const text: TextElement = {
            id: 'ddl', type: 'text', x: 120, y: 300, w: 1200, h: 90, rotation: 0, opacity: 1, isLocked: false, fill: null,
            html: '<p>CREATE TABLE Estudiante (</p><p>    id INT PRIMARY KEY,</p><p>    nombre VARCHAR(80) NOT NULL</p><p>);</p>',
            style: { fontSize: 32, color: '#1d2433', align: 'left', verticalAlign: 'top', lineHeight: 1.3, isBold: false }
        };

        const code = textToCode(text);
        expect(code).toMatchObject({ id: 'ddl', type: 'code', x: 120, y: 300, w: 1200, language: 'sql' });
        expect(code.code).toBe('CREATE TABLE Estudiante (\n    id INT PRIMARY KEY,\n    nombre VARCHAR(80) NOT NULL\n);');
        expect(code.h).toBeGreaterThan(text.h);
    });
});
