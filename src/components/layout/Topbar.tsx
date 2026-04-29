import { Moon, Sun } from 'lucide-react'
import { Button } from '../common/Button'
import { useWorkspaceStore } from '../../store/workspaceStore'

export function Topbar() {
  const darkMode = useWorkspaceStore((s) => s.ui.darkMode)
  const setDarkMode = useWorkspaceStore((s) => s.setDarkMode)

  return (
    <header className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">API Collection Runner</div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Workspace</h1>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setDarkMode(!darkMode)}
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  )
}

