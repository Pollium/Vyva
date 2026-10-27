import { ConvertError } from './errors';
import type { OfficeEngine } from './import/office';
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

export const libreOffice = ({ command = 'soffice', timeoutMs = DEFAULT_TIMEOUT_MS }: LibreOfficeOptions = {}): OfficeEngine => async ({ file, from, to }) => {
    const folder = await mkdtemp(join(tmpdir(), 'vyva-office-'));
    const source = join(folder, `source.${from}`);
    try{
        await writeFile(source, file);
        await run(command, [
            `-env:UserInstallation=${pathToFileURL(join(folder, 'profile')).href}`,
            '--headless',
            ...(from === 'pdf' ? ['--infilter=impress_pdf_import'] : []),
            '--convert-to', to,
            '--outdir', folder,
            source
        ], { timeout: timeoutMs }).catch((error: unknown) => {
            throw new ConvertError('office-failed', `LibreOffice at ${command} could not turn the ${from} file into ${to}`, { cause: error });
        });

        return new Uint8Array(await readFile(join(folder, `source.${to}`)).catch((error: unknown) => {
            throw new ConvertError('office-failed', `LibreOffice finished without writing the ${to} file`, { cause: error });
        }));
    }finally{
        await rm(folder, { recursive: true, force: true });
    }
};
