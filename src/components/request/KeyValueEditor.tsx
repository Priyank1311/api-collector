import { Plus, Trash2 } from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { Button } from '../common/Button'

export function KeyValueEditor({ kind, title }: { kind: 'headers' | 'params'; title: string }) {
  const rows = useWorkspaceStore((s) => s.draft[kind])
  const setRow = useWorkspaceStore((s) => s.setDraftRow)
  const add = useWorkspaceStore((s) => s.addDraftRow)
  const remove = useWorkspaceStore((s) => s.removeDraftRow)

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{title}</div>
        <Button type="button" variant="secondary" size="sm" onClick={() => add(kind)}>
          <Plus className="mr-2 h-4 w-4" />
          Add
        </Button>
      </div>

      <div className="mt-2 grid gap-2">
        {rows.map((r) => (
          <div key={r.id} className="grid grid-cols-12 gap-2">
            <input
              className="col-span-5 h-9 rounded-md border border-slate-200 bg-white px-2 text-sm outline-none focus:border-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              placeholder="Key"
              value={r.key}
              onChange={(e) => setRow(kind, r.id, { key: e.target.value })}
            />
            <input
              className="col-span-6 h-9 rounded-md border border-slate-200 bg-white px-2 text-sm outline-none focus:border-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              placeholder="Value"
              value={r.value}
              onChange={(e) => setRow(kind, r.id, { value: e.target.value })}
            />
            <div className="col-span-1 flex justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => remove(kind, r.id)} aria-label="Remove row">
                <Trash2 className="h-4 w-4 text-rose-600" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

