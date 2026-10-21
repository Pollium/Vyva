import type { PdfJob } from '../export/pdf';
import { gotenberg } from '../gotenberg';
import { FAKE_PDF, PNG_BYTES } from './fixtures';
import { createServer, type Server } from 'node:http';
import { buffer } from 'node:stream/consumers';
import { afterEach, describe, expect, it } from 'vitest';

interface Conversion{
    path: string;
    fields: Record<string, string>;
    files: Record<string, string>;
}

interface Upstream{
    url: string;
    conversions: Conversion[];
}

const JOB: PdfJob = {
    html: '<p>Hello</p>',
    files: [{ name: 'logo.png', data: PNG_BYTES, contentType: 'image/png' }],
    footerHtml: '<span class="pageNumber"></span>',
    page: { width: 8.27, height: 11.69, margins: { top: 20 / 25.4, right: 0.5, bottom: 1, left: 0.5 } }
};

const servers: Server[] = [];

const listen = (status: number): Promise<Upstream> => new Promise((resolve) => {
    const conversions: Conversion[] = [];
    const server = createServer(async (request, response) => {
        const body = new Uint8Array(await buffer(request));
        const form = await new Response(body, { headers: { 'content-type': request.headers['content-type'] ?? '' } }).formData();
        const fields: Record<string, string> = {};
        const files: Record<string, string> = {};
        for(const [key, value] of form){
            if(typeof value === 'string') fields[key] = value;
            else files[value.name] = await value.text();
        }
        conversions.push({ path: request.url ?? '', fields, files });
        response.writeHead(status).end(status === 200 ? FAKE_PDF : 'Chromium crashed');
    });
    servers.push(server);
    server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        resolve({ url: `http://127.0.0.1:${typeof address === 'object' && address !== null ? address.port : 0}`, conversions });
    });
});

describe('gotenberg', () => {
    afterEach(() => {
        for(const server of servers.splice(0)) server.close();
    });

    it('posts the page, its files and its footer to Gotenberg and hands back the pdf', async () => {
        const upstream = await listen(200);
        const data = await gotenberg({ url: `${upstream.url}/` })(JOB);

        expect(Buffer.from(data).equals(FAKE_PDF)).toBe(true);
        const [conversion] = upstream.conversions;
        expect(conversion.path).toBe('/forms/chromium/convert/html');
        expect(conversion.fields).toEqual({
            paperWidth: '8.27',
            paperHeight: '11.69',
            marginTop: '0.787',
            marginBottom: '1',
            marginLeft: '0.5',
            marginRight: '0.5',
            printBackground: 'true',
            preferCssPageSize: 'false',
            waitDelay: '0.5s'
        });
        expect(Object.keys(conversion.files)).toEqual(['index.html', 'logo.png', 'footer.html']);
        expect(conversion.files['index.html']).toBe('<p>Hello</p>');
    });

    it('fails as pdf-failed when Gotenberg answers with an error', async () => {
        const upstream = await listen(500);

        await expect(gotenberg({ url: upstream.url })(JOB)).rejects.toMatchObject({ code: 'pdf-failed', message: expect.stringContaining('500: Chromium crashed') });
    });

    it('fails as pdf-failed when Gotenberg cannot be reached', async () => {
        await expect(gotenberg({ url: 'http://127.0.0.1:1' })(JOB)).rejects.toMatchObject({ code: 'pdf-failed' });
    });
});
