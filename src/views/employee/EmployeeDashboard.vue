<template>
  <div class="dashboard">
    <!-- -- Loading ----------------------------------------------- -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading your dashboard�</p>
    </div>

    <template v-else-if="data">
      <!-- -- Row 1: Profile + Pass cards --------------------------- -->
      <div class="top-row">
        <!-- Profile card -->
        <div class="card profile-card">
          <div class="profile-avatar">
            <img
              v-if="data.profile.photo_path"
              :src="`${STORAGE_URL}/${data.profile.photo_path}`"
              :alt="data.profile.name"
              class="avatar-img"
            />
            <div v-else class="avatar-initials">{{ initials }}</div>
          </div>
          <div class="profile-info">
            <h2 class="profile-name">{{ data.profile.name }}</h2>
            <p class="profile-meta">
              <span v-if="data.profile.job_title">{{ data.profile.job_title }}</span>
              <span v-if="data.profile.department" class="dot">�</span>
              <span v-if="data.profile.department">{{ data.profile.department }}</span>
              <span v-if="data.profile.branch" class="dot">�</span>
              <span v-if="data.profile.branch">{{ data.profile.branch }}</span>
            </p>
            <p class="profile-company">{{ data.company.name }} � {{ data.company.city }}</p>

            <div class="profile-contacts">
              <span v-if="data.profile.email" class="contact-item">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M4 4h16v16H4z" />
                  <path d="M4 4l8 8 8-8" />
                </svg>
                {{ data.profile.email }}
              </span>
              <span v-if="data.profile.phone" class="contact-item">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"
                  />
                </svg>
                {{ data.profile.phone }}
              </span>
            </div>
          </div>
        </div>

        <!-- Membership pass card -->
        <div class="card pass-card" :class="`pass-card--${data.pass.plan_key}`">
          <div class="pass-header">
            <div>
              <p class="pass-label">FITNESS PASS</p>
              <h3 class="pass-plan">{{ data.pass.plan_name }}</h3>
            </div>
            <div class="pass-badge" :class="`badge--${data.pass.status}`">
              {{ statusLabel(data.pass.status) }}
            </div>
          </div>

          <div class="pass-fan">
            <p class="fan-label">FAN Number</p>
            <p class="fan-number">{{ data.profile.fan_number }}</p>
          </div>

          <div class="pass-footer">
            <div>
              <p class="pass-meta-label">Plan type</p>
              <p class="pass-meta-val">
                {{
                  data.pass.plan_key === 'platinum'
                    ? 'Premium Access'
                    : data.pass.plan_key === 'basic_plus'
                    ? 'Plus Access'
                    : 'Basic Access'
                }}
              </p>
            </div>
            <div v-if="data.pass.valid_until">
              <p class="pass-meta-label">Valid until</p>
              <p class="pass-meta-val">{{ formatDate(data.pass.valid_until) }}</p>
            </div>
          </div>

          <!-- Decorative circles -->
          <div class="pass-deco pass-deco-1"></div>
          <div class="pass-deco pass-deco-2"></div>
        </div>
      </div>
      <!-- /top-row -->

      <!-- -- Row 2: Stat cards ----------------------------------- -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon stat-icon--total">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <div class="stat-body">
            <p class="stat-value">{{ data.stats.total_checkins }}</p>
            <p class="stat-label">Total Visits</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon stat-icon--month">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div class="stat-body">
            <p class="stat-value">{{ data.stats.this_month_checkins }}</p>
            <p class="stat-label">This Month</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon stat-icon--week">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div class="stat-body">
            <p class="stat-value">{{ data.stats.this_week_checkins }}</p>
            <p class="stat-label">This Week</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon stat-icon--last">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
          </div>
          <div class="stat-body">
            <p class="stat-value">
              {{ data.stats.last_visit ? formatDate(data.stats.last_visit) : '�' }}
            </p>
            <p class="stat-label">Last Visit</p>
          </div>
        </div>
      </div>
      <!-- /stats-row -->

      <!-- -- Row 3: Recent check-ins + Accessible gyms ----------- -->
      <div class="bottom-row">
        <!-- Recent check-ins -->
        <div class="card section-card">
          <div class="section-head">
            <h3 class="section-title">Recent Check-ins</h3>
            <span class="section-count">Last {{ data.recent_checkins.length }}</span>
          </div>

          <div v-if="data.recent_checkins.length === 0" class="empty-state">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#cbd5e1"
              stroke-width="1.5"
            >
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <p>No check-ins yet.</p>
          </div>

          <ul v-else class="checkin-list">
            <li v-for="c in data.recent_checkins" :key="c.id" class="checkin-item">
              <div class="checkin-left">
                <div class="checkin-dot" :class="`dot--${c.gym_tier}`"></div>
                <div>
                  <p class="checkin-gym">{{ c.gym_name }}</p>
                  <p class="checkin-loc">{{ c.gym_sub_city }}</p>
                </div>
              </div>
              <div class="checkin-right">
                <p class="checkin-date">{{ formatDateTime(c.checked_in_at) }}</p>
                <p v-if="c.duration_min" class="checkin-dur">{{ c.duration_min }} min</p>
                <span class="tier-badge tier-badge--{{ c.gym_tier }}">{{
                  tierLabel(c.gym_tier)
                }}</span>
              </div>
            </li>
          </ul>
        </div>
        <!-- /recent check-ins -->

        <!-- Accessible gyms -->
        <div class="card section-card">
          <div class="section-head">
            <h3 class="section-title">Gyms on Your Plan</h3>
            <span class="section-count">{{ data.accessible_gyms.length }} locations</span>
          </div>

          <div v-if="data.accessible_gyms.length === 0" class="empty-state">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#cbd5e1"
              stroke-width="1.5"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
            <p>No gyms available yet.</p>
          </div>

          <ul v-else class="gym-list">
            <li v-for="g in data.accessible_gyms" :key="g.id" class="gym-item">
              <div class="gym-left">
                <div class="gym-tier-dot" :class="`dot--${g.tier}`"></div>
                <div>
                  <p class="gym-name">{{ g.name }}</p>
                  <p class="gym-addr">
                    {{ g.sub_city }}<span v-if="g.city">, {{ g.city }}</span>
                  </p>
                </div>
              </div>
              <span class="tier-tag" :class="`tier-tag--${g.tier}`">{{ tierLabel(g.tier) }}</span>
            </li>
          </ul>
        </div>
        <!-- /gyms -->
      </div>
      <!-- /bottom-row -->
    </template>

    <!-- -- Error ------------------------------------------------ -->
    <div v-else class="error-state">
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#f87171"
        stroke-width="1.5"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p>{{ error }}</p>
      <button class="retry-btn" @click="loadDashboard">Retry</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'

interface CheckIn {
  id: number
  gym_name: string
  gym_tier: string
  gym_sub_city: string
  checked_in_at: string | null
  checked_out_at: string | null
  duration_min: number | null
}

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
  profile: {
    name: string
    email: string
    phone: string
    fan_number: string
    job_title: string
    department: string
    branch: string
    photo_path: string | null
  }
  company: { name: string; city: string }
  pass: {
    plan_name: string
    plan_key: string
    status: string
    valid_until: string | null
  }
  stats: {
    total_checkins: number
    this_month_checkins: number
    this_week_checkins: number
    last_visit: string | null
  }
  recent_checkins: CheckIn[]
  accessible_gyms: Gym[]
}

const STORAGE_URL: string = import.meta.env.VITE_STORAGE_URL

const api = useApi()
const loading = ref(true)
const error = ref('')
const data = ref<DashboardData | null>(null)

const initials = computed(() => {
  const name = data.value?.profile.name ?? ''
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
})

async function loadDashboard() {
  loading.value = true
  error.value = ''
  try {
    data.value = await api.get<DashboardData>('employee/dashboard')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Could not load dashboard.'
  } finally {
    loading.value = false
  }
}

onMounted(loadDashboard)

/* -- Helpers ---------------------------------------------------- */
function formatDate(d: string | null): string {
  if (!d) return '�'
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(d: string | null): string {
  if (!d) return '�'
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusLabel(s: string): string {
  return s === 'active'
    ? 'Active'
    : s === 'suspended'
    ? 'Suspended'
    : s === 'inactive'
    ? 'Inactive'
    : s
}

function tierLabel(t: string): string {
  return t === 'platinum'
    ? 'Platinum'
    : t === 'premium'
    ? 'Premium'
    : t === 'basic_plus'
    ? 'Plus'
    : 'Basic'
}
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-family: 'Inter', system-ui, sans-serif;
}

/* -- Loading / Error ------------------------------------------- */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 80px 20px;
  color: #94a3b8;
}
.loading-state p,
.error-state p {
  font-size: 0.95rem;
  margin: 0;
}
.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e2e8f0;
  border-top-color: #4cd964;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.retry-btn {
  padding: 8px 20px;
  border-radius: 8px;
  border: 1.5px solid #e2e8f0;
  background: #fff;
  font-size: 0.85rem;
  cursor: pointer;
  color: #334155;
}
.retry-btn:hover {
  background: #f8fafc;
}

/* -- Cards ----------------------------------------------------- */
.card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
}

/* -- Row 1 ----------------------------------------------------- */
.top-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

/* Profile card */
.profile-card {
  display: flex;
  align-items: flex-start;
  gap: 18px;
  padding: 24px;
}
.profile-avatar {
  flex-shrink: 0;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #4cd96422, #2eb84b22);
  display: flex;
  align-items: center;
  justify-content: center;
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-initials {
  font-size: 1.4rem;
  font-weight: 700;
  color: #4cd964;
  letter-spacing: -0.02em;
}
.profile-info {
  flex: 1;
  min-width: 0;
}
.profile-name {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.profile-meta {
  font-size: 0.82rem;
  color: #64748b;
  margin: 0 0 3px;
}
.profile-company {
  font-size: 0.8rem;
  color: #94a3b8;
  margin: 0 0 12px;
}
.dot {
  margin: 0 4px;
}
.profile-contacts {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.contact-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  color: #475569;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Pass card */
.pass-card {
  position: relative;
  padding: 24px;
  color: #fff;
  overflow: hidden;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
}
.pass-card--platinum {
  background: linear-gradient(135deg, #2eb84b 0%, #2eb84b 100%);
}
.pass-card--basic_plus {
  background: linear-gradient(135deg, #2eb84b 0%, #1a9e38 100%);
}
.pass-card--basic {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}

.pass-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}
.pass-label {
  font-size: 0.65rem;
  letter-spacing: 0.15em;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 4px;
}
.pass-plan {
  font-size: 1.3rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.01em;
}
.pass-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  flex-shrink: 0;
}
.badge--active {
  background: rgba(34, 197, 94, 0.2);
  color: #86efac;
  border: 1px solid rgba(134, 239, 172, 0.3);
}
.badge--suspended {
  background: rgba(251, 191, 36, 0.2);
  color: #fde68a;
  border: 1px solid rgba(253, 230, 138, 0.3);
}
.badge--inactive {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  border: 1px solid rgba(252, 165, 165, 0.3);
}

.pass-fan {
  margin-bottom: 20px;
}
.fan-label {
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 0.1em;
  margin: 0 0 4px;
}
.fan-number {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  font-feature-settings: 'tnum';
  margin: 0;
}

.pass-footer {
  display: flex;
  gap: 28px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 14px;
}
.pass-meta-label {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 0.08em;
  margin: 0 0 3px;
}
.pass-meta-val {
  font-size: 0.82rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
}

/* Decorative circles */
.pass-deco {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.04);
  pointer-events: none;
}
.pass-deco-1 {
  width: 160px;
  height: 160px;
  top: -60px;
  right: -40px;
}
.pass-deco-2 {
  width: 100px;
  height: 100px;
  bottom: -30px;
  right: 60px;
}

/* -- Stats row ------------------------------------------------- */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.stat-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
}
.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-icon--total {
  background: #f0fdf4;
  color: #16a34a;
}
.stat-icon--month {
  background: #ebfaee;
  color: #4cd964;
}
.stat-icon--week {
  background: #fef9ec;
  color: #d97706;
}
.stat-icon--last {
  background: #fdf2f8;
  color: #4cd964;
}
.stat-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 2px;
  line-height: 1;
  letter-spacing: -0.02em;
}
.stat-label {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 0;
}

/* -- Bottom row ------------------------------------------------ */
.bottom-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: start;
}

.section-card {
  padding: 0;
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid #f1f5f9;
}
.section-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}
.section-count {
  font-size: 0.78rem;
  color: #94a3b8;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 40px 20px;
  color: #94a3b8;
  font-size: 0.85rem;
}

/* Check-in list */
.checkin-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.checkin-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 20px;
  gap: 12px;
  border-bottom: 1px solid #f8fafc;
}
.checkin-item:last-child {
  border-bottom: none;
}
.checkin-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.checkin-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
  flex-shrink: 0;
}
.checkin-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.checkin-gym {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.checkin-loc {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 0;
}
.checkin-date {
  font-size: 0.75rem;
  color: #64748b;
  margin: 0;
}
.checkin-dur {
  font-size: 0.72rem;
  color: #94a3b8;
  margin: 0;
}

/* Gym list */
.gym-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 420px;
  overflow-y: auto;
}
.gym-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  gap: 12px;
  border-bottom: 1px solid #f8fafc;
}
.gym-item:last-child {
  border-bottom: none;
}
.gym-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.gym-tier-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.gym-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.gym-addr {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 0;
}

/* Tier dot colors */
.dot--platinum {
  background: #2eb84b;
}
.dot--premium {
  background: #2eb84b;
}
.dot--basic_plus {
  background: #2eb84b;
}
.dot--basic {
  background: #64748b;
}

/* Tier badges (check-ins) */
.tier-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}
.tier-badge--platinum {
  background: #ebfaee;
  color: #2eb84b;
}
.tier-badge--premium {
  background: #ebfaee;
  color: #4cd964;
}
.tier-badge--basic_plus {
  background: #ebfaee;
  color: #2eb84b;
}
.tier-badge--basic {
  background: #f8fafc;
  color: #64748b;
}

/* Tier tags (gym list) */
.tier-tag {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}
.tier-tag--platinum {
  background: #ebfaee;
  color: #2eb84b;
}
.tier-tag--premium {
  background: #ebfaee;
  color: #4cd964;
}
.tier-tag--basic_plus {
  background: #e0f2fe;
  color: #2eb84b;
}
.tier-tag--basic {
  background: #f1f5f9;
  color: #64748b;
}

/* -- Responsive ------------------------------------------------ */
@media (max-width: 1100px) {
  .top-row {
    grid-template-columns: 1fr;
  }
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
  .bottom-row {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 600px) {
  .stats-row {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
