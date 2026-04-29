import { Check, FolderPlus, Pencil, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { Button } from '../common/Button'

export function Sidebar() {
  const collections = useWorkspaceStore((s) => s.collections)
  const activeCollectionId = useWorkspaceStore((s) => s.activeCollectionId)
  const setActiveCollection = useWorkspaceStore((s) => s.setActiveCollection)
  const createCollection = useWorkspaceStore((s) => s.createCollection)
  const renameCollection = useWorkspaceStore((s) => s.renameCollection)
  const deleteCollection = useWorkspaceStore((s) => s.deleteCollection)
  const loadRequestIntoDraft = useWorkspaceStore((s) => s.loadRequestIntoDraft)

  const activeCollection = useMemo(
    () => collections.find((c) => c.id === activeCollectionId),
    [collections, activeCollectionId],
  )

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  return (
    <div className="w-full min-w-0 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-900 dark:text-white">Collections</div>
        <Button type="button" variant="secondary" size="sm" onClick={() => createCollection()}>
          <FolderPlus className="mr-2 h-4 w-4" />
          New
        </Button>
      </div>

      {collections.length === 0 ? (
        <div className="mt-3 rounded-lg border border-dashed border-slate-200 p-3 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Create a collection to start saving requests.
        </div>
      ) : (
        <div className="mt-3 grid gap-2">
          {collections.map((c) => {
            const selected = c.id === activeCollectionId
            const isEditing = editingId === c.id
            return (
              <div
                key={c.id}
                className={[
                  'min-w-0 rounded-lg border px-3 py-2',
                  selected
                    ? 'border-indigo-200 bg-indigo-50 dark:border-indigo-900/60 dark:bg-indigo-950/40'
                    : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    onClick={() => setActiveCollection(c.id)}
                  >
                    <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">{c.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{c.requests.length}</div>
                  </button>

                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          renameCollection(c.id, editingName)
                          setEditingId(null)
                        }}
                        aria-label="Save rename"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingId(c.id)
                          setEditingName(c.name)
                        }}
                        aria-label="Rename collection"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCollection(c.id)}
                      aria-label="Delete collection"
                    >
                      <Trash2 className="h-4 w-4 text-rose-600" />
                    </Button>
                  </div>
                </div>

                {isEditing ? (
                  <input
                    className="mt-2 h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm outline-none focus:border-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        renameCollection(c.id, editingName)
                        setEditingId(null)
                      }
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    autoFocus
                  />
                ) : null}

                {selected ? (
                  <div className="mt-2 border-t border-slate-200 pt-2 dark:border-slate-800">
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">Saved requests</div>
                    {activeCollection?.requests.length ? (
                      <div className="mt-2 grid gap-1">
                        {activeCollection.requests.map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            className="flex w-full min-w-0 items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
                            onClick={() => loadRequestIntoDraft(r)}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                                {r.name}
                              </div>
                              <div className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                                {r.method} · {r.url}
                              </div>
                            </div>
                            <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                              Open
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        No saved requests yet.
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
