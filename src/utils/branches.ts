export type BranchKind = 'gym' | 'company'

export interface BranchForm {
  branch_name: string
  contact_person: string
  email: string
  password: string
  city: string
  sub_city: string
  woreda: string
  landmark: string
  google_maps_link: string
  /** Pin picked on the map */
  latitude: number | null
  longitude: number | null
  contact_phone: string
  weekday_open: string
  weekday_close: string
  weekend_open: string
  weekend_close: string
  weekend_closed: boolean
  max_capacity: string
}

export function emptyBranch(): BranchForm {
  return {
    branch_name: '',
    contact_person: '',
    email: '',
    password: '',
    city: '',
    sub_city: '',
    woreda: '',
    landmark: '',
    google_maps_link: '',
    latitude: null,
    longitude: null,
    contact_phone: '',
    weekday_open: '06:00',
    weekday_close: '22:00',
    weekend_open: '08:00',
    weekend_close: '20:00',
    weekend_closed: false,
    max_capacity: '',
  }
}

/** Same rules the server enforces (StrongPassword) */
export function passwordRules(pw: string) {
  return [
    { id: 'len', label: 'At least 12 characters', ok: pw.length >= 12 },
    { id: 'upper', label: 'One uppercase letter', ok: /[A-Z]/.test(pw) },
    { id: 'lower', label: 'One lowercase letter', ok: /[a-z]/.test(pw) },
    { id: 'num', label: 'One number', ok: /[0-9]/.test(pw) },
    { id: 'special', label: 'One special character', ok: /[^A-Za-z0-9]/.test(pw) },
  ]
}

export const isStrongPassword = (pw: string) => passwordRules(pw).every((r) => r.ok)

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

/**
 * `withPassword` is false on public applications: the branch login is only
 * created (with a temporary password) once an admin approves.
 */
export function branchValid(b: BranchForm, kind: BranchKind = 'gym', withPassword = true): boolean {
  const phone = b.contact_phone.replace(/\s/g, '')
  const common = !!(
    b.branch_name.trim() &&
    b.contact_person.trim() &&
    isEmail(b.email.trim()) &&
    (!withPassword || isStrongPassword(b.password)) &&
    b.city.trim() &&
    b.woreda.trim() &&
    (!phone || phone.length >= 9)
  )
  if (kind === 'company') return common

  return (
    common &&
    !!b.weekday_open &&
    !!b.weekday_close &&
    b.weekday_close > b.weekday_open &&
    Number(b.max_capacity) > 0 &&
    (b.weekend_closed || (!!b.weekend_open && !!b.weekend_close && b.weekend_close > b.weekend_open))
  )
}

/** Names of the fields still blocking a branch (for the "Still needed" hint) */
export function branchMissing(b: BranchForm, kind: BranchKind = 'gym', withPassword = true): string[] {
  const miss: string[] = []
  const phone = b.contact_phone.replace(/\s/g, '')
  if (!b.branch_name.trim()) miss.push('name')
  if (!b.contact_person.trim()) miss.push('manager name')
  if (!isEmail(b.email.trim())) miss.push('login email')
  if (withPassword && !isStrongPassword(b.password)) miss.push('strong password')
  if (!b.city.trim()) miss.push('city')
  if (!b.woreda.trim()) miss.push('address')
  if (phone && phone.length < 9) miss.push('valid phone')
  if (kind === 'gym') {
    if (!(b.weekday_close > b.weekday_open)) miss.push('weekday hours')
    if (!b.weekend_closed && !(b.weekend_close > b.weekend_open)) miss.push('weekend hours')
    if (!(Number(b.max_capacity) > 0)) miss.push('capacity')
  }
  return miss
}

/** Shape the API expects (see BranchLoginService::validate) */
export function branchPayload(b: BranchForm, kind: BranchKind = 'gym', withPassword = true) {
  const phone = b.contact_phone.replace(/\s/g, '')
  const base = {
    branch_name: b.branch_name.trim(),
    contact_person: b.contact_person.trim(),
    email: b.email.trim(),
    ...(withPassword ? { password: b.password } : {}),
    city: b.city,
    sub_city: b.sub_city || null,
    woreda: b.woreda.trim(),
    landmark: b.landmark.trim() || null,
    contact_phone: phone ? '+251' + phone : null,
    latitude: b.latitude,
    longitude: b.longitude,
  }
  if (kind === 'company') return base

  return {
    ...base,
    google_maps_link: b.google_maps_link.trim() || null,
    weekday_open: b.weekday_open,
    weekday_close: b.weekday_close,
    weekend_open: b.weekend_closed ? null : b.weekend_open,
    weekend_close: b.weekend_closed ? null : b.weekend_close,
    max_capacity: Number(b.max_capacity),
  }
}
