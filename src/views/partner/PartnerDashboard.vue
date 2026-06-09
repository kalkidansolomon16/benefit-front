<template>
  <div class="pd">

    <!-- -- Loading ------------------------------------------------ -->
    <div v-if="loading" class="pd-loading">
      <div class="spinner"></div>
      <p>Loading dashboard�</p>
    </div>

    <template v-else-if="data">

      <!-- -- Gym Info Banner --------------------------------------- -->
      <div class="gym-banner">
        <div class="gym-avatar">{{ initials(data.gym.name) }}</div>
        <div class="gym-info">
          <div class="gym-name-row">
            <h2 class="gym-name">{{ data.gym.name }}</h2>
            <span class="tier-badge" :class="`tier--${data.gym.tier}`">{{ tierLabel(data.gym.tier) }}</span>
            <span class="status-badge" :class="data.gym.is_active ? 'status--active' : 'status--inactive'">
              {{ data.gym.is_active ? 'Active' : 'Inactive' }}
            </span>
          </div>
          <p class="gym-location">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {{ data.gym.city }}<span v-if="data.gym.sub_city">, {{ data.gym.sub_city }}</span>
            <span v-if="data.gym.address"> � {{ data.gym.address }}</span>
          </p>
          <div class="gym-meta-row">
            <span class="meta-chip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.26 11a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.17 0h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 7.91a16 16 0 0 0 6 6l.46-.46a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21 16.92z"/></svg>
              {{ data.gym.contact_phone }}
            </span>
            <span class="meta-chip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 4h16v16H4z"/><path d="M4 4l8 8 8-8"/></svg>
              {{ data.gym.contact_email }}
            </span>
            <span v-if="data.gym.partnership_start" class="meta-chip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Partner since {{ data.gym.partnership_start }}
            </span>
          </div>
        </div>
      </div>

      <!-- -- Stat Cards -------------------------------------------- -->
      <div class="stat-grid">
        <div class="stat-card">
          <p class="stat-label">Today's Visits</p>
          <p class="stat-value emerald">{{ data.stats.today_checkins }}</p>
          <p class="stat-sub">check-ins today</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">This Week</p>
          <p class="stat-value blue">{{ data.stats.week_checkins }}</p>
          <p class="stat-sub">visits this week</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">This Month</p>
          <p class="stat-value violet">{{ data.stats.month_checkins }}</p>
          <p class="stat-sub">visits this month</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Total Visits</p>
          <p class="stat-value amber">{{ data.stats.total_checkins }}</p>
          <p class="stat-sub">all time</p>
        </div>
        <div class="stat-card capacity-card">
          <p class="stat-label">Capacity Utilisation</p>
          <div class="capacity-row">
            <p class="stat-value" :class="capacityColor(data.stats.capacity_pct)">{{ data.stats.capacity_pct }}%</p>
            <p class="cap-fraction">{{ data.stats.active_members }} / {{ data.stats.max_capacity }}</p>
          </div>
          <div class="cap-bar-bg">
            <div class="cap-bar-fill" :style="{ width: data.stats.capacity_pct + '%' }" :class="capacityColor(data.stats.capacity_pct)"></div>
          </div>
          <p class="stat-sub">active members / max capacity</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Avg Visit Duration</p>
          <p class="stat-value slate">{{ data.stats.avg_duration_min ?? '�' }}</p>
          <p class="stat-sub">{{ data.stats.avg_duration_min ? 'minutes per visit' : 'no completed visits yet' }}</p>
        </div>
      </div>

      <!-- -- 7-Day Trend ------------------------------------------- -->
      <div class="card trend-card">
        <h3 class="card-title">Check-in Trend � Last 7 Days</h3>
        <div class="trend-chart">
          <div
            v-for="day in data.checkin_trend"
            :key="day.date"
            class="trend-col"
          >
            <span class="bar-count">{{ day.count }}</span>
            <div class="bar-wrap">
              <div
                class="bar-fill"
                :style="{ height: barHeight(day.count) }"
              ></div>
            </div>
            <span class="bar-label">{{ day.day }}</span>
          </div>
        </div>
      </div>

      <!-- -- Recent Check-ins -------------------------------------- -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Recent Check-ins</h3>
          <span class="card-sub">Last 10 visits</span>
        </div>

        <div v-if="data.recent_checkins.length === 0" class="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          <p>No check-ins recorded yet.</p>
        </div>

        <div v-else class="checkins-table-wrap">
          <table class="checkins-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>FAN</th>
                <th>Checked In</th>
                <th>Checked Out</th>
                <th>Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in data.recent_checkins" :key="c.id">
                <td>
                  <div class="member-cell">
                    <div class="member-avatar">{{ initials(c.employee_name) }}</div>
                    <span>{{ c.employee_name }}</span>
                  </div>
                </td>
                <td class="fan-cell">{{ c.fan_number ?? '�' }}</td>
                <td class="time-cell">{{ c.checked_in_at ?? '�' }}</td>
                <td class="time-cell">{{ c.checked_out_at ?? '�' }}</td>
                <td class="dur-cell">{{ c.duration_min != null ? c.duration_min + ' min' : '�' }}</td>
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

      <!-- -- Facilities -------------------------------------------- -->
      <div v-if="data.gym.facilities?.length" class="card">
        <h3 class="card-title">Facilities & Amenities</h3>
        <div class="facilities-grid">
          <span v-for="f in data.gym.facilities" :key="f" class="facility-chip">{{ f }}</span>
        </div>
      </div>

    </template>

    <!-- -- Error ------------------------------------------------- -->
    <div v-else class="pd-error">
      <p>{{ errorMsg }}</p>
      <button class="retry-btn" @click="load">Retry</button>
    </div>

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

interface TrendDay {
  day: string
  date: string
  count: number
}

interface DashboardData {
  gym: {
    id: number
    name: string
    tier: string
    city: string
    sub_city: string | null
    address: string | null
    contact_person: string
    contact_phone: string
    contact_email: string
    max_capacity: number
    facilities: string[]
    opening_hours: string | null
    is_active: boolean
    partnership_start: string | null
  }
  stats: {
    today_checkins: number
    week_checkins: number
    month_checkins: number
    total_checkins: number
    active_members: number
    max_capacity: number
    capacity_pct: number
    avg_duration_min: number | null
  }
  checkin_trend: TrendDay[]
  recent_checkins: CheckinRow[]
}

const loading  = ref(true)
const data     = ref<DashboardData | null>(null)
const errorMsg = ref('')

async function load() {
  loading.value  = true
  errorMsg.value = ''
  try {
    data.value = await api.get<DashboardData>('partner/dashboard')
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : 'Failed to load dashboard.'
  } finally {
    loading.value = false
  }
}

onMounted(load)

// -- Helpers ------------------------------------------------------
function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w.charAt(0).toUpperCase())
    .join('')
}

function tierLabel(tier: string): string {
  const map: Record<string, string> = {
    basic: 'Basic',
    basic_plus: 'Basic Plus',
    premium: 'Premium',
    platinum: 'Platinum',
  }
  return map[tier] ?? tier
}

function capacityColor(pct: number): string {
  if (pct >= 90) return 'red'
  if (pct >= 70) return 'amber'
  return 'emerald'
}

const maxCount = computed(() =>
  Math.max(1, ...(data.value?.checkin_trend.map(d => d.count) ?? [1]))
)

function barHeight(count: number): string {
  return Math.round((count / maxCount.value) * 100) + '%'
}
</script>

<style scoped>
.pd {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* -- Loading / Error ------------------------------------------- */
.pd-loading {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; padding: 80px 0; color: #64748b;
}
.spinner {
  width: 32px; height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #4CD964;
  border-radius: 50%;
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.pd-error {
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; padding: 60px 0; color: #ef4444;
}
.retry-btn {
  padding: 8px 20px; border-radius: 8px; border: none;
  background: #4CD964; color: #fff; font-weight: 600;
  cursor: pointer; font-size: 0.9rem;
}

/* -- Gym Banner ------------------------------------------------ */
.gym-banner {
  display: flex;
  align-items: flex-start;
  gap: 18px;
  background: #fff;
  border-radius: 14px;
  padding: 20px 24px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.gym-avatar {
  width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
  background: linear-gradient(135deg, #4CD964, #2EB84B);
  color: #fff; font-weight: 800; font-size: 1.2rem;
  display: flex; align-items: center; justify-content: center;
}
.gym-info { flex: 1; min-width: 0; }
.gym-name-row {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  margin-bottom: 4px;
}
.gym-name { font-size: 1.25rem; font-weight: 700; color: #0f172a; margin: 0; }

.tier-badge {
  font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.08em; padding: 3px 9px; border-radius: 20px;
}
.tier--basic        { background: #f1f5f9; color: #64748b; }
.tier--basic_plus   { background: #EBFAEE; color: #3b82f6; }
.tier--premium      { background: #f0fdf4; color: #4CD964; }
.tier--platinum     { background: #faf5ff; color: #a855f7; }

.status-badge {
  font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.08em; padding: 3px 9px; border-radius: 20px;
}
.status--active   { background: #f0fdf4; color: #16a34a; }
.status--inactive { background: #fff1f2; color: #e11d48; }

.gym-location {
  display: flex; align-items: center; gap: 4px;
  font-size: 0.83rem; color: #64748b; margin: 4px 0 8px;
}
.gym-meta-row { display: flex; flex-wrap: wrap; gap: 8px; }
.meta-chip {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 0.75rem; color: #475569;
  background: #f8fafc; padding: 4px 10px; border-radius: 20px;
}

/* -- Stat Grid ------------------------------------------------- */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 18px 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.capacity-card { grid-column: span 2; }

.stat-label { font-size: 0.75rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 6px; }
.stat-value { font-size: 2rem; font-weight: 800; margin: 0 0 2px; line-height: 1; }
.stat-sub   { font-size: 0.75rem; color: #94a3b8; margin: 0; }

.stat-value.emerald { color: #4CD964; }
.stat-value.blue    { color: #3b82f6; }
.stat-value.violet  { color: #4CD964; }
.stat-value.amber   { color: #f59e0b; }
.stat-value.slate   { color: #475569; }
.stat-value.red     { color: #ef4444; }

.capacity-row { display: flex; align-items: baseline; gap: 10px; margin-bottom: 8px; }
.cap-fraction { font-size: 0.85rem; color: #94a3b8; }

.cap-bar-bg {
  height: 6px; background: #f1f5f9; border-radius: 3px;
  overflow: hidden; margin-bottom: 6px;
}
.cap-bar-fill {
  height: 100%; border-radius: 3px;
  transition: width 0.5s ease;
}
.cap-bar-fill.emerald { background: #4CD964; }
.cap-bar-fill.amber   { background: #f59e0b; }
.cap-bar-fill.red     { background: #ef4444; }

/* -- Card ------------------------------------------------------ */
.card {
  background: #fff;
  border-radius: 14px;
  padding: 20px 24px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.card-header {
  display: flex; align-items: baseline; gap: 10px; margin-bottom: 16px;
}
.card-title { font-size: 0.95rem; font-weight: 700; color: #0f172a; margin: 0; }
.card-sub   { font-size: 0.78rem; color: #94a3b8; margin: 0; }

/* -- 7-Day Trend Chart ----------------------------------------- */
.trend-card .card-title { margin-bottom: 20px; }
.trend-chart {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  height: 140px;
}
.trend-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  height: 100%;
}
.bar-count { font-size: 0.7rem; font-weight: 600; color: #475569; min-height: 16px; }
.bar-wrap {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  background: #f8fafc;
  border-radius: 6px;
  overflow: hidden;
  min-height: 0;
}
.bar-fill {
  width: 100%;
  background: linear-gradient(180deg, #4CD964, #2EB84B);
  border-radius: 6px 6px 0 0;
  min-height: 3px;
  transition: height 0.4s ease;
}
.bar-label { font-size: 0.7rem; color: #94a3b8; font-weight: 500; }

/* -- Check-ins Table ------------------------------------------- */
.checkins-table-wrap { overflow-x: auto; }
.checkins-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.84rem;
}
.checkins-table thead tr {
  border-bottom: 1.5px solid #f1f5f9;
}
.checkins-table th {
  text-align: left;
  font-size: 0.72rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0 12px 10px;
}
.checkins-table td {
  padding: 11px 12px;
  border-bottom: 1px solid #f8fafc;
  color: #334155;
}
.checkins-table tbody tr:last-child td { border-bottom: none; }
.checkins-table tbody tr:hover { background: #f8fafc; }

.member-cell {
  display: flex; align-items: center; gap: 10px;
}
.member-avatar {
  width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
  background: linear-gradient(135deg, #4CD964, #2EB84B);
  color: #fff; font-weight: 700; font-size: 0.72rem;
  display: flex; align-items: center; justify-content: center;
}
.fan-cell  { font-family: 'Courier New', monospace; font-size: 0.8rem; color: #475569; }
.time-cell { font-size: 0.8rem; color: #475569; white-space: nowrap; }
.dur-cell  { font-weight: 600; color: #334155; }

.status-pill {
  font-size: 0.7rem; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.05em; padding: 3px 9px; border-radius: 20px;
}
.pill--active { background: #fef9c3; color: #a16207; }
.pill--done   { background: #f0fdf4; color: #16a34a; }

/* -- Facilities ------------------------------------------------ */
.facilities-grid {
  display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px;
}
.facility-chip {
  font-size: 0.8rem; font-weight: 500;
  background: #f0fdf4; color: #065f46;
  padding: 5px 12px; border-radius: 20px;
  border: 1px solid #d1fae5;
}

/* -- Empty State ----------------------------------------------- */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 10px; padding: 40px 0; color: #94a3b8;
  font-size: 0.88rem;
}

/* -- Responsive ------------------------------------------------ */
@media (max-width: 800px) {
  .stat-grid { grid-template-columns: repeat(2, 1fr); }
  .capacity-card { grid-column: span 2; }
}
@media (max-width: 500px) {
  .stat-grid { grid-template-columns: 1fr; }
  .capacity-card { grid-column: span 1; }
  .gym-banner { flex-direction: column; }
}
</style>
