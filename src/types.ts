export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type KeyValueRow = {
  id: string
  key: string
  value: string
}

export type RequestItem = {
  id: string
  name: string
  method: HttpMethod
  url: string
  headers: KeyValueRow[]
  params: KeyValueRow[]
  body: string
}

export type RequestDraft = Omit<RequestItem, 'id' | 'name'> & {
  name?: string
}

export type Collection = {
  id: string
  name: string
  requests: RequestItem[]
}

export type ResponseState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | {
      kind: 'success'
      status: number
      statusText: string
      timeMs: number
      headers: Record<string, string>
      data: unknown
    }
  | { kind: 'error'; message: string; status?: number; timeMs?: number; data?: unknown }

