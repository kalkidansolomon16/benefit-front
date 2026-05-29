<template>
  <div class="pc">

    <!-- Loading -->
    <div v-if="loading" class="pc-loading">
      <div class="spinner"></div>
      <p>Loading check-ins…</p>
    </div>

    <template v-else>

      <!-- Scan panel -->
      <div class="scan-card">
        <div class="scan-head">
          <div>
            <p class="scan-title">Scan Member Barcode</p>
            <p class="scan-sub">Type or scan the barcode shown on the member's app.</p>
          </div>
          <span v-if="scanResult" class="scan-pill" :class="scanResult.ok ? 'pill--ok' : 'pill--err'">
            {{ scanResult.message }}
          </span>
        </div>
        <form class="scan-form" @submit.prevent="submitScan">
          <input
            v-model="scanToken"
            class="scan-input"
            placeholder="e.g. FA1A2B3C4D5E6F7"
            autocomplete="off"
            :disabled="scanning"
          />
          <button class="scan-btn" type="submit" :disabled="scanning || !scanToken.trim()">
            {{ scanning ? 'Checking…' : 'Check In' }}
          </button>
        </form>
      </div>

      <!-- Expected Visitors Today -->
      <div class="visitors-card">
        <div class="visitors-head">
          <div class="visitors-title-wrap">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="visitors-icon">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <p class="visitors-title">Expected Visitors Today</p>
            <span class="visitors-count-pill">{{ expectedVisitors.length }}</span>
          </div>
          <button class="refresh-btn" @click="loadExpectedVisitors" :disabled="visitorsLoading" title="Refresh">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" :class="{ 'spin-anim': visitorsLoading }">
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
        </div>

        <!-- Visitors loading -->
        <div v-if="visitorsLoading" class="visitors-loading">
          <div class="spinner-sm"></div>
          <span>Loading…</span>
        </div>

        <!-- Empty state -->
        <div v-else-if="expectedVisitors.length === 0" class="visitors-empty">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <p>No members have selected this gym for today yet.</p>
        </div>

        <!-- Visitor list -->
        <div v-else class="visitors-list">
          <div
            v-for="v in expectedVisitors"
            :key="v.employee_id"
            class="visitor-row"
            :class="{ 'visitor-row--done': v.checked_in }"
          >
            <div class="visitor-av" :class="{ 'av--done': v.checked_in }">
              {{ initials(v.name) }}
            </div>
            <div class="visitor-info">
              <p class="visitor-name">{{ v.name }}</p>
              <p class="visitor-fan">{{ v.fan_number }}</p>
            </div>
            <div class="visitor-meta">
              <p class="visitor-time">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Selected {{ v.selected_at }}
              </p>
            </div>
            <span class="visitor-badge" :class="v.checked_in ? 'badge--in' : 'badge--pending'">
              <svg v-if="v.checked_in" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              <svg v-else width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {{ v.checked_in ? 'Checked In' : 'Pending' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Stat strip -->
      <div class="stat-strip">
        <div class="stat-tile">
          <p class="tile-label">Total</p>
          <p class="tile-value">{{ allCheckins.length }}</p>
        </div>
        <div class="stat-tile">
          <p class="tile-label">This Month</p>
          <p class="tile-value emerald">{{ monthCount }}</p>
        </div>
        <div class="stat-tile">
          <p class="tile-label">This Week</p>
          <p class="tile-value blue">{{ weekCount }}</p>
        </div>
        <div class="stat-tile">
          <p class="tile-label">Avg Duration</p>
          <p class="tile-value violet">{{ avgDur ?? '—' }}<span v-if="avgDur" class="tile-unit"> min</span></p>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-row">
        <div class="search-wrap">
          <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input v-model="search" class="search-input" placeholder="Search by member name or FAN…" />
        </div>
        <select v-model="monthFilter" class="filter-select">
          <option value="">All months</option>
          <option v-for="m in monthOptions" :key="m.value" :value="m.value">{{ m.label }}</option>
        </select>
        <select v-model="statusFilter" class="filter-select">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <!-- Table -->
      <div class="card">
        <div v-if="filtered.length === 0" class="empty-state">
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          <p>No check-ins match your filters.</p>
        </div>
        <div v-else class="table-wrap">
          <table class="ci-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Member</th>
                <th>FAN</th>
                <th>Checked In</th>
                <th>Checked Out</th>
                <th>Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(c, i) in paginatedFiltered" :key="c.id">
                <td class="idx-cell">{{ (partnerPage - 1) * partnerPerPage + i + 1 }}</td>
                <td>
                  <div class="member-cell">
                    <div class="member-av">{{ initials(c.employee_name) }}</div>
                    <span>{{ c.employee_name }}</span>
                  </div>
                </td>
                <td class="fan-cell">{{ c.fan_number ?? '—' }}</td>
                <td class="time-cell">{{ c.checked_in_at ?? '—' }}</td>
                <td class="time-cell">{{ c.checked_out_at ?? '—' }}</td>
                <td class="dur-cell">{{ c.duration_min != null ? c.duration_min + ' min' : '—' }}</td>
                <td>
                  <span class="status-pill" :class="c.status === 'active' ? 'pill--active' : 'pill--done'">
                    {{ c.status === 'active' ? 'Active' : 'Completed' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <AppPagination
          v-model:page="partnerPage"
          :total-pages="partnerTotalPages"
          :total="filtered.length"
          :per-page="partnerPerPage"
        />
      </div>

    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useApi } from '@/composables/useApi'
import AppPagination from '@/components/AppPagination.vue'

const api = useApi()

interface CheckinRow {
  id: number
  employee_name: string
  fan_number: string | null
  checked_in_at: string | null
  checked_out_at: string | null
  duration_min: number | null
  status: 'active' | 'completed'
}

interface ExpectedVisitor {
  employee_id: number
  name: string
  fan_number: string
  checked_in: boolean
  selected_at: string   // HH:mm
}

const loading    = ref(true)
const allCheckins = ref<CheckinRow[]>([])
const search     = ref('')
const monthFilter = ref('')
const statusFilter = ref('')

// Expected visitors state
const expectedVisitors = ref<ExpectedVisitor[]>([])
const visitorsLoading  = ref(false)

// Scan state
const scanToken = ref('')
const scanning  = ref(false)
const scanResult = ref<{ ok: boolean; message: string } | null>(null)
let scanResultTimer: ReturnType<typeof setTimeout> | null = null

async function submitScan() {
  if (!scanToken.value.trim()) return
  scanning.value = true
  scanResult.value = null
  try {
    const res = await api.post<{ id: number; gym_id: number }>('checkins/scan', {
      token: scanToken.value.trim().toUpperCase(),
      gym_id: await resolveMyGymId(),
    })
    scanResult.value = { ok: true, message: `Checked in successfully (#${res.id}).` }
    scanToken.value = ''
    // Refresh both lists so the visitor flips to "Checked In"
    await Promise.all([load(), loadExpectedVisitors()])
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Scan failed.'
    scanResult.value = { ok: false, message: msg }
  } finally {
    scanning.value = false
    if (scanResultTimer) clearTimeout(scanResultTimer)
    scanResultTimer = setTimeout(() => { scanResult.value = null }, 5000)
  }
}

// Cache the partner's gym id from the dashboard endpoint
let myGymId: number | null = null
async function resolveMyGymId(): Promise<number> {
  if (myGymId) return myGymId
  const res = await api.get<{ gym?: { id: number } }>('partner/dashboard')
  myGymId = res.gym?.id ?? 0
  return myGymId
}

async function load() {
  loading.value = true
  try {
    const res = await api.get<{ recent_checkins: CheckinRow[]; stats: { total_checkins: number } }>('partner/dashboard')
    allCheckins.value = res.recent_checkins ?? []
  } finally {
    loading.value = false
  }
}

async function loadExpectedVisitors() {
  visitorsLoading.value = true
  try {
    const gymId = await resolveMyGymId()
    const res = await api.get<{ visitors: ExpectedVisitor[] }>(
      `partner/expected-visitors${gymId ? `?gym_id=${gymId}` : ''}`
    )
    expectedVisitors.value = res.visitors ?? []
  } catch {
    expectedVisitors.value = []
  } finally {
    visitorsLoading.value = false
  }
}

onMounted(async () => {
  await load()
  await loadExpectedVisitors()
})

const filtered = computed(() => {
  let rows = allCheckins.value
  if (search.value) {
    const q = search.value.toLowerCase()
    rows = rows.filter(c =>
      c.employee_name.toLowerCase().includes(q) ||
      (c.fan_number ?? '').toLowerCase().includes(q)
    )
  }
  if (monthFilter.value) {
    rows = rows.filter(c => c.checked_in_at?.startsWith(monthFilter.value))
  }
  if (statusFilter.value) {
    rows = rows.filter(c => c.status === statusFilter.value)
  }
  return rows
})

const monthOptions = computed(() => {
  const months = new Set<string>()
  allCheckins.value.forEach(c => {
    if (c.checked_in_at) months.add(c.checked_in_at.slice(0, 7))
  })
  return [...months].sort().reverse().map(m => {
    const [y, mo] = m.split('-')
    const label = new Date(+y, +mo - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' })
    return { value: m, label }
  })
})

const partnerPage    = ref(1)
const partnerPerPage = 20
const partnerTotalPages   = computed(() => Math.max(1, Math.ceil(filtered.value.length / partnerPerPage)))
const paginatedFiltered   = computed(() => filtered.value.slice((partnerPage.value - 1) * partnerPerPage, partnerPage.value * partnerPerPage))

watch(filtered, () => { partnerPage.value = 1 })

const monthCount = computed(() => {
  const now = new Date()
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return allCheckins.value.filter(c => c.checked_in_at?.startsWith(ym)).length
})

const weekCount = computed(() => {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)
  return allCheckins.value.filter(c => {
    if (!c.checked_in_at) return false
    return new Date(c.checked_in_at) >= weekStart
  }).length
})

const avgDur = computed(() => {
  const withDur = allCheckins.value.filter(c => c.duration_min != null)
  if (!withDur.length) return null
  return Math.round(withDur.reduce((s, c) => s + (c.duration_min ?? 0), 0) / withDur.length)
})

function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
}
</script>

<style scoped>
.pc { display: flex; flex-direction: column; gap: 16px; }

.pc-loading {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; padding: 80px 0; color: #64748b;
}
.spinner {
  width: 30px; height: 30px;
  border: 3px solid #e2e8f0; border-top-color: #4CD964;
  border-radius: 50%; animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Expected Visitors Card ─────────────────────────────────────── */
.visitors-card {
  background: #fff; border-radius: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  overflow: hidden;
}

.visitors-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1.5px solid #f1f5f9;
}
.visitors-title-wrap {
  display: flex; align-items: center; gap: 8px;
}
.visitors-icon { color: #4CD964; flex-shrink: 0; }
.visitors-title {
  margin: 0; font-size: 0.92rem; font-weight: 700; color: #0f172a;
}
.visitors-count-pill {
  background: #f0fdf4; color: #15803d;
  font-size: 0.72rem; font-weight: 700;
  padding: 2px 8px; border-radius: 999px;
  border: 1px solid #bbf7d0;
}

.refresh-btn {
  background: none; border: 1.5px solid #e2e8f0; border-radius: 8px;
  width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #64748b; transition: border-color .15s, color .15s;
  padding: 0;
}
.refresh-btn:hover:not(:disabled) { border-color: #4CD964; color: #4CD964; }
.refresh-btn:disabled { opacity: .5; cursor: not-allowed; }
.spin-anim { animation: spin .7s linear infinite; }

.visitors-loading {
  display: flex; align-items: center; gap: 8px;
  padding: 20px; color: #64748b; font-size: 0.84rem;
}
.spinner-sm {
  width: 16px; height: 16px;
  border: 2px solid #e2e8f0; border-top-color: #4CD964;
  border-radius: 50%; animation: spin .7s linear infinite;
}

.visitors-empty {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; padding: 28px 20px; color: #94a3b8; font-size: 0.84rem;
}

.visitors-list { display: flex; flex-direction: column; }

.visitor-row {
  display: flex; align-items: center; gap: 12px;
  padding: 11px 20px;
  border-bottom: 1px solid #f8fafc;
  transition: background .12s;
}
.visitor-row:last-child { border-bottom: none; }
.visitor-row:hover { background: #f8fafc; }
.visitor-row--done { background: #f0fdf4; }
.visitor-row--done:hover { background: #dcfce7; }

.visitor-av {
  width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
  background: linear-gradient(135deg, #4CD964, #2EB84B);
  color: #fff; font-weight: 700; font-size: 0.72rem;
  display: flex; align-items: center; justify-content: center;
}
.av--done {
  background: linear-gradient(135deg, #86efac, #4ade80);
}

.visitor-info { flex: 1; min-width: 0; }
.visitor-name {
  margin: 0; font-size: 0.85rem; font-weight: 600;
  color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.visitor-fan {
  margin: 2px 0 0; font-size: 0.75rem; color: #64748b;
  font-family: 'Courier New', monospace;
}

.visitor-meta { flex-shrink: 0; }
.visitor-time {
  display: flex; align-items: center; gap: 4px;
  margin: 0; font-size: 0.75rem; color: #94a3b8;
  white-space: nowrap;
}

.visitor-badge {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.04em; padding: 4px 10px;
  border-radius: 999px; white-space: nowrap; flex-shrink: 0;
}
.badge--in      { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
.badge--pending { background: #fef9c3; color: #a16207; border: 1px solid #fde68a; }

/* ── Stat strip ─────────────────────────────────────────────────── */
.stat-strip {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
}
.stat-tile {
  background: #fff; border-radius: 12px; padding: 16px 18px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.tile-label { font-size: 0.72rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 4px; }
.tile-value { font-size: 1.8rem; font-weight: 800; margin: 0; color: #0f172a; }
.tile-value.emerald { color: #4CD964; }
.tile-value.blue    { color: #3b82f6; }
.tile-value.violet  { color: #4CD964; }
.tile-unit { font-size: 0.85rem; font-weight: 500; color: #94a3b8; }

/* ── Filters ────────────────────────────────────────────────────── */
.filters-row {
  display: flex; gap: 10px; flex-wrap: wrap;
}
.search-wrap {
  flex: 1; min-width: 200px;
  position: relative;
}
.search-icon {
  position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8;
}
.search-input {
  width: 100%; padding: 9px 12px 9px 36px;
  border: 1.5px solid #e2e8f0; border-radius: 9px; font-size: 0.87rem;
  color: #334155; outline: none; background: #fff;
}
.search-input:focus { border-color: #4CD964; }
.filter-select {
  padding: 9px 12px; border: 1.5px solid #e2e8f0; border-radius: 9px;
  font-size: 0.87rem; color: #334155; background: #fff; outline: none;
  min-width: 140px; cursor: pointer;
}
.filter-select:focus { border-color: #4CD964; }

/* ── Card ───────────────────────────────────────────────────────── */
.card {
  background: #fff; border-radius: 14px; padding: 20px 24px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

/* ── Empty state ────────────────────────────────────────────────── */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 10px; padding: 40px 0; color: #94a3b8; font-size: 0.88rem;
}

/* ── Table ──────────────────────────────────────────────────────── */
.table-wrap { overflow-x: auto; }
.ci-table { width: 100%; border-collapse: collapse; font-size: 0.84rem; }
.ci-table thead tr { border-bottom: 1.5px solid #f1f5f9; }
.ci-table th {
  text-align: left; font-size: 0.72rem; font-weight: 600; color: #94a3b8;
  text-transform: uppercase; letter-spacing: 0.05em; padding: 0 12px 10px;
}
.ci-table td {
  padding: 11px 12px; border-bottom: 1px solid #f8fafc; color: #334155;
}
.ci-table tbody tr:last-child td { border-bottom: none; }
.ci-table tbody tr:hover { background: #f8fafc; }

.idx-cell  { color: #94a3b8; font-size: 0.78rem; }
.member-cell { display: flex; align-items: center; gap: 10px; }
.member-av {
  width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
  background: linear-gradient(135deg, #4CD964, #2EB84B);
  color: #fff; font-weight: 700; font-size: 0.72rem;
  display: flex; align-items: center; justify-content: center;
}
.fan-cell  { font-family: 'Courier New', monospace; font-size: 0.8rem; color: #475569; }
.time-cell { font-size: 0.8rem; color: #475569; white-space: nowrap; }
.dur-cell  { font-weight: 600; }

.status-pill {
  font-size: 0.7rem; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.05em; padding: 3px 9px; border-radius: 20px;
}
.pill--active { background: #fef9c3; color: #a16207; }
.pill--done   { background: #f0fdf4; color: #16a34a; }

/* ── Scan panel ─────────────────────────────────────────────────── */
.scan-card {
  background: #fff; border-radius: 14px; padding: 18px 22px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  display: flex; flex-direction: column; gap: 12px;
}
.scan-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.scan-title { margin: 0; font-size: 0.95rem; font-weight: 700; color: #0f172a; }
.scan-sub   { margin: 2px 0 0; font-size: 0.78rem; color: #94a3b8; }
.scan-pill {
  font-size: 0.74rem; font-weight: 600;
  padding: 5px 12px; border-radius: 999px;
}
.pill--ok  { background: #f0fdf4; color: #15803d; }
.pill--err { background: #fef2f2; color: #b91c1c; }
.scan-form { display: flex; gap: 10px; flex-wrap: wrap; }
.scan-input {
  flex: 1; min-width: 200px;
  padding: 11px 14px; border: 1.5px solid #e2e8f0; border-radius: 9px;
  font-size: 0.92rem; font-family: 'Courier New', monospace; letter-spacing: 0.1em;
  color: #0f172a; background: #fff; outline: none;
  text-transform: uppercase;
}
.scan-input:focus { border-color: #4CD964; }
.scan-btn {
  padding: 11px 22px; border-radius: 9px; border: none;
  background: #4CD964; color: #fff; font-weight: 700; font-size: 0.88rem;
  cursor: pointer; transition: background .15s;
}
.scan-btn:hover:not(:disabled) { background: #2EB84B; }
.scan-btn:disabled { background: #cbd5e1; cursor: not-allowed; }

@media (max-width: 700px) {
  .stat-strip { grid-template-columns: repeat(2, 1fr); }
  .visitor-row { flex-wrap: wrap; }
  .visitor-meta { display: none; }
}
</style>
