<template>
  <div class="page">

    <!-- Header buttons -->
    <div class="page-actions">
      <div></div>
      <div class="header-btns">
        <button class="btn-refresh" @click="generate">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          Refresh
        </button>
        <button class="btn-export" @click="exportCsv">↓ Export CSV</button>
      </div>
    </div>

    <!-- Filter panel -->
    <div class="filter-panel">
      <div class="filter-group">
        <label class="filter-label">PERIOD</label>
        <select v-model="period" class="select-box">
          <option value="monthly">Monthly</option>
          <option value="weekly">Weekly</option>
          <option value="daily">Daily</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">GYM</label>
        <select v-model="gymFilter" class="select-box">
          <option value="">All gyms</option>
          <option v-for="g in allGyms" :key="g.id" :value="g.id">{{ g.name }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">FROM</label>
        <div class="date-wrap">
          <input v-model="dateFrom" type="date" class="date-input" />
          <svg class="date-icon" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </div>
      </div>
      <div class="filter-group">
        <label class="filter-label">TO</label>
        <div class="date-wrap">
          <input v-model="dateTo" type="date" class="date-input" />
          <svg class="date-icon" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </div>
      </div>
      <div class="filter-group filter-group--btn">
        <button class="btn-generate" @click="generate">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          Generate Report
        </button>
      </div>
    </div>

    <div v-if="loading" class="state-msg">Generating report…</div>

    <template v-else>
      <!-- Gym summary cards -->
      <div v-if="gymSummaries.length" class="gym-summary-grid">
        <div v-for="g in gymSummaries" :key="g.id" class="gym-sum-card" :class="'gscard-' + gymTierKey(g.tier)">
          <div class="gsc-header">
            <div>
              <h3 class="gsc-name">{{ g.name }}</h3>
              <span class="gsc-tier-badge" :class="'gtb-' + gymTierKey(g.tier)">{{ gymTierLabel(g.tier) }}</span>
            </div>
            <span class="gsc-big-num">{{ g.total_checkins }}</span>
          </div>
          <div class="gsc-stats">
            <div><p class="gsc-sl">Unique members</p><p class="gsc-sv">{{ g.unique_members }}</p></div>
            <div><p class="gsc-sl">Active days</p><p class="gsc-sv">{{ g.active_days }}</p></div>
            <div><p class="gsc-sl">First check-in</p><p class="gsc-sv">{{ g.first_checkin?.slice(0,10) ?? '—' }}</p></div>
            <div><p class="gsc-sl">Last check-in</p><p class="gsc-sv">{{ g.last_checkin?.slice(0,10) ?? '—' }}</p></div>
          </div>
        </div>
      </div>

      <!-- Grouped bar chart -->
      <div v-if="chartPeriods.length" class="card">
        <h3 class="card-title">Check-ins by {{ periodLabel }} Period</h3>
        <div class="bar-scroll">
          <svg :width="chartW" :height="chartH + 50" :viewBox="`0 0 ${chartW} ${chartH + 50}`">
            <!-- Y gridlines -->
            <line v-for="tick in yTicks" :key="tick"
              :x1="Y_PAD" :y1="chartH - (tick / yMax) * (chartH - 20)"
              :x2="chartW" :y2="chartH - (tick / yMax) * (chartH - 20)"
              stroke="#f1f5f9" stroke-width="1"/>
            <text v-for="tick in yTicks" :key="'yt'+tick"
              :x="Y_PAD - 5" :y="chartH - (tick / yMax) * (chartH - 20) + 4"
              text-anchor="end" fill="#94a3b8" font-size="10">{{ tick }}</text>

            <!-- Bars per period -->
            <g v-for="(p, pi) in chartPeriods" :key="p">
              <!-- Period label -->
              <text
                :x="Y_PAD + pi * periodStep + periodStep / 2"
                :y="chartH + 20"
                text-anchor="middle" fill="#94a3b8" font-size="11"
              >{{ p }}</text>
              <!-- Bars per gym in this period -->
              <g v-for="(gym, gi) in gymSummaries" :key="gym.id">
                <rect
                  :x="Y_PAD + pi * periodStep + gi * singleBarW + 4"
                  :y="chartH - barHeight(gymPeriodVal(gym.id, p)) - 1"
                  :width="singleBarW - 2"
                  :height="barHeight(gymPeriodVal(gym.id, p))"
                  :fill="gymColors[gi % gymColors.length]"
                  rx="3" opacity="0.85"
                />
              </g>
            </g>

            <!-- Legend -->
            <g v-for="(gym, gi) in gymSummaries" :key="'leg'+gym.id"
              :transform="`translate(${Y_PAD + gi * 160}, ${chartH + 36})`">
              <rect width="12" height="12" rx="2" :fill="gymColors[gi % gymColors.length]"/>
              <text x="16" y="10" fill="#64748b" font-size="10">{{ gym.name }}</text>
            </g>
          </svg>
        </div>
      </div>

      <!-- Detailed table -->
      <div v-if="periodData.length" class="card">
        <h3 class="card-title">Detailed Data</h3>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr><th>PERIOD</th><th>GYM</th><th>TIER</th><th>CHECK-INS</th><th>UNIQUE MEMBERS</th><th>ACTIVE DAYS</th></tr>
            </thead>
            <tbody>
              <tr v-for="row in paginatedPeriodData" :key="`${row.period}-${row.gym_id}`">
                <td class="td-period">{{ row.period }}</td>
                <td class="td-name">{{ row.gym_name }}</td>
                <td><span class="gsc-tier-badge" :class="'gtb-' + gymTierKey(row.gym_tier)">{{ gymTierLabel(row.gym_tier) }}</span></td>
                <td class="td-num teal">{{ row.checkins }}</td>
                <td class="td-num">{{ row.unique_members }}</td>
                <td class="td-num">{{ row.active_days }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <AppPagination
          v-model:page="detailPage"
          :total-pages="detailTotalPages"
          :total="periodData.length"
          :per-page="detailPerPage"
        />
      </div>

      <div v-if="!gymSummaries.length" class="state-msg">No check-in data for the selected filters.</div>
    </template>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'
import AppPagination from '@/components/AppPagination.vue'

const api = useApi()

interface GymSummary {
  id: number; name: string; tier: string; total_checkins: number
  unique_members: number; active_days: number; first_checkin: string; last_checkin: string
}
interface PeriodRow {
  period: string; gym_id: number; gym_name: string; gym_tier: string
  checkins: number; unique_members: number; active_days: number
}
interface GymBasic { id: number; name: string }

const gymSummaries = ref<GymSummary[]>([])
const periodData   = ref<PeriodRow[]>([])
const allGyms      = ref<GymBasic[]>([])
const loading      = ref(true)
const period       = ref('monthly')
const gymFilter    = ref('')
const dateFrom     = ref('')
const dateTo       = ref('')

const periodLabel = computed(() => ({ monthly: 'Monthly', weekly: 'Weekly', daily: 'Daily' }[period.value] ?? 'Monthly'))

async function generate() {
  loading.value = true
  detailPage.value = 1
  try {
    let url = `dashboard/attendance-report?period=${period.value}`
    if (gymFilter.value) url += `&gym_id=${gymFilter.value}`
    if (dateFrom.value)  url += `&from=${dateFrom.value}`
    if (dateTo.value)    url += `&to=${dateTo.value}`
    const res = await api.get<{ gym_summaries: GymSummary[]; period_data: PeriodRow[] }>(url)
    gymSummaries.value = res.gym_summaries ?? []
    periodData.value   = res.period_data   ?? []
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  // Load gym list for filter dropdown
  try {
    const res = await api.get<{ data: GymBasic[] } | GymBasic[]>('gyms')
    allGyms.value = Array.isArray(res) ? res : (res as { data: GymBasic[] }).data
  } catch {}
  await generate()
})

/* ── Detail table pagination ──────────────────────────────────── */
const detailPage    = ref(1)
const detailPerPage = 20
const detailTotalPages   = computed(() => Math.max(1, Math.ceil(periodData.value.length / detailPerPage)))
const paginatedPeriodData = computed(() => periodData.value.slice((detailPage.value - 1) * detailPerPage, detailPage.value * detailPerPage))

/* ── Chart ────────────────────────────────────────────────────── */
const gymColors = ['#4CD964', '#2EB84B', '#f59e0b', '#3b82f6', '#ef4444', '#ec4899']

const chartPeriods = computed(() => [...new Set(periodData.value.map(r => r.period))].sort())

const periodStep = 140
const singleBarW = computed(() => gymSummaries.value.length ? Math.min(36, (periodStep - 20) / gymSummaries.value.length) : 36)
const Y_PAD = 30
const chartW = computed(() => Y_PAD + chartPeriods.value.length * periodStep + 30)
const chartH = 180

const yMax = computed(() => Math.max(...periodData.value.map(r => r.checkins), 10))
const yTicks = computed(() => {
  const step = Math.ceil(yMax.value / 4)
  return [0, step, step * 2, step * 3, step * 4]
})

function barHeight(v: number) {
  return Math.max(0, (v / (yMax.value || 1)) * (chartH - 20))
}

function gymPeriodVal(gymId: number, p: string) {
  return periodData.value.find(r => r.gym_id === gymId && r.period === p)?.checkins ?? 0
}

/* ── Tier helpers ─────────────────────────────────────────────── */
function gymTierKey(t: string) {
  if (!t) return 'basic'
  if (t.includes('platinum')) return 'platinum'
  if (t.includes('plus'))     return 'plus'
  return 'basic'
}
function gymTierLabel(t: string) {
  if (!t) return 'Basic Gym'
  if (t.includes('platinum')) return 'Platinum Gym'
  if (t.includes('plus'))     return 'Basic Plus Gym'
  return 'Basic Gym'
}

/* ── Export CSV ───────────────────────────────────────────────── */
function exportCsv() {
  const rows = [
    ['Period', 'Gym', 'Tier', 'Check-ins', 'Unique Members', 'Active Days'],
    ...periodData.value.map(r => [r.period, r.gym_name, gymTierLabel(r.gym_tier), r.checkins, r.unique_members, r.active_days]),
  ]
  const csv  = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const a    = document.createElement('a')
  a.href     = URL.createObjectURL(blob)
  a.download = `attendance_report_${new Date().toISOString().slice(0,10)}.csv`
  a.click()
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 20px; }

.page-actions { display: flex; align-items: center; justify-content: space-between; }
.header-btns  { display: flex; gap: 10px; }

.btn-refresh, .btn-export, .btn-generate {
  display: flex; align-items: center; gap: 6px;
  padding: 9px 16px; border-radius: 10px; font-size: 0.84rem; font-weight: 600;
  border: none; cursor: pointer; transition: opacity .15s;
}
.btn-refresh  { background: white; color: #64748b; border: 1px solid #e2e8f0; }
.btn-export   { background: #4CD964; color: white; }
.btn-generate { background: #2EB84B; color: white; }
.btn-refresh:hover, .btn-export:hover, .btn-generate:hover { opacity: .85; }

/* Filter panel */
.filter-panel {
  background: white; border-radius: 14px; padding: 20px;
  display: flex; gap: 16px; flex-wrap: wrap; align-items: flex-end;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.filter-group { display: flex; flex-direction: column; gap: 6px; }
.filter-group--btn { justify-content: flex-end; }
.filter-label { font-size: 0.68rem; font-weight: 600; color: #94a3b8; letter-spacing: 0.08em; text-transform: uppercase; }
.select-box {
  padding: 9px 12px; background: white; border: 1px solid #e2e8f0;
  border-radius: 10px; color: #0f172a; font-size: 0.84rem; outline: none; font-family: inherit;
}
.select-box:focus { border-color: #2EB84B; }
/* Custom date input */
.date-wrap { position: relative; }
.date-input {
  padding: 9px 38px 9px 13px; background: white; border: 1.5px solid #e2e8f0;
  border-radius: 10px; color: #0f172a; font-size: 0.84rem; outline: none;
  font-family: inherit; cursor: pointer; color-scheme: light;
  transition: border-color .15s, box-shadow .15s;
}
.date-input:focus { border-color: #2EB84B; box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
.date-icon {
  position: absolute; right: 11px; top: 50%; transform: translateY(-50%);
  color: #94a3b8; pointer-events: none;
}
.date-input::-webkit-calendar-picker-indicator {
  opacity: 0; cursor: pointer; position: absolute; right: 0; top: 0; width: 38px; height: 100%;
}
.date-input { color-scheme: light; }

.state-msg { text-align: center; color: #94a3b8; padding: 48px; background: white; border-radius: 14px; }

/* Gym summary cards */
.gym-summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.gym-sum-card {
  background: white; border-radius: 14px; padding: 20px;
  border: 1.5px solid #e2e8f0; box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.gscard-platinum { background: #faf5ff; border-color: #e9d5ff; }
.gscard-plus     { background: #f0fdf9; border-color: #99f6e4; }

.gsc-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
.gsc-name   { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0 0 6px; }
.gsc-big-num { font-size: 2rem; font-weight: 800; color: #4CD964; line-height: 1; }
.gscard-platinum .gsc-big-num { color: #2EB84B; }

.gsc-tier-badge {
  display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600;
}
.gtb-platinum { background: #ede9fe; color: #2EB84B; }
.gtb-plus     { background: #d1fae5; color: #2EB84B; }
.gtb-basic    { background: #f1f5f9; color: #64748b; }

.gsc-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.gsc-sl { font-size: 0.72rem; color: #94a3b8; margin: 0 0 2px; }
.gsc-sv { font-size: 0.88rem; font-weight: 600; color: #0f172a; margin: 0; }

/* Chart */
.card { background: white; border-radius: 14px; padding: 22px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.card-title { font-size: 0.95rem; font-weight: 600; color: #0f172a; margin: 0 0 18px; }
.bar-scroll { overflow-x: auto; }

/* Table */
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.84rem; }
.data-table th {
  padding: 10px 14px; text-align: left; font-size: 0.7rem; font-weight: 600;
  color: #94a3b8; letter-spacing: 0.06em; text-transform: uppercase;
  border-bottom: 1px solid #f1f5f9;
}
.data-table td { padding: 12px 14px; border-bottom: 1px solid #f8fafc; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td { background: #f8fafc; }
.td-period { color: #64748b; font-size: 0.82rem; }
.td-name   { font-weight: 600; color: #0f172a; }
.td-num    { font-weight: 700; color: #0f172a; }
.td-num.teal { color: #4CD964; }
</style>
