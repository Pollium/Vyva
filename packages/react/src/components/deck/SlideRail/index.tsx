import RailItem, { type RailActions } from '../RailItem';
import { useMediaQuery } from '../../../hooks/use-media-query';
import { useMessages } from '../../../messages/context';
import type { DeckContent } from '@vyva/core/content';
import type { FileUrl } from '@vyva/core/render';
import { useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

const COLUMN_SCREEN = '(min-width: 64rem), (orientation: landscape)';

interface SlideRailProps{
    deck: DeckContent;
    current: number;
    fileUrl: FileUrl;
    isLocked: boolean;
    onSelect: (index: number) => void;
    onMove: (from: number, to: number) => void;
    onDuplicate: (index: number) => void;
    onRemove: (index: number) => void;
    onRelayout: (index: number) => void;
    addButton: ReactNode;
}

const SlideRail = (props: SlideRailProps) => {
    const { deck, current, fileUrl, isLocked, addButton } = props;
    const t = useMessages();
    const [dragFrom, setDragFrom] = useState<number | null>(null);
    const [dropAt, setDropAt] = useState<number | null>(null);
    const shown = useDeferredValue(deck);
    const shownSlides = useMemo(() => new Map(shown.slides.map((slide) => [slide.id, slide])), [shown.slides]);
    const latest = useRef(props);
    const dragging = useRef<number | null>(null);
    const isColumn = useMediaQuery(COLUMN_SCREEN);

    useEffect(() => {
        latest.current = props;
    });

    const actions = useMemo<RailActions>(() => {
        const endDrag = () => {
            dragging.current = null;
            setDragFrom(null);
            setDropAt(null);
        };

        return {
            select: (index) => latest.current.onSelect(index),
            move: (from, to) => latest.current.onMove(from, to),
            duplicate: (index) => latest.current.onDuplicate(index),
            remove: (index) => latest.current.onRemove(index),
            relayout: (index) => latest.current.onRelayout(index),
            dragStart: (index) => {
                dragging.current = index;
                setDragFrom(index);
            },
            dragOver: (index) => {
                if(dragging.current === null) return false;
                setDropAt(index);
                return true;
            },
            drop: (index) => {
                if(dragging.current !== null) latest.current.onMove(dragging.current, index);
                endDrag();
            },
            dragEnd: endDrag
        };
    }, []);

    return (
        <nav aria-label={t.deck.slides} className='vy:flex vy:w-36 vy:shrink-0 vy:flex-col vy:max-lg:landscape:w-32 vy:max-lg:landscape:pt-2 vy:max-lg:portrait:order-1 vy:max-lg:portrait:w-auto vy:max-lg:portrait:border-t vy:max-lg:portrait:border-foreground/[0.06] vy:lg:w-48'>
            <div className={`vy:min-h-0 vy:flex-1 vy:overscroll-contain vy:[scrollbar-width:none] ${isColumn ? 'vy:overflow-y-auto' : 'vy:overflow-x-auto'}`}>
                <ol className='vy:flex vy:flex-col vy:gap-3 vy:py-1 vy:pl-1 vy:pr-2 vy:max-lg:portrait:w-max vy:max-lg:portrait:flex-row vy:max-lg:portrait:px-3 vy:max-lg:portrait:py-2.5'>
                    {deck.slides.map((slide, index) => (
                        <RailItem
                            key={slide.id}
                            slide={shownSlides.get(slide.id) ?? slide}
                            theme={shown.theme}
                            format={shown.format}
                            fileUrl={fileUrl}
                            index={index}
                            count={deck.slides.length}
                            isCurrent={index === current}
                            isLocked={isLocked}
                            isDropTarget={dropAt === index && dragFrom !== index}
                            isColumn={isColumn}
                            actions={actions}
                        />
                    ))}
                    <li className='vy:flex vy:gap-2 vy:pb-2 vy:max-lg:portrait:w-28 vy:max-lg:portrait:shrink-0 vy:max-lg:portrait:pb-0'>
                        <span className='vy:w-4 vy:shrink-0 vy:max-lg:portrait:hidden' aria-hidden='true' />
                        <span className='vy:min-w-0 vy:flex-1'>{addButton}</span>
                    </li>
                </ol>
            </div>
        </nav>
    );
};

export default SlideRail;
