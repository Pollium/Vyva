import Canvas from '../Canvas';
import { LAYERS } from '../ui/layers';
import { useWheelStep } from '../../hooks/use-wheel-step';
import { useMessages } from '../../messages/context';
import { slideMarkup } from '../../utils/markup';
import type { DeckContent } from '@vyva/core/content';
import { DECK_SIZES } from '@vyva/core/content';
import type { FileUrl } from '@vyva/core/render';
import { X } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';

const BACK_ZONE = 1 / 3;
const FORWARD_KEYS = ['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'];
const BACK_KEYS = ['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'];

interface PresentModeProps{
    deck: DeckContent;
    start: number;
    fileUrl: FileUrl;
    onClose: () => void;
}

const PresentMode = ({ deck, start, fileUrl, onClose }: PresentModeProps) => {
    const t = useMessages();
    const root = useRef<HTMLDivElement | null>(null);
    const [index, setIndex] = useState(start);
    const [box, setBox] = useState({ width: window.innerWidth, height: window.innerHeight });
    const { width, height } = DECK_SIZES[deck.format];
    const last = deck.slides.length - 1;
    const fit = Math.min(box.width / width, box.height / height);
    const markup = slideMarkup(deck, index, fileUrl);

    useEffect(() => {
        const node = root.current;
        void node?.requestFullscreen?.().catch(() => undefined);
        node?.focus();

        const resize = () => setBox({ width: window.innerWidth, height: window.innerHeight });
        const leave = () => {
            if(document.fullscreenElement === null) onClose();
        };
        window.addEventListener('resize', resize);
        document.addEventListener('fullscreenchange', leave);

        return () => {
            window.removeEventListener('resize', resize);
            document.removeEventListener('fullscreenchange', leave);
            if(document.fullscreenElement !== null) void document.exitFullscreen().catch(() => undefined);
        };
    }, [onClose]);

    const go = (step: number) => setIndex((current) => Math.min(last, Math.max(0, current + step)));

    useWheelStep(root, go);

    const onKeyDown = (event: KeyboardEvent) => {
        if(FORWARD_KEYS.includes(event.key)) go(1);
        else if(BACK_KEYS.includes(event.key)) go(-1);
        else if(event.key === 'Home') setIndex(0);
        else if(event.key === 'End') setIndex(last);
        else if(event.key === 'Escape') onClose();
        else return;
        event.preventDefault();
    };

    return createPortal(
        <div
            ref={root}
            role='dialog'
            aria-label={t.deck.presentation}
            tabIndex={-1}
            onClick={(event) => go(event.clientX < box.width * BACK_ZONE ? -1 : 1)}
            onKeyDown={onKeyDown}
            className={`vy:fixed vy:inset-0 ${LAYERS.present} vy:flex vy:items-center vy:justify-center vy:bg-black vy:outline-none`}
        >
            <div style={{ width: width * fit, height: height * fit }}>
                {markup === null ? null : <Canvas markup={markup} label={t.deck.slideOf(index + 1, last + 1)} />}
            </div>
            <div className='vy:absolute vy:bottom-[max(1rem,env(safe-area-inset-bottom))] vy:right-5 vy:rounded-full vy:bg-white/10 vy:px-3 vy:py-1 vy:text-[0.8125rem] vy:tabular-nums vy:text-white/80'>{index + 1} / {last + 1}</div>
            <button
                type='button'
                aria-label={t.deck.leavePresentation}
                onClick={(event) => {
                    event.stopPropagation();
                    onClose();
                }}
                className='vy:absolute vy:right-4 vy:top-[max(1rem,env(safe-area-inset-top))] vy:grid vy:size-10 vy:place-items-center vy:rounded-full vy:bg-white/10 vy:text-white/80 vy:opacity-0 vy:transition-opacity vy:hover:opacity-100 vy:focus-visible:opacity-100 vy:motion-reduce:transition-none vy:[@media(hover:none)]:opacity-100'
            >
                <X className='vy:size-5' aria-hidden='true' />
            </button>
        </div>,
        document.body
    );
};

export default PresentMode;
