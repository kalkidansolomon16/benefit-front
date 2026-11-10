// Geocoding helpers for the Leaflet location picker.
// Uses OpenStreetMap Nominatim (free, no key). Its usage policy allows at most
// ~1 request/second and no per-keystroke autocomplete, so callers only search
// on explicit submit and reverse-geocode after the pin settles.

export interface LatLng {
  lat: number
  lng: number
}

export interface PlaceAddress {
  /** One of CITIES when it can be matched, else the raw OSM city/town */
  city: string
  /** One of ADDIS_SUB_CITIES when it can be matched, else '' */
  sub_city: string
  /** Short human-readable spot (POI / road / neighbourhood) */
  landmark: string
  /** Full OSM display name */
  display: string
}

export interface PlaceResult extends LatLng {
  display: string
}

export const DEFAULT_CENTER: LatLng = { lat: 9.0108, lng: 38.7613 } // Addis Ababa

export const CITIES = [
  'Addis Ababa', 'Hawassa', 'Adama (Nazret)', 'Dire Dawa', 'Bahir Dar',
  'Mekelle', 'Gondar', 'Jimma', 'Dessie', 'Jijiga',
]

export const ADDIS_SUB_CITIES = [
  'Arada', 'Addis Ketema', 'Akaki Kality', 'Bole', 'Gullele', 'Kirkos',
  'Kolfe Keranio', 'Lideta', 'Nifas Silk-Lafto', 'Yeka', 'Lemi Kura',
]

const NOMINATIM = 'https://nominatim.openstreetmap.org'

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '')

function matchCity(values: string[]): string {
  for (const v of values) {
    const n = norm(v)
    if (!n) continue
    const hit = CITIES.find((c) => {
      const base = norm(c.replace(/\(.*\)/, ''))
      const alias = norm(c.match(/\((.*)\)/)?.[1] ?? '')
      return n.includes(base) || (alias && n.includes(alias))
    })
    if (hit) return hit
  }
  return ''
}

function matchSubCity(values: string[]): string {
  for (const v of values) {
    const n = norm(v)
    // "Nifas Silk-Lafto" is often written "Nefas Silk Lafto" in OSM
    const hit = ADDIS_SUB_CITIES.find((s) => {
      const base = norm(s)
      return n.includes(base) || (base === 'nifassilklafto' && n.includes('silklafto'))
    })
    if (hit) return hit
  }
  return ''
}

/** Latitude/longitude from "9.01, 38.75" or a Google Maps / OSM link */
export function parseCoordinates(text: string): LatLng | null {
  const t = text.trim()
  const patterns = [
    /@(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/, // google .../@9.01,38.75,15z
    /[?&](?:q|query|ll)=(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/, // ?q=9.01,38.75
    /!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/, // google place data
    /#map=\d+\/(-?\d{1,2}\.\d+)\/(-?\d{1,3}\.\d+)/, // openstreetmap.org/#map=
    /^(-?\d{1,2}\.\d+)\s*[, ]\s*(-?\d{1,3}\.\d+)$/, // plain "lat, lng"
  ]
  for (const p of patterns) {
    const m = t.match(p)
    if (m) {
      const lat = Number(m[1])
      const lng = Number(m[2])
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng }
    }
  }
  return null
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    countrycodes: 'et',
    limit: '6',
    'accept-language': 'en',
  })
  const res = await fetch(`${NOMINATIM}/search?${params}`, { signal })
  if (!res.ok) throw new Error('Place search is unavailable right now.')
  const rows = (await res.json()) as { lat: string; lon: string; display_name: string }[]
  return rows.map((r) => ({ lat: Number(r.lat), lng: Number(r.lon), display: r.display_name }))
}

export async function reverseGeocode(p: LatLng, signal?: AbortSignal): Promise<PlaceAddress | null> {
  const params = new URLSearchParams({
    lat: String(p.lat),
    lon: String(p.lng),
    format: 'jsonv2',
    zoom: '18',
    addressdetails: '1',
    'accept-language': 'en',
  })
  const res = await fetch(`${NOMINATIM}/reverse?${params}`, { signal })
  if (!res.ok) return null
  const data = (await res.json()) as {
    name?: string
    display_name?: string
    address?: Record<string, string>
  }
  if (!data.address) return null
  const a = data.address

  const cityValues = [a.city, a.town, a.municipality, a.county, a.state].filter(Boolean) as string[]
  const city = matchCity(cityValues) || a.city || a.town || ''
  const sub_city =
    city === 'Addis Ababa'
      ? matchSubCity(
          [a.city_district, a.suburb, a.borough, a.district, a.quarter, data.display_name].filter(
            Boolean,
          ) as string[],
        )
      : ''
  const landmark = [data.name || a.amenity || a.building || a.shop, a.road, a.neighbourhood || a.suburb]
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .slice(0, 2)
    .join(', ')

  return { city, sub_city, landmark, display: data.display_name ?? '' }
}

/** Great-circle distance in metres */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export const mapsLink = (p: LatLng) =>
  `https://www.google.com/maps?q=${p.lat.toFixed(6)},${p.lng.toFixed(6)}`

/** 0.42 -> "420 m", 3.27 -> "3.3 km", 14.6 -> "15 km" */
export function formatKm(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 1 : 0)} km`
}
