<template>
  <div class="page">
    <h1 class="visits-h1">Your visits</h1>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading check-in history…</p>
    </div>

    <template v-else-if="checkins !== null">

      <!-- Summary stat strip -->
      <div class="stat-strip">
        <div class="stat-item">
          <p class="stat-val">{{ stats.total_checkins }}</p>
          <p class="stat-lbl">Total visits</p>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <p class="stat-val">{{ stats.this_month_checkins }}</p>
          <p class="stat-lbl">This month</p>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <p class="stat-val">{{ stats.this_week_checkins }}</p>
          <p class="stat-lbl">This week</p>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <p class="stat-val">{{ stats.gyms_visited }}</p>
          <p class="stat-lbl">Gyms visited</p>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <p class="stat-val">{{ avgDuration ? duration(avgDuration) : '—' }}</p>
          <p class="stat-lbl">Avg time spent</p>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="toolbar">
        <div class="search-wrap">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input v-model="search" type="text" class="search-input" placeholder="Search by gym, branch or area…" />
          <button v-if="search" class="clear-btn" aria-label="Clear search" @click="search = ''">✕</button>
        </div>
        <select v-model="filterMonth" class="month-select">
          <option value="">All time</option>
          <option v-for="m in availableMonths" :key="m.value" :value="m.value">{{ m.label }}</option>
        </select>
      </div>

      <!-- Empty -->
      <div v-if="filteredCheckins.length === 0" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.4"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        <p>{{ search || filterMonth ? 'No check-ins match your filters.' : 'No check-ins yet. Visit a partner gym to get started.' }}</p>
      </div>

      <!-- Check-in table -->
      <div v-else class="table-card">
        <table class="ci-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Gym / branch</th>
              <th>Location</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Time spent</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in paginatedCheckins" :key="c.id" class="clickable" tabindex="0" @click="open(c)" @keydown.enter="open(c)">
              <td class="cell-date"><strong>{{ c.date || '—' }}</strong><span>{{ c.weekday }}</span></td>
              <td class="cell-gym">
                {{ c.gym_name }}
                <span v-if="c.branch_name" class="branch">{{ c.branch_name }}</span>
                <span class="tier-tag" :class="`tier-tag--${c.gym_tier}`">{{ tierLabel(c.gym_tier) }}</span>
              </td>
              <td class="cell-loc">{{ location(c) }}</td>
              <td class="cell-time">{{ c.time_in || '—' }}</td>
              <td class="cell-time">{{ c.time_out || '—' }}</td>
              <td class="cell-dur">
                <span v-if="c.duration_min" class="dur-chip">{{ duration(c.duration_min) }}</span>
                <span v-else class="cell-na">—</span>
              </td>
              <td><span class="status" :class="`status--${c.status}`">{{ statusLabel(c.status) }}</span></td>
              <td class="cell-more">Details ›</td>
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

      <!-- Visit details -->
      <Transition name="fade">
        <div v-if="selected" class="overlay" @click.self="selected = null">
          <div class="detail" role="dialog" aria-modal="true" aria-labelledby="visit-title">
            <header class="detail-head">
              <div>
                <p class="detail-kicker">Visit on {{ selected.weekday }}, {{ selected.date }}</p>
                <h2 id="visit-title">{{ selected.gym_name }}</h2>
                <p v-if="selected.branch_name" class="detail-branch">{{ selected.branch_name }} branch</p>
              </div>
              <button class="close" aria-label="Close" @click="selected = null">✕</button>
            </header>

            <div class="times">
              <div><span>Checked in</span><strong>{{ selected.time_in || '—' }}</strong></div>
              <div><span>Checked out</span><strong>{{ selected.time_out || '—' }}</strong></div>
              <div><span>Time spent</span><strong>{{ selected.duration_min ? duration(selected.duration_min) : '—' }}</strong></div>
            </div>

            <dl class="facts">
              <div><dt>Status</dt><dd><span class="status" :class="`status--${selected.status}`">{{ statusLabel(selected.status) }}</span></dd></div>
              <div><dt>Gym level</dt><dd>{{ tierLabel(selected.gym_tier) }}</dd></div>
              <div><dt>Address</dt><dd>{{ fullAddress(selected) }}</dd></div>
              <div v-if="selected.gym_phone"><dt>Gym phone</dt><dd><a :href="`tel:${selected.gym_phone}`">{{ selected.gym_phone }}</a></dd></div>
              <div><dt>Checked in with</dt><dd>{{ selected.method_label }}</dd></div>
              <div v-if="selected.recorded_by"><dt>Recorded by</dt><dd>{{ selected.recorded_by }}</dd></div>
              <div><dt>Visit reference</dt><dd>#{{ selected.id }}</dd></div>
            </dl>

            <p v-if="selected.status === 'no_checkout'" class="note">
              No check-out was recorded for this visit, so the time spent is not known.
            </p>

            <div class="detail-actions">
              <a v-if="selected.latitude !== null && selected.longitude !== null" class="btn" target="_blank" rel="noopener"
                 :href="`https://www.google.com/maps/search/?api=1&query=${selected.latitude},${selected.longitude}`">Open in maps</a>
              <button class="btn ghost" @click="selected = null">Close</button>
            </div>
          </div>
        </div>
      </Transition>

    </template>

    <!-- Error -->
    <div v-else class="error-state">
      <p>{{ error }}</p>
      <button class="retry-btn" @click="load">Retry</button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, reactive } from 'vue'
import { useApi } from '@/composables/useApi'
import AppPagination from '@/components/AppPagination.vue'

type VisitStatus = 'completed' | 'in_gym' | 'no_checkout'

interface CheckIn {
  id: number
  gym_id: number | null
  gym_name: string
  branch_name: string | null
  gym_tier: string
  gym_sub_city: string
  gym_city: string | null
  gym_address: string | null
  gym_phone: string | null
  latitude: number | null
  longitude: number | null
  checked_in_at: string | null
  checked_out_at: string | null
  date: string | null
  weekday: string | null
  time_in: string | null
  time_out: string | null
  duration_min: number | null
  status: VisitStatus
  method: string
  method_label: string
  recorded_by: string | null
}

interface CheckinsRes {
  checkins: CheckIn[]
  stats: { total_checkins: number; this_month_checkins: number; this_week_checkins: number; gyms_visited: number }
}

const api      = useApi()
const loading  = ref(true)
const error    = ref('')
const checkins = ref<CheckIn[] | null>(null)
const search      = ref('')
const filterMonth = ref('')
const selected    = ref<CheckIn | null>(null)
const stats = reactive({ total_checkins: 0, this_month_checkins: 0, this_week_checkins: 0, gyms_visited: 0 })

const avgDuration = computed(() => {
  const withDur = (checkins.value ?? []).filter(c => c.duration_min)
  if (!withDur.length) return null
  return Math.round(withDur.reduce((s, c) => s + (c.duration_min ?? 0), 0) / withDur.length)
})

const availableMonths = computed(() => {
  const months = new Set<string>()
  ;(checkins.value ?? []).forEach(c => { if (c.checked_in_at) months.add(c.checked_in_at.slice(0, 7)) })
  return Array.from(months).sort().reverse().map(m => ({
    value: m,
    label: new Date(m + '-01T00:00:00').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
  }))
})

const filteredCheckins = computed(() => {
  const q = search.value.trim().toLowerCase()
  return (checkins.value ?? []).filter(c => {
    const matchSearch = !q || [c.gym_name, c.branch_name, c.gym_sub_city, c.gym_city, c.gym_address]
      .some(v => (v ?? '').toLowerCase().includes(q))
    const matchMonth = !filterMonth.value || (c.checked_in_at ?? '').startsWith(filterMonth.value)
    return matchSearch && matchMonth
  })
})

const ciPage    = ref(1)
const ciPerPage = 10
const ciTotalPages      = computed(() => Math.max(1, Math.ceil(filteredCheckins.value.length / ciPerPage)))
const paginatedCheckins = computed(() => filteredCheckins.value.slice((ciPage.value - 1) * ciPerPage, ciPage.value * ciPerPage))

async function load() {
  loading.value = true
  error.value   = ''
  try {
    const data = await api.get<CheckinsRes>('employee/checkins')
    checkins.value = data.checkins
    Object.assign(stats, data.stats)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Could not load check-ins.'
    checkins.value = null
  } finally {
    loading.value = false
  }
}

function open(c: CheckIn) { selected.value = c }
function onKey(e: KeyboardEvent) { if (e.key === 'Escape') selected.value = null }

onMounted(() => { load(); window.addEventListener('keydown', onKey) })
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
watch(filteredCheckins, () => { ciPage.value = 1 })

function duration(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60), m = min % 60
  return m ? `${h} h ${m} min` : `${h} h`
}
function location(c: CheckIn): string {
  return [c.gym_sub_city, c.gym_city].filter(Boolean).join(', ') || '—'
}
function fullAddress(c: CheckIn): string {
  return [c.gym_address, c.gym_sub_city, c.gym_city].filter(Boolean).join(', ') || '—'
}
function statusLabel(s: VisitStatus): string {
  return s === 'completed' ? 'Completed' : s === 'in_gym' ? 'In the gym now' : 'No check-out'
}
function tierLabel(t: string): string {
  return t === 'platinum' ? 'Platinum' : t === 'premium' ? 'Premium' : t === 'basic_plus' ? 'Plus' : 'Basic'
}
</script>

<style scoped>
.visits-h1 { margin: 0 0 22px; font-family: var(--font-heading); font-size: 42px; font-weight: 600; color: #1f2937; }
@media (max-width: 600px) { .visits-h1 { font-size: 30px; } }
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
.search-input:focus { border-color: #8BE000; }
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
.month-select:focus { border-color: #8BE000; }

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
.tier-tag--platinum   { background: #EBFAEE; color: #72B800; }
.tier-tag--premium    { background: #EBFAEE; color: #8BE000; }
.tier-tag--basic_plus { background: #EEF9DC; color: #72B800; }
.tier-tag--basic      { background: #f1f5f9; color: #64748b; }

/* Extra cells */
.clickable { cursor: pointer; }
.clickable:focus-visible { outline: 2px solid #8BE000; outline-offset: -2px; }
.cell-date { white-space: nowrap; }
.cell-date strong { display: block; color: #0f172a; font-weight: 600; }
.cell-date span { font-size: .74rem; color: #94a3b8; }
.cell-gym .branch { display: block; font-weight: 500; font-size: .76rem; color: #64748b; margin: 2px 0 4px; }
.cell-gym .tier-tag { margin-top: 4px; }
.cell-more { color: #72B800; font-weight: 600; font-size: .78rem; white-space: nowrap; text-align: right; }
.status { display: inline-block; padding: 3px 9px; border-radius: 20px; font-size: .72rem; font-weight: 600; white-space: nowrap; }
.status--completed   { background: #f0fdf4; color: #15803d; }
.status--in_gym      { background: #eef9dc; color: #4d7c0f; }
.status--no_checkout { background: #fef3c7; color: #92400e; }

/* Detail dialog */
.overlay { position: fixed; inset: 0; z-index: 2000; background: rgba(15,23,42,.45); display: flex; align-items: center; justify-content: center; padding: 16px; }
.detail { background: #fff; border-radius: 18px; width: 100%; max-width: 520px; max-height: calc(100vh - 32px); overflow: auto; box-shadow: 0 24px 60px rgba(0,0,0,.25); }
.detail-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding: 22px 24px 16px; background: #0b0c10; color: #fff; }
.detail-head h2 { margin: 2px 0 0; font-size: 1.25rem; }
.detail-kicker { margin: 0; font-size: .76rem; color: #8BE000; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; }
.detail-branch { margin: 4px 0 0; font-size: .85rem; color: #cbd5e1; }
.close { background: rgba(255,255,255,.1); border: none; color: #fff; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; flex-shrink: 0; }
.close:hover { background: rgba(255,255,255,.2); }
.times { display: grid; grid-template-columns: repeat(3, 1fr); border-bottom: 1px solid #f1f5f9; }
.times div { padding: 16px 8px; text-align: center; border-right: 1px solid #f1f5f9; }
.times div:last-child { border-right: none; }
.times span { display: block; font-size: .7rem; color: #94a3b8; text-transform: uppercase; letter-spacing: .05em; }
.times strong { display: block; margin-top: 4px; font-size: 1.1rem; color: #0f172a; }
.facts { margin: 0; padding: 8px 24px; }
.facts div { display: flex; justify-content: space-between; gap: 16px; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
.facts div:last-child { border-bottom: none; }
.facts dt { font-size: .82rem; color: #64748b; flex-shrink: 0; }
.facts dd { margin: 0; font-size: .85rem; color: #0f172a; font-weight: 600; text-align: right; }
.facts a { color: #4d7c0f; }
.note { margin: 0 24px 8px; padding: 10px 12px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; font-size: .8rem; color: #92400e; }
.detail-actions { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 24px 22px; }
.btn { padding: 9px 18px; border-radius: 10px; border: 1.5px solid #0b0c10; background: #0b0c10; color: #fff; font-weight: 700; font-size: .84rem; cursor: pointer; text-decoration: none; }
.btn:hover { background: #8BE000; border-color: #8BE000; color: #0b0c10; }
.btn.ghost { background: #fff; color: #0b0c10; border-color: #e2e8f0; }
.fade-enter-active, .fade-leave-active { transition: opacity .18s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 900px) {
  .ci-table th:nth-child(3), .ci-table td:nth-child(3),
  .ci-table th:nth-child(8), .ci-table td:nth-child(8) { display: none; }
}
@media (max-width: 700px) {
  .table-card { overflow-x: auto; }
  .ci-table th:nth-child(5),
  .ci-table td:nth-child(5),
  .ci-table th:nth-child(6),
  .ci-table td:nth-child(6) { display: none; }
  .stat-strip { gap: 12px; }
  .stat-divider { display: none; }
}
</style>
