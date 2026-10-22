import type { Slide } from '@pollium/vyva-core/content';
import { useLayoutEffect, useRef, useState, type RefObject } from 'react';

const sameNodes = (a: readonly Element[], b: readonly Element[]): boolean => a.length === b.length && a.every((node, index) => node === b[index]);

interface MoveableTargetsOptions{
    slide: Slide;
    selected: readonly string[];
    editingId: string | null;
    isLocked: boolean;
    section: RefObject<HTMLElement | null>;
    nodeOf: (id: string) => HTMLElement | null;
}

export interface MoveableTargets{
    targets: HTMLElement[];
    guidelines: Element[];
}

const NOTHING: MoveableTargets = { targets: [], guidelines: [] };

export const useMoveableTargets = ({ slide, selected, editingId, isLocked, section, nodeOf }: MoveableTargetsOptions): MoveableTargets => {
    const shown = useRef(NOTHING);
    const [nodes, setNodes] = useState(NOTHING);

    useLayoutEffect(() => {
        const movable = isLocked ? [] : slide.elements.filter((element) => selected.includes(element.id) && !element.isLocked && element.id !== editingId);
        const targets = movable.map((element) => nodeOf(element.id)).filter((node) => node !== null);
        const others = slide.elements.filter((element) => !selected.includes(element.id)).map((element) => nodeOf(element.id)).filter((node) => node !== null);
        const guidelines = section.current === null ? others : [section.current, ...others];

        if(!sameNodes(targets, shown.current.targets) || !sameNodes(guidelines, shown.current.guidelines)){
            shown.current = { targets, guidelines };
            setNodes(shown.current);
        }
    }, [editingId, isLocked, nodeOf, section, selected, slide]);

    return nodes;
};
