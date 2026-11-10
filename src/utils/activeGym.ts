const KEY = 'fitaccess_active_gym'

/** The branch the gym owner is currently working on (sent to the API as X-Gym-Id) */
export function getActiveGymId(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function setActiveGymId(id: number | string | null): void {
  try {
    if (id === null) localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, String(id))
  } catch {
    /* storage unavailable — owner just stays on the main branch */
  }
}

export function gymHeader(): Record<string, string> {
  const id = getActiveGymId()
  return id ? { 'X-Gym-Id': id } : {}
}
