export interface Frame{
    x: number;
    y: number;
    w: number;
    h: number;
    rotation: number;
}

export interface Point{
    x: number;
    y: number;
}

export const MIN_SIZE = 16;

interface Box{
    x: number;
    y: number;
    w: number;
    h: number;
}

export const boundsOf = (frames: Box[]): Box => {
    const left = Math.min(...frames.map((frame) => frame.x));
    const top = Math.min(...frames.map((frame) => frame.y));
    const right = Math.max(...frames.map((frame) => frame.x + frame.w));
    const bottom = Math.max(...frames.map((frame) => frame.y + frame.h));

    return { x: left, y: top, w: right - left, h: bottom - top };
};

export const intersects = (a: Box, b: Box): boolean =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
