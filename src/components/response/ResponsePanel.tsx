import { Copy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { Button } from '../common/Button'
import { JsonViewer } from './JsonViewer'

function toCopyText(value: unknown) {
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export function ResponsePanel() {
  const response = useWorkspaceStore((s) => s.response)
  const showToast = useWorkspaceStore((s) => s.showToast)
  const [tab, setTab] = useState<'body' | 'headers'>('body')

  const statusBadge = useMemo(() => {
    if (response.kind !== 'success') return null
    const ok = response.status < 400
    return (
      <span
        className={[
          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
          ok
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200'
            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200',
        ].join(' ')}
      >
        {response.status}
      </span>
    )
  }, [response])

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-900 dark:text-white">Response</div>
        <div className="flex items-center gap-2">
          {response.kind === 'success' ? (
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              {statusBadge}
              <span>{response.timeMs}ms</span>
            </div>
          ) : null}

          {response.kind === 'success' ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={async () => {
                const text =
                  tab === 'body' ? toCopyText(response.data) : toCopyText(response.headers)
                try {
                  await navigator.clipboard.writeText(text)
                  showToast({ kind: 'success', message: 'Copied response.' })
                } catch {
                  showToast({ kind: 'error', message: 'Copy failed.' })
                }
              }}
              aria-label="Copy response"
              title="Copy"
            >
              <Copy className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>

      {response.kind === 'idle' ? (
        <div className="mt-4 rounded-lg border border-dashed border-slate-200 p-3 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Send a request to see status, headers, and body.
        </div>
      ) : null}

      {response.kind === 'loading' ? (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
          Loading…
        </div>
      ) : null}

      {response.kind === 'error' ? (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
          <div className="font-semibold">Error</div>
          <div className="mt-1">{response.message}</div>
          {typeof response.status === 'number' ? (
            <div className="mt-2 text-xs opacity-90">Status: {response.status}</div>
          ) : null}
          {typeof response.timeMs === 'number' ? <div className="text-xs opacity-90">Time: {response.timeMs}ms</div> : null}
        </div>
      ) : null}

      {response.kind === 'success' ? (
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={[
                'rounded-md px-2 py-1 text-xs font-semibold',
                tab === 'body'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
              ].join(' ')}
              onClick={() => setTab('body')}
            >
              Body
            </button>
            <button
              type="button"
              className={[
                'rounded-md px-2 py-1 text-xs font-semibold',
                tab === 'headers'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
              ].join(' ')}
              onClick={() => setTab('headers')}
            >
              Headers
            </button>
          </div>

          <div className="mt-3 max-h-[60vh] overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
            <JsonViewer value={tab === 'body' ? response.data : response.headers} />
          </div>
        </div>
      ) : null}
    </div>
  )
}

