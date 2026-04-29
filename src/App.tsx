import { useEffect } from 'react'
import { SaveRequestModal } from './components/collection/SaveRequestModal'
import { Sidebar } from './components/collection/Sidebar'
import { Topbar } from './components/layout/Topbar'
import { RequestPanel } from './components/request/RequestPanel'
import { ResponsePanel } from './components/response/ResponsePanel'
import { useWorkspaceStore } from './store/workspaceStore'
import { fetchWorkspace, isWorkspaceSyncEnabled } from './utils/workspaceSync'

export default function App() {
  const darkMode = useWorkspaceStore((s) => s.ui.darkMode)
  const toast = useWorkspaceStore((s) => s.ui.toast)
  const showToast = useWorkspaceStore((s) => s.showToast)
  const hydrateWorkspace = useWorkspaceStore((s) => s.hydrateWorkspace)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  useEffect(() => {
    if (!isWorkspaceSyncEnabled()) return
    let cancelled = false
    fetchWorkspace()
      .then((snap) => {
        if (cancelled || !snap) return
        hydrateWorkspace(snap)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [hydrateWorkspace])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => showToast(undefined), 2000)
    return () => window.clearTimeout(t)
  }, [toast, showToast])

  return (
    <div className="h-full">
      <div className="mx-auto flex h-full max-w-7xl flex-col p-4 md:p-6">
        <Topbar />

        <main className="mt-6 grid flex-1 grid-cols-1 gap-4 lg:grid-cols-12">
          <aside className="min-w-0 lg:col-span-3">
            <Sidebar />
          </aside>

          <section className="min-w-0 lg:col-span-5">
            <RequestPanel />
          </section>

          <section className="min-w-0 lg:col-span-4">
            <ResponsePanel />
          </section>
        </main>
      </div>

      <SaveRequestModal />

      {toast ? (
        <div className="fixed bottom-4 left-1/2 z-50 w-[min(420px,calc(100vw-2rem))] -translate-x-1/2">
          <div
            className={[
              'rounded-lg border px-3 py-2 text-sm font-semibold shadow-lg',
              toast.kind === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200'
                : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200',
            ].join(' ')}
          >
            {toast.message}
          </div>
        </div>
      ) : null}
    </div>
  )
}
