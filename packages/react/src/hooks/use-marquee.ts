import { intersects, type Point } from '../utils/deck/geometry';
import type { Slide } from '@vyva/core/content';
import { useRef, useState, type PointerEvent, type RefObject } from 'react';

export interface MarqueeBox{
    x: number;
    y: number;
    w: number;
    h: number;
}

interface MarqueeGesture{
    start: Point;
    additive: readonly string[];
}

interface MarqueeOptions{
    surface: RefObject<HTMLDivElement | null>;
    slide: Slide;
    selected: readonly string[];
    scale: number;
    onSelect: (ids: string[]) => void;
}

export interface Marquee{
    box: MarqueeBox | null;
    start: (event: PointerEvent) => void;
    move: (event: PointerEvent) => void;
    end: () => void;
}

export const useMarquee = ({ surface, slide, selected, scale, onSelect }: MarqueeOptions): Marquee => {
    const gesture = useRef<MarqueeGesture | null>(null);
    const shownKey = useRef('');
    const [box, setBox] = useState<MarqueeBox | null>(null);

    const toSlide = (event: { clientX: number; clientY: number }): Point => {
        const rect = surface.current?.getBoundingClientRect();
        if(rect === undefined) return { x: 0, y: 0 };

        return { x: (event.clientX - rect.left) / scale, y: (event.clientY - rect.top) / scale };
    };

    const start = (event: PointerEvent) => {
        const additive = event.shiftKey ? [...selected] : [];
        if(!event.shiftKey) onSelect([]);
        if(event.currentTarget instanceof Element) event.currentTarget.setPointerCapture(event.pointerId);
        shownKey.current = additive.join(',');
        gesture.current = { start: toSlide(event), additive };
    };

    const move = (event: PointerEvent) => {
        const current = gesture.current;
        if(current === null) return;

        const point = toSlide(event);
        const next = {
            x: Math.min(current.start.x, point.x),
            y: Math.min(current.start.y, point.y),
            w: Math.abs(point.x - current.start.x),
            h: Math.abs(point.y - current.start.y)
        };
        setBox(next);
        const ids = [...new Set([...current.additive, ...slide.elements.filter((element) => intersects(next, element)).map((element) => element.id)])];
        const key = ids.join(',');
        if(key === shownKey.current) return;

        shownKey.current = key;
        onSelect(ids);
    };

    const end = () => {
        gesture.current = null;
        setBox(null);
    };

    return { box, start, move, end };
};
