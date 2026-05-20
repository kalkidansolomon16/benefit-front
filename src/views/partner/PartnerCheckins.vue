<template>
  <div class="pc">

    <!-- Loading -->
    <div v-if="loading" class="pc-loading">
      <div class="spinner"></div>
      <p>Loading check-ins…</p>
    </div>

    <template v-else>

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
              <tr v-for="(c, i) in filtered" :key="c.id">
                <td class="idx-cell">{{ i + 1 }}</td>
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
      </div>

    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'

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

const loading    = ref(true)
const allCheckins = ref<CheckinRow[]>([])
const search     = ref('')
const monthFilter = ref('')
const statusFilter = ref('')

async function load() {
  loading.value = true
  try {
    const res = await api.get<{ recent_checkins: CheckinRow[]; stats: { total_checkins: number } }>('partner/dashboard')
    // Use all recent checkins from the dashboard endpoint
    allCheckins.value = res.recent_checkins ?? []
  } finally {
    loading.value = false
  }
}
onMounted(load)

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
  border: 3px solid #e2e8f0; border-top-color: #10b981;
  border-radius: 50%; animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Stat strip */
.stat-strip {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
}
.stat-tile {
  background: #fff; border-radius: 12px; padding: 16px 18px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.tile-label { font-size: 0.72rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 4px; }
.tile-value { font-size: 1.8rem; font-weight: 800; margin: 0; color: #0f172a; }
.tile-value.emerald { color: #10b981; }
.tile-value.blue    { color: #3b82f6; }
.tile-value.violet  { color: #8b5cf6; }
.tile-unit { font-size: 0.85rem; font-weight: 500; color: #94a3b8; }

/* Filters */
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
.search-input:focus { border-color: #10b981; }
.filter-select {
  padding: 9px 12px; border: 1.5px solid #e2e8f0; border-radius: 9px;
  font-size: 0.87rem; color: #334155; background: #fff; outline: none;
  min-width: 140px; cursor: pointer;
}
.filter-select:focus { border-color: #10b981; }

/* Card */
.card {
  background: #fff; border-radius: 14px; padding: 20px 24px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

/* Empty state */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 10px; padding: 40px 0; color: #94a3b8; font-size: 0.88rem;
}

/* Table */
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
  background: linear-gradient(135deg, #10b981, #059669);
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

@media (max-width: 700px) {
  .stat-strip { grid-template-columns: repeat(2, 1fr); }
}
</style>
