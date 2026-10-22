import type { DeckHistory } from './use-deck-history';
import { updateElements } from '../utils/deck/deck-ops';
import type { Slide } from '@pollium/vyva-core/content';
import { withTextHeight } from '@pollium/vyva-core/render';
import { useCallback, useEffect, useLayoutEffect } from 'react';

const HEIGHT_TOLERANCE = 1;

interface FittedTextHeightsOptions{
    history: DeckHistory;
    slide: Slide;
    slideIndex: number;
    nodeOf: (id: string) => HTMLElement | null;
    isGesturing: () => boolean;
}

export const useFittedTextHeights = ({ history, slide, slideIndex, nodeOf, isGesturing }: FittedTextHeightsOptions) => {
    const { snapshot, preview } = history;
    const fitTextHeights = useCallback(() => {
        if(isGesturing()) return;

        const current = snapshot();
        const heights = new Map<string, number>();
        for(const element of current.slides[slideIndex]?.elements ?? []){
            const node = element.type === 'text' ? nodeOf(element.id) : null;
            if(node !== null && Math.abs(node.offsetHeight - element.h) > HEIGHT_TOLERANCE) heights.set(element.id, node.offsetHeight);
        }
        if(heights.size === 0) return;

        preview(updateElements(current, slideIndex, [...heights.keys()], (element) => element.type === 'text' ? withTextHeight(element, heights.get(element.id) ?? element.h) : element));
    }, [isGesturing, nodeOf, preview, slideIndex, snapshot]);

    useLayoutEffect(fitTextHeights, [fitTextHeights, slide]);

    useEffect(() => {
        void document.fonts.ready.then(fitTextHeights);
    }, [fitTextHeights]);
};
