import type { ExportBundle, ExportedFile } from './bundle';
import { fontFaces, fontFilesOf } from './fonts';
import { bodyOf, pageHtml } from './html';
import type { Content } from '@vyva/core/content';
import { DECK_SIZES } from '@vyva/core/content';
import { escapeHtml } from '@vyva/core/escape';
import { CONTENT_CSS } from '@vyva/core/render';

export interface PdfFile{
    name: string;
    data: Uint8Array;
    contentType: string;
}

export interface PdfMargins{
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export interface PdfPage{
    width: number;
    height: number;
    margins: PdfMargins;
}

export interface PdfJob{
    html: string;
    files: PdfFile[];
    footerHtml: string | null;
    page: PdfPage;
}

export type PdfEngine = (job: PdfJob) => Promise<Uint8Array>;

const SLIDE_PX_PER_INCH = 144;
const MM_PER_INCH = 25.4;
const A4_INCHES = { width: 8.27, height: 11.69 };
const FOOTER_ROOM_MM = 4;
const NO_MARGINS: PdfMargins = { top: 0, right: 0, bottom: 0, left: 0 };

const PRINT_CSS = `
@page{size:auto}
html,body{margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.vy-print-slide{break-after:page;overflow:hidden}
.vy-print-slide:last-child{break-after:auto}
.vy-doc{width:auto;min-height:0;padding:0}
.vy-doc .vy-doc-footer{display:none}
.vy-doc img{break-inside:avoid}
.vy-doc tr,.vy-doc pre,.vy-doc blockquote{break-inside:avoid}
.vy-doc h1,.vy-doc h2,.vy-doc h3,.vy-doc h4{break-after:avoid}
`;

const inches = (mm: number): number => mm / MM_PER_INCH;

const pageOf = (content: Content): PdfPage => {
    if(content.kind === 'deck'){
        const { width, height } = DECK_SIZES[content.format];
        return { width: width / SLIDE_PX_PER_INCH, height: height / SLIDE_PX_PER_INCH, margins: NO_MARGINS };
    }

    const { margins } = content.design;
    return {
        ...A4_INCHES,
        margins: { top: inches(margins.top), right: inches(margins.right), bottom: inches(margins.bottom + FOOTER_ROOM_MM), left: inches(margins.left) }
    };
};

const footerOf = (content: Content): string | null => {
    if(content.kind !== 'document') return null;

    const { design } = content;
    const text = escapeHtml(design.footerText);
    if(text === '' && !design.showPageNumbers) return null;

    const number = design.showPageNumbers ? '<span><span class="pageNumber"></span> / <span class="totalPages"></span></span>' : '<span></span>';
    const side = (mm: number) => `${inches(mm).toFixed(3)}in`;
    return `<html><head><style>.vy-page-footer{box-sizing:border-box;display:flex;justify-content:space-between;width:100%;padding:0 ${side(design.margins.right)} 0 ${side(design.margins.left)};font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:8pt;color:#6b7280}</style></head><body><div class="vy-page-footer"><span>${text}</span>${number}</div></body></html>`;
};

export const buildPdf = async (content: Content, bundle: ExportBundle, engine: PdfEngine): Promise<ExportedFile> => {
    const fonts = await fontFilesOf(bundle.fonts);
    const css = `${fontFaces(fonts, (file) => file.name)}${CONTENT_CSS}${PRINT_CSS}`;
    const html = pageHtml(bundle, css, bodyOf(content, (id) => bundle.images.get(id)?.name ?? null));
    const files: PdfFile[] = [
        ...[...bundle.images.values()].map(({ name, data, contentType }) => ({ name, data, contentType })),
        ...fonts.map(({ name, data }) => ({ name, data, contentType: 'font/woff2' }))
    ];

    const data = await engine({ html, files, footerHtml: footerOf(content), page: pageOf(content) });
    return { data, contentType: 'application/pdf', extension: 'pdf' };
};
