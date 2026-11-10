/**
 * Packages are stored under several spellings: plans use their names
 * ("Fit Basic Plus"), gyms use keys ("basic_plus"), and the top package is
 * "premium" in some places and "platinum" / "gold" in older data.
 * Filters compare canonicalTier() values so every spelling matches.
 */
export type TierKey = 'basic' | 'basic_plus' | 'premium'

export const TIER_OPTIONS: { value: TierKey; label: string }[] = [
  { value: 'basic',      label: 'Fit Basic' },
  { value: 'basic_plus', label: 'Fit Basic Plus' },
  { value: 'premium',    label: 'Fit Premium' },
]

export function canonicalTier(t?: string | null): TierKey | '' {
  if (!t) return ''
  const s = String(t).toLowerCase().replace(/[\s-]+/g, '_')
  if (/platinum|premium|gold|chief/.test(s)) return 'premium'
  if (/plus|\+|director/.test(s)) return 'basic_plus'
  if (/basic|staff/.test(s)) return 'basic'
  return ''
}

export function tierName(t?: string | null): string {
  const key = canonicalTier(t)
  return TIER_OPTIONS.find(o => o.value === key)?.label ?? (t ?? '')
}
