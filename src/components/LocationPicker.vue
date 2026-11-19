<script setup lang="ts">
/**
 * Leaflet map for picking a location instead of typing it.
 *
 *  - "Use my current location" (browser GPS / Wi-Fi positioning)
 *  - search a place, or paste coordinates / a Google Maps link
 *  - click the map or drag the pin to fine-tune
 *  - after the pin settles the address is looked up and emitted (`address`)
 *    so the parent can fill city / sub-city / landmark
 *
 * Branches: pass `autoLocate=false` and `reference` (the main location). The
 * person registering every branch is usually sitting at one office, so the
 * device location would put every branch in the same spot. The map then opens
 * on the main location, and warns if a branch pin is left on top of it.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  DEFAULT_CENTER,
  distanceMeters,
  parseCoordinates,
  reverseGeocode,
  searchPlaces,
  type LatLng,
  type PlaceAddress,
  type PlaceResult,
} from '@/utils/geo'

const props = withDefaults(
  defineProps<{
    lat: number | null
    lng: number | null
    /** Ask for the device location on open when no pin is set yet */
    autoLocate?: boolean
    /** Another known spot (e.g. the main location) shown as a grey marker */
    reference?: (LatLng & { label?: string }) | null
    /** Show-only map (admin review) */
    readonly?: boolean
    height?: string
    locateLabel?: string
  }>(),
  {
    autoLocate: false,
    reference: null,
    readonly: false,
    height: '280px',
    locateLabel: 'Use my current location',
  },
)

const emit = defineEmits<{
  'update:lat': [value: number | null]
  'update:lng': [value: number | null]
  address: [value: PlaceAddress]
}>()

const mapEl = ref<HTMLDivElement | null>(null)
let map: L.Map | null = null
let marker: L.Marker | null = null
let refMarker: L.Marker | null = null
let accuracyCircle: L.Circle | null = null
let resizeObs: ResizeObserver | null = null

const locating = ref(false)
const locateMsg = ref('')
const query = ref('')
const searching = ref(false)
const results = ref<PlaceResult[]>([])
const searchMsg = ref('')
const resolved = ref('')
let geoAbort: AbortController | null = null
let geoTimer: ReturnType<typeof setTimeout> | null = null

const pin = computed<LatLng | null>(() =>
  props.lat != null && props.lng != null && !Number.isNaN(props.lat) && !Number.isNaN(props.lng)
    ? { lat: Number(props.lat), lng: Number(props.lng) }
    : null,
)

const nearReference = computed(() => {
  if (!pin.value || !props.reference) return false
  return distanceMeters(pin.value, props.reference) < 60
})

const pinIcon = L.divIcon({
  className: 'lp-pin',
  html: '<span class="lp-pin-dot"></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 33],
})
const refIcon = L.divIcon({
  className: 'lp-pin lp-pin-ref',
  html: '<span class="lp-pin-dot"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 26],
})

const round = (n: number) => Math.round(n * 1e7) / 1e7

function placeMarker(p: LatLng) {
  if (!map) return
  if (marker) {
    marker.setLatLng(p)
  } else {
    marker = L.marker(p, { icon: pinIcon, draggable: !props.readonly, keyboard: true }).addTo(map)
    marker.on('dragend', () => {
      const ll = marker!.getLatLng()
      clearAccuracy()
      setPin({ lat: ll.lat, lng: ll.lng }, false)
    })
  }
}

function clearAccuracy() {
  accuracyCircle?.remove()
  accuracyCircle = null
}

/** Set the pin, tell the parent, and look the address up once it settles */
function setPin(p: LatLng, pan = true, zoom?: number) {
  const next = { lat: round(p.lat), lng: round(p.lng) }
  placeMarker(next)
  if (pan && map) map.setView(next, zoom ?? Math.max(map.getZoom(), 16))
  emit('update:lat', next.lat)
  emit('update:lng', next.lng)
  scheduleReverse(next)
}

function scheduleReverse(p: LatLng) {
  if (geoTimer) clearTimeout(geoTimer)
  geoAbort?.abort()
  resolved.value = 'Looking up address…'
  geoTimer = setTimeout(async () => {
    geoAbort = new AbortController()
    try {
      const addr = await reverseGeocode(p, geoAbort.signal)
      if (addr) {
        resolved.value = addr.display
        emit('address', addr)
      } else {
        resolved.value = ''
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') resolved.value = ''
    }
  }, 700)
}

function clearPin() {
  marker?.remove()
  marker = null
  clearAccuracy()
  resolved.value = ''
  emit('update:lat', null)
  emit('update:lng', null)
}

function locate() {
  locateMsg.value = ''
  if (!('geolocation' in navigator)) {
    locateMsg.value = 'This browser cannot detect location. Search or tap the map instead.'
    return
  }
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      locating.value = false
      const p = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      const acc = Math.round(pos.coords.accuracy)
      setPin(p, true, acc > 500 ? 15 : 17)
      clearAccuracy()
      if (map) {
        accuracyCircle = L.circle(p, {
          radius: acc,
          color: '#16a34a',
          weight: 1,
          fillOpacity: 0.08,
          interactive: false,
        }).addTo(map)
      }
      if (acc > 150) {
        locateMsg.value = `Your device location is approximate (±${acc} m). Drag the pin to the exact entrance.`
      }
    },
    (err) => {
      locating.value = false
      locateMsg.value =
        err.code === err.PERMISSION_DENIED
          ? 'Location permission was blocked. Search for the place or tap it on the map instead.'
          : 'Could not detect your location. Search for the place or tap it on the map instead.'
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
  )
}

async function runSearch() {
  const q = query.value.trim()
  searchMsg.value = ''
  results.value = []
  if (!q) return

  const coords = parseCoordinates(q)
  if (coords) {
    clearAccuracy()
    setPin(coords, true, 17)
    return
  }

  searching.value = true
  try {
    const rows = await searchPlaces(q)
    if (!rows.length) searchMsg.value = 'No places found. Try a nearby landmark, or tap the map.'
    else if (rows.length === 1) choose(rows[0]!)
    else results.value = rows
  } catch (e) {
    searchMsg.value = e instanceof Error ? e.message : 'Search failed.'
  } finally {
    searching.value = false
  }
}

function choose(r: PlaceResult) {
  results.value = []
  clearAccuracy()
  setPin(r, true, 17)
}

function showReference() {
  if (!map) return
  refMarker?.remove()
  refMarker = null
  if (props.reference) {
    refMarker = L.marker(props.reference, { icon: refIcon, interactive: true, keyboard: false })
      .bindTooltip(props.reference.label ?? 'Main location', { direction: 'top', offset: [0, -20] })
      .addTo(map)
  }
}

onMounted(() => {
  if (!mapEl.value) return
  const start = pin.value ?? props.reference ?? DEFAULT_CENTER
  map = L.map(mapEl.value, {
    center: start,
    zoom: pin.value ? 16 : props.reference ? 15 : 12,
    scrollWheelZoom: false, // don't hijack page scrolling inside long forms
    attributionControl: true,
  })
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map)
  map.on('focus', () => map?.scrollWheelZoom.enable())
  map.on('blur', () => map?.scrollWheelZoom.disable())

  showReference()
  if (pin.value) placeMarker(pin.value)

  if (!props.readonly) {
    map.on('click', (e: L.LeafletMouseEvent) => {
      clearAccuracy()
      setPin({ lat: e.latlng.lat, lng: e.latlng.lng }, false)
    })
    if (props.autoLocate && !pin.value) locate()
  }

  // Maps inside steps / modals are often created while hidden
  resizeObs = new ResizeObserver(() => map?.invalidateSize())
  resizeObs.observe(mapEl.value)
})

// Parent changed the coordinates (reset, loaded data, …)
watch(pin, (p) => {
  if (!map) return
  if (!p) {
    marker?.remove()
    marker = null
    return
  }
  const cur = marker?.getLatLng()
  if (!cur || cur.lat !== p.lat || cur.lng !== p.lng) {
    placeMarker(p)
    map.setView(p, Math.max(map.getZoom(), 16))
  }
})
watch(() => props.reference, showReference, { deep: true })

onBeforeUnmount(() => {
  if (geoTimer) clearTimeout(geoTimer)
  geoAbort?.abort()
  resizeObs?.disconnect()
  map?.remove()
  map = null
})
</script>

<template>
  <div class="lp">
    <div v-if="!readonly" class="lp-tools">
      <button type="button" class="lp-locate" :disabled="locating" @click="locate">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <circle cx="12" cy="12" r="3.5" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          <circle cx="12" cy="12" r="8" />
        </svg>
        {{ locating ? 'Detecting…' : locateLabel }}
      </button>
      <form class="lp-search" @submit.prevent="runSearch">
        <input
          v-model="query"
          type="search"
          class="lp-input"
          placeholder="Search a place, or paste coordinates / Google Maps link"
          aria-label="Search location"
        />
        <button type="submit" class="lp-go" :disabled="searching || !query.trim()">
          {{ searching ? '…' : 'Find' }}
        </button>
      </form>
    </div>

    <ul v-if="results.length" class="lp-results">
      <li v-for="(r, i) in results" :key="i">
        <button type="button" @click="choose(r)">{{ r.display }}</button>
      </li>
    </ul>
    <p v-if="searchMsg" class="lp-msg">{{ searchMsg }}</p>
    <p v-if="locateMsg" class="lp-msg">{{ locateMsg }}</p>

    <div ref="mapEl" class="lp-map" :style="{ height }" tabindex="0" aria-label="Map"></div>

    <div class="lp-foot">
      <template v-if="pin">
        <span class="lp-coords">
          📍 {{ pin.lat.toFixed(6) }}, {{ pin.lng.toFixed(6) }}
          <span v-if="resolved" class="lp-resolved"> · {{ resolved }}</span>
        </span>
        <button v-if="!readonly" type="button" class="lp-clear" @click="clearPin">Clear pin</button>
      </template>
      <span v-else-if="!readonly" class="lp-hint">Tap the map to drop a pin. You can drag it afterwards.</span>
      <span v-else class="lp-hint">No map location was provided.</span>
    </div>

    <p v-if="nearReference && !readonly" class="lp-warn">
      This pin is on the same spot as {{ reference?.label ?? 'the main location' }}. If this branch is
      somewhere else, search for it or drag the pin to its real location.
    </p>
  </div>
</template>

<style scoped>
.lp { display: flex; flex-direction: column; gap: 8px; }
.lp-tools { display: flex; gap: 8px; flex-wrap: wrap; }
.lp-locate {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 9px 12px; border-radius: 10px; border: 1.5px solid #16a34a;
  background: #f0fdf4; color: #166534; font-weight: 600; font-size: 13px;
  font-family: inherit; cursor: pointer; white-space: nowrap;
}
.lp-locate:disabled { opacity: 0.6; cursor: wait; }
.lp-search { flex: 1 1 240px; display: flex; gap: 6px; min-width: 0; }
.lp-input {
  flex: 1; min-width: 0; box-sizing: border-box; padding: 9px 11px;
  border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 13px;
  font-family: inherit; background: #fff; color: #0f172a;
}
.lp-input:focus { outline: none; border-color: #0f172a; }
.lp-go {
  padding: 9px 14px; border-radius: 10px; border: none; background: #0f172a;
  color: #fff; font-weight: 600; font-size: 13px; font-family: inherit; cursor: pointer;
}
.lp-go:disabled { opacity: 0.5; cursor: default; }
.lp-results {
  list-style: none; margin: 0; padding: 4px; border: 1.5px solid #e2e8f0;
  border-radius: 10px; background: #fff; max-height: 180px; overflow-y: auto;
}
.lp-results button {
  width: 100%; text-align: left; padding: 8px 10px; border: none; background: none;
  font-size: 12.5px; color: #334155; font-family: inherit; cursor: pointer; border-radius: 8px;
}
.lp-results button:hover { background: #f1f5f9; }
.lp-map {
  width: 100%; border-radius: 12px; border: 1.5px solid #e2e8f0; overflow: hidden;
  z-index: 0; /* keep Leaflet panes under modals/dropdowns */
}
.lp-map:focus { outline: 2px solid #16a34a; outline-offset: 1px; }
.lp-foot { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; font-size: 12px; }
.lp-coords { color: #166534; font-weight: 600; min-width: 0; overflow-wrap: anywhere; }
.lp-resolved { color: #64748b; font-weight: 400; }
.lp-hint { color: #94a3b8; }
.lp-clear { background: none; border: none; color: #ef4444; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; padding: 0; }
.lp-msg { margin: 0; font-size: 12px; color: #b45309; }
.lp-warn {
  margin: 0; font-size: 12px; color: #92400e; background: #fffbeb;
  border: 1px solid #fde68a; border-radius: 8px; padding: 8px 10px; line-height: 1.45;
}

/* Leaflet-created marker elements */
.lp :deep(.lp-pin) { background: none; border: none; }
.lp :deep(.lp-pin-dot) {
  display: block; width: 100%; height: 100%;
  background: #16a34a; border: 3px solid #fff;
  border-radius: 50% 50% 50% 0; transform: rotate(-45deg);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35); box-sizing: border-box;
}
.lp :deep(.lp-pin-ref .lp-pin-dot) { background: #64748b; }
</style>
