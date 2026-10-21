import { ConvertError } from './errors';
import { bundleOf, type ExportedFile, type ReadImage } from './export/bundle';
import { buildDocx } from './export/docx';
import { buildPptx } from './export/pptx';
import type { Content, ContentKind } from '@vyva/core/content';

export const EXPORT_FORMATS = {
    document: ['docx'],
    deck: ['pptx']
} as const satisfies Record<ContentKind, readonly string[]>;

export type ExportFormat = typeof EXPORT_FORMATS[ContentKind][number];

export interface ExportOptions{
    title: string;
    readImage: ReadImage;
    language?: string;
}

const DEFAULT_LANGUAGE = 'en';
const FORMATS: ReadonlySet<string> = new Set(Object.values(EXPORT_FORMATS).flat());

export const isExportFormat = (value: unknown): value is ExportFormat => typeof value === 'string' && FORMATS.has(value);

export const canExport = (kind: ContentKind, format: ExportFormat): boolean => {
    const formats: readonly ExportFormat[] = EXPORT_FORMATS[kind];
    return formats.includes(format);
};

export const exportContent = async (content: Content, format: ExportFormat, { title, readImage, language = DEFAULT_LANGUAGE }: ExportOptions): Promise<ExportedFile> => {
    if(!canExport(content.kind, format)) throw new ConvertError('unsupported', `A ${content.kind} cannot be exported as ${format}`);

    const bundle = await bundleOf(content, { title, language, readImage });
    return content.kind === 'document' ? buildDocx(content, bundle) : buildPptx(content, bundle);
};
