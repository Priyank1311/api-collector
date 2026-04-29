import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Collection, KeyValueRow, RequestDraft, RequestItem, ResponseState } from '../types'
import { makeId } from '../utils/ids'

type UiState = {
  darkMode: boolean
  isSaveModalOpen: boolean
  toast?: { kind: 'success' | 'error'; message: string }
}

type WorkspaceState = {
  ui: UiState
  collections: Collection[]
  activeCollectionId?: string
  activeRequestId?: string
  draft: RequestDraft
  response: ResponseState
  validation?: { url?: string; jsonBody?: string }
}

type WorkspaceActions = {
  setDarkMode: (enabled: boolean) => void
  showToast: (toast?: UiState['toast']) => void

  createCollection: (name?: string) => void
  renameCollection: (collectionId: string, name: string) => void
  deleteCollection: (collectionId: string) => void
  setActiveCollection: (collectionId: string) => void

  setDraft: (patch: Partial<RequestDraft>) => void
  setDraftRow: (kind: 'headers' | 'params', rowId: string, patch: Partial<KeyValueRow>) => void
  addDraftRow: (kind: 'headers' | 'params') => void
  removeDraftRow: (kind: 'headers' | 'params', rowId: string) => void
  loadRequestIntoDraft: (request: RequestItem) => void

  openSaveModal: () => void
  closeSaveModal: () => void
  saveDraftToCollection: (name: string) => void

  setResponse: (state: ResponseState) => void
  setValidation: (v?: WorkspaceState['validation']) => void
  hydrateWorkspace: (snapshot: { collections?: Collection[]; activeCollectionId?: string; draft?: RequestDraft }) => void
}

const emptyRow = (): KeyValueRow => ({ id: makeId('row'), key: '', value: '' })

const defaultDraft: RequestDraft = {
  method: 'GET',
  url: 'https://jsonplaceholder.typicode.com/users',
  headers: [emptyRow()],
  params: [emptyRow()],
  body: '',
}

export const useWorkspaceStore = create<WorkspaceState & WorkspaceActions>()(
  persist(
    (set, get) => ({
      ui: { darkMode: false, isSaveModalOpen: false },
      collections: [],
      activeCollectionId: undefined,
      activeRequestId: undefined,
      draft: defaultDraft,
      response: { kind: 'idle' },
      validation: undefined,

      setDarkMode: (enabled) => {
        set((s) => ({ ui: { ...s.ui, darkMode: enabled } }))
      },
      showToast: (toast) => set((s) => ({ ui: { ...s.ui, toast } })),

      createCollection: (name) => {
        const id = makeId('col')
        const collection: Collection = { id, name: name?.trim() || 'New Collection', requests: [] }
        set((s) => ({
          collections: [collection, ...s.collections],
          activeCollectionId: id,
          activeRequestId: undefined,
        }))
      },
      renameCollection: (collectionId, name) => {
        const n = name.trim()
        if (!n) return
        set((s) => ({
          collections: s.collections.map((c) => (c.id === collectionId ? { ...c, name: n } : c)),
        }))
      },
      deleteCollection: (collectionId) => {
        set((s) => {
          const collections = s.collections.filter((c) => c.id !== collectionId)
          const activeCollectionId =
            s.activeCollectionId === collectionId ? collections[0]?.id : s.activeCollectionId
          return { collections, activeCollectionId, activeRequestId: undefined }
        })
      },
      setActiveCollection: (collectionId) => set({ activeCollectionId: collectionId, activeRequestId: undefined }),

      setDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
      setDraftRow: (kind, rowId, patch) =>
        set((s) => ({
          draft: {
            ...s.draft,
            [kind]: s.draft[kind].map((r) => (r.id === rowId ? { ...r, ...patch } : r)),
          },
        })),
      addDraftRow: (kind) => set((s) => ({ draft: { ...s.draft, [kind]: [...s.draft[kind], emptyRow()] } })),
      removeDraftRow: (kind, rowId) =>
        set((s) => {
          const next = s.draft[kind].filter((r) => r.id !== rowId)
          return { draft: { ...s.draft, [kind]: next.length ? next : [emptyRow()] } }
        }),
      loadRequestIntoDraft: (request) =>
        set({
          activeRequestId: request.id,
          draft: {
            method: request.method,
            url: request.url,
            headers: request.headers.length ? request.headers : [emptyRow()],
            params: request.params.length ? request.params : [emptyRow()],
            body: request.body ?? '',
          },
          response: { kind: 'idle' },
          validation: undefined,
        }),

      openSaveModal: () => set((s) => ({ ui: { ...s.ui, isSaveModalOpen: true } })),
      closeSaveModal: () => set((s) => ({ ui: { ...s.ui, isSaveModalOpen: false } })),
      saveDraftToCollection: (name) => {
        const n = name.trim()
        if (!n) return
        const { activeCollectionId, collections, draft } = get()
        if (!activeCollectionId) return
        const req: RequestItem = {
          id: makeId('req'),
          name: n,
          method: draft.method,
          url: draft.url,
          headers: draft.headers,
          params: draft.params,
          body: draft.body ?? '',
        }
        const next = collections.map((c) =>
          c.id === activeCollectionId ? { ...c, requests: [req, ...c.requests] } : c,
        )
        set((s) => ({ collections: next, ui: { ...s.ui, isSaveModalOpen: false, toast: { kind: 'success', message: 'Saved request.' } } }))
      },

      setResponse: (state) => set({ response: state }),
      setValidation: (v) => set({ validation: v }),
      hydrateWorkspace: (snapshot) =>
        set((s) => ({
          collections: snapshot.collections ?? s.collections,
          activeCollectionId: snapshot.activeCollectionId ?? s.activeCollectionId,
          draft: snapshot.draft ?? s.draft,
        })),
    }),
    {
      name: 'api-collection-runner-v1',
      partialize: (s) => ({
        ui: { darkMode: s.ui.darkMode, isSaveModalOpen: false },
        collections: s.collections,
        activeCollectionId: s.activeCollectionId,
      }),
    },
  ),
)

