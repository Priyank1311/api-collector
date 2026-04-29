import { useMemo, useState } from 'react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { Button } from '../common/Button'
import { isWorkspaceSyncEnabled, putWorkspace } from '../../utils/workspaceSync'

export function SaveRequestModal() {
  const isOpen = useWorkspaceStore((s) => s.ui.isSaveModalOpen)
  const close = useWorkspaceStore((s) => s.closeSaveModal)
  const save = useWorkspaceStore((s) => s.saveDraftToCollection)
  const activeCollectionId = useWorkspaceStore((s) => s.activeCollectionId)

  const [name, setName] = useState('')
  const canSave = useMemo(() => Boolean(activeCollectionId && name.trim().length > 0), [activeCollectionId, name])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={close} />
      <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="text-sm font-semibold text-slate-900 dark:text-white">Save request</div>
        <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">Give this request a name.</div>

        <input
          className="mt-3 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          placeholder="e.g. Get Users"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') close()
            if (e.key === 'Enter' && canSave) {
              save(name)
              setName('')
              if (!isWorkspaceSyncEnabled()) return
              const s = useWorkspaceStore.getState()
              putWorkspace({ collections: s.collections, activeCollectionId: s.activeCollectionId }).catch(() => undefined)
            }
          }}
          autoFocus
        />

        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={!canSave}
            onClick={async () => {
              save(name)
              setName('')
              if (!isWorkspaceSyncEnabled()) return
              const s = useWorkspaceStore.getState()
              await putWorkspace({ collections: s.collections, activeCollectionId: s.activeCollectionId })
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}

