import { Send, Save } from 'lucide-react'
import { useMemo } from 'react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { executeRequest } from '../../utils/executeRequest'
import { validateJsonBody, validateUrl } from '../../utils/requestValidation'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { KeyValueEditor } from './KeyValueEditor'

export function RequestPanel() {
  const draft = useWorkspaceStore((s) => s.draft)
  const setDraft = useWorkspaceStore((s) => s.setDraft)
  const response = useWorkspaceStore((s) => s.response)
  const setResponse = useWorkspaceStore((s) => s.setResponse)
  const validation = useWorkspaceStore((s) => s.validation)
  const setValidation = useWorkspaceStore((s) => s.setValidation)
  const activeCollectionId = useWorkspaceStore((s) => s.activeCollectionId)
  const openSaveModal = useWorkspaceStore((s) => s.openSaveModal)
  const showToast = useWorkspaceStore((s) => s.showToast)

  const canHaveBody = useMemo(
    () => draft.method === 'POST' || draft.method === 'PUT' || draft.method === 'PATCH',
    [draft.method],
  )

  async function onSend() {
    const urlV = validateUrl(draft.url)
    const jsonV = validateJsonBody(draft.method, draft.body ?? '')
    const nextValidation = { url: urlV.ok ? undefined : urlV.message, jsonBody: jsonV.ok ? undefined : jsonV.message }
    setValidation(nextValidation)
    if (!urlV.ok || !jsonV.ok) return

    setResponse({ kind: 'loading' })
    const result = await executeRequest(draft)
    setResponse(result)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-900 dark:text-white">Request</div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!activeCollectionId}
            onClick={() => {
              if (!activeCollectionId) {
                showToast({ kind: 'error', message: 'Create/select a collection first.' })
                return
              }
              openSaveModal()
            }}
          >
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
          <Button type="button" variant="primary" size="sm" disabled={response.kind === 'loading'} onClick={onSend}>
            <Send className="mr-2 h-4 w-4" />
            Send
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3">
        <div className="grid grid-cols-12 gap-2">
          <label className="col-span-4 grid gap-1.5">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Method</span>
            <select
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              value={draft.method}
              onChange={(e) => setDraft({ method: e.target.value as typeof draft.method })}
              aria-label="Method"
            >
              {(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>

          <label className="col-span-8 grid gap-1.5">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">URL</span>
            <Input
              value={draft.url}
              onChange={(e) => setDraft({ url: e.target.value })}
              error={validation?.url}
              aria-label="URL"
            />
          </label>
        </div>

        <KeyValueEditor kind="params" title="Query params" />
        <KeyValueEditor kind="headers" title="Headers" />

        <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">JSON body</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {canHaveBody ? 'Used for POST/PUT/PATCH' : 'Not sent for this method'}
            </div>
          </div>

          <textarea
            className={[
              'mt-2 min-h-32 w-full resize-y rounded-md border bg-white p-2 font-mono text-xs outline-none',
              validation?.jsonBody
                ? 'border-rose-300 focus:border-rose-400'
                : 'border-slate-200 focus:border-slate-400',
              'dark:border-slate-800 dark:bg-slate-900 dark:text-white',
            ].join(' ')}
            placeholder={canHaveBody ? '{ "key": "value" }' : 'Body disabled for this method'}
            value={draft.body ?? ''}
            onChange={(e) => setDraft({ body: e.target.value })}
            disabled={!canHaveBody}
          />
          {validation?.jsonBody ? <div className="mt-1 text-xs font-medium text-rose-700">{validation.jsonBody}</div> : null}
        </div>
      </div>
    </div>
  )
}

