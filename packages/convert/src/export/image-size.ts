export interface ImageSize{
    width: number;
    height: number;
}

const FALLBACK: ImageSize = { width: 800, height: 600 };

const pngSize = (data: Buffer): ImageSize | null =>
    data.length >= 24 ? { width: data.readUInt32BE(16), height: data.readUInt32BE(20) } : null;

const gifSize = (data: Buffer): ImageSize | null =>
    data.length >= 10 ? { width: data.readUInt16LE(6), height: data.readUInt16LE(8) } : null;

const JPEG_FRAMES = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

const jpegSize = (data: Buffer): ImageSize | null => {
    let offset = 2;
    while(offset + 9 < data.length){
        if(data[offset] !== 0xff){
            offset += 1;
            continue;
        }

        const marker = data[offset + 1];
        if(JPEG_FRAMES.has(marker)) return { height: data.readUInt16BE(offset + 5), width: data.readUInt16BE(offset + 7) };

        offset += 2 + data.readUInt16BE(offset + 2);
    }
    return null;
};

const webpSize = (data: Buffer): ImageSize | null => {
    if(data.length < 30 || data.toString('ascii', 0, 4) !== 'RIFF' || data.toString('ascii', 8, 12) !== 'WEBP') return null;

    const chunk = data.toString('ascii', 12, 16);
    if(chunk === 'VP8X') return { width: 1 + data.readUIntLE(24, 3), height: 1 + data.readUIntLE(27, 3) };
    if(chunk === 'VP8L'){
        const bits = data.readUInt32LE(21);
        return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >> 14) & 0x3fff) };
    }
    if(chunk === 'VP8 ') return { width: data.readUInt16LE(26) & 0x3fff, height: data.readUInt16LE(28) & 0x3fff };

    return null;
};

const READERS: Record<string, (data: Buffer) => ImageSize | null> = {
    'image/png': pngSize,
    'image/gif': gifSize,
    'image/jpeg': jpegSize,
    'image/webp': webpSize
};

export const imageSize = (data: Buffer, contentType: string): ImageSize => {
    const size = READERS[contentType]?.(data) ?? null;

    return size !== null && size.width > 0 && size.height > 0 ? size : FALLBACK;
};

export const fitWithin = (size: ImageSize, maxWidth: number, maxHeight: number): ImageSize => {
    const scale = Math.min(1, maxWidth / size.width, maxHeight / size.height);

    return { width: Math.round(size.width * scale), height: Math.round(size.height * scale) };
};
