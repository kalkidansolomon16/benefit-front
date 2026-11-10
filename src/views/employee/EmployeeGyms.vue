<template>
  <div class="page">

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading gyms…</p>
    </div>

    <template v-else-if="data">

      <!-- Plan badge -->
      <div class="plan-banner">
        <div class="plan-banner-left">
          <span class="plan-icon"><svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></span>
          <div>
            <p class="plan-banner-label">Your Plan</p>
            <p class="plan-banner-name">{{ data.pass.plan_name }}</p>
          </div>
        </div>
        <div class="plan-banner-tiers">
          <span
            v-for="t in accessibleTiers"
            :key="t"
            class="tier-pill"
            :class="tierPillClass(t)"
          >{{ tierLabel(t) }}</span>
        </div>
      </div>

      <!-- Search & filter -->
      <div class="toolbar">
        <div class="search-wrap">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            v-model="search"
            type="text"
            class="search-input"
            placeholder="Search gyms by name or location…"
          />
          <button v-if="search" class="clear-btn" @click="search = ''">✕</button>
        </div>
        <select v-model="filterTier" class="tier-select">
          <option value="">All tiers</option>
          <option v-for="t in accessibleTiers" :key="t" :value="t">{{ tierLabel(t) }}</option>
        </select>
      </div>

      <!-- Near me -->
      <div class="near-bar">
        <button type="button" class="near-btn" :class="{ active: !!me }" :disabled="locating" @click="locateMe">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="3.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="8"/></svg>
          {{ locating ? 'Finding your location…' : me ? 'Update my location' : 'Find gyms near me' }}
        </button>

        <select v-if="me" v-model.number="radiusKm" class="tier-select" aria-label="Distance">
          <option :value="0">Any distance</option>
          <option v-for="km in RADII" :key="km" :value="km">Within {{ km }} km</option>
        </select>

        <div class="view-toggle" role="group" aria-label="View">
          <button type="button" :class="{ on: view === 'list' }" @click="view = 'list'">List</button>
          <button type="button" :class="{ on: view === 'map' }" @click="view = 'map'">Map</button>
        </div>
      </div>
      <p v-if="locateMsg" class="near-msg" :class="{ 'near-msg--warn': locateWarn }">{{ locateMsg }}</p>
      <p v-else-if="me && hiddenNoPin > 0" class="near-msg">{{ noPinNote }}</p>

      <!-- Map view -->
      <NearbyGymsMap
        v-if="view === 'map'"
        :gyms="mapGyms"
        :me="me"
        :radius-km="me ? radiusKm : 0"
        height="420px"
      />
      <p v-if="view === 'map' && mapGyms.length === 0" class="near-msg">
        None of these gyms have a map location yet.
      </p>

      <!-- No results -->
      <div v-if="view === 'list' && filteredGyms.length === 0" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.4"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <p v-if="me && radiusKm">No gyms within {{ radiusKm }} km of you. Try a larger distance.</p>
        <p v-else>No gyms found{{ search ? ` for "${search}"` : '' }}.</p>
      </div>

      <!-- Gyms grid -->
      <div v-else-if="view === 'list'" class="gym-grid">
        <div
          v-for="g in paginatedGyms"
          :key="g.id"
          class="gym-card"
        >
          <div class="gym-card-header">
            <div class="gym-avatar" :class="tierPillClass(g.tier, 'gym-avatar--')">
              {{ g.name.slice(0, 2).toUpperCase() }}
            </div>
            <div class="gym-head-right">
              <span v-if="g.distanceKm != null" class="dist-tag">{{ formatKm(g.distanceKm) }} away</span>
              <span class="tier-tag" :class="tierPillClass(g.tier, 'tier-tag--')">{{ tierLabel(g.tier) }}</span>
            </div>
          </div>

          <h3 class="gym-name">{{ g.name }}</h3>
          <p class="gym-location">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {{ g.sub_city }}<span v-if="g.city">, {{ g.city }}</span>
          </p>
          <p v-if="g.address" class="gym-address">{{ g.address }}</p>

          <!-- How busy it is right now -->
          <GymCrowd :crowd="g.crowd" :gym-id="g.id" />

          <!-- Facilities -->
          <div v-if="g.facilities?.length" class="facilities">
            <span v-for="f in g.facilities.slice(0, 4)" :key="f" class="facility-chip">{{ f }}</span>
            <span v-if="g.facilities.length > 4" class="facility-chip facility-chip--more">+{{ g.facilities.length - 4 }}</span>
          </div>

          <!-- Hours -->
          <p v-if="hoursLabel(g.opening_hours)" class="gym-hours">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {{ hoursLabel(g.opening_hours) }}
          </p>

          <a
            v-if="g.latitude != null && g.longitude != null"
            :href="directionsUrl(g)"
            target="_blank"
            rel="noopener noreferrer"
            class="dir-link"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
            Directions
          </a>
        </div>
      </div>

      <AppPagination
        v-if="view === 'list'"
        v-model:page="gymPage"
        :total-pages="gymTotalPages"
        :total="filteredGyms.length"
        :per-page="gymPerPage"
      />

    </template>

    <!-- Error -->
    <div v-else class="error-state">
      <p>{{ error }}</p>
      <button class="retry-btn" @click="load">Retry</button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { canonicalTier } from '@/utils/tier'
import { ref, computed, onMounted, watch } from 'vue'
import { useApi } from '@/composables/useApi'
import GymCrowd, { type Crowd } from '@/components/GymCrowd.vue'
import AppPagination from '@/components/AppPagination.vue'
import NearbyGymsMap, { type MapGym } from '@/components/NearbyGymsMap.vue'
import { distanceMeters, formatKm, type LatLng } from '@/utils/geo'

interface Gym {
  id: number
  name: string
  tier: string
  sub_city: string
  city: string
  address: string
  latitude?: number | null
  longitude?: number | null
  facilities: string[]
  opening_hours: string | null
  crowd?: Crowd | null
}

interface DashboardData {
  pass: {
    plan_name: string
    plan_key: string
    accessible_tiers: string[]
    plan_labels: Record<string, string>
  }
  accessible_gyms: Gym[]
}

const api     = useApi()
const loading = ref(true)
const error   = ref('')
const data    = ref<DashboardData | null>(null)
const search  = ref('')
const filterTier = ref('')

const accessibleTiers = computed(() =>
  data.value?.pass.accessible_tiers ?? [data.value?.pass.plan_key ?? 'basic']
)

const gymPage    = ref(1)
const gymPerPage = 10
const gymTotalPages  = computed(() => Math.max(1, Math.ceil(filteredGyms.value.length / gymPerPage)))
const paginatedGyms  = computed(() => filteredGyms.value.slice((gymPage.value - 1) * gymPerPage, gymPage.value * gymPerPage))

// ── Near me ───────────────────────────────────────────────────
// The position stays in the browser: distances are worked out here and the
// location is never sent to the server.
const RADII = [1, 2, 5, 10, 20]
const me         = ref<LatLng | null>(null)
const locating   = ref(false)
const locateMsg  = ref('')
const locateWarn = ref(false)
const radiusKm   = ref(0)
const view       = ref<'list' | 'map'>('list')

function locateMe() {
  locateMsg.value = ''
  locateWarn.value = false
  if (!('geolocation' in navigator)) {
    locateMsg.value = 'Your browser cannot share your location. Use the search box instead.'
    locateWarn.value = true
    return
  }
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      locating.value = false
      me.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      const acc = Math.round(pos.coords.accuracy)
      if (acc > 1000) {
        locateMsg.value = `Your location is approximate (about ±${(acc / 1000).toFixed(1)} km), so distances are estimates.`
      }
    },
    (err) => {
      locating.value = false
      locateWarn.value = true
      locateMsg.value =
        err.code === err.PERMISSION_DENIED
          ? 'Location access is blocked. Allow location for this site in your browser settings, then try again.'
          : 'We could not find your location. Check that location services are on, then try again.'
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 120000 },
  )
}

type GymWithDistance = Gym & { distanceKm: number | null }

const hasPin = (g: Gym) => g.latitude != null && g.longitude != null

function directionsUrl(g: Gym): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${g.latitude},${g.longitude}`
}

/** Search + tier filter, before any distance filtering */
const matchedGyms = computed<GymWithDistance[]>(() => {
  const gyms = data.value?.accessible_gyms ?? []
  const q = search.value.toLowerCase()
  return gyms
    .filter(g => {
      const matchTier   = !filterTier.value || canonicalTier(g.tier) === canonicalTier(filterTier.value)
      const matchSearch = !q ||
        g.name.toLowerCase().includes(q) ||
        (g.sub_city ?? '').toLowerCase().includes(q) ||
        (g.city ?? '').toLowerCase().includes(q)
      return matchTier && matchSearch
    })
    .map(g => ({
      ...g,
      distanceKm: me.value && hasPin(g)
        ? distanceMeters(me.value, { lat: Number(g.latitude), lng: Number(g.longitude) }) / 1000
        : null,
    }))
})

const hiddenNoPin = computed(() => matchedGyms.value.filter(g => !hasPin(g)).length)

const noPinNote = computed(() => {
  const n = hiddenNoPin.value
  const what = n === 1 ? '1 gym has' : `${n} gyms have`
  return radiusKm.value
    ? `${what} not set a map location yet, so ${n === 1 ? 'it is' : 'they are'} not shown.`
    : `${what} not set a map location yet, so ${n === 1 ? 'it is' : 'they are'} listed last.`
})

const filteredGyms = computed<GymWithDistance[]>(() => {
  let gyms = matchedGyms.value
  if (!me.value) return gyms
  if (radiusKm.value > 0) gyms = gyms.filter(g => g.distanceKm != null && g.distanceKm <= radiusKm.value)
  // Nearest first; gyms without a map location go last
  return [...gyms].sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
})

const mapGyms = computed<MapGym[]>(() =>
  filteredGyms.value.filter(hasPin).map(g => ({
    id: g.id,
    name: g.name,
    lat: Number(g.latitude),
    lng: Number(g.longitude),
    distanceKm: g.distanceKm,
    subtitle: [g.sub_city, g.city].filter(Boolean).join(', '),
  })),
)

async function load() {
  loading.value = true
  error.value   = ''
  try {
    data.value = await api.get<DashboardData>('employee/dashboard')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Could not load gyms.'
  } finally {
    loading.value = false
  }
}

onMounted(load)

watch(filteredGyms, () => { gymPage.value = 1 })

// Map known tiers to CSS suffix; unknown tiers fall back to 'basic' colour
const TIER_CSS: Record<string, string> = {
  platinum: 'platinum', premium: 'premium', basic_plus: 'basic_plus', basic: 'basic',
}
function tierPillClass(t: string, prefix = 'tier-pill--'): string {
  return prefix + (TIER_CSS[canonicalTier(t) || t] ?? 'basic')
}

function tierLabel(t: string): string {
  // Use plan label from API if available, otherwise humanise the tier key
  const labels = data.value?.pass.plan_labels ?? {}
  const key = canonicalTier(t)
  if (key && labels[key]) return labels[key]
  return { platinum: 'Platinum', premium: 'Premium', basic_plus: 'Plus', basic: 'Basic' }[t]
    ?? t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function hoursLabel(raw: string | null): string {
  if (!raw) return ''
  if (typeof raw === 'object') {
    const h = raw as Record<string, string>
    return h.summary ?? (h.weekdays ? `Weekdays ${h.weekdays}` + (h.weekends ? ` · Weekends ${h.weekends}` : '') : '')
  }
  try {
    const parsed = JSON.parse(raw) as Record<string, string>
    return parsed.summary ?? (parsed.weekdays ? `Weekdays ${parsed.weekdays}` + (parsed.weekends ? ` · Weekends ${parsed.weekends}` : '') : raw)
  } catch {
    return raw
  }
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 20px; font-family: 'Inter', system-ui, sans-serif; }

/* Loading / Error */
.loading-state, .error-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 14px; padding: 80px 20px; color: #94a3b8;
}
.spinner {
  width: 34px; height: 34px; border: 3px solid #e2e8f0;
  border-top-color: #8BE000; border-radius: 50%; animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.retry-btn {
  padding: 8px 20px; border-radius: 8px; border: 1.5px solid #e2e8f0;
  background: #fff; font-size: 0.85rem; cursor: pointer; color: #334155;
}

/* Plan banner */
.plan-banner {
  display: flex; align-items: center; justify-content: space-between;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
  padding: 16px 20px; gap: 16px; flex-wrap: wrap;
}
.plan-banner-left { display: flex; align-items: center; gap: 12px; }
.plan-icon { font-size: 1.6rem; line-height: 1; }
.plan-banner-label { font-size: 0.68rem; color: #94a3b8; letter-spacing: 0.08em; margin: 0 0 2px; text-transform: uppercase; }
.plan-banner-name  { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0; }
.plan-banner-tiers { display: flex; gap: 8px; flex-wrap: wrap; }
.tier-pill {
  padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;
}
.tier-pill--platinum   { background: #EBFAEE; color: #72B800; }
.tier-pill--premium    { background: #EBFAEE; color: #8BE000; }
.tier-pill--basic_plus { background: #EEF9DC; color: #72B800; }
.tier-pill--basic      { background: #f1f5f9; color: #64748b; }

/* Toolbar */
.toolbar {
  display: flex; gap: 12px; align-items: center; flex-wrap: wrap;
}
.search-wrap {
  position: relative; flex: 1; min-width: 220px;
}
.search-icon {
  position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
  color: #94a3b8; pointer-events: none;
}
.search-input {
  width: 100%; padding: 10px 36px 10px 36px;
  border: 1.5px solid #e2e8f0; border-radius: 10px;
  font-size: 0.9rem; color: #1e293b; background: #fff;
  outline: none; transition: border-color 0.2s;
  font-family: inherit;
}
.search-input:focus { border-color: #8BE000; }
.search-input::placeholder { color: #94a3b8; }
.clear-btn {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 0.8rem;
  line-height: 1; padding: 2px 4px;
}
.clear-btn:hover { color: #334155; }

.tier-select {
  padding: 10px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px;
  font-size: 0.88rem; color: #1e293b; background: #fff;
  outline: none; cursor: pointer; font-family: inherit;
  transition: border-color 0.2s;
}
.tier-select:focus { border-color: #8BE000; }

/* Near me */
.near-bar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-top: -8px; }
.near-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 16px; border-radius: 10px; border: 1.5px solid #0B0C10;
  background: #0B0C10; color: #fff; font-size: 0.88rem; font-weight: 600;
  font-family: inherit; cursor: pointer; transition: background 0.2s, color 0.2s;
}
.near-btn:hover:not(:disabled) { background: #8BE000; border-color: #8BE000; color: #0B0C10; }
.near-btn.active { background: #fff; color: #0B0C10; }
.near-btn.active:hover:not(:disabled) { background: #EEF9DC; border-color: #8BE000; }
.near-btn:disabled { opacity: 0.6; cursor: wait; }
.view-toggle {
  margin-left: auto; display: inline-flex; border: 1.5px solid #e2e8f0;
  border-radius: 10px; overflow: hidden; background: #fff;
}
.view-toggle button {
  padding: 9px 16px; border: none; background: none; font: inherit; font-size: 0.85rem;
  font-weight: 600; color: #64748b; cursor: pointer;
}
.view-toggle button.on { background: #0B0C10; color: #fff; }
.near-msg { margin: -10px 0 0; font-size: 0.8rem; color: #64748b; }
.near-msg--warn { color: #b45309; }

.gym-head-right { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
.dist-tag {
  padding: 3px 10px; border-radius: 10px; font-size: 0.72rem; font-weight: 700;
  background: #0B0C10; color: #8BE000; white-space: nowrap;
}
.dir-link {
  align-self: flex-start; display: inline-flex; align-items: center; gap: 6px;
  margin-top: 6px; padding: 6px 14px; border-radius: 999px;
  border: 1.5px solid #0B0C10; color: #0B0C10; font-size: 0.78rem; font-weight: 600;
  text-decoration: none; transition: background 0.2s, border-color 0.2s;
}
.dir-link:hover { background: #8BE000; border-color: #8BE000; }

@media (max-width: 560px) {
  .view-toggle { margin-left: 0; }
}

/* Empty */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; padding: 60px 20px; color: #94a3b8; font-size: 0.9rem;
}

/* Gym grid */
.gym-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.gym-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 16px;
  padding: 20px; display: flex; flex-direction: column; gap: 8px;
  transition: box-shadow 0.2s, transform 0.2s;
}
.gym-card:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  transform: translateY(-2px);
}

.gym-card-header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;
}
.gym-avatar {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.9rem; font-weight: 700; letter-spacing: -0.01em;
}
.gym-avatar--platinum   { background: #EBFAEE; color: #72B800; }
.gym-avatar--premium    { background: #EBFAEE; color: #8BE000; }
.gym-avatar--basic_plus { background: #EEF9DC; color: #72B800; }
.gym-avatar--basic      { background: #f1f5f9; color: #64748b; }

.tier-tag {
  padding: 3px 10px; border-radius: 10px; font-size: 0.7rem; font-weight: 600;
}
.tier-tag--platinum   { background: #EBFAEE; color: #72B800; }
.tier-tag--premium    { background: #EBFAEE; color: #8BE000; }
.tier-tag--basic_plus { background: #EEF9DC; color: #72B800; }
.tier-tag--basic      { background: #f1f5f9; color: #64748b; }

.gym-name {
  font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0;
  line-height: 1.3;
}
.gym-location {
  display: flex; align-items: center; gap: 5px;
  font-size: 0.8rem; color: #64748b; margin: 0;
}
.gym-address {
  font-size: 0.76rem; color: #94a3b8; margin: 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.facilities {
  display: flex; flex-wrap: wrap; gap: 5px; margin-top: 4px;
}
.facility-chip {
  padding: 3px 9px; background: #f8fafc; border: 1px solid #e2e8f0;
  border-radius: 20px; font-size: 0.72rem; color: #475569;
}
.facility-chip--more { background: #f0f2f5; color: #94a3b8; }

.gym-hours {
  display: flex; align-items: center; gap: 5px;
  font-size: 0.76rem; color: #94a3b8; margin: 4px 0 0;
}
</style>
