import type { ExportBundle, ExportedFile } from './bundle';
import { fontFaces, fontFilesOf } from './fonts';
import type { Content } from '@vyva/core/content';
import { DECK_SIZES } from '@vyva/core/content';
import { escapeHtml } from '@vyva/core/escape';
import { CONTENT_CSS, renderDocument, renderSlide, type FileUrl } from '@vyva/core/render';

const SCREEN_PX_PER_INCH = 96;
const SLIDE_PX_PER_INCH = 144;
const SCREEN_CSS = 'body{margin:0;background:#f3f4f6;display:flex;justify-content:center;padding:24px 0}.vy-doc{box-shadow:0 1px 4px rgba(0,0,0,.12)}';

const dataUrl = (contentType: string, data: Buffer): string => `data:${contentType};base64,${data.toString('base64')}`;

export const bodyOf = (content: Content, fileUrl: FileUrl): string => {
    if(content.kind === 'document') return renderDocument(content, fileUrl);

    const { width, height } = DECK_SIZES[content.format];
    const zoom = SCREEN_PX_PER_INCH / SLIDE_PX_PER_INCH;
    return content.slides
        .map((slide) => `<div class="vy-print-slide" style="width:${width * zoom}px;height:${height * zoom}px"><div style="width:${width}px;height:${height}px;transform:scale(${zoom});transform-origin:0 0">${renderSlide(slide, content, fileUrl)}</div></div>`)
        .join('');
};

export const pageHtml = ({ title, language }: ExportBundle, css: string, body: string): string =>
    `<!doctype html><html lang="${escapeHtml(language)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>${css}</style></head><body>${body}</body></html>`;

export const buildHtml = async (content: Content, bundle: ExportBundle): Promise<ExportedFile> => {
    const fonts = fontFaces(await fontFilesOf(bundle.fonts), (file) => dataUrl('font/woff2', file.data));
    const fileUrl = (id: string) => {
        const image = bundle.images.get(id);
        return image === undefined ? null : dataUrl(image.contentType, image.data);
    };
    const html = pageHtml(bundle, `${fonts}${CONTENT_CSS}${SCREEN_CSS}`, bodyOf(content, fileUrl));

    return { data: Buffer.from(html, 'utf8'), contentType: 'text/html; charset=utf-8', extension: 'html' };
};
