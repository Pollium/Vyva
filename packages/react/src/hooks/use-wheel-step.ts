import { useEffect, useRef, type RefObject } from 'react';

export type StepDirection = 1 | -1;

const STEP_PX = 50;
const GESTURE_GAP_MS = 180;

export const useWheelStep = (target: RefObject<HTMLElement | null>, onStep: ((direction: StepDirection) => void) | null) => {
    const latest = useRef(onStep);

    useEffect(() => {
        latest.current = onStep;
    });

    useEffect(() => {
        const node = target.current;
        if(node === null) return;

        let travelled = 0;
        let hasStepped = false;
        let gap: number | undefined;

        const onWheel = (event: WheelEvent) => {
            const step = latest.current;
            if(step === null || event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

            event.preventDefault();
            window.clearTimeout(gap);
            gap = window.setTimeout(() => {
                travelled = 0;
                hasStepped = false;
            }, GESTURE_GAP_MS);
            if(hasStepped) return;

            travelled += event.deltaMode === WheelEvent.DOM_DELTA_PIXEL ? event.deltaY : Math.sign(event.deltaY) * STEP_PX;
            if(Math.abs(travelled) < STEP_PX) return;

            hasStepped = true;
            step(travelled > 0 ? 1 : -1);
        };

        node.addEventListener('wheel', onWheel, { passive: false });

        return () => {
            node.removeEventListener('wheel', onWheel);
            window.clearTimeout(gap);
        };
    }, [target]);
};
