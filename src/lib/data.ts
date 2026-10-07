import type { Cell, ColumnProfile, DataType, Dataset, Row } from '../types'

const empty = (v: unknown) => v === null || v === undefined || String(v).trim() === ''
export const dateLike = (name: string) => /date|time|month|year|day|created|order/i.test(name)
export const moneyLike = (name: string) => /revenue|sales|amount|income|profit|price|cost|total|value/i.test(name)

export function inferType(name: string, values: Cell[]): DataType {
  const usable = values.filter(v => !empty(v)); if (!usable.length) return 'text'
  const numbers = usable.filter(v => typeof v === 'number' || (typeof v === 'string' && /^[-+]?\d*\.?\d+$/.test(v.trim()))).length
  const bools = usable.filter(v => typeof v === 'boolean' || /^(true|false|yes|no)$/i.test(String(v))).length
  const dates = usable.filter(v => !Number.isNaN(Date.parse(String(v))) && /[-/]|\d{4}/.test(String(v))).length
  if (numbers / usable.length >= .8) return 'number'
  if ((dateLike(name) && dates / usable.length >= .6) || dates / usable.length >= .85) return 'date'
  if (bools / usable.length >= .8) return 'boolean'
  return 'text'
}

export function profileRows(input: Record<string, unknown>[], sourceName: string): Dataset {
  const keys = [...new Set(input.flatMap(r => Object.keys(r).map(k => k.trim()).filter(Boolean)))].slice(0, 100)
  const cleaned = input.map(row => {
    const normalized = Object.fromEntries(Object.entries(row).map(([key, value]) => [key.trim(), value]))
    return Object.fromEntries(keys.map(k => [k, empty(normalized[k]) ? null : typeof normalized[k] === 'string' ? normalized[k].trim() : normalized[k] as Cell]))
  }).filter(r => Object.values(r).some(v => !empty(v))) as Row[]
  const columns: ColumnProfile[] = keys.map(name => { const vals = cleaned.map(r => r[name]); const nonEmpty = vals.filter(v => !empty(v)); return { name, type: inferType(name, vals), nonEmpty: nonEmpty.length, missing: cleaned.length - nonEmpty.length, unique: new Set(nonEmpty.map(String)).size } })
  return { rows: cleaned, columns, sourceName, removedBlankRows: input.length - cleaned.length }
}

export function toNumber(value: Cell): number | null { const n = typeof value === 'number' ? value : Number(String(value).replace(/[$,]/g, '')); return Number.isFinite(n) ? n : null }
export function formatNumber(value: number, currency = false) { return new Intl.NumberFormat('en-US', { style: currency ? 'currency' : 'decimal', currency: 'USD', maximumFractionDigits: 0 }).format(value) }
export function numericColumns(d: Dataset) { return d.columns.filter(c => c.type === 'number') }
export function categoryColumns(d: Dataset) { return d.columns.filter(c => c.type === 'text' && c.unique > 1 && c.unique <= Math.max(20, d.rows.length * .6)) }
export function dateColumns(d: Dataset) { return d.columns.filter(c => c.type === 'date') }

export function groupedData(rows: Row[], category: string, metric: string) { const m = new Map<string, number>(); rows.forEach(r => { const key = String(r[category] ?? 'Unspecified'); const val = toNumber(r[metric]); if (val !== null) m.set(key, (m.get(key) ?? 0) + val) }); return [...m].map(([name, value]) => ({ name, value })).sort((a,b) => b.value-a.value).slice(0, 10) }
