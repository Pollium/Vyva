import { FONT_FAMILIES } from '@pollium/vyva-core/content';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const OUTPUT = new URL('../src/font-widths.ts', import.meta.url);
const EM = 1000;
const MEASURED_CHARS = [
    ...Array.from({ length: 0x7f - 0x20 }, (_, index) => String.fromCharCode(0x20 + index)),
    ...Array.from({ length: 0x100 - 0xa1 }, (_, index) => String.fromCharCode(0xa1 + index)),
    ...'–—‘’‚“”„•…€→←↑↓≤≥≠×÷✓'
].join('');

const fileOf = (font: string, subset: string): string => {
    const slug = font.toLowerCase().replace(/ /g, '-');

    return join(dirname(require.resolve(`@fontsource-variable/${slug}/package.json`)), 'files', `${slug}-${subset}-wght-normal.woff2`);
};

const faces = FONT_FAMILIES.flatMap((font) => ['latin', 'latin-ext'].map((subset) =>
    `@font-face{font-family:'${font}';font-weight:100 900;src:url('file://${fileOf(font, subset)}') format('woff2')}`)).join('\n');

const page = `<!doctype html><html><head><meta charset="utf-8"><style>${faces}</style></head><body><pre id="out"></pre><script>
const fonts = ${JSON.stringify(FONT_FAMILIES)};
const chars = ${JSON.stringify(MEASURED_CHARS)};
(async () => {
    const context = document.createElement('canvas').getContext('2d');
    const widths = {};
    for(const font of fonts){
        widths[font] = {};
        for(const [weight, name] of [[400, 'regular'], [700, 'bold']]){
            await document.fonts.load(weight + ' ${EM}px "' + font + '"', chars);
            context.font = weight + ' ${EM}px "' + font + '"';
            widths[font][name] = [...chars].map((char) => Math.round(context.measureText(char).width));
        }
    }
    document.getElementById('out').textContent = JSON.stringify(widths);
})();
</script></body></html>`;

const directory = mkdtempSync(join(tmpdir(), 'font-widths-'));
try{
    const html = join(directory, 'measure.html');
    writeFileSync(html, page);
    const dom = execFileSync(process.env.CHROME_PATH ?? 'google-chrome', [
        '--headless=new', '--disable-gpu', '--allow-file-access-from-files', '--virtual-time-budget=10000', '--dump-dom', `file://${html}`
    ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const json = dom.match(/<pre id="out">([^<]+)<\/pre>/)?.[1];
    if(json === undefined) throw new Error('Chrome did not measure the fonts.');

    const widths = JSON.parse(json.replace(/&quot;/g, '"')) as Record<string, { regular: number[]; bold: number[] }>;
    const body = Object.entries(widths).map(([font, { regular, bold }]) =>
        `    '${font}': {\n        regular: [${regular.join(',')}],\n        bold: [${bold.join(',')}]\n    }`).join(',\n');
    writeFileSync(OUTPUT, `import type { FontFamily } from '@pollium/vyva-core/content';\n\nexport const MEASURED_CHARS = ${JSON.stringify(MEASURED_CHARS)};\n\nexport const FONT_WIDTHS: Record<FontFamily, { regular: number[]; bold: number[] }> = {\n${body}\n};\n`);
    console.log(`wrote ${Object.keys(widths).length} fonts`);
}finally{
    rmSync(directory, { recursive: true, force: true });
}
