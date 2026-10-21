const ASCII_FALLBACK = 'download';
const NAME_LIMIT = 80;

const asciiSlug = (title: string): string =>
    title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, NAME_LIMIT) || ASCII_FALLBACK;

const readable = (title: string): string =>
    title.replace(/[\\/:*?"<>|\r\n]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, NAME_LIMIT) || ASCII_FALLBACK;

export const contentDisposition = (title: string, extension: string): string =>
    `attachment; filename="${asciiSlug(title)}.${extension}"; filename*=UTF-8''${encodeURIComponent(`${readable(title)}.${extension}`)}`;
