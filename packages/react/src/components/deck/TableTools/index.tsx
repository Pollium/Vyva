import PanelRow from '../../editor/PanelRow';
import ColorMenu from '../../editor/ColorMenu';
import ToolButton from '../../editor/ToolButton';
import SelectInput from '../../ui/SelectInput';
import type { CellRef } from '../../../contracts/deck-editing';
import { useMessages } from '../../../messages/context';
import { numberOptions } from '../../../utils/deck/number-options';
import { insertColumn, insertRow, removeColumn, removeRow } from '../../../utils/deck/table-ops';
import type { TableElement } from '@vyva/core/content';
import { BetweenHorizontalEnd, BetweenHorizontalStart, BetweenVerticalEnd, BetweenVerticalStart, Heading, PaintBucket, Square, TableColumnsSplit, TableRowsSplit } from 'lucide-react';

const TABLE_SIZES = [14, 16, 20, 24, 28, 32, 40];

interface TableToolsProps{
    table: TableElement;
    cell: CellRef | null;
    isLocked: boolean;
    onPatch: (change: (table: TableElement) => TableElement) => void;
}

const TableTools = ({ table, cell, isLocked, onPatch }: TableToolsProps) => {
    const t = useMessages();
    const rows = (change: (current: string[][]) => string[][]) => onPatch((current) => ({ ...current, rows: change(current.rows) }));

    return (
        <>
            <PanelRow label={t.editor.fontSize}>
                <SelectInput label={t.deck.tableFontSize} hideLabel className='vy:w-24' isDisabled={isLocked} value={String(table.fontSize)} options={numberOptions(TABLE_SIZES, table.fontSize, String)} onChange={(value) => onPatch((current) => ({ ...current, fontSize: Number(value) }))} />
            </PanelRow>
            <PanelRow label={t.deck.tableHeader}>
                <ToolButton label={t.editor.headerRow} isActive={table.hasHeader} disabled={isLocked} onClick={() => onPatch((current) => ({ ...current, hasHeader: !current.hasHeader }))}><Heading className='vy:size-4' /></ToolButton>
                <ColorMenu label={t.deck.headerColor} value={table.headerFill} isDisabled={isLocked} onPick={(color) => color !== null && onPatch((current) => ({ ...current, headerFill: color }))} icon={<PaintBucket className='vy:size-4' />} />
            </PanelRow>
            <PanelRow label={t.deck.borders}>
                <ColorMenu label={t.deck.borderColor} value={table.borderColor} isDisabled={isLocked} onPick={(color) => color !== null && onPatch((current) => ({ ...current, borderColor: color }))} icon={<Square className='vy:size-4' />} />
            </PanelRow>
            {cell === null ? null : (
                <div className='vy:flex vy:flex-wrap vy:gap-0.5' role='group' aria-label={t.deck.rowsAndColumns}>
                    <ToolButton label={t.editor.addRowAbove} disabled={isLocked} onClick={() => rows((current) => insertRow(current, cell.row))}><BetweenHorizontalStart className='vy:size-4' /></ToolButton>
                    <ToolButton label={t.editor.addRowBelow} disabled={isLocked} onClick={() => rows((current) => insertRow(current, cell.row + 1))}><BetweenHorizontalEnd className='vy:size-4' /></ToolButton>
                    <ToolButton label={t.editor.addColumnLeft} disabled={isLocked} onClick={() => rows((current) => insertColumn(current, cell.column))}><BetweenVerticalStart className='vy:size-4' /></ToolButton>
                    <ToolButton label={t.editor.addColumnRight} disabled={isLocked} onClick={() => rows((current) => insertColumn(current, cell.column + 1))}><BetweenVerticalEnd className='vy:size-4' /></ToolButton>
                    <ToolButton label={t.editor.removeRow} disabled={isLocked || table.rows.length <= 1} onClick={() => rows((current) => removeRow(current, cell.row))}><TableRowsSplit className='vy:size-4' /></ToolButton>
                    <ToolButton label={t.editor.removeColumn} disabled={isLocked} onClick={() => rows((current) => removeColumn(current, cell.column))}><TableColumnsSplit className='vy:size-4' /></ToolButton>
                </div>
            )}
        </>
    );
};

export default TableTools;
