import type { CellRef } from '../../../contracts/deck-editing';
import { useMessages } from '../../../messages/context';
import { columnsOf } from '../../../utils/deck/table-ops';
import { MAX_CELL_TEXT, MAX_TABLE_COLUMNS, MAX_TABLE_ROWS, type DeckContent, type TableElement } from '@pollium/vyva-core/content';
import { deckFont, deckTextColor } from '@pollium/vyva-core/render';
import { useEffect, useRef, type CSSProperties } from 'react';

interface TableCellsEditorProps{
    table: TableElement;
    deck: DeckContent;
    cell: CellRef;
    onCell: (cell: CellRef) => void;
    onChange: (rows: string[][]) => void;
    onDone: () => void;
}

const ACTIVE: CSSProperties = { outline: '3px solid var(--vy-color-selection)', outlineOffset: -3 };

const TableCellsEditor = ({ table, deck, cell, onCell, onChange, onDone }: TableCellsEditorProps) => {
    const t = useMessages();
    const columns = columnsOf(table.rows);
    const area = useRef<HTMLTextAreaElement | null>(null);
    const value = table.rows[cell.row]?.[cell.column] ?? '';

    useEffect(() => {
        const node = area.current;
        if(node === null) return;

        node.focus();
        node.setSelectionRange(node.value.length, node.value.length);
    }, [cell.row, cell.column]);

    const write = (next: string) => onChange(table.rows.map((row, at) => at === cell.row
        ? Array.from({ length: columns }, (_, column) => column === cell.column ? next : row[column] ?? '')
        : row));

    const step = (forward: boolean) => {
        const index = cell.row * columns + cell.column + (forward ? 1 : -1);
        if(index < 0) return;
        if(index >= table.rows.length * columns){
            if(table.rows.length >= MAX_TABLE_ROWS) return;
            onChange([...table.rows, Array.from({ length: columns }, () => '')]);
        }
        onCell({ row: Math.floor(index / columns), column: index % columns });
    };

    return (
        <table
            className='vy-table'
            style={{ fontSize: table.fontSize, color: deckTextColor(deck), fontFamily: deckFont(deck) }}
            onPointerDown={(event) => event.stopPropagation()}
        >
            <tbody>
                {table.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                        {Array.from({ length: Math.min(columns, MAX_TABLE_COLUMNS) }, (_, column) => {
                            const isHeader = table.hasHeader && rowIndex === 0;
                            const isActive = rowIndex === cell.row && column === cell.column;
                            const Cell = isHeader ? 'th' : 'td';
                            const style: CSSProperties = isHeader
                                ? { border: `1px solid ${table.borderColor}`, background: table.headerFill, color: '#ffffff', fontWeight: 600 }
                                : { border: `1px solid ${table.borderColor}` };

                            return (
                                <Cell key={column} style={isActive ? { ...style, ...ACTIVE } : style} onPointerDown={() => onCell({ row: rowIndex, column })}>
                                    {isActive ? (
                                        <textarea
                                            ref={area}
                                            value={value}
                                            rows={Math.max(1, value.split('\n').length)}
                                            maxLength={MAX_CELL_TEXT}
                                            aria-label={t.deck.cellOf(rowIndex + 1, column + 1)}
                                            onChange={(event) => write(event.target.value)}
                                            onKeyDown={(event) => {
                                                if(event.key === 'Tab'){
                                                    event.preventDefault();
                                                    step(!event.shiftKey);
                                                }else if(event.key === 'Escape'){
                                                    event.preventDefault();
                                                    event.stopPropagation();
                                                    onDone();
                                                }
                                            }}
                                            className='vy:block vy:w-full vy:resize-none vy:border-0 vy:bg-transparent vy:p-0 vy:outline-none'
                                            style={{ font: 'inherit', color: 'inherit', lineHeight: 'inherit' }}
                                        />
                                    ) : row[column] ?? ''}
                                </Cell>
                            );
                        })}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default TableCellsEditor;
