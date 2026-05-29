<template>
  <div class="page">

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading check-in history…</p>
    </div>

    <template v-else-if="checkins !== null">

      <!-- Summary stat strip -->
      <div class="stat-strip">
        <div class="stat-item">
          <p class="stat-val">{{ totalCount }}</p>
          <p class="stat-lbl">Total Visits</p>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <p class="stat-val">{{ monthCount }}</p>
          <p class="stat-lbl">This Month</p>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <p class="stat-val">{{ weekCount }}</p>
          <p class="stat-lbl">This Week</p>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <p class="stat-val">{{ avgDuration ? avgDuration + ' min' : '—' }}</p>
          <p class="stat-lbl">Avg Duration</p>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="toolbar">
        <div class="search-wrap">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input v-model="search" type="text" class="search-input" placeholder="Search by gym name…" />
          <button v-if="search" class="clear-btn" @click="search = ''">✕</button>
        </div>
        <select v-model="filterMonth" class="month-select">
          <option value="">All time</option>
          <option v-for="m in availableMonths" :key="m.value" :value="m.value">{{ m.label }}</option>
        </select>
      </div>

      <!-- Empty -->
      <div v-if="filteredCheckins.length === 0" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.4"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        <p>{{ search || filterMonth ? 'No check-ins match your filters.' : 'No check-ins yet. Visit a gym to get started!' }}</p>
      </div>

      <!-- Check-in table -->
      <div v-else class="table-card">
        <table class="ci-table">
          <thead>
            <tr>
              <th>Gym</th>
              <th>Location</th>
              <th>Tier</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in paginatedCheckins" :key="c.id">
              <td class="cell-gym">{{ c.gym_name }}</td>
              <td class="cell-loc">{{ c.gym_sub_city || '—' }}</td>
              <td>
                <span class="tier-tag" :class="`tier-tag--${c.gym_tier}`">{{ tierLabel(c.gym_tier) }}</span>
              </td>
              <td class="cell-time">{{ formatDateTime(c.checked_in_at) }}</td>
              <td class="cell-time">{{ c.checked_out_at ? formatDateTime(c.checked_out_at) : '—' }}</td>
              <td class="cell-dur">
                <span v-if="c.duration_min" class="dur-chip">{{ c.duration_min }} min</span>
                <span v-else class="cell-na">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <AppPagination
        v-model:page="ciPage"
        :total-pages="ciTotalPages"
        :total="filteredCheckins.length"
        :per-page="ciPerPage"
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
import { ref, computed, onMounted, watch } from 'vue'
import { useApi } from '@/composables/useApi'
import AppPagination from '@/components/AppPagination.vue'

interface CheckIn {
  id: number
  gym_name: string
  gym_tier: string
  gym_sub_city: string
  checked_in_at: string | null
  checked_out_at: string | null
  duration_min: number | null
}

interface DashboardData {
  recent_checkins: CheckIn[]
  stats: {
    total_checkins: number
    this_month_checkins: number
    this_week_checkins: number
  }
}

const api      = useApi()
const loading  = ref(true)
const error    = ref('')
const checkins = ref<CheckIn[] | null>(null)
const search      = ref('')
const filterMonth = ref('')

const totalCount = ref(0)
const monthCount = ref(0)
const weekCount  = ref(0)

const avgDuration = computed(() => {
  const withDur = (checkins.value ?? []).filter(c => c.duration_min)
  if (!withDur.length) return null
  return Math.round(withDur.reduce((s, c) => s + (c.duration_min ?? 0), 0) / withDur.length)
})

const availableMonths = computed(() => {
  const months = new Set<string>()
  ;(checkins.value ?? []).forEach(c => {
    if (c.checked_in_at) {
      const d = new Date(c.checked_in_at)
      months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }
  })
  return Array.from(months).sort().reverse().map(m => ({
    value: m,
    label: new Date(m + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
  }))
})

const ciPage    = ref(1)
const ciPerPage = 20
const ciTotalPages   = computed(() => Math.max(1, Math.ceil(filteredCheckins.value.length / ciPerPage)))
const paginatedCheckins = computed(() => filteredCheckins.value.slice((ciPage.value - 1) * ciPerPage, ciPage.value * ciPerPage))

const filteredCheckins = computed(() => {
  return (checkins.value ?? []).filter(c => {
    const matchSearch = !search.value ||
      c.gym_name.toLowerCase().includes(search.value.toLowerCase())
    const matchMonth = !filterMonth.value ||
      (c.checked_in_at && c.checked_in_at.startsWith(filterMonth.value))
    return matchSearch && matchMonth
  })
})

async function load() {
  loading.value = true
  error.value   = ''
  try {
    const data = await api.get<DashboardData>('employee/dashboard')
    checkins.value = data.recent_checkins
    totalCount.value = data.stats.total_checkins
    monthCount.value = data.stats.this_month_checkins
    weekCount.value  = data.stats.this_week_checkins
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Could not load check-ins.'
    checkins.value = null
  } finally {
    loading.value = false
  }
}

onMounted(load)

watch(filteredCheckins, () => { ciPage.value = 1 })

function formatDateTime(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function tierLabel(t: string): string {
  return t === 'platinum' ? 'Platinum' : t === 'premium' ? 'Premium' : t === 'basic_plus' ? 'Plus' : 'Basic'
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
  border-top-color: #4CD964; border-radius: 50%; animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.retry-btn {
  padding: 8px 20px; border-radius: 8px; border: 1.5px solid #e2e8f0;
  background: #fff; font-size: 0.85rem; cursor: pointer; color: #334155;
}

/* Stat strip */
.stat-strip {
  display: flex; align-items: center;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
  padding: 18px 24px; gap: 0; flex-wrap: wrap;
}
.stat-item { flex: 1; text-align: center; min-width: 100px; }
.stat-val { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0 0 2px; letter-spacing: -0.02em; }
.stat-lbl { font-size: 0.75rem; color: #94a3b8; margin: 0; }
.stat-divider { width: 1px; background: #e2e8f0; align-self: stretch; margin: 0 8px; }

/* Toolbar */
.toolbar { display: flex; gap: 12px; flex-wrap: wrap; }
.search-wrap { position: relative; flex: 1; min-width: 220px; }
.search-icon {
  position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
  color: #94a3b8; pointer-events: none;
}
.search-input {
  width: 100%; padding: 10px 36px;
  border: 1.5px solid #e2e8f0; border-radius: 10px;
  font-size: 0.9rem; color: #1e293b; background: #fff;
  outline: none; transition: border-color 0.2s; font-family: inherit;
}
.search-input:focus { border-color: #4CD964; }
.search-input::placeholder { color: #94a3b8; }
.clear-btn {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 0.8rem; padding: 2px 4px;
}
.clear-btn:hover { color: #334155; }
.month-select {
  padding: 10px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px;
  font-size: 0.88rem; color: #1e293b; background: #fff;
  outline: none; cursor: pointer; font-family: inherit;
  transition: border-color 0.2s;
}
.month-select:focus { border-color: #4CD964; }

/* Empty */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; padding: 60px 20px; color: #94a3b8; font-size: 0.9rem; text-align: center;
}

/* Table */
.table-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;
}
.ci-table {
  width: 100%; border-collapse: collapse;
}
.ci-table thead tr {
  background: #f8fafc;
}
.ci-table th {
  text-align: left; padding: 12px 16px;
  font-size: 0.73rem; font-weight: 600; color: #94a3b8;
  letter-spacing: 0.07em; text-transform: uppercase;
  border-bottom: 1px solid #e2e8f0;
}
.ci-table tbody tr {
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.15s;
}
.ci-table tbody tr:last-child { border-bottom: none; }
.ci-table tbody tr:hover { background: #fafbfc; }
.ci-table td {
  padding: 13px 16px; font-size: 0.84rem; color: #334155;
}
.cell-gym { font-weight: 600; color: #0f172a; }
.cell-loc { color: #64748b; }
.cell-time { color: #64748b; white-space: nowrap; }
.cell-dur { white-space: nowrap; }
.cell-na { color: #cbd5e1; }

.dur-chip {
  display: inline-block; padding: 2px 9px;
  background: #f0fdf4; color: #16a34a;
  border-radius: 20px; font-size: 0.75rem; font-weight: 600;
}

.tier-tag {
  display: inline-block; padding: 3px 9px;
  border-radius: 10px; font-size: 0.71rem; font-weight: 600;
}
.tier-tag--platinum   { background: #EBFAEE; color: #2EB84B; }
.tier-tag--premium    { background: #EBFAEE; color: #4CD964; }
.tier-tag--basic_plus { background: #e0f2fe; color: #2EB84B; }
.tier-tag--basic      { background: #f1f5f9; color: #64748b; }

@media (max-width: 700px) {
  .ci-table th:nth-child(3),
  .ci-table td:nth-child(3),
  .ci-table th:nth-child(5),
  .ci-table td:nth-child(5) { display: none; }
  .stat-strip { gap: 12px; }
  .stat-divider { display: none; }
}
</style>
