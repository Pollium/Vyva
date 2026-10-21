import { ConvertError } from './errors';
import type { PdfEngine, PdfJob } from './export/pdf';

export interface GotenbergOptions{
    url: string;
    timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 60_000;
const CONVERT_PATH = '/forms/chromium/convert/html';

const inches = (value: number): string => String(Number(value.toFixed(3)));

const formOf = ({ html, files, footerHtml, page }: PdfJob): FormData => {
    const form = new FormData();
    form.append('files', new Blob([html], { type: 'text/html' }), 'index.html');
    for(const file of files) form.append('files', new Blob([new Uint8Array(file.data)], { type: file.contentType }), file.name);
    if(footerHtml !== null) form.append('files', new Blob([footerHtml], { type: 'text/html' }), 'footer.html');

    const { margins } = page;
    const sizes = { paperWidth: page.width, paperHeight: page.height, marginTop: margins.top, marginBottom: margins.bottom, marginLeft: margins.left, marginRight: margins.right };
    for(const [field, value] of Object.entries(sizes)) form.append(field, inches(value));
    form.append('printBackground', 'true');
    form.append('preferCssPageSize', 'false');
    form.append('waitDelay', '0.5s');

    return form;
};

export const gotenberg = ({ url, timeoutMs = DEFAULT_TIMEOUT_MS }: GotenbergOptions): PdfEngine => async (job) => {
    const endpoint = `${url.replace(/\/+$/, '')}${CONVERT_PATH}`;
    const response = await fetch(endpoint, { method: 'POST', body: formOf(job), signal: AbortSignal.timeout(timeoutMs) }).catch((error: unknown) => {
        throw new ConvertError('pdf-failed', `Gotenberg at ${url} could not be reached`, { cause: error });
    });
    if(!response.ok) throw new ConvertError('pdf-failed', `Gotenberg answered ${response.status}: ${await response.text().catch(() => '')}`);

    return new Uint8Array(await response.arrayBuffer());
};
