<template>
  <div class="page">

    <!-- ── Tab bar ───────────────────────────────────────────── -->
    <div class="tab-bar">
      <button
        class="tab-btn"
        :class="{ active: tab === 'gyms' }"
        @click="tab = 'gyms'"
      >
        Active Gyms
        <span class="tab-count">{{ gyms.length }}</span>
      </button>
      <button
        class="tab-btn"
        :class="{ active: tab === 'applications' }"
        @click="tab = 'applications'; loadApplications()"
      >
        Partner Applications
        <span v-if="pendingCount > 0" class="tab-count tab-count--red">{{ pendingCount }}</span>
      </button>
    </div>

    <!-- ══════════════════════════════════════════════════════════
         TAB 1 — ACTIVE GYMS
    ═══════════════════════════════════════════════════════════ -->
    <div v-if="tab === 'gyms'">
      <div class="page-actions">
        <p class="count-label">{{ gyms.length }} registered</p>
      </div>

      <div v-if="loadingGyms" class="state-msg">Loading gyms…</div>
      <div v-else-if="!gyms.length" class="state-msg">No gyms yet. Approve a partner application to add one.</div>

      <div v-else class="gym-grid">
        <div
          v-for="g in gyms"
          :key="g.id"
          class="gym-card"
          :class="'card-' + gymTierKey(g.tier)"
        >
          <div class="gc-header">
            <div>
              <h3 class="gc-name">{{ g.name }}</h3>
              <span class="gc-tier-badge" :class="'tb-' + gymTierKey(g.tier)">{{ gymTierLabel(g.tier) }}</span>
            </div>
            <span class="gc-big-num">{{ g.checkins_today ?? 0 }}</span>
          </div>
          <div class="gc-stats">
            <div class="gc-stat">
              <p class="gc-stat-label">Today's check-ins</p>
              <p class="gc-stat-val">{{ g.checkins_today ?? 0 }}</p>
            </div>
            <div class="gc-stat">
              <p class="gc-stat-label">Total members served</p>
              <p class="gc-stat-val">{{ g.total_members ?? 0 }}</p>
            </div>
          </div>
          <div class="gc-footer">
            <span v-if="g.sub_city" class="gc-city">{{ g.sub_city }}</span>
            <span class="gc-partner-badge" :class="g.is_partner ? 'partner' : 'regular'">
              {{ g.is_partner ? 'Partner' : 'Regular' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════
         TAB 2 — PARTNER APPLICATIONS
    ═══════════════════════════════════════════════════════════ -->
    <div v-else>

      <!-- Status filter -->
      <div class="app-toolbar">
        <div class="filter-tabs">
          <button
            v-for="f in statusFilters"
            :key="f.value"
            class="filter-btn"
            :class="{ active: appStatus === f.value }"
            @click="appStatus = f.value; loadApplications()"
          >
            {{ f.label }}
          </button>
        </div>
      </div>

      <div v-if="loadingApps" class="state-msg">Loading applications…</div>
      <div v-else-if="!applications.length" class="state-msg">
        No {{ appStatus === 'all' ? '' : appStatus }} partner applications.
      </div>

      <!-- Application cards -->
      <div v-else class="app-list">
        <div v-for="app in applications" :key="app.id" class="app-card">

          <!-- Card header -->
          <div class="app-card-header">
            <div class="app-avatar">{{ app.facility_name.slice(0,2).toUpperCase() }}</div>
            <div class="app-header-info">
              <h3 class="app-name">{{ app.facility_name }}</h3>
              <p class="app-contact">{{ app.contact_person }} · {{ app.contact_email }}</p>
            </div>
            <span class="status-badge" :class="`status--${app.status}`">
              {{ app.status.charAt(0).toUpperCase() + app.status.slice(1) }}
            </span>
          </div>

          <!-- Body grid -->
          <div class="app-body">

            <!-- Categories -->
            <div class="app-section">
              <p class="app-section-label">Service Categories</p>
              <div class="cat-chips">
                <span v-for="c in app.categories" :key="c" class="cat-chip">{{ categoryLabel(c) }}</span>
              </div>
            </div>

            <!-- Location -->
            <div class="app-section">
              <p class="app-section-label">Location</p>
              <p class="app-section-val">
                {{ [app.sub_city, app.city].filter(Boolean).join(', ') }}
              </p>
              <p class="app-section-sub">{{ app.woreda }}</p>
              <p v-if="app.landmark" class="app-section-sub">{{ app.landmark }}</p>
            </div>

            <!-- Contact -->
            <div class="app-section">
              <p class="app-section-label">Contact</p>
              <p class="app-section-val">{{ app.contact_phone }}</p>
              <p class="app-section-sub">TIN: {{ app.tin_number }}</p>
            </div>

            <!-- Operations -->
            <div class="app-section">
              <p class="app-section-label">Operating Hours</p>
              <p class="app-section-val">{{ app.operating_hours_summary || 'Not specified' }}</p>
              <p class="app-section-sub">Max {{ app.max_capacity }} members/hr</p>
            </div>

          </div>

          <!-- Amenities -->
          <div v-if="app.amenities?.length" class="app-amenities">
            <span v-for="a in app.amenities" :key="a" class="amenity-chip">{{ a }}</span>
          </div>

          <!-- License link -->
          <div v-if="app.business_license_url" class="app-license">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <a :href="app.business_license_url" target="_blank" class="license-link">View Business License</a>
          </div>

          <!-- Maps link -->
          <div v-if="app.google_maps_link" class="app-license">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <a :href="app.google_maps_link" target="_blank" class="license-link">View on Maps</a>
          </div>

          <!-- Rejection reason -->
          <div v-if="app.status === 'rejected' && app.rejection_reason" class="rejection-note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Rejection reason: {{ app.rejection_reason }}
          </div>

          <!-- Submitted at -->
          <p class="app-date">Submitted {{ app.submitted_at }}</p>

          <!-- Actions (only for pending) -->
          <div v-if="app.status === 'pending'" class="app-actions">
            <button class="btn-approve" @click="openApprove(app)">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
              Approve & Create Gym
            </button>
            <button class="btn-reject" @click="openReject(app)">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              Reject
            </button>
          </div>

        </div>
      </div>
    </div>

    <!-- ══ Approve Modal ══ -->
    <Teleport to="body">
      <div v-if="approveModal" class="modal-overlay" @click.self="approveModal = false">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">Approve Partner Application</h2>
            <button class="modal-close" @click="approveModal = false">✕</button>
          </div>

          <div class="modal-body">
            <p class="modal-subtitle">
              <strong>{{ selectedApp?.facility_name }}</strong> will be added as an active gym on the platform.
            </p>

            <div class="field-group">
              <label class="field-label">Assign Gym Tier <span class="req">*</span></label>
              <div class="tier-grid">
                <button
                  v-for="t in tierOptions"
                  :key="t.value"
                  type="button"
                  class="tier-btn"
                  :class="{ selected: approveTier === t.value }"
                  @click="approveTier = t.value"
                >
                  <span class="tier-dot" :class="`dot-${t.value}`"></span>
                  <span>{{ t.label }}</span>
                </button>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" @click="approveModal = false">Cancel</button>
            <button
              class="btn-confirm-approve"
              :disabled="!approveTier || approveLoading"
              @click="confirmApprove"
            >
              <span v-if="approveLoading" class="spinner"></span>
              <span v-else>Confirm Approval</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ══ Reject Modal ══ -->
    <Teleport to="body">
      <div v-if="rejectModal" class="modal-overlay" @click.self="rejectModal = false">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">Reject Application</h2>
            <button class="modal-close" @click="rejectModal = false">✕</button>
          </div>

          <div class="modal-body">
            <p class="modal-subtitle">
              Rejecting <strong>{{ selectedApp?.facility_name }}</strong>. The applicant will be notified.
            </p>
            <div class="field-group">
              <label class="field-label">Reason <span class="optional">(optional)</span></label>
              <textarea
                v-model="rejectReason"
                class="textarea"
                rows="3"
                placeholder="e.g. Incomplete documentation, facility does not meet standards…"
              ></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" @click="rejectModal = false">Cancel</button>
            <button class="btn-confirm-reject" :disabled="rejectLoading" @click="confirmReject">
              <span v-if="rejectLoading" class="spinner"></span>
              <span v-else>Confirm Rejection</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ══ Toast ══ -->
    <Teleport to="body">
      <Transition name="toast">
        <div v-if="toast.show" class="toast" :class="`toast--${toast.type}`">
          {{ toast.message }}
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'

const api = useApi()

// ── Tabs ────────────────────────────────────────────────────
const tab = ref<'gyms' | 'applications'>('gyms')

// ── Gyms ────────────────────────────────────────────────────
interface Gym {
  id: number; name: string; tier: string; sub_city: string
  is_partner: boolean; checkins_today: number; total_members: number
}
const gyms       = ref<Gym[]>([])
const loadingGyms = ref(true)

async function loadGyms() {
  loadingGyms.value = true
  try {
    gyms.value = await api.get<Gym[]>('dashboard/gym-stats')
  } finally {
    loadingGyms.value = false
  }
}

// ── Partner Applications ─────────────────────────────────────
interface Application {
  id: number
  facility_name: string
  categories: string[]
  contact_person: string
  contact_phone: string
  contact_email: string
  tin_number: string
  business_license_url: string | null
  city: string
  sub_city: string
  woreda: string
  landmark: string
  google_maps_link: string | null
  operating_hours_summary: string
  max_capacity: number
  amenities: string[]
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  submitted_at: string
}

const applications  = ref<Application[]>([])
const loadingApps   = ref(false)
const pendingCount  = ref(0)
const appStatus     = ref('all')

const statusFilters = [
  { value: 'all',      label: 'All' },
  { value: 'pending',  label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

async function loadApplications() {
  loadingApps.value = true
  try {
    const params = appStatus.value !== 'all' ? `?status=${appStatus.value}` : ''
    const res = await api.get<{ data: Application[]; pending_count: number }>(`partner-applications${params}`)
    applications.value = res.data
    pendingCount.value  = res.pending_count
  } finally {
    loadingApps.value = false
  }
}

// ── Approve ─────────────────────────────────────────────────
const approveModal   = ref(false)
const approveLoading = ref(false)
const approveTier    = ref('')
const selectedApp    = ref<Application | null>(null)

const tierOptions = [
  { value: 'basic',      label: '🏋️ Basic' },
  { value: 'basic_plus', label: '⭐ Basic Plus' },
  { value: 'premium',    label: '💎 Premium' },
  { value: 'platinum',   label: '👑 Platinum' },
]

function openApprove(app: Application) {
  selectedApp.value  = app
  approveTier.value  = ''
  approveModal.value = true
}

async function confirmApprove() {
  if (!approveTier.value || !selectedApp.value) return
  approveLoading.value = true
  try {
    const res = await api.post<{ message: string }>(`partner-applications/${selectedApp.value.id}/approve`, { tier: approveTier.value })
    approveModal.value = false
    showToast(res.message, 'success')
    await Promise.all([loadGyms(), loadApplications()])
  } catch (e: unknown) {
    showToast(e instanceof Error ? e.message : 'Approval failed.', 'error')
  } finally {
    approveLoading.value = false
  }
}

// ── Reject ──────────────────────────────────────────────────
const rejectModal   = ref(false)
const rejectLoading = ref(false)
const rejectReason  = ref('')

function openReject(app: Application) {
  selectedApp.value = app
  rejectReason.value = ''
  rejectModal.value  = true
}

async function confirmReject() {
  if (!selectedApp.value) return
  rejectLoading.value = true
  try {
    const res = await api.post<{ message: string }>(`partner-applications/${selectedApp.value.id}/reject`, { reason: rejectReason.value })
    rejectModal.value = false
    showToast(res.message, 'success')
    await loadApplications()
  } catch (e: unknown) {
    showToast(e instanceof Error ? e.message : 'Rejection failed.', 'error')
  } finally {
    rejectLoading.value = false
  }
}

// ── Toast ────────────────────────────────────────────────────
const toast = ref({ show: false, message: '', type: 'success' })
let toastTimer: ReturnType<typeof setTimeout>
function showToast(message: string, type = 'success') {
  clearTimeout(toastTimer)
  toast.value = { show: true, message, type }
  toastTimer = setTimeout(() => { toast.value.show = false }, 4000)
}

// ── Helpers ──────────────────────────────────────────────────
const categoryMap: Record<string, string> = {
  gym: '🏋️ Gym & Fitness', swimming: '🏊 Swimming Pool',
  spa: '💆 Spa & Hydrotherapy', reflexology: '🤲 Reflexology & Massage',
  cinema: '🎬 Cinema / Theatre', yoga: '🧘 Yoga & Pilates',
  sauna: '🧖 Sauna & Steam', nutrition: '🥗 Nutrition Clinic',
}
function categoryLabel(c: string): string { return categoryMap[c] ?? c }

function gymTierKey(t: string) {
  if (!t) return 'basic'
  if (t.includes('platinum')) return 'platinum'
  if (t.includes('basic_plus') || t.includes('plus')) return 'plus'
  return 'basic'
}
function gymTierLabel(t: string) {
  if (!t) return 'Basic'
  if (t.includes('platinum')) return 'Platinum'
  if (t.includes('premium'))  return 'Premium'
  if (t.includes('basic_plus') || t.includes('plus')) return 'Basic Plus'
  return 'Basic'
}

onMounted(() => {
  loadGyms()
  loadApplications()   // pre-load so pendingCount badge shows immediately
})
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 20px; font-family: 'Inter', system-ui, sans-serif; }

/* ── Tab bar ──────────────────────────────────────────────── */
.tab-bar { display: flex; gap: 4px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 4px; width: fit-content; }
.tab-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 18px; border-radius: 9px; border: none;
  font-size: 0.84rem; font-weight: 600; color: #64748b;
  background: transparent; cursor: pointer; transition: all 0.15s;
  font-family: inherit;
}
.tab-btn:hover { color: #1e293b; background: #f8fafc; }
.tab-btn.active { background: #0f172a; color: #fff; }
.tab-count {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 20px; height: 20px; padding: 0 5px;
  background: rgba(255,255,255,0.15); border-radius: 10px;
  font-size: 0.72rem; font-weight: 700;
}
.tab-btn:not(.active) .tab-count { background: #f1f5f9; color: #64748b; }
.tab-count--red { background: #fee2e2 !important; color: #dc2626 !important; }
.tab-btn.active .tab-count--red { background: rgba(220,38,38,0.2) !important; color: #fca5a5 !important; }

/* ── Gyms tab ─────────────────────────────────────────────── */
.page-actions { display: flex; align-items: center; justify-content: space-between; }
.count-label  { font-size: 0.85rem; color: #94a3b8; margin: 0; }
.state-msg    { text-align: center; color: #94a3b8; padding: 56px; background: white; border-radius: 14px; border: 1px solid #e2e8f0; }

.gym-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.gym-card {
  background: white; border-radius: 14px; padding: 20px;
  border: 1.5px solid #e2e8f0; box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  transition: transform .12s, box-shadow .12s;
}
.gym-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
.card-platinum { background: #faf5ff; border-color: #e9d5ff; }
.card-plus     { background: #f0fdf9; border-color: #99f6e4; }
.card-basic    { background: white;   border-color: #e2e8f0; }
.gc-header     { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
.gc-name       { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0 0 6px; }
.gc-tier-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 600; }
.tb-platinum   { background: #ede9fe; color: #7c3aed; }
.tb-plus       { background: #d1fae5; color: #059669; }
.tb-basic      { background: #f1f5f9; color: #64748b; }
.gc-big-num    { font-size: 2rem; font-weight: 800; color: #7c3aed; line-height: 1; }
.card-plus .gc-big-num { color: #14b8a6; }
.gc-stats      { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
.gc-stat-label { font-size: 0.72rem; color: #94a3b8; margin: 0 0 3px; }
.gc-stat-val   { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0; }
.gc-footer     { display: flex; align-items: center; justify-content: space-between; }
.gc-city       { font-size: 0.75rem; color: #94a3b8; }
.gc-partner-badge { display: inline-block; padding: 2px 9px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
.partner { background: #d1fae5; color: #059669; }
.regular { background: #f1f5f9; color: #94a3b8; }

/* ── Applications tab ─────────────────────────────────────── */
.app-toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.filter-tabs { display: flex; gap: 4px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 3px; }
.filter-btn {
  padding: 6px 14px; border-radius: 7px; border: none;
  font-size: 0.8rem; font-weight: 600; color: #64748b;
  background: transparent; cursor: pointer; transition: all 0.15s; font-family: inherit;
}
.filter-btn:hover { color: #1e293b; }
.filter-btn.active { background: #0f172a; color: #fff; }

/* Application card */
.app-list { display: flex; flex-direction: column; gap: 16px; }
.app-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 16px;
  padding: 22px; display: flex; flex-direction: column; gap: 14px;
}

.app-card-header { display: flex; align-items: center; gap: 14px; }
.app-avatar {
  width: 48px; height: 48px; border-radius: 14px; flex-shrink: 0;
  background: linear-gradient(135deg, #16a34a, #2563eb);
  color: #fff; font-weight: 800; font-size: 1rem;
  display: flex; align-items: center; justify-content: center;
}
.app-header-info { flex: 1; min-width: 0; }
.app-name    { font-size: 1.05rem; font-weight: 700; color: #0f172a; margin: 0 0 3px; }
.app-contact { font-size: 0.78rem; color: #64748b; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.status-badge {
  padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700;
  flex-shrink: 0; text-transform: capitalize;
}
.status--pending  { background: #fef9c3; color: #92400e; }
.status--approved { background: #dcfce7; color: #166534; }
.status--rejected { background: #fee2e2; color: #991b1b; }

/* Body grid */
.app-body { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
.app-section { display: flex; flex-direction: column; gap: 3px; }
.app-section-label { font-size: 0.7rem; font-weight: 700; color: #94a3b8; letter-spacing: 0.07em; text-transform: uppercase; margin: 0; }
.app-section-val   { font-size: 0.85rem; font-weight: 600; color: #1e293b; margin: 0; }
.app-section-sub   { font-size: 0.78rem; color: #64748b; margin: 0; }

.cat-chips { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 2px; }
.cat-chip  { padding: 3px 9px; background: #f0f9ff; color: #0284c7; border-radius: 20px; font-size: 0.73rem; font-weight: 600; }

.app-amenities { display: flex; flex-wrap: wrap; gap: 6px; }
.amenity-chip  { padding: 3px 9px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; font-size: 0.73rem; color: #475569; }

.app-license {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.8rem; color: #64748b;
}
.license-link { color: #2563eb; font-weight: 600; text-decoration: none; }
.license-link:hover { text-decoration: underline; }

.rejection-note {
  display: flex; align-items: flex-start; gap: 7px;
  font-size: 0.8rem; color: #991b1b;
  background: #fff1f2; padding: 10px 14px; border-radius: 8px;
}

.app-date { font-size: 0.75rem; color: #94a3b8; margin: 0; }

.app-actions { display: flex; gap: 10px; padding-top: 4px; }
.btn-approve {
  display: flex; align-items: center; gap: 7px;
  padding: 9px 18px; background: #16a34a; color: #fff;
  border: none; border-radius: 9px; font-size: 0.84rem; font-weight: 600;
  cursor: pointer; transition: opacity 0.15s; font-family: inherit;
}
.btn-approve:hover { opacity: 0.85; }
.btn-reject {
  display: flex; align-items: center; gap: 7px;
  padding: 9px 18px; background: #fff; color: #dc2626;
  border: 1.5px solid #fecaca; border-radius: 9px; font-size: 0.84rem; font-weight: 600;
  cursor: pointer; transition: background 0.15s; font-family: inherit;
}
.btn-reject:hover { background: #fff1f2; }

/* ── Modals ───────────────────────────────────────────────── */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 200; padding: 16px;
}
.modal {
  background: #fff; border-radius: 18px;
  width: 100%; max-width: 460px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  overflow: hidden;
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px; border-bottom: 1px solid #f1f5f9;
}
.modal-title  { font-size: 1.05rem; font-weight: 700; color: #0f172a; margin: 0; }
.modal-close  { background: none; border: none; font-size: 1.1rem; color: #94a3b8; cursor: pointer; padding: 4px 8px; border-radius: 6px; }
.modal-close:hover { color: #1e293b; background: #f1f5f9; }
.modal-body   { padding: 22px 24px; display: flex; flex-direction: column; gap: 18px; }
.modal-subtitle { font-size: 0.88rem; color: #64748b; margin: 0; line-height: 1.5; }
.modal-footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 16px 24px; border-top: 1px solid #f1f5f9;
}

.field-group  { display: flex; flex-direction: column; gap: 8px; }
.field-label  { font-size: 0.85rem; font-weight: 600; color: #334155; }
.req          { color: #e0386a; }
.optional     { color: #94a3b8; font-weight: 400; font-size: 0.78rem; }

/* Tier selector in modal */
.tier-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.tier-btn {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; background: #f8fafc;
  border: 1.5px solid #e2e8f0; border-radius: 10px;
  font-size: 0.84rem; font-weight: 500; color: #475569;
  cursor: pointer; transition: all 0.15s; font-family: inherit;
}
.tier-btn:hover   { border-color: #16a34a; color: #166534; }
.tier-btn.selected { border-color: #16a34a; background: #f0fdf4; color: #166534; font-weight: 700; }
.tier-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.dot-basic      { background: #64748b; }
.dot-basic_plus { background: #0284c7; }
.dot-premium    { background: #7c3aed; }
.dot-platinum   { background: #f59e0b; }

.textarea {
  width: 100%; padding: 10px 14px;
  border: 1.5px solid #e2e8f0; border-radius: 10px;
  font-size: 0.88rem; color: #1e293b; font-family: inherit;
  resize: vertical; outline: none; box-sizing: border-box;
  transition: border-color 0.2s;
}
.textarea:focus { border-color: #334155; }

.btn-cancel {
  padding: 9px 20px; background: #f8fafc; color: #475569;
  border: 1.5px solid #e2e8f0; border-radius: 9px; font-size: 0.84rem; font-weight: 600;
  cursor: pointer; font-family: inherit;
}
.btn-cancel:hover { background: #f1f5f9; }
.btn-confirm-approve {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 20px; background: #16a34a; color: #fff;
  border: none; border-radius: 9px; font-size: 0.84rem; font-weight: 600;
  cursor: pointer; transition: opacity 0.15s; font-family: inherit;
}
.btn-confirm-approve:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-confirm-approve:not(:disabled):hover { opacity: 0.85; }
.btn-confirm-reject {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 20px; background: #dc2626; color: #fff;
  border: none; border-radius: 9px; font-size: 0.84rem; font-weight: 600;
  cursor: pointer; transition: opacity 0.15s; font-family: inherit;
}
.btn-confirm-reject:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-confirm-reject:not(:disabled):hover { opacity: 0.85; }

/* ── Toast ────────────────────────────────────────────────── */
.toast {
  position: fixed; bottom: 28px; right: 28px; z-index: 999;
  padding: 13px 20px; border-radius: 12px;
  font-size: 0.88rem; font-weight: 600; font-family: 'Inter', system-ui, sans-serif;
  box-shadow: 0 8px 30px rgba(0,0,0,0.15); min-width: 260px; max-width: 400px;
}
.toast--success { background: #0f172a; color: #fff; }
.toast--error   { background: #dc2626; color: #fff; }
.toast-enter-active, .toast-leave-active { transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(12px) scale(0.95); }

/* Spinner */
.spinner {
  width: 15px; height: 15px;
  border: 2px solid rgba(255,255,255,0.35); border-top-color: #fff;
  border-radius: 50%; animation: spin 0.65s linear infinite; display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Responsive ───────────────────────────────────────────── */
@media (max-width: 700px) {
  .app-body { grid-template-columns: 1fr; }
  .tier-grid { grid-template-columns: 1fr; }
}
</style>
