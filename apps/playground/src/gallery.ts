import type { PickedImage } from '@pollium/vyva-react/contracts/images';

const WIDTH = 1200;
const HEIGHT = 800;

const COLORS = [
    { fileId: '0192f3a0-1c2d-7e3f-8a4b-5c6d7e8f9001', alt: 'A blue gradient', color: '#2f6fed' },
    { fileId: '0192f3a0-1c2d-7e3f-8a4b-5c6d7e8f9002', alt: 'A green gradient', color: '#0f7b6c' },
    { fileId: '0192f3a0-1c2d-7e3f-8a4b-5c6d7e8f9003', alt: 'An orange gradient', color: '#c4572e' },
    { fileId: '0192f3a0-1c2d-7e3f-8a4b-5c6d7e8f9004', alt: 'A purple gradient', color: '#8250df' }
];

const gradient = (color: string) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="#ffffff"/></linearGradient></defs><rect width="${WIDTH}" height="${HEIGHT}" fill="url(#g)"/></svg>`)}`;

export const GALLERY: PickedImage[] = COLORS.map(({ fileId, alt, color }) => ({ fileId, alt, url: gradient(color), credit: null }));

export const fileUrl = (fileId: string): string | null => GALLERY.find((image) => image.fileId === fileId)?.url ?? null;
