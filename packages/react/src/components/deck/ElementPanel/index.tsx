import ArrangeSection from '../ArrangeSection';
import CodePanel from '../CodePanel';
import FrameFields from '../FrameFields';
import InlineFormat from '../InlineFormat';
import ShapeSection from '../ShapeSection';
import SlideImageSection from '../SlideImageSection';
import TableTools from '../TableTools';
import TextStyleSection from '../TextStyleSection';
import PanelDisclosure from '../../editor/PanelDisclosure';
import PanelSection from '../../editor/PanelSection';
import type { DeckEditing } from '../../../contracts/deck-editing';
import { useMessages } from '../../../messages/context';
import type { Align, Arrange } from '../../../utils/deck/deck-ops';
import type { CodeElement, DeckContent, ImageElement, ShapeElement, SlideElement, TableElement } from '@pollium/vyva-core/content';
import type { Editor } from '@tiptap/react';

interface ElementPanelProps{
    deck: DeckContent;
    slideNumber: number;
    selection: SlideElement[];
    editing: DeckEditing | null;
    textEditor: Editor | null;
    isLocked: boolean;
    onPatch: (patch: (element: SlideElement) => SlideElement) => void;
    onArrange: (how: Arrange) => void;
    onAlign: (how: Align) => void;
    onToggleLock: () => void;
    onEditCode: () => void;
}

const ElementPanel = ({ deck, slideNumber, selection, editing, textEditor, isLocked, onPatch, onArrange, onAlign, onToggleLock, onEditCode }: ElementPanelProps) => {
    const t = useMessages();
    const single = selection.length === 1 ? selection[0] : null;
    const isEditingText = textEditor !== null && editing?.kind === 'text';
    const patchShape = (change: (shape: ShapeElement) => ShapeElement) => onPatch((element) => element.type === 'shape' ? change(element) : element);
    const patchImage = (change: (image: ImageElement) => ImageElement) => onPatch((element) => element.type === 'image' ? change(element) : element);
    const patchTable = (change: (table: TableElement) => TableElement) => onPatch((element) => element.type === 'table' ? change(element) : element);
    const patchCode = (change: (code: CodeElement) => CodeElement) => onPatch((element) => element.type === 'code' ? change(element) : element);

    return (
        <div className='vy:flex vy:flex-col'>
            <header className='vy:pb-1 vy:pt-3'>
                <h2 className='vy:text-[1rem] vy:font-semibold vy:text-foreground'>{single === null ? t.deck.elementCount(selection.length) : t.deck.kinds[single.type]}</h2>
                <p className='vy:text-[0.8125rem] vy:text-muted'>{t.deck.slide(slideNumber)}</p>
            </header>

            {isEditingText ? (
                <PanelSection title={t.deck.selectedText}>
                    <div className='vy:flex vy:flex-wrap vy:items-center vy:gap-0.5'>
                        <InlineFormat editor={textEditor} />
                    </div>
                </PanelSection>
            ) : null}

            {single === null || isEditingText ? null : <TextStyleSection element={single} theme={deck.theme} isLocked={isLocked} onPatch={onPatch} />}
            {single?.type === 'shape' ? <ShapeSection shape={single} isLocked={isLocked} onPatch={patchShape} /> : null}
            {single?.type === 'image' ? <SlideImageSection image={single} isLocked={isLocked} onPatch={patchImage} /> : null}

            {single?.type === 'code' ? (
                <PanelSection title={t.deck.code}>
                    <CodePanel code={single} isLocked={isLocked} onPatch={patchCode} onEdit={onEditCode} />
                </PanelSection>
            ) : null}

            {single?.type === 'table' ? (
                <PanelSection title={t.deck.table}>
                    <TableTools table={single} cell={editing?.kind === 'cell' && editing.id === single.id ? editing.cell : null} isLocked={isLocked} onPatch={patchTable} />
                </PanelSection>
            ) : null}

            {isEditingText ? null : <ArrangeSection selection={selection} isLocked={isLocked} onArrange={onArrange} onAlign={onAlign} onToggleLock={onToggleLock} onPatch={onPatch} />}

            {single === null || isEditingText ? null : (
                <PanelDisclosure title={t.deck.positionAndSize}>
                    <FrameFields element={single} isLocked={isLocked} onChange={(key, value) => onPatch((element) => ({ ...element, [key]: value }))} />
                </PanelDisclosure>
            )}
        </div>
    );
};

export default ElementPanel;
