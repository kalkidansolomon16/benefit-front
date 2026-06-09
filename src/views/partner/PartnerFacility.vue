<template>
  <div class="pf">

    <div v-if="loading" class="pf-loading">
      <div class="spinner"></div>
      <p>Loading facility info�</p>
    </div>

    <template v-else-if="gym">

      <!-- Profile Card -->
      <div class="profile-card">
        <div class="profile-avatar">{{ initials(gym.name) }}</div>
        <div class="profile-body">
          <div class="profile-name-row">
            <h2 class="profile-name">{{ gym.name }}</h2>
            <span class="tier-badge" :class="`tier--${gym.tier}`">{{ tierLabel(gym.tier) }}</span>
            <span class="status-badge" :class="gym.is_active ? 'badge--active' : 'badge--inactive'">
              {{ gym.is_active ? 'Active' : 'Inactive' }}
            </span>
          </div>
          <p class="profile-sub">Partner Gym � {{ gym.city }}</p>
          <p v-if="gym.partnership_start" class="profile-since">
            Partner since <strong>{{ gym.partnership_start }}</strong>
          </p>
        </div>
      </div>

      <!-- Info Grid -->
      <div class="info-grid">

        <!-- Contact -->
        <div class="info-card">
          <h3 class="info-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Contact Details
          </h3>
          <div class="info-rows">
            <div class="info-row">
              <span class="info-key">Contact Person</span>
              <span class="info-val">{{ gym.contact_person }}</span>
            </div>
            <div class="info-row">
              <span class="info-key">Phone</span>
              <span class="info-val">{{ gym.contact_phone }}</span>
            </div>
            <div class="info-row">
              <span class="info-key">Email</span>
              <span class="info-val">{{ gym.contact_email }}</span>
            </div>
          </div>
        </div>

        <!-- Location -->
        <div class="info-card">
          <h3 class="info-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Location
          </h3>
          <div class="info-rows">
            <div class="info-row">
              <span class="info-key">City</span>
              <span class="info-val">{{ gym.city }}</span>
            </div>
            <div v-if="gym.sub_city" class="info-row">
              <span class="info-key">Sub-city</span>
              <span class="info-val">{{ gym.sub_city }}</span>
            </div>
            <div v-if="gym.address" class="info-row">
              <span class="info-key">Address</span>
              <span class="info-val">{{ gym.address }}</span>
            </div>
          </div>
        </div>

        <!-- Operations -->
        <div class="info-card">
          <h3 class="info-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Operations
          </h3>
          <div class="info-rows">
            <div class="info-row">
              <span class="info-key">Max Capacity</span>
              <span class="info-val">{{ gym.max_capacity }} members/hr</span>
            </div>
            <div v-if="parsedHours" class="info-row opening-hours-row">
              <span class="info-key">Opening Hours</span>
              <div class="hours-block">
                <div v-if="parsedHours.weekdays" class="hours-line">
                  <span class="hours-day">Weekdays</span>
                  <span class="hours-time">{{ parsedHours.weekdays }}</span>
                </div>
                <div v-if="parsedHours.weekends" class="hours-line">
                  <span class="hours-day">Weekends</span>
                  <span class="hours-time">{{ parsedHours.weekends }}</span>
                </div>
                <span v-if="!parsedHours.weekdays && !parsedHours.weekends" class="info-val">
                  {{ parsedHours.summary ?? gym.opening_hours }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Membership -->
        <div class="info-card">
          <h3 class="info-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            Membership Info
          </h3>
          <div class="info-rows">
            <div class="info-row">
              <span class="info-key">Tier</span>
              <span class="info-val">{{ tierLabel(gym.tier) }}</span>
            </div>
            <div v-if="gym.partnership_start" class="info-row">
              <span class="info-key">Partnership Start</span>
              <span class="info-val">{{ gym.partnership_start }}</span>
            </div>
            <div class="info-row">
              <span class="info-key">Status</span>
              <span :class="gym.is_active ? 'val--active' : 'val--inactive'">
                {{ gym.is_active ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </div>
        </div>

      </div>

      <!-- Facilities -->
      <div v-if="gym.facilities?.length" class="card">
        <h3 class="card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
          Facilities & Amenities
        </h3>
        <div class="facilities-grid">
          <span v-for="f in gym.facilities" :key="f" class="facility-chip">{{ f }}</span>
        </div>
      </div>

    </template>

    <div v-else class="pf-error">
      <p>Failed to load facility info.</p>
      <button class="retry-btn" @click="load">Retry</button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'

const api = useApi()

interface GymInfo {
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

const loading = ref(true)
const gym     = ref<GymInfo | null>(null)

async function load() {
  loading.value = true
  try {
    const res = await api.get<{ gym: GymInfo }>('partner/dashboard')
    gym.value = res.gym
  } finally {
    loading.value = false
  }
}
onMounted(load)

interface OpeningHours {
  summary?: string
  weekdays?: string
  weekends?: string
  [key: string]: string | undefined
}

const parsedHours = computed<OpeningHours | null>(() => {
  if (!gym.value?.opening_hours) return null
  const raw = gym.value.opening_hours
  if (typeof raw === 'object') return raw as OpeningHours
  try {
    return JSON.parse(raw) as OpeningHours
  } catch {
    return { summary: raw }
  }
})

function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('')
}

function tierLabel(tier: string): string {
  const map: Record<string, string> = {
    basic: 'Basic', basic_plus: 'Basic Plus', premium: 'Premium', platinum: 'Platinum',
  }
  return map[tier] ?? tier
}
</script>

<style scoped>
.pf { display: flex; flex-direction: column; gap: 18px; }

.pf-loading {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; padding: 80px 0; color: #64748b;
}
.spinner {
  width: 30px; height: 30px;
  border: 3px solid #e2e8f0; border-top-color: #4CD964;
  border-radius: 50%; animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.pf-error {
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; padding: 60px 0; color: #ef4444;
}
.retry-btn {
  padding: 8px 20px; border-radius: 8px; border: none;
  background: #4CD964; color: #fff; font-weight: 600; cursor: pointer;
}

/* Profile card */
.profile-card {
  display: flex; align-items: center; gap: 20px;
  background: #fff; border-radius: 14px; padding: 22px 26px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.profile-avatar {
  width: 60px; height: 60px; border-radius: 16px; flex-shrink: 0;
  background: linear-gradient(135deg, #4CD964, #2EB84B);
  color: #fff; font-weight: 800; font-size: 1.3rem;
  display: flex; align-items: center; justify-content: center;
}
.profile-name-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 4px; }
.profile-name { font-size: 1.3rem; font-weight: 700; color: #0f172a; margin: 0; }
.profile-sub  { font-size: 0.84rem; color: #64748b; margin: 0 0 4px; }
.profile-since { font-size: 0.8rem; color: #94a3b8; margin: 0; }

.tier-badge {
  font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
  padding: 3px 9px; border-radius: 20px;
}
.tier--basic      { background: #f1f5f9; color: #64748b; }
.tier--basic_plus { background: #EBFAEE; color: #3b82f6; }
.tier--premium    { background: #f0fdf4; color: #4CD964; }
.tier--platinum   { background: #faf5ff; color: #a855f7; }

.status-badge { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 3px 9px; border-radius: 20px; }
.badge--active   { background: #f0fdf4; color: #16a34a; }
.badge--inactive { background: #fff1f2; color: #e11d48; }

/* Info grid */
.info-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px;
}
.info-card {
  background: #fff; border-radius: 12px; padding: 18px 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.info-title {
  display: flex; align-items: center; gap: 7px;
  font-size: 0.85rem; font-weight: 700; color: #334155; margin: 0 0 14px;
}
.info-rows { display: flex; flex-direction: column; gap: 10px; }
.info-row  { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.info-key  { font-size: 0.78rem; color: #94a3b8; font-weight: 500; flex-shrink: 0; }
.info-val  { font-size: 0.84rem; color: #334155; font-weight: 500; text-align: right; }
.val--active   { font-size: 0.84rem; color: #16a34a; font-weight: 600; }
.val--inactive { font-size: 0.84rem; color: #e11d48; font-weight: 600; }

/* Opening hours */
.opening-hours-row { align-items: flex-start; }
.hours-block { display: flex; flex-direction: column; gap: 5px; text-align: right; }
.hours-line  { display: flex; gap: 8px; justify-content: flex-end; align-items: center; }
.hours-day   { font-size: 0.75rem; color: #94a3b8; font-weight: 500; }
.hours-time  { font-size: 0.84rem; color: #334155; font-weight: 600; }

/* Facilities */
.card {
  background: #fff; border-radius: 14px; padding: 20px 24px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.card-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 0.92rem; font-weight: 700; color: #0f172a; margin: 0 0 14px;
}
.facilities-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.facility-chip {
  font-size: 0.8rem; font-weight: 500;
  background: #f0fdf4; color: #065f46;
  padding: 5px 12px; border-radius: 20px; border: 1px solid #d1fae5;
}

@media (max-width: 640px) {
  .info-grid { grid-template-columns: 1fr; }
  .profile-card { flex-direction: column; text-align: center; }
  .profile-name-row { justify-content: center; }
}
</style>
