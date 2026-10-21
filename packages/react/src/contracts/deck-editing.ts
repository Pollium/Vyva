export type TextCaret = { x: number; y: number } | 'all' | 'end';

export interface CellRef{
    row: number;
    column: number;
}

export type DeckEditing =
    | { kind: 'text'; id: string; caret: TextCaret }
    | { kind: 'cell'; id: string; cell: CellRef };
