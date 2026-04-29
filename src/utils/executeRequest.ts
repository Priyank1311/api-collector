import axios from 'axios'
import type { RequestDraft, ResponseState } from '../types'
import { rowsToRecord } from './kv'
import { methodAllowsBody } from './requestValidation'

export async function executeRequest(draft: RequestDraft): Promise<ResponseState> {
  const start = performance.now()

  try {
    const apiBase = import.meta.env.VITE_BACKEND_URL as string | undefined
    const shouldUseProxy = Boolean(apiBase && apiBase.trim().length > 0)

    const res = shouldUseProxy
      ? await axios.post(
          `${apiBase!.replace(/\/+$/, '')}/proxy`,
          {
            method: draft.method,
            url: draft.url.trim(),
            params: draft.params,
            headers: draft.headers,
            body: draft.body ?? '',
            timeoutMs: 15_000,
          },
          { timeout: 20_000, validateStatus: () => true },
        )
      : await axios.request({
          method: draft.method,
          url: draft.url.trim(),
          params: rowsToRecord(draft.params),
          headers: rowsToRecord(draft.headers),
          data:
            methodAllowsBody(draft.method) && draft.body.trim().length > 0 ? JSON.parse(draft.body) : undefined,
          timeout: 15_000,
          validateStatus: () => true,
        })

    const timeMs = Math.max(0, Math.round(performance.now() - start))

    if (shouldUseProxy) {
      // Backend already returns a normalized response shape
      const payload = res.data as ResponseState
      if (payload.kind === 'success') return payload
      return payload.kind === 'error' ? payload : { kind: 'error', message: 'Request failed.' }
    }

    if (res.status >= 400) {
      return {
        kind: 'error',
        message: `Request failed with status ${res.status}.`,
        status: res.status,
        timeMs,
        data: res.data,
      }
    }

    const headers: Record<string, string> = {}
    for (const [k, v] of Object.entries(res.headers ?? {})) {
      headers[k] = Array.isArray(v) ? v.join(', ') : String(v)
    }

    return {
      kind: 'success',
      status: res.status,
      statusText: res.statusText ?? '',
      timeMs,
      headers,
      data: res.data,
    }
  } catch (err) {
    const timeMs = Math.max(0, Math.round(performance.now() - start))
    const message = err instanceof Error ? err.message : 'Request failed.'
    return { kind: 'error', message, timeMs }
  }
}

