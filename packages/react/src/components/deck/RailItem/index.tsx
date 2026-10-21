import SlideThumb from '../SlideThumb';
import ActionMenu from '../../ui/ActionMenu';
import MenuItem from '../../ui/MenuItem';
import { useMessages } from '../../../messages/context';
import type { DeckFormat, DeckTheme, Slide } from '@vyva/core/content';
import type { FileUrl } from '@vyva/core/render';
import { memo, useEffect, useRef } from 'react';

export interface RailActions{
    select: (index: number) => void;
    move: (from: number, to: number) => void;
    duplicate: (index: number) => void;
    remove: (index: number) => void;
    relayout: (index: number) => void;
    dragStart: (index: number) => void;
    dragOver: (index: number) => boolean;
    drop: (index: number) => void;
    dragEnd: () => void;
}

interface RailItemProps{
    slide: Slide;
    theme: DeckTheme;
    format: DeckFormat;
    fileUrl: FileUrl;
    index: number;
    count: number;
    isCurrent: boolean;
    isLocked: boolean;
    isDropTarget: boolean;
    isColumn: boolean;
    actions: RailActions;
}

const RailItem = memo(({ slide, theme, format, fileUrl, index, count, isCurrent, isLocked, isDropTarget, isColumn, actions }: RailItemProps) => {
    const t = useMessages();
    const item = useRef<HTMLLIElement | null>(null);

    useEffect(() => {
        if(isCurrent) item.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }, [isCurrent]);

    return (
        <li
            ref={item}
            draggable={!isLocked}
            onDragStart={(event) => {
                actions.dragStart(index);
                event.dataTransfer.effectAllowed = 'move';
            }}
            onDragOver={(event) => {
                if(actions.dragOver(index)) event.preventDefault();
            }}
            onDrop={(event) => {
                event.preventDefault();
                actions.drop(index);
            }}
            onDragEnd={actions.dragEnd}
            className={`vy:group/slide vy:relative vy:flex vy:gap-2 vy:max-lg:portrait:w-28 vy:max-lg:portrait:shrink-0 ${isDropTarget ? 'vy:before:absolute vy:before:-top-2 vy:before:left-6 vy:before:right-0 vy:before:h-0.5 vy:before:rounded-full vy:before:bg-foreground' : ''}`}
        >
            <span className={`vy:w-4 vy:shrink-0 vy:pt-1 vy:text-right vy:max-lg:portrait:hidden vy:text-[0.6875rem] vy:tabular-nums vy:transition-opacity vy:group-hover/slide:opacity-100 vy:motion-reduce:transition-none ${isCurrent ? 'vy:font-semibold vy:text-foreground' : 'vy:text-muted vy:opacity-0'}`}>{index + 1}</span>
            <button
                type='button'
                aria-label={t.deck.goToSlide(index + 1)}
                aria-current={isCurrent}
                onClick={() => actions.select(index)}
                className={`vy:min-w-0 vy:flex-1 vy:overflow-hidden vy:rounded-lg vy:ring-offset-2 vy:ring-offset-background vy:transition vy:motion-reduce:transition-none ${isCurrent ? 'vy:ring-2 vy:ring-foreground' : ''}`}
            >
                <SlideThumb slide={slide} theme={theme} format={format} label={t.deck.slide(index + 1)} fileUrl={fileUrl} />
            </button>
            {isLocked ? null : (
                <span className={`vy:absolute vy:right-1 vy:top-1 vy:transition-opacity vy:focus-within:opacity-100 vy:group-hover/slide:opacity-100 vy:motion-reduce:transition-none ${isCurrent ? 'vy:opacity-100' : 'vy:opacity-0 vy:[@media(hover:none)]:hidden'}`}>
                    <ActionMenu subject={t.deck.slideSubject(index + 1)}>
                        <MenuItem onAction={() => actions.relayout(index)}>{t.deck.changeLayout}</MenuItem>
                        <MenuItem onAction={() => actions.duplicate(index)}>{t.deck.duplicate}</MenuItem>
                        {index > 0 ? <MenuItem onAction={() => actions.move(index, index - 1)}>{isColumn ? t.deck.moveUp : t.deck.moveLeft}</MenuItem> : null}
                        {index < count - 1 ? <MenuItem onAction={() => actions.move(index, index + 1)}>{isColumn ? t.deck.moveDown : t.deck.moveRight}</MenuItem> : null}
                        {count > 1 ? <MenuItem isDanger onAction={() => actions.remove(index)}>{t.deck.delete}</MenuItem> : null}
                    </ActionMenu>
                </span>
            )}
        </li>
    );
});

export default RailItem;
