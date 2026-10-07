export type Cell = string | number | boolean | null
export type DataType = 'number' | 'date' | 'boolean' | 'text'
export type Row = Record<string, Cell>
export interface ColumnProfile { name: string; type: DataType; nonEmpty: number; missing: number; unique: number; }
export interface Dataset { rows: Row[]; columns: ColumnProfile[]; sourceName: string; removedBlankRows: number; }
