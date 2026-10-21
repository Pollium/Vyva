import PanelRow from '../../editor/PanelRow';
import PanelSection from '../../editor/PanelSection';
import ToolButton from '../../editor/ToolButton';
import ToggleField from '../../ui/ToggleField';
import { useMessages } from '../../../messages/context';
import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import { BetweenHorizontalEnd, BetweenHorizontalStart, BetweenVerticalEnd, BetweenVerticalStart, Minus, TableCellsMerge, Trash2 } from 'lucide-react';

interface TableSectionProps{
    editor: Editor;
    isLocked: boolean;
}

const TableSection = ({ editor, isLocked }: TableSectionProps) => {
    const t = useMessages();
    const state = useEditorState({
        editor,
        selector: ({ editor: current }) => ({
            isHeaderRow: current.isActive('tableHeader'),
            canMergeOrSplit: current.can().mergeOrSplit()
        })
    });
    const chain = () => editor.chain().focus();

    return (
        <PanelSection title={t.document.table}>
            <ToggleField label={t.editor.headerRow} isSelected={state.isHeaderRow} isDisabled={isLocked} onChange={() => chain().toggleHeaderRow().run()} />
            <PanelRow label={t.document.rows}>
                <ToolButton label={t.editor.addRowAbove} disabled={isLocked} onClick={() => chain().addRowBefore().run()}><BetweenHorizontalStart className='vy:size-4' /></ToolButton>
                <ToolButton label={t.editor.addRowBelow} disabled={isLocked} onClick={() => chain().addRowAfter().run()}><BetweenHorizontalEnd className='vy:size-4' /></ToolButton>
                <ToolButton label={t.editor.removeRow} disabled={isLocked} onClick={() => chain().deleteRow().run()}><Minus className='vy:size-4' /></ToolButton>
            </PanelRow>
            <PanelRow label={t.document.columns}>
                <ToolButton label={t.editor.addColumnLeft} disabled={isLocked} onClick={() => chain().addColumnBefore().run()}><BetweenVerticalStart className='vy:size-4' /></ToolButton>
                <ToolButton label={t.editor.addColumnRight} disabled={isLocked} onClick={() => chain().addColumnAfter().run()}><BetweenVerticalEnd className='vy:size-4' /></ToolButton>
                <ToolButton label={t.editor.removeColumn} disabled={isLocked} onClick={() => chain().deleteColumn().run()}><Minus className='vy:size-4' /></ToolButton>
            </PanelRow>
            <PanelRow label={t.document.cells}>
                <ToolButton label={t.document.mergeOrSplit} disabled={isLocked || !state.canMergeOrSplit} onClick={() => chain().mergeOrSplit().run()}><TableCellsMerge className='vy:size-4' /></ToolButton>
            </PanelRow>
            <ToolButton label={t.document.deleteTable} variant='labelled' disabled={isLocked} className='vy:self-start vy:text-muted' onClick={() => chain().deleteTable().run()}>
                <Trash2 className='vy:size-4' />
                {t.document.deleteTable}
            </ToolButton>
        </PanelSection>
    );
};

export default TableSection;
