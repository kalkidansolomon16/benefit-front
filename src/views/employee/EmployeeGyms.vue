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
          <span class="plan-icon">🏋️</span>
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

      <!-- No results -->
      <div v-if="filteredGyms.length === 0" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.4"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <p>No gyms found{{ search ? ` for "${search}"` : '' }}.</p>
      </div>

      <!-- Gyms grid -->
      <div v-else class="gym-grid">
        <div
          v-for="g in filteredGyms"
          :key="g.id"
          class="gym-card"
        >
          <div class="gym-card-header">
            <div class="gym-avatar" :class="tierPillClass(g.tier, 'gym-avatar--')">
              {{ g.name.slice(0, 2).toUpperCase() }}
            </div>
            <span class="tier-tag" :class="tierPillClass(g.tier, 'tier-tag--')">{{ tierLabel(g.tier) }}</span>
          </div>

          <h3 class="gym-name">{{ g.name }}</h3>
          <p class="gym-location">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {{ g.sub_city }}<span v-if="g.city">, {{ g.city }}</span>
          </p>
          <p v-if="g.address" class="gym-address">{{ g.address }}</p>

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
        </div>
      </div>

    </template>

    <!-- Error -->
    <div v-else class="error-state">
      <p>{{ error }}</p>
      <button class="retry-btn" @click="load">Retry</button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'

interface Gym {
  id: number
  name: string
  tier: string
  sub_city: string
  city: string
  address: string
  facilities: string[]
  opening_hours: string | null
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

const filteredGyms = computed(() => {
  const gyms = data.value?.accessible_gyms ?? []
  return gyms.filter(g => {
    const matchTier   = !filterTier.value || g.tier === filterTier.value
    const matchSearch = !search.value ||
      g.name.toLowerCase().includes(search.value.toLowerCase()) ||
      g.sub_city.toLowerCase().includes(search.value.toLowerCase()) ||
      g.city?.toLowerCase().includes(search.value.toLowerCase())
    return matchTier && matchSearch
  })
})

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

// Map known tiers to CSS suffix; unknown tiers fall back to 'basic' colour
const TIER_CSS: Record<string, string> = {
  platinum: 'platinum', premium: 'premium', basic_plus: 'basic_plus', basic: 'basic',
}
function tierPillClass(t: string, prefix = 'tier-pill--'): string {
  return prefix + (TIER_CSS[t] ?? 'basic')
}

function tierLabel(t: string): string {
  // Use plan label from API if available, otherwise humanise the tier key
  const labels = data.value?.pass.plan_labels ?? {}
  if (labels[t]) return labels[t]
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
  border-top-color: #e0386a; border-radius: 50%; animation: spin 0.7s linear infinite;
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
.tier-pill--platinum   { background: #f5f3ff; color: #7c3aed; }
.tier-pill--premium    { background: #eff6ff; color: #2563eb; }
.tier-pill--basic_plus { background: #e0f2fe; color: #0284c7; }
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
.search-input:focus { border-color: #e0386a; }
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
.tier-select:focus { border-color: #e0386a; }

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
.gym-avatar--platinum   { background: #f5f3ff; color: #7c3aed; }
.gym-avatar--premium    { background: #eff6ff; color: #2563eb; }
.gym-avatar--basic_plus { background: #e0f2fe; color: #0284c7; }
.gym-avatar--basic      { background: #f1f5f9; color: #64748b; }

.tier-tag {
  padding: 3px 10px; border-radius: 10px; font-size: 0.7rem; font-weight: 600;
}
.tier-tag--platinum   { background: #f5f3ff; color: #7c3aed; }
.tier-tag--premium    { background: #eff6ff; color: #2563eb; }
.tier-tag--basic_plus { background: #e0f2fe; color: #0284c7; }
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
