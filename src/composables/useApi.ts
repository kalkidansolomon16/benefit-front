import { useAuthStore } from '@/stores/auth'

const BASE = 'http://localhost:8000/api/v1'

function headers(extra: Record<string, string> = {}): Record<string, string> {
  const auth = useAuthStore()
  return {
    Accept: 'application/json',
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
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `HTTP ${res.status}`)
  }
  return res.json()
}

export function useApi() {
  return {
    get:    <T>(path: string)                 => request<T>('GET',    path),
    post:   <T>(path: string, body?: unknown) => request<T>('POST',   path, body),
    put:    <T>(path: string, body?: unknown) => request<T>('PUT',    path, body),
    patch:  <T>(path: string, body?: unknown) => request<T>('PATCH',  path, body),
    del:    <T>(path: string)                 => request<T>('DELETE', path),
    delete: <T>(path: string)                 => request<T>('DELETE', path),
  }
}
