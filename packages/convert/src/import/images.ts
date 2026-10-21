export interface NewImage{
    name: string;
    data: Uint8Array;
    contentType: string;
}

export type SaveImage = (image: NewImage) => Promise<string | null>;

export type ImageSaver = (data: Uint8Array, contentType: string) => Promise<string | null>;

const EXTENSIONS: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp' };

export const imageSaver = (saveImage: SaveImage, filename: string, limit: number): ImageSaver => {
    const base = filename.replace(/\.[a-z0-9]+$/i, '');
    let taken = 0;

    return async (data, contentType) => {
        const extension = EXTENSIONS[contentType];
        if(extension === undefined || taken >= limit) return null;

        taken += 1;
        return saveImage({ name: `${base} (image ${taken}).${extension}`, data, contentType });
    };
};
