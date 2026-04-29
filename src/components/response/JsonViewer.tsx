import { ChevronDown, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'

type Props = {
  value: unknown
  className?: string
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === 'object' && !Array.isArray(v)
}

function tryParseJson(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const t = value.trim()
  if (!t) return value
  if (!(t.startsWith('{') || t.startsWith('['))) return value
  try {
    return JSON.parse(t)
  } catch {
    return value
  }
}

function JsonNode({
  label,
  value,
  depth,
}: {
  label?: string
  value: unknown
  depth: number
}) {
  const [open, setOpen] = useState(depth < 2)

  const isArray = Array.isArray(value)
  const isObj = isPlainObject(value)

  if (!isArray && !isObj) {
    const rendered =
      value === null
        ? 'null'
        : value === undefined
          ? 'undefined'
          : typeof value === 'string'
            ? `"${value}"`
            : String(value)
    const color =
      value === null
        ? 'text-slate-500'
        : typeof value === 'string'
          ? 'text-emerald-700 dark:text-emerald-300'
          : typeof value === 'number'
            ? 'text-indigo-700 dark:text-indigo-300'
            : typeof value === 'boolean'
              ? 'text-rose-700 dark:text-rose-300'
              : 'text-slate-700 dark:text-slate-200'

    return (
      <div className="flex min-w-0 items-start gap-2">
        {label ? <span className="shrink-0 text-slate-600 dark:text-slate-300">{label}:</span> : null}
        <span className={['break-words', color].join(' ')}>{rendered}</span>
      </div>
    )
  }

  const entries: Array<[string, unknown]> = isArray
    ? (value as unknown[]).map((v, i) => [String(i), v])
    : Object.entries(value as Record<string, unknown>)

  const summary = isArray ? `[${entries.length}]` : `{${entries.length}}`

  return (
    <div>
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-md px-1 py-0.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Collapse JSON node' : 'Expand JSON node'}
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-slate-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-500" />
        )}
        {label ? <span className="text-slate-700 dark:text-slate-200">{label}:</span> : null}
        <span className="text-slate-500 dark:text-slate-400">{summary}</span>
      </button>

      {open ? (
        <div className="ml-4 mt-1 grid gap-1 border-l border-slate-200 pl-3 dark:border-slate-800">
          {entries.map(([k, v]) => (
            <JsonNode key={k} label={isArray ? `[${k}]` : k} value={v} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function JsonViewer({ value, className = '' }: Props) {
  const parsed = useMemo(() => tryParseJson(value), [value])

  if (typeof parsed === 'string') {
    return (
      <pre
        className={[
          'whitespace-pre-wrap break-words font-mono text-xs text-slate-800 dark:text-slate-100',
          className,
        ].join(' ')}
      >
        {parsed}
      </pre>
    )
  }

  return (
    <div className={['font-mono text-xs text-slate-800 dark:text-slate-100', className].join(' ')}>
      <JsonNode value={parsed} depth={0} />
    </div>
  )
}

