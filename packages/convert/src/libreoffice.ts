import { ConvertError } from './errors';
import type { PdfSlides } from './import/pdf-slides';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

export interface LibreOfficeOptions{
    command?: string;
    timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 120_000;
const run = promisify(execFile);

export const libreOffice = ({ command = 'soffice', timeoutMs = DEFAULT_TIMEOUT_MS }: LibreOfficeOptions = {}): PdfSlides => async (pdf) => {
    const folder = await mkdtemp(join(tmpdir(), 'vyva-slides-'));
    const source = join(folder, 'source.pdf');
    try{
        await writeFile(source, pdf);
        await run(command, [
            `-env:UserInstallation=${pathToFileURL(join(folder, 'profile')).href}`,
            '--headless',
            '--infilter=impress_pdf_import',
            '--convert-to', 'pptx',
            '--outdir', folder,
            source
        ], { timeout: timeoutMs }).catch((error: unknown) => {
            throw new ConvertError('slides-failed', `LibreOffice at ${command} could not turn the PDF into slides`, { cause: error });
        });

        return new Uint8Array(await readFile(join(folder, 'source.pptx')).catch((error: unknown) => {
            throw new ConvertError('slides-failed', 'LibreOffice finished without writing the slides', { cause: error });
        }));
    }finally{
        await rm(folder, { recursive: true, force: true });
    }
};
