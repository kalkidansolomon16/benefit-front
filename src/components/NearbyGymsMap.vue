<script setup lang="ts">
/**
 * Map of the gyms on the employee's plan around their current position.
 * Shows a "You are here" dot, an optional search-radius circle and one pin per
 * gym; clicking a pin opens a popup with the distance and a directions link.
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { DEFAULT_CENTER, formatKm, type LatLng } from '@/utils/geo'

export interface MapGym {
  id: number
  name: string
  lat: number
  lng: number
  distanceKm: number | null
  subtitle: string
}

const props = withDefaults(
  defineProps<{
    gyms: MapGym[]
    me: LatLng | null
    /** Radius in km to draw around the employee; 0 = none */
    radiusKm?: number
    height?: string
  }>(),
  { radiusKm: 0, height: '380px' },
)

const emit = defineEmits<{ select: [id: number] }>()

const mapEl = ref<HTMLDivElement | null>(null)
let map: L.Map | null = null
let layer: L.LayerGroup | null = null
let resizeObs: ResizeObserver | null = null

const gymIcon = L.divIcon({
  className: 'ngm-pin',
  html: '<span class="ngm-pin-dot"></span>',
  iconSize: [26, 26],
  iconAnchor: [13, 31],
  popupAnchor: [0, -28],
})
const meIcon = L.divIcon({
  className: 'ngm-me',
  html: '<span class="ngm-me-dot"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

function directionsUrl(g: MapGym): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${g.lat},${g.lng}`
}

function draw() {
  if (!map) return
  layer?.remove()
  layer = L.layerGroup().addTo(map)
  const bounds: L.LatLngExpression[] = []
  let radiusCircle: L.Circle | null = null

  if (props.me) {
    L.marker(props.me, { icon: meIcon, keyboard: false, zIndexOffset: 1000 })
      .bindTooltip('You are here', { direction: 'top', offset: [0, -10] })
      .addTo(layer)
    bounds.push([props.me.lat, props.me.lng])
    if (props.radiusKm > 0) {
      radiusCircle = L.circle(props.me, {
        radius: props.radiusKm * 1000,
        color: '#8BE000',
        weight: 1.5,
        fillColor: '#8BE000',
        fillOpacity: 0.07,
        interactive: false,
      }).addTo(layer)
    }
  }

  for (const g of props.gyms) {
    const dist = g.distanceKm != null ? `<div class="ngm-dist">${formatKm(g.distanceKm)} away</div>` : ''
    const html =
      `<div class="ngm-pop"><strong>${esc(g.name)}</strong>` +
      (g.subtitle ? `<div class="ngm-sub">${esc(g.subtitle)}</div>` : '') +
      dist +
      `<a href="${directionsUrl(g)}" target="_blank" rel="noopener noreferrer" class="ngm-dir">Get directions</a></div>`
    L.marker([g.lat, g.lng], { icon: gymIcon, title: g.name })
      .bindPopup(html)
      .on('click', () => emit('select', g.id))
      .addTo(layer)
    bounds.push([g.lat, g.lng])
  }

  if (radiusCircle) {
    // A distance is chosen: show the whole search area around the employee
    map.fitBounds(radiusCircle.getBounds(), { padding: [20, 20] })
  } else if (bounds.length === 1) {
    map.setView(bounds[0]!, 14)
  } else if (bounds.length > 1) {
    // Focus on the employee and the closest gyms rather than the whole city
    const near = props.me
      ? [[props.me.lat, props.me.lng] as L.LatLngTuple, ...props.gyms.slice(0, 5).map((g) => [g.lat, g.lng] as L.LatLngTuple)]
      : bounds
    map.fitBounds(L.latLngBounds(near as L.LatLngTuple[]), { padding: [40, 40], maxZoom: 15 })
  }
}

onMounted(() => {
  if (!mapEl.value) return
  map = L.map(mapEl.value, { center: props.me ?? DEFAULT_CENTER, zoom: 12, scrollWheelZoom: false })
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map)
  map.on('focus', () => map?.scrollWheelZoom.enable())
  map.on('blur', () => map?.scrollWheelZoom.disable())
  draw()
  resizeObs = new ResizeObserver(() => map?.invalidateSize())
  resizeObs.observe(mapEl.value)
})

watch(() => [props.gyms, props.me, props.radiusKm], draw, { deep: true })

onBeforeUnmount(() => {
  resizeObs?.disconnect()
  map?.remove()
  map = null
})
</script>

<template>
  <div ref="mapEl" class="ngm-map" :style="{ height }" tabindex="0" aria-label="Map of nearby gyms"></div>
</template>

<style scoped>
.ngm-map {
  width: 100%;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  z-index: 0;
}
.ngm-map:focus { outline: 2px solid #8BE000; outline-offset: 1px; }

.ngm-map :deep(.ngm-pin),
.ngm-map :deep(.ngm-me) { background: none; border: none; }
.ngm-map :deep(.ngm-pin-dot) {
  display: block; width: 100%; height: 100%;
  background: #0B0C10; border: 3px solid #8BE000;
  border-radius: 50% 50% 50% 0; transform: rotate(-45deg);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35); box-sizing: border-box;
}
.ngm-map :deep(.ngm-me-dot) {
  display: block; width: 100%; height: 100%;
  border-radius: 50%;
  background-color: #8BE000; border: 3px solid #fff;
  box-shadow: 0 0 0 4px rgba(139, 224, 0, 0.35), 0 1px 4px rgba(0, 0, 0, 0.3);
  box-sizing: border-box;
}
.ngm-map :deep(.ngm-pop) { font-family: inherit; font-size: 13px; line-height: 1.4; color: #0B0C10; min-width: 150px; }
.ngm-map :deep(.ngm-sub) { color: #64748b; font-size: 12px; }
.ngm-map :deep(.ngm-dist) { margin-top: 4px; font-weight: 700; }
.ngm-map :deep(.ngm-dir) {
  display: inline-block; margin-top: 8px; padding: 5px 12px; border-radius: 999px;
  background: #0B0C10; color: #fff !important; font-weight: 600; font-size: 12px; text-decoration: none;
}
.ngm-map :deep(.ngm-dir:hover) { background: #8BE000; color: #0B0C10 !important; }
</style>
