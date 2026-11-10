import { useAuthStore } from '@/stores/auth'
import { gymHeader } from '@/utils/activeGym'

const BASE: string = import.meta.env.VITE_API_BASE_URL

function headers(extra: Record<string, string> = {}): Record<string, string> {
  const auth = useAuthStore()
  return {
    Accept: 'application/json',
    ...gymHeader(),
    ...(auth.token ? { Authorization: `Bearer ${auth.token}` } : {}),
    ...extra,
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}/${path}`, {
    method,
    headers: headers({ 'Content-Type': 'application/json' }),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  if (res.status === 401 && useAuthStore().token) {
    // The saved session is no longer valid on the server (expired, revoked or
    // signed out elsewhere): drop it and ask the user to sign in again.
    useAuthStore().clearSession()
    window.location.href = '/login?session=expired'
    throw new Error('Your session has expired. Please sign in again.')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `HTTP ${res.status}`)
  }
  return res.json()
}

export function useApi() {
  return {
    get: <T>(path: string) => request<T>('GET', path),
    post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
    put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
    patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
    del: <T>(path: string) => request<T>('DELETE', path),
    delete: <T>(path: string) => request<T>('DELETE', path),
  }
}
