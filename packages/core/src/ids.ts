declare const crypto: { getRandomValues<T extends Uint8Array>(array: T): T };

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export const newId = (length = 10): string => {
    const bytes = crypto.getRandomValues(new Uint8Array(length));

    return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join('');
};
