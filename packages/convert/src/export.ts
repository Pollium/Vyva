import { ConvertError } from './errors';
import { bundleOf, type ExportedFile, type ReadImage } from './export/bundle';
import { buildDocx } from './export/docx';
import { buildHtml } from './export/html';
import { buildPdf, type PdfEngine } from './export/pdf';
import { buildPptx } from './export/pptx';
import type { Content, ContentKind } from '@pollium/vyva-core/content';
import { hasPdfPages } from '@pollium/vyva-core/content';

export const EXPORT_FORMATS = {
    document: ['pdf', 'docx', 'html'],
    deck: ['pptx', 'pdf']
} as const satisfies Record<ContentKind, readonly string[]>;

export type ExportFormat = typeof EXPORT_FORMATS[ContentKind][number];

export interface ExportOptions{
    title: string;
    readImage: ReadImage;
    pdfEngine?: PdfEngine;
    language?: string;
}

const DEFAULT_LANGUAGE = 'en';
const FORMATS: ReadonlySet<string> = new Set(Object.values(EXPORT_FORMATS).flat());

export const isExportFormat = (value: unknown): value is ExportFormat => typeof value === 'string' && FORMATS.has(value);

export const exportFormatsOf = (content: Content): readonly ExportFormat[] => hasPdfPages(content) ? ['pdf'] : EXPORT_FORMATS[content.kind];

export const canExport = (content: Content, format: ExportFormat): boolean => exportFormatsOf(content).includes(format);

const engineOf = (engine: PdfEngine | undefined): PdfEngine => {
    if(engine === undefined) throw new TypeError('Exporting as pdf needs a pdfEngine');
    return engine;
};

export const exportContent = async (content: Content, format: ExportFormat, { title, readImage, pdfEngine, language = DEFAULT_LANGUAGE }: ExportOptions): Promise<ExportedFile> => {
    if(!canExport(content, format)) throw new ConvertError('unsupported', `This ${content.kind} cannot be exported as ${format}`);

    const engine = format === 'pdf' ? engineOf(pdfEngine) : null;
    const bundle = await bundleOf(content, { title, language, readImage });
    if(engine !== null) return buildPdf(content, bundle, engine);
    if(format === 'html') return buildHtml(content, bundle);

    return content.kind === 'document' ? buildDocx(content, bundle) : buildPptx(content, bundle);
};
