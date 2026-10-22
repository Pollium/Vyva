import Button from '../../ui/Button';
import CheckboxField from '../../ui/CheckboxField';
import Modal from '../../ui/Modal';
import type { CellRef } from '../../../contracts/deck-editing';
import { useMessages } from '../../../messages/context';
import { columnsOf, insertColumn, insertRow, removeColumn, removeRow } from '../../../utils/deck/table-ops';
import { MAX_CELL_TEXT, MAX_TABLE_COLUMNS, MAX_TABLE_ROWS, type TableElement } from '@pollium/vyva-core/content';
import { BetweenHorizontalEnd, BetweenHorizontalStart, BetweenVerticalEnd, BetweenVerticalStart, TableColumnsSplit, TableRowsSplit } from 'lucide-react';
import { useState } from 'react';

interface TableDialogProps{
    table: TableElement;
    isLocked: boolean;
    onSave: (rows: string[][], hasHeader: boolean) => void;
    onClose: () => void;
}

const TableDialog = ({ table, isLocked, onSave, onClose }: TableDialogProps) => {
    const t = useMessages();
    const [rows, setRows] = useState<string[][]>(() => table.rows.map((row) => [...row]));
    const [hasHeader, setHeader] = useState(table.hasHeader);
    const [focus, setFocus] = useState<CellRef>({ row: 0, column: 0 });
    const columns = columnsOf(rows);
    const padded = (cells: string[]) => Array.from({ length: columns }, (_, index) => cells[index] ?? '');

    const setCell = (row: number, column: number, value: string) =>
        setRows((current) => current.map((cells, at) => at === row ? padded(cells).map((cell, index) => index === column ? value : cell) : cells));

    const edits = [
        { label: t.editor.addRowAbove, icon: BetweenHorizontalStart, isDisabled: rows.length >= MAX_TABLE_ROWS, run: () => setRows((current) => insertRow(current, focus.row)) },
        { label: t.editor.addRowBelow, icon: BetweenHorizontalEnd, isDisabled: rows.length >= MAX_TABLE_ROWS, run: () => setRows((current) => insertRow(current, focus.row + 1)) },
        { label: t.editor.addColumnLeft, icon: BetweenVerticalStart, isDisabled: columns >= MAX_TABLE_COLUMNS, run: () => setRows((current) => insertColumn(current, focus.column)) },
        { label: t.editor.addColumnRight, icon: BetweenVerticalEnd, isDisabled: columns >= MAX_TABLE_COLUMNS, run: () => setRows((current) => insertColumn(current, focus.column + 1)) },
        {
            label: t.editor.removeRow,
            icon: TableRowsSplit,
            isDisabled: rows.length <= 1,
            run: () => {
                setRows((current) => removeRow(current, focus.row));
                setFocus({ row: Math.max(0, focus.row - 1), column: focus.column });
            }
        },
        {
            label: t.editor.removeColumn,
            icon: TableColumnsSplit,
            isDisabled: columns <= 1,
            run: () => {
                setRows((current) => removeColumn(current, focus.column));
                setFocus({ row: focus.row, column: Math.max(0, focus.column - 1) });
            }
        }
    ];

    return (
        <Modal isOpen onOpenChange={(isOpen) => { if(!isOpen) onClose(); }} title={t.deck.editTableShort} width='wide'>
            <div className='vy:flex vy:flex-col vy:gap-4'>
                <div className='vy:flex vy:flex-wrap vy:items-center vy:gap-2'>
                    <span className='vy:text-[0.8125rem] vy:text-muted'>{t.deck.cellOf(focus.row + 1, focus.column + 1)}</span>
                    {edits.map((edit) => (
                        <Button key={edit.label} size='sm' variant='secondary' isDisabled={edit.isDisabled} onPress={edit.run}>
                            <edit.icon className='vy:size-3.5' aria-hidden='true' />
                            {edit.label}
                        </Button>
                    ))}
                </div>

                <div className='vy:max-h-[55vh] vy:overflow-auto'>
                    <table className='vy:w-full vy:border-collapse'>
                        <tbody>
                            {rows.map((cells, row) => (
                                <tr key={row}>
                                    {padded(cells).map((cell, column) => (
                                        <td key={column} className={`vy:border vy:border-foreground/10 vy:p-0 ${focus.row === row && focus.column === column ? 'vy:outline-2 vy:-outline-offset-2 vy:outline-selection' : ''}`}>
                                            <textarea
                                                aria-label={t.deck.cellOf(row + 1, column + 1)}
                                                value={cell}
                                                rows={Math.max(1, cell.split('\n').length)}
                                                maxLength={MAX_CELL_TEXT}
                                                onFocus={() => setFocus({ row, column })}
                                                onChange={(event) => setCell(row, column, event.target.value)}
                                                className={`vy:block vy:w-full vy:min-w-24 vy:resize-none vy:bg-transparent vy:px-2 vy:py-1.5 vy:text-[0.875rem] vy:text-foreground vy:focus:bg-foreground/[0.04] vy:focus:outline-none ${hasHeader && row === 0 ? 'vy:font-semibold' : ''}`}
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className='vy:flex vy:flex-wrap vy:items-center vy:justify-between vy:gap-3'>
                    <CheckboxField label={t.deck.firstRowHeader} isSelected={hasHeader} onChange={setHeader} />
                    <span className='vy:text-[0.75rem] vy:text-muted'>{t.deck.tableLimits(MAX_TABLE_ROWS, MAX_TABLE_COLUMNS)}</span>
                </div>

                <div className='vy:flex vy:justify-end vy:gap-2'>
                    <Button variant='secondary' onPress={onClose}>{t.ui.cancel}</Button>
                    <Button isDisabled={isLocked} onPress={() => onSave(rows.map(padded), hasHeader)}>{t.deck.saveTable}</Button>
                </div>
            </div>
        </Modal>
    );
};

export default TableDialog;
