import InlineFormat from '../InlineFormat';
import MenuRow from '../../editor/MenuRow';
import ToolButton from '../../editor/ToolButton';
import ToolDivider from '../../editor/ToolDivider';
import ToolPopover from '../../editor/ToolPopover';
import type { DeckEditing } from '../../../contracts/deck-editing';
import { useMessages } from '../../../messages/context';
import { holdsText } from '../../../utils/deck/deck-ops';
import { SHAPES } from '../../../utils/deck/shape-kinds';
import type { ShapeKind, SlideElement } from '@vyva/core/content';
import type { Editor } from '@tiptap/react';
import { Check, Code2, Copy, ImagePlus, Shapes, Sparkles, Table2, Trash2, Type } from 'lucide-react';

const SHAPE_MENU_WIDTH = 220;
const TOOLBAR = 'vy:mx-auto vy:flex vy:max-w-full vy:shrink-0 vy:items-center vy:gap-0.5 vy:overflow-x-auto vy:overscroll-x-contain vy:px-1 vy:py-1 vy:max-lg:w-full vy:max-lg:border-b vy:max-lg:border-foreground/[0.06] vy:max-lg:px-2';

interface DeckToolbarProps{
    selection: SlideElement[];
    editing: DeckEditing | null;
    textEditor: Editor | null;
    isLocked: boolean;
    onAddText: () => void;
    onAddImage: (() => void) | undefined;
    onAddShape: (shape: ShapeKind) => void;
    onAddTable: () => void;
    onAddCode: () => void;
    onEditCode: () => void;
    onEditTable: () => void;
    onReplaceImage: (() => void) | undefined;
    onDuplicate: () => void;
    onDelete: () => void;
    onImprove: (() => void) | undefined;
    onFinishEdit: () => void;
}

const DeckToolbar = (props: DeckToolbarProps) => {
    const { selection, editing, textEditor, isLocked, onAddImage, onReplaceImage, onImprove } = props;
    const t = useMessages();
    const single = selection.length === 1 ? selection[0] : null;
    const allLocked = selection.length > 0 && selection.every((element) => element.isLocked);
    const canImprove = single !== null && (holdsText(single) || single.type === 'table');

    if(textEditor !== null && editing?.kind === 'text'){
        return (
            <div role='toolbar' aria-label={t.deck.tools} className={TOOLBAR}>
                <InlineFormat editor={textEditor} isCompact />
                <ToolDivider />
                <ToolButton label={t.deck.finishWriting} variant='labelled' onClick={props.onFinishEdit}><Check className='vy:size-4' />{t.deck.done}</ToolButton>
            </div>
        );
    }

    return (
        <div role='toolbar' aria-label={t.deck.tools} className={TOOLBAR}>
            {selection.length === 0 ? (
                <>
                    <ToolButton label={t.deck.addText} variant='labelled' disabled={isLocked} onClick={props.onAddText}><Type className='vy:size-4' />{t.deck.text}</ToolButton>
                    {onAddImage === undefined ? null : (
                        <ToolButton label={t.deck.addImage} variant='labelled' disabled={isLocked} onClick={onAddImage}><ImagePlus className='vy:size-4' />{t.deck.image}</ToolButton>
                    )}
                    <ToolPopover label={t.deck.addShape} variant='labelled' icon={<><Shapes className='vy:size-4' />{t.deck.shape}</>} isDisabled={isLocked} width={SHAPE_MENU_WIDTH}>
                        {(close) => (
                            <div className='vy:flex vy:flex-col'>
                                {SHAPES.map((shape) => (
                                    <MenuRow
                                        key={shape.value}
                                        onClick={() => {
                                            props.onAddShape(shape.value);
                                            close();
                                        }}
                                    >
                                        <shape.icon className='vy:size-4 vy:text-muted' aria-hidden='true' />
                                        {t.deck.shapes[shape.value]}
                                    </MenuRow>
                                ))}
                            </div>
                        )}
                    </ToolPopover>
                    <ToolButton label={t.deck.addTable} variant='labelled' disabled={isLocked} onClick={props.onAddTable}><Table2 className='vy:size-4' />{t.deck.table}</ToolButton>
                    <ToolButton label={t.deck.addCode} variant='labelled' disabled={isLocked} onClick={props.onAddCode}><Code2 className='vy:size-4' />{t.deck.code}</ToolButton>
                </>
            ) : (
                <>
                    {single?.type === 'image' && onReplaceImage !== undefined ? (
                        <>
                            <ToolButton label={t.deck.replaceImage} variant='labelled' disabled={isLocked} onClick={onReplaceImage}>{t.deck.replace}</ToolButton>
                            <ToolDivider />
                        </>
                    ) : null}
                    {single?.type === 'code' ? (
                        <>
                            <ToolButton label={t.deck.editCode} variant='labelled' disabled={isLocked} onClick={props.onEditCode}>{t.deck.editCodeShort}</ToolButton>
                            <ToolDivider />
                        </>
                    ) : null}
                    {single?.type === 'table' ? (
                        <>
                            <ToolButton label={t.deck.editTable} variant='labelled' disabled={isLocked} onClick={props.onEditTable}>{t.deck.editTableShort}</ToolButton>
                            <ToolDivider />
                        </>
                    ) : null}
                    <ToolButton label={t.deck.duplicate} disabled={isLocked} onClick={props.onDuplicate}><Copy className='vy:size-4' /></ToolButton>
                    <ToolButton label={t.deck.delete} disabled={isLocked || allLocked} onClick={props.onDelete}><Trash2 className='vy:size-4' /></ToolButton>
                    {canImprove && onImprove !== undefined ? (
                        <>
                            <ToolDivider />
                            <ToolButton label={t.deck.improveHint} variant='labelled' disabled={isLocked} onClick={onImprove}><Sparkles className='vy:size-4' />{t.deck.improve}</ToolButton>
                        </>
                    ) : null}
                </>
            )}
        </div>
    );
};

export default DeckToolbar;
