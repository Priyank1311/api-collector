import type { HttpMethod } from '../types'

export function methodAllowsBody(method: HttpMethod) {
  return method === 'POST' || method === 'PUT' || method === 'PATCH'
}

export function validateUrl(url: string) {
  const trimmed = url.trim()
  if (!trimmed) return { ok: false as const, message: 'URL is required.' }
  try {
    // eslint-disable-next-line no-new
    new URL(trimmed)
    return { ok: true as const }
  } catch {
    return { ok: false as const, message: 'URL must be a valid absolute URL (include https://).' }
  }
}

export function validateJsonBody(method: HttpMethod, body: string) {
  if (!methodAllowsBody(method)) return { ok: true as const }
  const trimmed = body.trim()
  if (!trimmed) return { ok: true as const } // allow empty body
  try {
    JSON.parse(trimmed)
    return { ok: true as const }
  } catch {
    return { ok: false as const, message: 'Request body must be valid JSON.' }
  }
}

