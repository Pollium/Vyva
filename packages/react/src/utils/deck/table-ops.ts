import { MAX_TABLE_COLUMNS, MAX_TABLE_ROWS } from '@pollium/vyva-core/content';

export const columnsOf = (rows: string[][]): number => Math.max(1, ...rows.map((row) => row.length));

const rectangular = (rows: string[][]): string[][] => {
    const columns = columnsOf(rows);

    return rows.map((row) => Array.from({ length: columns }, (_, column) => row[column] ?? ''));
};

export const insertRow = (rows: string[][], at: number): string[][] => {
    if(rows.length >= MAX_TABLE_ROWS) return rows;

    const grid = rectangular(rows);
    const index = Math.min(Math.max(0, at), grid.length);

    return [...grid.slice(0, index), Array.from({ length: columnsOf(grid) }, () => ''), ...grid.slice(index)];
};

export const removeRow = (rows: string[][], at: number): string[][] =>
    rows.length <= 1 ? rows : rows.filter((_row, index) => index !== at);

export const insertColumn = (rows: string[][], at: number): string[][] => {
    const grid = rectangular(rows);
    if(columnsOf(grid) >= MAX_TABLE_COLUMNS) return rows;

    const index = Math.min(Math.max(0, at), columnsOf(grid));

    return grid.map((row) => [...row.slice(0, index), '', ...row.slice(index)]);
};

export const removeColumn = (rows: string[][], at: number): string[][] => {
    const grid = rectangular(rows);
    if(columnsOf(grid) <= 1) return rows;

    return grid.map((row) => row.filter((_cell, index) => index !== at));
};
