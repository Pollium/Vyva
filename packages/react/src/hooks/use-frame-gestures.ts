import type { DeckEditing } from '../contracts/deck-editing';
import type { DeckHistory } from './use-deck-history';
import { updateElements } from '../utils/deck/deck-ops';
import { MIN_SIZE, type Frame } from '../utils/deck/geometry';
import type { Slide, SlideElement } from '@vyva/core/content';
import type { OnDrag, OnResize, OnRotate } from 'react-moveable';
import { useCallback, useRef } from 'react';

const HALF_TURN = 180;
const FULL_TURN = 360;

const frameOf = (element: SlideElement): Frame => ({ x: element.x, y: element.y, w: element.w, h: element.h, rotation: element.rotation });

const normalized = (degrees: number): number => ((degrees + HALF_TURN) % FULL_TURN + FULL_TURN) % FULL_TURN - HALF_TURN;

const rounded = (frame: Frame): Frame => ({
    x: Math.round(frame.x),
    y: Math.round(frame.y),
    w: Math.round(frame.w),
    h: Math.round(frame.h),
    rotation: Math.round(frame.rotation)
});

export const paint = (node: HTMLElement | SVGElement, frame: Frame, slideHeight: number) => {
    node.style.left = `${frame.x}px`;
    node.style.top = `${frame.y}px`;
    node.style.width = `${frame.w}px`;
    if(node.style.height === 'max-content') node.style.bottom = `${slideHeight - frame.y - frame.h}px`;
    else node.style.height = `${frame.h}px`;
    node.style.transform = frame.rotation === 0 ? '' : `rotate(${frame.rotation}deg)`;
};

interface FrameGestureOptions{
    history: DeckHistory;
    slide: Slide;
    slideIndex: number;
    slideHeight: number;
    nodeOf: (id: string) => HTMLElement | null;
    onStartEdit: (editing: DeckEditing) => void;
}

export interface FrameGestures{
    setPendingEdit: (editing: DeckEditing | null) => void;
    isGesturing: () => boolean;
    onDrag: (event: OnDrag) => void;
    onResize: (event: OnResize) => void;
    onRotate: (event: OnRotate) => void;
    onGestureEnd: (event: { isDrag: boolean }) => void;
}

export const useFrameGestures = ({ history, slide, slideIndex, slideHeight, nodeOf, onStartEdit }: FrameGestureOptions): FrameGestures => {
    const startFrames = useRef(new Map<string, Frame>());
    const liveFrames = useRef(new Map<string, Frame>());
    const pendingEdit = useRef<DeckEditing | null>(null);
    const isGesturing = useCallback(() => liveFrames.current.size > 0, []);
    const setPendingEdit = useCallback((editing: DeckEditing | null) => {
        pendingEdit.current = editing;
    }, []);

    const startOf = (target: HTMLElement | SVGElement): [string, Frame] | null => {
        const id = target.dataset.elementId;
        if(id === undefined) return null;

        const known = startFrames.current.get(id);
        if(known !== undefined) return [id, known];

        const element = slide.elements.find((candidate) => candidate.id === id);
        if(element === undefined) return null;

        const frame = frameOf(element);
        startFrames.current.set(id, frame);
        return [id, frame];
    };

    const show = (target: HTMLElement | SVGElement, change: (start: Frame) => Frame) => {
        const start = startOf(target);
        if(start === null) return;

        const frame = change(start[1]);
        liveFrames.current.set(start[0], frame);
        paint(target, frame, slideHeight);
    };

    const onDrag = ({ target, beforeTranslate }: OnDrag) =>
        show(target, (start) => ({ ...start, x: start.x + beforeTranslate[0], y: start.y + beforeTranslate[1] }));

    const onResize = ({ target, width, height, direction, drag }: OnResize) => show(target, (start) => ({
        ...start,
        x: start.x + drag.beforeTranslate[0],
        y: start.y + drag.beforeTranslate[1],
        w: direction[0] === 0 ? start.w : Math.max(MIN_SIZE, width),
        h: direction[1] === 0 ? start.h : Math.max(MIN_SIZE, height)
    }));

    const onRotate = ({ target, rotation, drag }: OnRotate) => show(target, (start) => ({
        ...start,
        x: start.x + drag.beforeTranslate[0],
        y: start.y + drag.beforeTranslate[1],
        rotation: normalized(rotation)
    }));

    const onGestureEnd = ({ isDrag }: { isDrag: boolean }) => {
        const frames = new Map([...liveFrames.current].map(([id, frame]) => [id, rounded(frame)]));
        startFrames.current.clear();
        liveFrames.current.clear();
        const edit = pendingEdit.current;
        pendingEdit.current = null;

        if(frames.size === 0){
            if(!isDrag && edit !== null) onStartEdit(edit);
            return;
        }

        for(const [id, frame] of frames){
            const node = nodeOf(id);
            if(node !== null) paint(node, frame, slideHeight);
        }
        history.commit(updateElements(history.snapshot(), slideIndex, [...frames.keys()], (element) => {
            const frame = frames.get(element.id);
            return frame === undefined ? element : { ...element, ...frame };
        }));
    };

    return { setPendingEdit, isGesturing, onDrag, onResize, onRotate, onGestureEnd };
};
