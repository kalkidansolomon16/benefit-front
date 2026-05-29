<template>
  <div class="bc-page">

    <!-- Loading -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading your gym pass…</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-state">
      <svg width="40" height="40" fill="none" stroke="#ef4444" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <p>{{ error }}</p>
      <button class="btn-retry" @click="load">Retry</button>
    </div>

    <!-- ── STEP 1: Gym Selection ── -->
    <template v-else-if="needsSelection">

      <div class="step-header">
        <p class="step-label">Step 1 of 2</p>
        <h2 class="step-title">Choose Your Gym for Today</h2>
        <p class="step-sub">Select the gym you plan to visit. You can only visit one gym per day and your choice cannot be changed once made.</p>
      </div>

      <div v-if="!gyms.length" class="empty-gyms">
        <svg width="40" height="40" fill="none" stroke="#94a3b8" stroke-width="1.5" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <p>No gyms available under your current plan.</p>
        <p class="empty-sub">Contact your HR admin for assistance.</p>
      </div>

      <div v-else class="gym-list">
        <button
          v-for="gym in gyms"
          :key="gym.id"
          class="gym-card"
          :class="{ 'gym-card--selected': selectedGymId === gym.id }"
          @click="selectedGymId = gym.id"
        >
          <div class="gym-card-check">
            <svg v-if="selectedGymId === gym.id" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="gym-icon">
            <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
          </div>
          <div class="gym-info">
            <p class="gym-name">{{ gym.name }}</p>
            <p v-if="gym.city || gym.sub_city" class="gym-location">
              <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {{ [gym.sub_city, gym.city].filter(Boolean).join(', ') }}
            </p>
            <p v-else-if="gym.address" class="gym-location">
              <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {{ gym.address }}
            </p>
          </div>
        </button>
      </div>

      <div v-if="selectError" class="select-error">{{ selectError }}</div>

      <button
        v-if="gyms.length"
        class="btn-confirm"
        :disabled="!selectedGymId || selecting"
        @click="confirmSelection"
      >
        <div v-if="selecting" class="spinner-sm"></div>
        <svg v-else width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        {{ selecting ? 'Confirming…' : 'Confirm & Get Barcode' }}
      </button>

    </template>

    <!-- ── STEP 2: Access Used (already checked in) ── -->
    <template v-else-if="alreadyCheckedIn">

      <!-- Gym banner -->
      <div class="gym-banner gym-banner--used">
        <div class="gym-banner-icon gym-banner-icon--used">
          <svg width="18" height="18" fill="none" stroke="#64748b" stroke-width="2" viewBox="0 0 24 24"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
        </div>
        <div class="gym-banner-body">
          <p class="gym-banner-label">Today's Gym</p>
          <p class="gym-banner-name">{{ selectedGym?.name }}</p>
          <p v-if="selectedGym?.city" class="gym-banner-loc">{{ selectedGym.city }}</p>
        </div>
      </div>

      <!-- Daily access used card -->
      <div class="used-card">
        <div class="used-icon-wrap">
          <svg width="48" height="48" fill="none" stroke="#4CD964" stroke-width="1.8" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 class="used-title">Daily Access Used</h2>
        <p class="used-desc">
          You checked in at <strong>{{ selectedGym?.name }}</strong>
          <span v-if="checkedInAt"> at <strong>{{ checkedInAt }}</strong></span>
          today.
        </p>
        <div class="used-reset">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Your access resets tomorrow at midnight
        </div>

        <!-- Barcode (dimmed, for reference) -->
        <div class="used-barcode-wrap">
          <p class="used-barcode-label">Today's barcode (used)</p>
          <div class="barcode-inner">
            <svg
              class="barcode barcode--dim"
              :viewBox="`0 0 ${barWidth} 100`"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                v-for="(bar, i) in bars"
                :key="i"
                :x="bar.x"
                :y="0"
                :width="bar.w"
                :height="100"
                fill="#cbd5e1"
              />
            </svg>
            <p class="barcode-text barcode-text--dim">{{ token }}</p>
          </div>
        </div>
      </div>

      <!-- Info card -->
      <div class="info-card">
        <p class="info-title">How daily access works</p>
        <ul class="info-list">
          <li>Each day you can visit <strong>one gym</strong> from your plan's eligible gyms.</li>
          <li>Once checked in, your barcode is deactivated for the rest of the day.</li>
          <li>Tomorrow you can select a <strong>different gym</strong> if you like.</li>
        </ul>
      </div>

    </template>

    <!-- ── STEP 2: Active Barcode ── -->
    <template v-else>

      <!-- Selected gym banner -->
      <div class="gym-banner">
        <div class="gym-banner-icon">
          <svg width="18" height="18" fill="none" stroke="#15803d" stroke-width="2" viewBox="0 0 24 24"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
        </div>
        <div class="gym-banner-body">
          <p class="gym-banner-label">Today's Gym</p>
          <p class="gym-banner-name">{{ selectedGym?.name }}</p>
          <p v-if="selectedGym?.city" class="gym-banner-loc">{{ selectedGym.city }}</p>
        </div>
        <span class="gym-banner-lock">
          <svg width="13" height="13" fill="none" stroke="#64748b" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Locked for today
        </span>
      </div>

      <!-- Pass card -->
      <div class="pass-card">
        <div class="pass-header">
          <div>
            <p class="pass-label">FitAccess Gym Pass</p>
            <p class="pass-fan">FAN: <span>{{ fanNumber }}</span></p>
          </div>
          <div class="pass-tier">
            <span class="dot"></span>
            Live
          </div>
        </div>

        <!-- Barcode -->
        <div class="barcode-wrap">
          <svg
            class="barcode"
            :viewBox="`0 0 ${barWidth} 100`"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              v-for="(bar, i) in bars"
              :key="i"
              :x="bar.x"
              :y="0"
              :width="bar.w"
              :height="100"
              fill="#0f172a"
            />
          </svg>
          <p class="barcode-text">{{ token }}</p>
        </div>

        <!-- Countdown -->
        <div class="countdown">
          <div class="countdown-bar">
            <div class="countdown-fill" :style="{ width: progressPct + '%' }"></div>
          </div>
          <p class="countdown-text">
            Barcode refreshes in <strong>{{ countdownLabel }}</strong>
          </p>
        </div>
      </div>

      <!-- Info card -->
      <div class="info-card">
        <p class="info-title">How it works</p>
        <ul class="info-list">
          <li>Show this barcode to the staff at <strong>{{ selectedGym?.name }}</strong> to check in.</li>
          <li>The barcode rotates every <strong>12 hours</strong> and works <strong>only at your selected gym</strong>.</li>
          <li>Once scanned and checked in, your daily access is used — barcode deactivates.</li>
          <li>You can choose a different gym tomorrow.</li>
        </ul>
      </div>

    </template>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useApi } from '@/composables/useApi'

interface Gym {
  id: number
  name: string
  address: string | null
  city: string | null
  sub_city: string | null
  tier?: string
}

interface TokenResponse {
  needs_selection: boolean
  gyms: Gym[]
  fan_number?: string
  token?: string
  expires_at?: string
  expires_in_seconds?: number
  rotates_every_hours?: number
  already_checked_in_today?: boolean
  checked_in_at?: string   // HH:mm from backend
  selected_gym?: Gym
}

interface SelectionResponse {
  message: string
  selection: {
    fan_number: string
    token: string
    expires_at: string
    expires_in_seconds: number
    rotates_every_hours: number
    selected_gym: Gym
  }
}

const api = useApi()

const loading         = ref(true)
const error           = ref('')
const needsSelection  = ref(false)
const gyms            = ref<Gym[]>([])
const selectedGymId   = ref<number | null>(null)
const selectedGym     = ref<Gym | null>(null)
const selecting       = ref(false)
const selectError     = ref('')

const token             = ref('')
const fanNumber         = ref('')
const expiresAt         = ref<Date | null>(null)
const totalSlotSeconds  = ref(12 * 3600)
const remaining         = ref(0)
const alreadyCheckedIn  = ref(false)
const checkedInAt       = ref<string | null>(null)   // HH:mm

let ticker: ReturnType<typeof setInterval> | null = null

// ── Data loading ──────────────────────────────────────────────────

async function load() {
  loading.value = true
  error.value   = ''
  try {
    const res = await api.get<TokenResponse>('employee/checkin-token')
    gyms.value = res.gyms ?? []

    if (res.needs_selection) {
      needsSelection.value = true
    } else {
      needsSelection.value = false
      applyToken(res)
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Could not load your pass.'
  } finally {
    loading.value = false
  }
}

function applyToken(res: TokenResponse) {
  token.value            = res.token ?? ''
  fanNumber.value        = res.fan_number ?? ''
  expiresAt.value        = new Date(res.expires_at ?? '')
  totalSlotSeconds.value = (res.rotates_every_hours ?? 12) * 3600
  remaining.value        = res.expires_in_seconds ?? 0
  alreadyCheckedIn.value = res.already_checked_in_today ?? false
  checkedInAt.value      = res.checked_in_at ?? null
  selectedGym.value      = res.selected_gym ?? null
}

// ── Gym selection ─────────────────────────────────────────────────

async function confirmSelection() {
  if (!selectedGymId.value) return
  selecting.value   = true
  selectError.value = ''
  try {
    const res = await api.post<SelectionResponse>('employee/select-gym', {
      gym_id: selectedGymId.value,
    })
    const sel = res.selection
    needsSelection.value   = false
    token.value            = sel.token
    fanNumber.value        = sel.fan_number
    expiresAt.value        = new Date(sel.expires_at)
    totalSlotSeconds.value = sel.rotates_every_hours * 3600
    remaining.value        = sel.expires_in_seconds
    alreadyCheckedIn.value = false
    checkedInAt.value      = null
    selectedGym.value      = sel.selected_gym
  } catch (e: unknown) {
    selectError.value = e instanceof Error ? e.message : 'Failed to select gym. Please try again.'
  } finally {
    selecting.value = false
  }
}

// ── Countdown tick ────────────────────────────────────────────────

function tick() {
  if (!expiresAt.value) return
  const sec = Math.max(0, Math.floor((expiresAt.value.getTime() - Date.now()) / 1000))
  remaining.value = sec
  if (sec === 0) load()
}

onMounted(() => {
  load()
  ticker = setInterval(tick, 1000)
})
onUnmounted(() => { if (ticker) clearInterval(ticker) })

// ── Computed ──────────────────────────────────────────────────────

const countdownLabel = computed(() => {
  const s   = remaining.value
  const h   = Math.floor(s / 3600)
  const m   = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${h}h ${String(m).padStart(2, '0')}m ${String(sec).padStart(2, '0')}s`
})

const progressPct = computed(() => {
  if (!totalSlotSeconds.value) return 0
  return Math.max(0, Math.min(100, (remaining.value / totalSlotSeconds.value) * 100))
})

const barWidth = 600
const bars = computed(() => {
  const t = token.value
  if (!t) return []
  type Bar = { x: number; w: number }
  const out: Bar[] = []
  const padding = 10
  const usable  = barWidth - padding * 2
  const stripesPerChar = 6
  const totalStripes   = t.length * stripesPerChar + 4
  const unit           = usable / totalStripes

  let x = padding
  out.push({ x, w: unit }); x += unit * 2
  out.push({ x: x - unit, w: unit })

  for (let i = 0; i < t.length; i++) {
    const code = t.charCodeAt(i)
    for (let s = 0; s < stripesPerChar; s++) {
      const bit = (code >> s) & 1
      const widthUnits = ((code >> (s * 2)) & 0b11) + 1
      const w = unit * (widthUnits * 0.35 + 0.25)
      if (bit) out.push({ x, w })
      x += unit
    }
  }

  out.push({ x, w: unit }); x += unit * 2
  out.push({ x: x - unit, w: unit })
  return out
})
</script>

<style scoped>
.bc-page { display: flex; flex-direction: column; gap: 16px; max-width: 680px; }

/* Loading / Error */
.loading, .error-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 14px; padding: 80px 20px; color: #94a3b8; text-align: center;
}
.spinner {
  width: 34px; height: 34px; border: 3px solid #e2e8f0;
  border-top-color: #4CD964; border-radius: 50%;
  animation: spin .7s linear infinite;
}
.spinner-sm {
  width: 15px; height: 15px; border: 2.5px solid rgba(255,255,255,0.4);
  border-top-color: white; border-radius: 50%;
  animation: spin .7s linear infinite; display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }
.btn-retry {
  padding: 8px 22px; border-radius: 9px; border: 1.5px solid #e2e8f0;
  background: #fff; cursor: pointer; color: #334155; font-size: 0.85rem;
}

/* ── Step 1: Gym Selection ─────────────────────────────────────── */
.step-header { text-align: center; }
.step-label  { font-size: 0.72rem; color: #94a3b8; text-transform: uppercase; letter-spacing: .08em; margin: 0 0 6px; }
.step-title  { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 0 0 8px; }
.step-sub    { font-size: 0.85rem; color: #64748b; margin: 0; line-height: 1.6; max-width: 460px; margin-inline: auto; }

.empty-gyms {
  background: white; border-radius: 14px; padding: 40px 24px;
  text-align: center; color: #94a3b8; display: flex;
  flex-direction: column; align-items: center; gap: 10px;
  border: 1px solid #f1f5f9;
}
.empty-gyms .empty-sub { font-size: 0.8rem; margin: 0; }

.gym-list { display: flex; flex-direction: column; gap: 10px; }

.gym-card {
  display: flex; align-items: center; gap: 14px;
  background: white; border: 2px solid #e2e8f0; border-radius: 14px;
  padding: 16px 18px; cursor: pointer; text-align: left;
  transition: all .18s; width: 100%;
}
.gym-card:hover { border-color: #4CD964; background: #f0fdf4; }
.gym-card--selected { border-color: #4CD964; background: #f0fdf4; box-shadow: 0 0 0 3px rgba(76,217,100,.12); }

.gym-card-check {
  width: 22px; height: 22px; border-radius: 50%; border: 2px solid #e2e8f0;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: all .15s;
}
.gym-card--selected .gym-card-check { background: #4CD964; border-color: #4CD964; color: white; }

.gym-icon {
  width: 42px; height: 42px; border-radius: 10px;
  background: #f1f5f9; color: #64748b;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.gym-card--selected .gym-icon { background: #dcfce7; color: #15803d; }

.gym-info { flex: 1; }
.gym-name  { font-size: 0.97rem; font-weight: 700; color: #0f172a; margin: 0 0 4px; }
.gym-location {
  display: flex; align-items: center; gap: 4px;
  font-size: 0.78rem; color: #94a3b8; margin: 0;
}

.select-error {
  background: #fee2e2; border: 1px solid #fecaca; border-radius: 9px;
  padding: 10px 14px; color: #dc2626; font-size: 0.84rem; text-align: center;
}

.btn-confirm {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 14px 24px; background: #4CD964; color: white;
  border: none; border-radius: 13px; font-size: 0.95rem; font-weight: 700;
  cursor: pointer; transition: opacity .15s;
}
.btn-confirm:hover:not(:disabled) { opacity: .88; }
.btn-confirm:disabled { opacity: .45; cursor: not-allowed; }

/* ── Gym banner (shared) ───────────────────────────────────────── */
.gym-banner {
  display: flex; align-items: center; gap: 12px;
  background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 13px;
  padding: 12px 16px;
}
.gym-banner--used {
  background: #f8fafc; border-color: #e2e8f0;
}
.gym-banner-icon {
  width: 38px; height: 38px; border-radius: 10px; background: #dcfce7;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.gym-banner-icon--used { background: #f1f5f9; }
.gym-banner-body { flex: 1; }
.gym-banner-label { font-size: 0.68rem; color: #64748b; text-transform: uppercase; letter-spacing: .06em; margin: 0 0 2px; }
.gym-banner-name  { font-size: 0.95rem; font-weight: 700; color: #0f172a; margin: 0 0 2px; }
.gym-banner-loc   { font-size: 0.75rem; color: #64748b; margin: 0; }
.gym-banner-lock  {
  display: flex; align-items: center; gap: 4px;
  font-size: 0.72rem; color: #94a3b8; white-space: nowrap;
}

/* ── Daily Access Used card ────────────────────────────────────── */
.used-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 18px;
  padding: 36px 24px 28px; display: flex; flex-direction: column;
  align-items: center; text-align: center; gap: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,.05);
}
.used-icon-wrap {
  width: 80px; height: 80px; border-radius: 50%;
  background: #f0fdf4; border: 2px solid #bbf7d0;
  display: flex; align-items: center; justify-content: center;
}
.used-title {
  font-size: 1.4rem; font-weight: 800; color: #0f172a; margin: 0;
}
.used-desc {
  font-size: 0.92rem; color: #475569; margin: 0; line-height: 1.6; max-width: 380px;
}
.used-reset {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.78rem; color: #94a3b8;
  background: #f8fafc; border: 1px solid #f1f5f9;
  padding: 7px 14px; border-radius: 999px;
}

.used-barcode-wrap {
  width: 100%; margin-top: 8px;
  border-top: 1px solid #f1f5f9; padding-top: 20px;
}
.used-barcode-label {
  font-size: 0.72rem; color: #cbd5e1; text-transform: uppercase;
  letter-spacing: .06em; margin: 0 0 12px; text-align: center;
}
.barcode-inner {
  background: #f8fafc; border-radius: 10px; padding: 14px;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
}
.barcode--dim { width: 100%; height: 80px; display: block; }
.barcode-text--dim {
  font-family: 'Courier New', monospace; font-size: 0.9rem;
  letter-spacing: .25em; color: #cbd5e1; margin: 0;
}

/* ── Active Pass card ─────────────────────────────────────────── */
.pass-card {
  background: linear-gradient(135deg, #ffffff, #f8fafc);
  border: 1px solid #e2e8f0; border-radius: 18px;
  padding: 24px; box-shadow: 0 6px 24px rgba(15,23,42,.06);
}

.pass-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 22px; }
.pass-label  { font-size: 0.72rem; color: #94a3b8; letter-spacing: .1em; text-transform: uppercase; margin: 0 0 4px; }
.pass-fan    { font-size: 1.05rem; font-weight: 700; color: #0f172a; margin: 0; }
.pass-fan span { font-family: 'Courier New', monospace; color: #4CD964; }
.pass-tier {
  display: inline-flex; align-items: center; gap: 6px;
  background: #ecfdf5; color: #15803d; font-size: 0.72rem;
  padding: 4px 10px; border-radius: 999px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .06em;
}
.dot { width: 6px; height: 6px; border-radius: 50%; background: #4CD964; animation: pulse 1.6s ease-in-out infinite; }
@keyframes pulse { 50% { opacity: 0.35; } }

.barcode-wrap {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
  padding: 18px; display: flex; flex-direction: column; align-items: center; gap: 12px;
}
.barcode      { width: 100%; height: 110px; display: block; }
.barcode-text { font-family: 'Courier New', monospace; font-size: 1.1rem; letter-spacing: .3em; color: #0f172a; margin: 0; font-weight: 700; }

.countdown       { margin-top: 20px; }
.countdown-bar   { width: 100%; height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
.countdown-fill  { height: 100%; background: linear-gradient(90deg, #4CD964, #2EB84B); border-radius: 999px; transition: width 1s linear; }
.countdown-text  { margin: 10px 0 0; font-size: 0.82rem; color: #64748b; text-align: center; }
.countdown-text strong { color: #0f172a; font-family: 'Courier New', monospace; }

/* ── Info card ─────────────────────────────────────────────────── */
.info-card  { background: #fff; border: 1px solid #f1f5f9; border-radius: 14px; padding: 18px 22px; }
.info-title { margin: 0 0 8px; font-size: 0.9rem; font-weight: 700; color: #0f172a; }
.info-list  { margin: 0; padding-left: 18px; color: #475569; font-size: 0.85rem; line-height: 1.8; }
</style>
