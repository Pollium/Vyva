import InlineEditor from '../InlineEditor';
import SelectionOverlay from '../SelectionOverlay';
import SlideElementView from '../SlideElementView';
import type { CellRef, DeckEditing } from '../../../contracts/deck-editing';
import type { DeckHistory } from '../../../hooks/use-deck-history';
import { useFittedTextHeights } from '../../../hooks/use-fitted-text-heights';
import { useFrameGestures } from '../../../hooks/use-frame-gestures';
import { useMarquee } from '../../../hooks/use-marquee';
import { useModifierKeys } from '../../../hooks/use-modifier-keys';
import { useMoveableTargets } from '../../../hooks/use-moveable-targets';
import { useStageFit } from '../../../hooks/use-stage-fit';
import { useMessages } from '../../../messages/context';
import { cssToStyle } from '../../../utils/deck/css-style';
import { holdsText, sizeOf } from '../../../utils/deck/deck-ops';
import { editAt, editsInPlace } from '../../../utils/deck/edit-target';
import type { SlideElement } from '@pollium/vyva-core/content';
import { frameLayers } from '@pollium/vyva-core/deck-frame';
import { slideCss, type FileUrl } from '@pollium/vyva-core/render';
import type { Editor } from '@tiptap/react';
import Moveable from 'react-moveable';
import { useCallback, useLayoutEffect, useRef, type PointerEvent } from 'react';

const SNAP_PX = 6;
const ROTATE_STEP = 15;
const SLIDE_RADIUS = 8;
const SNAP_ROTATIONS = [0, 90, 180, 270];
const SNAP_ROTATION_THRESHOLD = 2;
const ALL_SIDES = { left: true, top: true, right: true, bottom: true, center: true, middle: true };
const CORNERS = ['nw', 'ne', 'sw', 'se'];
const EDGES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
const SIDES = ['e', 'w'];

interface SlideStageProps{
    history: DeckHistory;
    slideIndex: number;
    fileUrl: FileUrl;
    selected: readonly string[];
    editing: DeckEditing | null;
    isLocked: boolean;
    zoom: number | null;
    onFit: (scale: number) => void;
    onSelect: (ids: string[]) => void;
    onStartEdit: (editing: DeckEditing) => void;
    onFinishEdit: () => void;
    onTextChange: (id: string, html: string) => void;
    onCellChange: (id: string, rows: string[][]) => void;
    onCell: (id: string, cell: CellRef) => void;
    onTextEditor: (editor: Editor | null) => void;
}

const SlideStage = (props: SlideStageProps) => {
    const { history, slideIndex, fileUrl, selected, editing, isLocked, zoom, onFit, onSelect, onStartEdit, onFinishEdit } = props;
    const t = useMessages();
    const { deck } = history;
    const slide = deck.slides[slideIndex];
    const size = sizeOf(deck);
    const viewport = useRef<HTMLDivElement | null>(null);
    const surface = useRef<HTMLDivElement | null>(null);
    const section = useRef<HTMLElement | null>(null);
    const moveable = useRef<Moveable | null>(null);
    const editingId = editing?.id ?? null;
    const fit = useStageFit(viewport, size, onFit);
    const scale = zoom ?? fit;
    const modifiers = useModifierKeys();

    const nodeOf = useCallback((id: string): HTMLElement | null =>
        surface.current?.querySelector<HTMLElement>(`[data-element-id="${CSS.escape(id)}"]`) ?? null, []);
    const gestures = useFrameGestures({ history, slide, slideIndex, slideHeight: size.height, nodeOf, onStartEdit });
    const marquee = useMarquee({ surface, slide, selected, scale, onSelect });
    const { targets, guidelines } = useMoveableTargets({ slide, selected, editingId, isLocked, section, nodeOf });
    useFittedTextHeights({ history, slide, slideIndex, nodeOf, isGesturing: gestures.isGesturing });

    useLayoutEffect(() => {
        moveable.current?.updateRect();
    }, [scale]);

    const startMove = (event: PointerEvent, element: SlideElement) => {
        if(isLocked) return;
        event.stopPropagation();
        if(editingId !== null && editingId !== element.id) onFinishEdit();
        if(editingId === element.id) return;

        const isAdding = event.shiftKey || event.metaKey || event.ctrlKey;
        const wasOnlySelection = selected.length === 1 && selected[0] === element.id;
        const next = isAdding
            ? (selected.includes(element.id) ? selected.filter((id) => id !== element.id) : [...selected, element.id])
            : (selected.includes(element.id) ? [...selected] : [element.id]);
        onSelect(next);
        gestures.setPendingEdit(wasOnlySelection && !isAdding && !element.isLocked ? editAt(event, element) : null);
    };

    const startMarquee = (event: PointerEvent) => {
        if(isLocked || event.button !== 0) return;
        if(event.target instanceof Element && event.target.closest('.moveable-control-box') !== null) return;
        if(editingId !== null) onFinishEdit();
        if(event.pointerType === 'touch'){
            onSelect([]);
            return;
        }

        marquee.start(event);
    };

    const single = selected.length === 1 ? slide.elements.find((element) => element.id === selected[0]) ?? null : null;
    const outlined = slide.elements.filter((element) => selected.includes(element.id) && (isLocked || element.isLocked || element.id === editingId));
    const keepsRatio = targets.length === 1 && single?.type === 'image';
    const layers = frameLayers(slide, deck);
    const isTextOnly = selected.length > 0 && slide.elements.every((element) => !selected.includes(element.id) || element.type === 'text');
    const writesOnClick = (element: SlideElement) => !isLocked && !element.isLocked && editingId !== element.id && (holdsText(element) || element.type === 'table') && single?.id === element.id;

    return (
        <div
            ref={viewport}
            role='region'
            tabIndex={-1}
            aria-label={t.deck.canvasOf(slideIndex + 1)}
            className='vy:relative vy:isolate vy:flex vy:min-h-0 vy:flex-1 vy:overflow-auto vy:outline-none'
            onPointerDown={startMarquee}
            onPointerMove={marquee.move}
            onPointerUp={marquee.end}
            onPointerCancel={marquee.end}
        >
            <div ref={surface} className='vy:relative vy:m-auto vy:shrink-0' style={{ width: size.width * scale, height: size.height * scale }}>
                <div className='vy:absolute vy:left-0 vy:top-0 vy:origin-top-left' style={{ width: size.width, height: size.height, transform: `scale(${scale})` }}>
                    <section ref={section} className='vy-slide vy:overflow-hidden' style={{ ...cssToStyle(slideCss(slide, deck, fileUrl)), borderRadius: SLIDE_RADIUS / scale }}>
                        <div className='vy:contents' dangerouslySetInnerHTML={{ __html: layers.under }} />
                        {slide.elements.map((element) => (
                            <div
                                key={element.id}
                                onPointerDown={(event) => startMove(event, element)}
                                title={writesOnClick(element) ? t.deck.clickToWrite : undefined}
                                className={element.isLocked || editingId === element.id ? '' : writesOnClick(element) ? 'vy:cursor-text vy:touch-none' : 'vy:cursor-move vy:touch-none'}
                            >
                                <SlideElementView element={element} deck={deck} fileUrl={fileUrl}>
                                    {editing !== null && !isLocked && editsInPlace(element, editing) ? (
                                        <InlineEditor
                                            element={element}
                                            deck={deck}
                                            editing={editing}
                                            onCell={(cell) => props.onCell(element.id, cell)}
                                            onCellChange={(rows) => props.onCellChange(element.id, rows)}
                                            onTextChange={(html) => props.onTextChange(element.id, html)}
                                            onTextEditor={props.onTextEditor}
                                            onDone={onFinishEdit}
                                        />
                                    ) : undefined}
                                </SlideElementView>
                            </div>
                        ))}
                        <div className='vy:contents' dangerouslySetInnerHTML={{ __html: layers.over }} />
                    </section>

                    <SelectionOverlay outlined={outlined} marquee={marquee.box} scale={scale} />
                </div>

                <Moveable
                    ref={moveable}
                    className='vy-moveable'
                    target={targets}
                    origin={false}
                    draggable
                    resizable
                    rotatable
                    renderDirections={isTextOnly ? SIDES : keepsRatio ? CORNERS : EDGES}
                    rotationPosition='top'
                    keepRatio={keepsRatio !== modifiers.shift}
                    throttleRotate={modifiers.shift ? ROTATE_STEP : 0}
                    snappable={!modifiers.alt}
                    snapThreshold={SNAP_PX}
                    snapDirections={ALL_SIDES}
                    elementSnapDirections={ALL_SIDES}
                    elementGuidelines={guidelines}
                    snapRotationDegrees={SNAP_ROTATIONS}
                    snapRotationThreshold={SNAP_ROTATION_THRESHOLD}
                    isDisplaySnapDigit={false}
                    useMutationObserver
                    useResizeObserver
                    onDrag={gestures.onDrag}
                    onDragGroup={({ events }) => events.forEach(gestures.onDrag)}
                    onDragEnd={gestures.onGestureEnd}
                    onDragGroupEnd={gestures.onGestureEnd}
                    onResize={gestures.onResize}
                    onResizeGroup={({ events }) => events.forEach(gestures.onResize)}
                    onResizeEnd={gestures.onGestureEnd}
                    onResizeGroupEnd={gestures.onGestureEnd}
                    onRotate={gestures.onRotate}
                    onRotateGroup={({ events }) => events.forEach(gestures.onRotate)}
                    onRotateEnd={gestures.onGestureEnd}
                    onRotateGroupEnd={gestures.onGestureEnd}
                />
            </div>
        </div>
    );
};

export default SlideStage;
