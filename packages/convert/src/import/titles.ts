const MAX_TITLE = 200;
const UNTITLED = 'Untitled';

export const titleOf = (text: string, filename: string): string =>
    (text.trim() || filename.replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').trim() || UNTITLED).slice(0, MAX_TITLE);
