import { useLayoutEffect, useState, type RefObject } from 'react';

const PADDING = 48;
const COMPACT_PADDING = 12;
const COMPACT_VIEWPORT = 640;
const MIN_SCALE = 0.1;
const INITIAL_FIT = 0.5;

interface StageSize{
    width: number;
    height: number;
}

export const useStageFit = (viewport: RefObject<HTMLElement | null>, { width, height }: StageSize, onFit: (scale: number) => void): number => {
    const [fit, setFit] = useState(INITIAL_FIT);

    useLayoutEffect(() => {
        const node = viewport.current;
        if(node === null) return;

        const measure = () => {
            const padding = node.clientWidth < COMPACT_VIEWPORT ? COMPACT_PADDING : PADDING;
            const next = Math.max(MIN_SCALE, Math.min((node.clientWidth - padding * 2) / width, (node.clientHeight - padding * 2) / height));
            setFit(next);
            onFit(next);
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(node);
        return () => observer.disconnect();
    }, [viewport, width, height, onFit]);

    return fit;
};
