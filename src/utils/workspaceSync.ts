import axios from 'axios'
import type { Collection } from '../types'

type WorkspaceSnapshot = {
  collections: Collection[]
  activeCollectionId?: string
}

const apiBase = (import.meta.env.VITE_BACKEND_URL as string | undefined)?.trim()
const enabled = Boolean(apiBase)

function baseUrl() {
  return apiBase!.replace(/\/+$/, '')
}

export async function fetchWorkspace(): Promise<WorkspaceSnapshot | null> {
  if (!enabled) return null
  const res = await axios.get(`${baseUrl()}/api/workspace`, { timeout: 10_000 })
  const data = res.data as Partial<WorkspaceSnapshot>
  if (!data || !Array.isArray(data.collections)) return null
  return { collections: data.collections, activeCollectionId: data.activeCollectionId }
}

export async function putWorkspace(snapshot: WorkspaceSnapshot) {
  if (!enabled) return
  await axios.put(`${baseUrl()}/api/workspace`, snapshot, { timeout: 10_000 })
}

export function isWorkspaceSyncEnabled() {
  return enabled
}

