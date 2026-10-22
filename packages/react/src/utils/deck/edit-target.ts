import type { CellRef, DeckEditing } from '../../contracts/deck-editing';
import { holdsText } from './deck-ops';
import type { SlideElement } from '@pollium/vyva-core/content';
import type { PointerEvent } from 'react';

const FIRST_CELL: CellRef = { row: 0, column: 0 };

const cellAt = (target: EventTarget | null): CellRef => {
    const cell = target instanceof Element ? target.closest('td, th') : null;
    if(!(cell instanceof HTMLTableCellElement) || !(cell.parentElement instanceof HTMLTableRowElement)) return FIRST_CELL;

    return { row: cell.parentElement.rowIndex, column: cell.cellIndex };
};

export const editAt = (event: PointerEvent, element: SlideElement): DeckEditing | null => {
    if(element.type === 'table') return { kind: 'cell', id: element.id, cell: cellAt(event.target) };
    if(holdsText(element)) return { kind: 'text', id: element.id, caret: { x: event.clientX, y: event.clientY } };

    return null;
};

export const editsInPlace = (element: SlideElement, editing: DeckEditing | null): boolean => {
    if(editing === null || editing.id !== element.id) return false;
    if(editing.kind === 'cell') return element.type === 'table';

    return holdsText(element);
};
