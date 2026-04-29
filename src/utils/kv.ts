import type { KeyValueRow } from '../types'

export function normalizeRows(rows: KeyValueRow[]) {
  return rows
    .map((r) => ({ key: r.key.trim(), value: r.value }))
    .filter((r) => r.key.length > 0)
}

export function rowsToRecord(rows: KeyValueRow[]) {
  const out: Record<string, string> = {}
  for (const row of normalizeRows(rows)) out[row.key] = row.value
  return out
}

