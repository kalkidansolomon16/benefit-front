<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEmployeePortal, type PortalGym } from '@/composables/useEmployeePortal'
import { DEFAULT_CENTER, distanceMeters, type LatLng } from '@/utils/geo'
import GymCrowd from '@/components/GymCrowd.vue'

const portal = useEmployeePortal()
const route = useRoute()
const d = computed(() => portal.data.value!)

// ── Filters ──
const q = ref(typeof route.query.q === 'string' ? route.query.q : '')
const facility = ref(typeof route.query.facility === 'string' ? route.query.facility : '')
const tier = ref('')
const sort = ref<'name' | 'distance'>('name')
const me = ref<LatLng | null>(null)
const locating = ref(false)
const locateMsg = ref('')
const selected = ref<number | null>(null)

const tiers = computed(() => d.value.pass.accessible_tiers)
const tierLabel = (t: string) => d.value.pass.plan_labels[t] ?? t.replace('_', ' ')
const facilities = computed(() =>
  [...new Set(d.value.accessible_gyms.flatMap((g) => g.facilities ?? []))].filter(Boolean).sort(),
)

function dist(g: PortalGym): number | null {
  if (!me.value || g.latitude == null || g.longitude == null) return null
  return distanceMeters(me.value, { lat: g.latitude, lng: g.longitude })
}

const gyms = computed(() => {
  const term = q.value.trim().toLowerCase()
  const list = d.value.accessible_gyms.filter((g) => {
    if (tier.value && g.tier !== tier.value && !(tier.value === 'basic_plus' && g.tier === 'basic_plus')) return false
    if (facility.value && !(g.facilities ?? []).includes(facility.value)) return false
    if (!term) return true
    return [g.name, g.sub_city, g.city, g.address].filter(Boolean).join(' ').toLowerCase().includes(term)
  })
  return sort.value === 'distance' && me.value
    ? [...list].sort((a, b) => (dist(a) ?? Infinity) - (dist(b) ?? Infinity))
    : [...list].sort((a, b) => a.name.localeCompare(b.name))
})

// ── Opening hours: "06:00–22:00" → open / closed now ──
function hoursToday(g: PortalGym): string | null {
  const h = g.opening_hours
  if (!h || typeof h === 'string') return (h as string) || null
  const weekend = [0, 6].includes(new Date().getDay())
  return (weekend ? h.weekends : h.weekdays) ?? null
}
function openState(g: PortalGym): { open: boolean; text: string } | null {
  const h = hoursToday(g)
  if (!h) return null
  if (/closed/i.test(h)) return { open: false, text: 'Closed today' }
  const m = h.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/)
  if (!m) return { open: true, text: h }
  const now = new Date()
  const mins = now.getHours() * 60 + now.getMinutes()
  const from = +m[1]! * 60 + +m[2]!
  const to = +m[3]! * 60 + +m[4]!
  const open = to > from ? mins >= from && mins < to : mins >= from || mins < to
  return open ? { open: true, text: `Open · until ${m[3]}:${m[4]}` } : { open: false, text: `Closed · opens ${m[1]}:${m[2]}` }
}

function locate() {
  locateMsg.value = ''
  if (!('geolocation' in navigator)) {
    locateMsg.value = 'Your browser cannot detect location.'
    return
  }
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    (p) => {
      locating.value = false
      me.value = { lat: p.coords.latitude, lng: p.coords.longitude }
      sort.value = 'distance'
      showMe()
    },
    () => {
      locating.value = false
      locateMsg.value = 'Location is blocked. Search by name or area instead.'
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
  )
}

// ── Map ──
const mapEl = ref<HTMLDivElement | null>(null)
let map: L.Map | null = null
let layer: L.LayerGroup | null = null
let meMarker: L.CircleMarker | null = null
const markers = new Map<number, L.Marker>()

const pin = (active: boolean) =>
  L.divIcon({
    className: 'eg-pin',
    html: `<span class="eg-pin-dot${active ? ' on' : ''}"></span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 30],
  })

function drawMarkers() {
  if (!map || !layer) return
  layer.clearLayers()
  markers.clear()
  const pts: L.LatLngExpression[] = []
  for (const g of gyms.value) {
    if (g.latitude == null || g.longitude == null) continue
    const m = L.marker([g.latitude, g.longitude], { icon: pin(selected.value === g.id), title: g.name })
      .bindTooltip(g.name, { direction: 'top', offset: [0, -26] })
      .on('click', () => select(g.id, false))
    m.addTo(layer)
    markers.set(g.id, m)
    pts.push([g.latitude, g.longitude])
  }
  if (pts.length && !selected.value) map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 15 })
}

function showMe() {
  if (!map || !me.value) return
  meMarker?.remove()
  meMarker = L.circleMarker(me.value, { radius: 8, color: '#fff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 })
    .bindTooltip('You are here')
    .addTo(map)
  map.setView(me.value, 13)
}

async function select(id: number, pan = true) {
  selected.value = id
  drawMarkers()
  const g = d.value.accessible_gyms.find((x) => x.id === id)
  if (pan && map && g?.latitude != null && g.longitude != null) map.setView([g.latitude, g.longitude], 16)
  await nextTick()
  document.getElementById(`gym-${id}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
}

const mapsUrl = (g: PortalGym) =>
  g.latitude != null && g.longitude != null
    ? `https://www.google.com/maps/dir/?api=1&destination=${g.latitude},${g.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([g.name, g.address, g.city].filter(Boolean).join(', '))}`

let resize: ResizeObserver | null = null
onMounted(() => {
  if (!mapEl.value) return
  map = L.map(mapEl.value, { center: DEFAULT_CENTER, zoom: 12, scrollWheelZoom: true })
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map)
  layer = L.layerGroup().addTo(map)
  drawMarkers()
  resize = new ResizeObserver(() => map?.invalidateSize())
  resize.observe(mapEl.value)
})
onBeforeUnmount(() => {
  resize?.disconnect()
  map?.remove()
  map = null
})
watch(gyms, () => {
  if (selected.value && !gyms.value.some((g) => g.id === selected.value)) selected.value = null
  drawMarkers()
})
</script>

<template>
  <div class="eg">
    <div class="eg-bar">
      <label class="eg-field grow">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
        <input v-model="q" type="search" placeholder="Search for a gym or area" aria-label="Search gyms" />
      </label>
      <label class="eg-field">
        <select v-model="facility" aria-label="Facility">
          <option value="">All facilities</option>
          <option v-for="f in facilities" :key="f" :value="f">{{ f }}</option>
        </select>
      </label>
      <label class="eg-field">
        <select v-model="tier" aria-label="Package">
          <option value="">All my packages</option>
          <option v-for="t in tiers" :key="t" :value="t">{{ tierLabel(t) }}</option>
        </select>
      </label>
      <label class="eg-field">
        <select v-model="sort" aria-label="Sorting">
          <option value="name">Sort: A–Z</option>
          <option value="distance" :disabled="!me">Sort: nearest</option>
        </select>
      </label>
      <button type="button" class="eg-near" :disabled="locating" @click="locate">
        {{ locating ? 'Locating…' : 'Show nearest' }}
      </button>
    </div>
    <p v-if="locateMsg" class="eg-note">{{ locateMsg }}</p>

    <div class="eg-split">
      <div class="eg-list" aria-label="Gyms">
        <p class="eg-count">{{ gyms.length }} {{ gyms.length === 1 ? 'gym' : 'gyms' }} on your plan</p>
        <div v-if="!gyms.length" class="eg-empty">
          <strong>No exact matches</strong>
          <p>Try another name, area or facility.</p>
        </div>
        <article
          v-for="g in gyms"
          :id="`gym-${g.id}`"
          :key="g.id"
          class="eg-item"
          :class="{ on: selected === g.id }"
          tabindex="0"
          @click="select(g.id)"
          @keydown.enter="select(g.id)"
        >
          <h3>{{ g.name }}</h3>
          <div v-if="g.facilities?.length" class="eg-tags">
            <span v-for="f in g.facilities.slice(0, 3)" :key="f">{{ f }}</span>
            <span v-if="g.facilities.length > 3" class="more">+{{ g.facilities.length - 3 }} more</span>
          </div>
          <p class="eg-line">📍 {{ [g.address, g.sub_city, g.city].filter(Boolean).join(', ') }}</p>
          <p v-if="openState(g)" class="eg-line" :class="openState(g)!.open ? 'open' : 'closed'">
            🕒 {{ openState(g)!.text }}
          </p>
          <div v-if="g.crowd" class="eg-crowd" @click.stop>
            <GymCrowd :crowd="g.crowd" :gym-id="g.id" />
          </div>
          <div class="eg-foot">
            <span class="eg-plan">FitAccess <b>{{ tierLabel(g.tier) }}</b></span>
            <span v-if="dist(g) != null" class="eg-dist">{{ (dist(g)! / 1000).toFixed(1) }} km</span>
            <a :href="mapsUrl(g)" target="_blank" rel="noopener" class="eg-dir" @click.stop>Directions</a>
          </div>
        </article>
      </div>
      <div ref="mapEl" class="eg-map" aria-label="Map of gyms"></div>
    </div>
  </div>
</template>

<style scoped>
.eg { display: flex; flex-direction: column; gap: 14px; margin: -16px 0 0; }
.eg-bar { display: flex; gap: 10px; flex-wrap: wrap; align-items: stretch; }
.eg-field {
  display: flex; align-items: center; gap: 8px; padding: 0 14px; background: #fff; border: 1px solid #e5e7eb;
  border-radius: 12px; color: #4d7c0f;
}
.eg-field.grow { flex: 1 1 260px; }
.eg-field input, .eg-field select {
  border: none; outline: none; background: transparent; padding: 12px 0; font-size: 14px; font-family: inherit;
  color: #1f2937; min-width: 0; flex: 1;
}
.eg-near {
  padding: 12px 22px; border-radius: 12px; border: none; background: #0b0c10; color: #fff; font-weight: 700;
  font-family: inherit; cursor: pointer;
}
.eg-near:hover:not(:disabled) { background: #8be000; color: #0b0c10; }
.eg-note { margin: 0; font-size: 13px; color: #b45309; }
.eg-split { display: grid; grid-template-columns: minmax(300px, 380px) minmax(0, 1fr); gap: 16px; height: calc(100vh - 170px); min-height: 520px; }
.eg-list { overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding-right: 4px; }
.eg-count { margin: 0; font-size: 13px; color: #6b7280; }
.eg-empty { background: #fff; border-radius: 14px; padding: 18px; }
.eg-empty p { margin: 4px 0 0; color: #6b7280; font-size: 14px; }
.eg-item {
  background: #fff; border-radius: 14px; padding: 16px 18px; cursor: pointer; border: 2px solid transparent;
  box-shadow: 0 1px 3px rgba(11, 12, 16, 0.05); transition: border-color 0.15s;
}
.eg-item:hover, .eg-item:focus-visible { border-color: #d9f99d; outline: none; }
.eg-item.on { border-color: #8be000; }
.eg-item h3 { margin: 0 0 8px; font-size: 18px; color: #0b0c10; font-weight: 700; }
.eg-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
.eg-tags span { font-size: 12px; padding: 4px 8px; border-radius: 8px; background: #f3fce6; color: #3f6212; border: 1px solid #e2f5c4; }
.eg-tags span.more { background: #f3f4f6; color: #4b5563; border-color: #e5e7eb; }
.eg-line { margin: 4px 0; font-size: 13px; color: #4b5563; }
.eg-crowd { margin: 6px 0 2px; }
.eg-line.open { color: #15803d; }
.eg-line.closed { color: #b91c1c; }
.eg-foot { display: flex; align-items: center; gap: 10px; margin-top: 10px; flex-wrap: wrap; }
.eg-plan { font-size: 12px; color: #4b5563; }
.eg-plan b { background: #eef9dc; color: #3f6212; padding: 2px 8px; border-radius: 6px; margin-left: 2px; }
.eg-dist { font-size: 12px; color: #6b7280; }
.eg-dir { margin-left: auto; font-size: 13px; font-weight: 700; color: #4d7c0f; text-decoration: none; }
.eg-dir:hover { text-decoration: underline; }
.eg-map { border-radius: 16px; overflow: hidden; z-index: 0; background: #e5e7eb; }
.eg :deep(.eg-pin) { background: none; border: none; }
.eg :deep(.eg-pin-dot) {
  display: block; width: 100%; height: 100%; box-sizing: border-box; background: #0b0c10; border: 3px solid #8be000;
  border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
}
.eg :deep(.eg-pin-dot.on) { background: #8be000; border-color: #0b0c10; }
@media (max-width: 900px) {
  .eg { margin-top: 0; }
  .eg-split { grid-template-columns: 1fr; height: auto; }
  .eg-map { height: 340px; order: -1; }
  .eg-list { overflow: visible; }
}
</style>
