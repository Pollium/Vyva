import { imageSize, type ImageSize } from './image-size';
import { CODE_FONT } from '@pollium/vyva-core/code';
import type { Content, FontFamily } from '@pollium/vyva-core/content';
import { fileIdsOf } from '@pollium/vyva-core/render';

export interface StoredImage{
    data: Uint8Array;
    contentType: string;
}

export type ReadImage = (fileId: string) => Promise<StoredImage | null>;

export interface BundleImage{
    id: string;
    name: string;
    data: Buffer;
    contentType: string;
    extension: string;
    size: ImageSize;
}

export interface ExportBundle{
    title: string;
    language: string;
    images: Map<string, BundleImage>;
    fonts: FontFamily[];
}

export interface ExportedFile{
    data: Uint8Array;
    contentType: string;
    extension: string;
}

const EXTENSIONS: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp' };

const fontsOf = (content: Content): FontFamily[] => {
    if(content.kind === 'document') return [content.design.font, CODE_FONT];

    const hasCode = content.slides.some((slide) => slide.elements.some((element) => element.type === 'code'));
    return hasCode ? [content.theme.font, CODE_FONT] : [content.theme.font];
};

const bundleImage = (id: string, stored: StoredImage): BundleImage => {
    const data = Buffer.from(stored.data);
    const extension = EXTENSIONS[stored.contentType] ?? 'bin';

    return { id, name: `${id}.${extension}`, data, contentType: stored.contentType, extension, size: imageSize(data, stored.contentType) };
};

export interface BundleOptions{
    title: string;
    language: string;
    readImage: ReadImage;
}

export const bundleOf = async (content: Content, { title, language, readImage }: BundleOptions): Promise<ExportBundle> => {
    const ids = fileIdsOf(content);
    const stored = await Promise.all(ids.map((id) => readImage(id)));
    const images = new Map(ids.flatMap((id, index) => {
        const image = stored[index];
        return image === null ? [] : [[id, bundleImage(id, image)] as const];
    }));

    return { title, language, images, fonts: fontsOf(content) };
};
