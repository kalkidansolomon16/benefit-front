<template>
  <div class="page">

    <!-- -- Tab bar --------------------------------------------- -->
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
      <button
        class="tab-btn"
        :class="{ active: tab === 'upgrades' }"
        @click="tab = 'upgrades'; loadUpgradeRequests()"
      >
        Upgrade Requests
        <span v-if="upgradePendingCount > 0" class="tab-count tab-count--amber">{{ upgradePendingCount }}</span>
      </button>
    </div>

    <!-- ----------------------------------------------------------
         TAB 1 — ACTIVE GYMS
    ----------------------------------------------------------- -->
    <div v-if="tab === 'gyms'">
      <div class="page-actions">
        <p class="count-label">{{ gyms.length }} registered</p>
      </div>

      <div v-if="loadingGyms" class="state-msg">Loading gyms…</div>
      <div v-else-if="!gyms.length" class="state-msg">No gyms yet. Approve a partner application to add one.</div>

      <div v-else class="gym-grid">
        <div
          v-for="g in paginatedGyms"
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
          <div v-if="g.contact_email" class="gc-email">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            {{ g.contact_email }}
          </div>
        </div>
      </div>

      <AppPagination
        v-model:page="gymPage"
        :total-pages="gymTotalPages"
        :total="gyms.length"
        :per-page="gymPerPage"
      />
    </div>

    <!-- ----------------------------------------------------------
         TAB 3 — GYM UPGRADE REQUESTS
    ----------------------------------------------------------- -->
    <div v-else-if="tab === 'upgrades'">

      <div class="app-toolbar">
        <div class="filter-tabs">
          <button v-for="f in upgradeStatusFilters" :key="f.value"
            class="filter-btn" :class="{ active: upgradeStatus === f.value }"
            @click="upgradeStatus = f.value; loadUpgradeRequests()"
          >{{ f.label }}</button>
        </div>
      </div>

      <div v-if="loadingUpgrades" class="state-msg">Loading upgrade requests…</div>
      <div v-else-if="!upgradeRequests.length" class="state-msg">
        No {{ upgradeStatus === 'all' ? '' : upgradeStatus }} upgrade requests.
      </div>

      <div v-else class="app-list">
        <div v-for="r in paginatedUpgrades" :key="r.id" class="upgrade-req-card">

          <div class="urc-header">
            <div class="app-avatar">{{ (r.gym_name ?? '?').slice(0,2).toUpperCase() }}</div>
            <div class="app-header-info">
              <h3 class="app-name">{{ r.gym_name }}</h3>
              <p class="app-contact">{{ r.gym_city }}</p>
            </div>
            <span class="status-badge" :class="`status--${r.status}`">{{ r.status }}</span>
          </div>

          <div class="urc-tier-row">
            <div class="urc-tier-block">
              <p class="urc-tier-label">Current Tier</p>
              <span class="tier-badge-sm" :class="`tb-${gymTierKey(r.current_tier ?? '')}`">{{ gymTierLabel(r.current_tier ?? '') }}</span>
            </div>
            <div class="urc-arrow">→</div>
            <div class="urc-tier-block">
              <p class="urc-tier-label">Requested Tier</p>
              <span class="tier-badge-sm tb-requested">{{ gymTierLabel(r.requested_tier) }}</span>
            </div>
          </div>

          <div v-if="r.message" class="urc-message">
            <p class="urc-message-label">Message from gym</p>
            <p class="urc-message-body">{{ r.message }}</p>
          </div>

          <div v-if="r.status === 'rejected' && r.rejection_reason" class="rejection-note">
            Rejection reason: {{ r.rejection_reason }}
          </div>

          <div v-if="r.reviewed_by" class="urc-reviewed">
            Reviewed by <strong>{{ r.reviewed_by }}</strong> on {{ r.reviewed_at ? formatDate(r.reviewed_at) : '—' }}
          </div>

          <p class="app-date">Submitted {{ formatDate(r.created_at) }}</p>

          <div v-if="r.status === 'pending'" class="app-actions">
            <button class="btn-approve" @click="openUpgradeApprove(r)">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
              Approve Upgrade
            </button>
            <button class="btn-reject" @click="openUpgradeReject(r)">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              Reject
            </button>
          </div>

        </div>
      </div>

      <AppPagination
        v-model:page="upgradePage"
        :total-pages="upgradeTotalPages"
        :total="upgradeRequests.length"
        :per-page="upgradePerPage"
      />
    </div>

    <!-- ----------------------------------------------------------
         TAB 2 — PARTNER APPLICATIONS
    ----------------------------------------------------------- -->
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
        <div v-for="app in paginatedApps" :key="app.id" class="app-card">

          <!-- Card header -->
          <div class="app-card-header">
            <div class="app-avatar">{{ app.facility_name.slice(0,2).toUpperCase() }}</div>
            <div class="app-header-info">
              <h3 class="app-name">{{ app.facility_name }}</h3>
              <p class="app-contact">{{ app.contact_person }} — {{ app.contact_email }}</p>
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

      <AppPagination
        v-model:page="appPage"
        :total-pages="appTotalPages"
        :total="applications.length"
        :per-page="appPerPage"
      />
    </div>

    <!-- -- Approve Modal -- -->
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

    <!-- -- Reject Modal -- -->
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
                placeholder="e.g. Incomplete documentation, facility does not meet standards—"
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

    <!-- -- Upgrade Approve Modal -- -->
    <Teleport to="body">
      <div v-if="upgradeApproveModal" class="modal-overlay" @click.self="upgradeApproveModal = false">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">Approve Tier Upgrade</h2>
            <button class="modal-close" @click="upgradeApproveModal = false">✕</button>
          </div>
          <div class="modal-body">
            <p class="modal-subtitle">
              Approving upgrade for <strong>{{ selectedUpgrade?.gym_name }}</strong>.
              You can approve the requested tier or select a different one.
            </p>
            <div class="field-group">
              <label class="field-label">Approve as Tier <span class="req">*</span></label>
              <div class="tier-grid">
                <button
                  v-for="t in tierOptions"
                  :key="t.value"
                  type="button"
                  class="tier-btn"
                  :class="{ selected: upgradeApproveTier === t.value }"
                  @click="upgradeApproveTier = t.value"
                >
                  <span class="tier-dot" :class="`dot-${t.value}`"></span>
                  <span>{{ t.label }}</span>
                </button>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="upgradeApproveModal = false">Cancel</button>
            <button class="btn-confirm-approve" :disabled="!upgradeApproveTier || upgradeApproveLoading" @click="confirmUpgradeApprove">
              <span v-if="upgradeApproveLoading" class="spinner"></span>
              <span v-else>Confirm Approval</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- -- Upgrade Reject Modal -- -->
    <Teleport to="body">
      <div v-if="upgradeRejectModal" class="modal-overlay" @click.self="upgradeRejectModal = false">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">Reject Upgrade Request</h2>
            <button class="modal-close" @click="upgradeRejectModal = false">✕</button>
          </div>
          <div class="modal-body">
            <p class="modal-subtitle">
              Rejecting upgrade request for <strong>{{ selectedUpgrade?.gym_name }}</strong>.
              A reason is required so the gym knows what to improve.
            </p>
            <div class="field-group">
              <label class="field-label">Rejection Reason <span class="req">*</span></label>
              <textarea
                v-model="upgradeRejectReason"
                class="textarea"
                rows="3"
                placeholder="e.g. Facility does not yet meet the minimum capacity requirement for this tier…"
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="upgradeRejectModal = false">Cancel</button>
            <button class="btn-confirm-reject" :disabled="upgradeRejectLoading || !upgradeRejectReason.trim()" @click="confirmUpgradeReject">
              <span v-if="upgradeRejectLoading" class="spinner"></span>
              <span v-else>Confirm Rejection</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- -- Toast -- -->
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
import { ref, computed, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'
import { useRoute } from 'vue-router'
import AppPagination from '@/components/AppPagination.vue'

const api   = useApi()
const route = useRoute()

// -- Plans (dynamic tier source) ----------------------------
interface Plan { id: number; name: string; tier: string; monthly_fee_etb: number; is_active: boolean }
const allPlans = ref<Plan[]>([])

async function loadPlans() {
  try {
    const res = await api.get<Plan[]>('membership-plans?all=true')
    allPlans.value = (Array.isArray(res) ? res : []).filter((p: Plan) => p.is_active)
  } catch { allPlans.value = [] }
}

/** Strip common plan prefixes to get canonical tier (fit_basic_plus → basic_plus). */
function normalizeTier(tier: string): string {
  const stripped = tier.toLowerCase().replace(/^[a-z]+_(?=basic|premium|platinum|gold|silver)/i, '')
  if (stripped.includes('platinum') || stripped.includes('gold')) return 'platinum'
  if (stripped.includes('premium')) return 'premium'
  if (stripped.includes('basic_plus') || stripped.includes('plus')) return 'basic_plus'
  return 'basic'
}

/** Deduplicated tier options from active plans, canonical value + plan name as label. */
const tierOptions = computed(() => {
  const seen = new Set<string>()
  const opts: { value: string; label: string }[] = []
  // Sort by fee so cheapest plan wins for each canonical tier
  const sorted = [...allPlans.value].sort((a, b) => Number(a.monthly_fee_etb) - Number(b.monthly_fee_etb))
  for (const p of sorted) {
    const canonical = normalizeTier(p.tier)
    if (!seen.has(canonical)) {
      seen.add(canonical)
      opts.push({ value: canonical, label: p.name })
    }
  }
  // Fallback static options if plans haven't loaded yet
  if (!opts.length) {
    return [
      { value: 'basic',      label: 'Basic' },
      { value: 'basic_plus', label: 'Basic Plus' },
      { value: 'premium',    label: 'Premium' },
      { value: 'platinum',   label: 'Platinum' },
    ]
  }
  return opts
})

// -- Tabs ----------------------------------------------------
const tab = ref<'gyms' | 'applications' | 'upgrades'>('gyms')

// -- Gyms ----------------------------------------------------
interface Gym {
  id: number; name: string; tier: string; sub_city: string
  contact_email: string | null
  is_partner: boolean; checkins_today: number; total_members: number
}
const gyms       = ref<Gym[]>([])
const loadingGyms = ref(true)
const gymPage    = ref(1)
const gymPerPage = 10
const gymTotalPages   = computed(() => Math.max(1, Math.ceil(gyms.value.length / gymPerPage)))
const paginatedGyms   = computed(() => gyms.value.slice((gymPage.value - 1) * gymPerPage, gymPage.value * gymPerPage))

async function loadGyms() {
  loadingGyms.value = true
  try {
    gyms.value = await api.get<Gym[]>('dashboard/gym-stats')
  } finally {
    loadingGyms.value = false
  }
}

// -- Partner Applications -------------------------------------
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
const appPage       = ref(1)
const appPerPage    = 10
const appTotalPages    = computed(() => Math.max(1, Math.ceil(applications.value.length / appPerPage)))
const paginatedApps    = computed(() => applications.value.slice((appPage.value - 1) * appPerPage, appPage.value * appPerPage))

const statusFilters = [
  { value: 'all',      label: 'All' },
  { value: 'pending',  label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

async function loadApplications() {
  loadingApps.value = true
  appPage.value = 1
  try {
    const params = appStatus.value !== 'all' ? `?status=${appStatus.value}` : ''
    const res = await api.get<{ data: Application[]; pending_count: number }>(`partner-applications${params}`)
    applications.value = res.data
    pendingCount.value  = res.pending_count
  } finally {
    loadingApps.value = false
  }
}

// -- Approve -------------------------------------------------
const approveModal   = ref(false)
const approveLoading = ref(false)
const approveTier    = ref('')
const selectedApp    = ref<Application | null>(null)

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

// -- Reject --------------------------------------------------
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

// -- Toast ----------------------------------------------------
const toast = ref({ show: false, message: '', type: 'success' })
let toastTimer: ReturnType<typeof setTimeout>
function showToast(message: string, type = 'success') {
  clearTimeout(toastTimer)
  toast.value = { show: true, message, type }
  toastTimer = setTimeout(() => { toast.value.show = false }, 4000)
}

// -- Upgrade Requests -----------------------------------------
interface UpgradeRequest {
  id: number; gym_id: number; gym_name: string | null; gym_city: string | null
  current_tier: string | null; requested_tier: string; message: string | null
  status: string; rejection_reason: string | null
  reviewed_by: string | null; reviewed_at: string | null; created_at: string
}

const upgradeRequests     = ref<UpgradeRequest[]>([])
const loadingUpgrades     = ref(false)
const upgradePendingCount = ref(0)
const upgradeStatus       = ref('all')
const upgradePage         = ref(1)
const upgradePerPage      = 10
const upgradeTotalPages   = computed(() => Math.max(1, Math.ceil(upgradeRequests.value.length / upgradePerPage)))
const paginatedUpgrades   = computed(() =>
  upgradeRequests.value.slice((upgradePage.value - 1) * upgradePerPage, upgradePage.value * upgradePerPage)
)
const upgradeStatusFilters = [
  { value: 'all',      label: 'All' },
  { value: 'pending',  label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

async function loadUpgradeRequests() {
  loadingUpgrades.value = true
  upgradePage.value = 1
  try {
    const params = upgradeStatus.value !== 'all' ? `?status=${upgradeStatus.value}` : ''
    const res = await api.get<{ data: UpgradeRequest[]; pending_count: number }>(`admin/gym-upgrades${params}`)
    upgradeRequests.value    = res.data
    upgradePendingCount.value = res.pending_count
  } finally {
    loadingUpgrades.value = false
  }
}

// Upgrade approve modal
const upgradeApproveModal   = ref(false)
const upgradeApproveLoading = ref(false)
const upgradeApproveTier    = ref('')
const selectedUpgrade       = ref<UpgradeRequest | null>(null)

function openUpgradeApprove(r: UpgradeRequest) {
  selectedUpgrade.value    = r
  upgradeApproveTier.value = normalizeTier(r.requested_tier)
  upgradeApproveModal.value = true
}

async function confirmUpgradeApprove() {
  if (!selectedUpgrade.value || !upgradeApproveTier.value) return
  upgradeApproveLoading.value = true
  try {
    const res = await api.post<{ message: string }>(
      `admin/gym-upgrades/${selectedUpgrade.value.id}/approve`,
      { tier: upgradeApproveTier.value }
    )
    upgradeApproveModal.value = false
    showToast(res.message, 'success')
    await loadUpgradeRequests()
  } catch (e: unknown) {
    showToast(e instanceof Error ? e.message : 'Approval failed.', 'error')
  } finally {
    upgradeApproveLoading.value = false
  }
}

// Upgrade reject modal
const upgradeRejectModal   = ref(false)
const upgradeRejectLoading = ref(false)
const upgradeRejectReason  = ref('')

function openUpgradeReject(r: UpgradeRequest) {
  selectedUpgrade.value   = r
  upgradeRejectReason.value = ''
  upgradeRejectModal.value  = true
}

async function confirmUpgradeReject() {
  if (!selectedUpgrade.value || !upgradeRejectReason.value.trim()) return
  upgradeRejectLoading.value = true
  try {
    const res = await api.post<{ message: string }>(
      `admin/gym-upgrades/${selectedUpgrade.value.id}/reject`,
      { reason: upgradeRejectReason.value }
    )
    upgradeRejectModal.value = false
    showToast(res.message, 'success')
    await loadUpgradeRequests()
  } catch (e: unknown) {
    showToast(e instanceof Error ? e.message : 'Rejection failed.', 'error')
  } finally {
    upgradeRejectLoading.value = false
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// -- Helpers --------------------------------------------------
const categoryMap: Record<string, string> = {
  gym: '??? Gym & Fitness', swimming: '?? Swimming Pool',
  spa: '?? Spa & Hydrotherapy', reflexology: '?? Reflexology & Massage',
  cinema: '?? Cinema / Theatre', yoga: '?? Yoga & Pilates',
  sauna: '?? Sauna & Steam', nutrition: '?? Nutrition Clinic',
}
function categoryLabel(c: string): string { return categoryMap[c] ?? c }

function gymTierKey(t: string) {
  const c = normalizeTier(t || 'basic')
  if (c === 'platinum') return 'platinum'
  if (c === 'premium')  return 'premium'
  if (c === 'basic_plus') return 'plus'
  return 'basic'
}
function gymTierLabel(t: string) {
  if (!t) return tierOptions.value[0]?.label ?? 'Basic'
  const canonical = normalizeTier(t)
  // Find plan whose canonical tier matches; prefer plan name from DB
  const match = tierOptions.value.find(o => o.value === canonical)
  return match?.label ?? canonical.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

onMounted(() => {
  // If navigated here via notification link (?tab=upgrades)
  if (route.query.tab === 'upgrades') tab.value = 'upgrades'

  loadGyms()
  loadApplications()    // pre-load so pendingCount badge shows immediately
  loadUpgradeRequests() // pre-load so upgradePendingCount badge shows immediately
  loadPlans()           // load plan tiers for dynamic tier options
})
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 20px; font-family: 'Inter', system-ui, sans-serif; }

/* -- Tab bar ------------------------------------------------ */
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
.tab-count--red   { background: #fee2e2 !important; color: #dc2626 !important; }
.tab-btn.active .tab-count--red { background: rgba(220,38,38,0.2) !important; color: #fca5a5 !important; }
.tab-count--amber { background: #fef3c7 !important; color: #b45309 !important; }
.tab-btn.active .tab-count--amber { background: rgba(180,83,9,0.2) !important; color: #fcd34d !important; }

/* -- Gyms tab ----------------------------------------------- */
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
.tb-platinum   { background: #ede9fe; color: #2EB84B; }
.tb-plus       { background: #d1fae5; color: #2EB84B; }
.tb-basic      { background: #f1f5f9; color: #64748b; }
.gc-big-num    { font-size: 2rem; font-weight: 800; color: #2EB84B; line-height: 1; }
.card-plus .gc-big-num { color: #4CD964; }
.gc-stats      { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
.gc-stat-label { font-size: 0.72rem; color: #94a3b8; margin: 0 0 3px; }
.gc-stat-val   { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0; }
.gc-footer     { display: flex; align-items: center; justify-content: space-between; }
.gc-city       { font-size: 0.75rem; color: #94a3b8; }
.gc-email      { display: flex; align-items: center; gap: 5px; font-size: 0.74rem; color: #64748b; margin-top: 10px; padding-top: 10px; border-top: 1px solid #f1f5f9; }
.gc-partner-badge { display: inline-block; padding: 2px 9px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
.partner { background: #d1fae5; color: #2EB84B; }
.regular { background: #f1f5f9; color: #94a3b8; }

/* -- Upgrade request cards ---------------------------------- */
.upgrade-req-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 16px;
  padding: 22px; display: flex; flex-direction: column; gap: 14px;
}
.urc-header { display: flex; align-items: center; gap: 14px; }
.urc-tier-row {
  display: flex; align-items: center; gap: 14px;
  background: #f8fafc; border-radius: 10px; padding: 12px 16px;
}
.urc-tier-block { display: flex; flex-direction: column; gap: 4px; }
.urc-tier-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #94a3b8; margin: 0; }
.urc-arrow { font-size: 1.2rem; color: #94a3b8; flex-shrink: 0; margin: 0 8px; }
.tier-badge-sm {
  display: inline-block; padding: 3px 12px; border-radius: 20px;
  font-size: 0.78rem; font-weight: 700;
}
.tb-basic      { background: #eff6ff; color: #3b82f6; }
.tb-plus       { background: #f0fdf4; color: #16a34a; }
.tb-premium    { background: #fff7ed; color: #ea580c; }
.tb-platinum   { background: #faf5ff; color: #9333ea; }
.tb-requested  { background: #fef3c7; color: #b45309; }
.urc-message { display: flex; flex-direction: column; gap: 4px; }
.urc-message-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #94a3b8; margin: 0; }
.urc-message-body  { font-size: 0.85rem; color: #374151; margin: 0; font-style: italic; }
.urc-reviewed { font-size: 0.75rem; color: #94a3b8; }

/* -- Applications tab --------------------------------------- */
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
  background: linear-gradient(135deg, #16a34a, #4CD964);
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
.cat-chip  { padding: 3px 9px; background: #EBFAEE; color: #2EB84B; border-radius: 20px; font-size: 0.73rem; font-weight: 600; }

.app-amenities { display: flex; flex-wrap: wrap; gap: 6px; }
.amenity-chip  { padding: 3px 9px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; font-size: 0.73rem; color: #475569; }

.app-license {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.8rem; color: #64748b;
}
.license-link { color: #4CD964; font-weight: 600; text-decoration: none; }
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

/* -- Modals ------------------------------------------------- */
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
.req          { color: #4CD964; }
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
.dot-basic_plus { background: #2EB84B; }
.dot-premium    { background: #2EB84B; }
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

/* -- Toast -------------------------------------------------- */
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

/* -- Responsive --------------------------------------------- */
@media (max-width: 700px) {
  .app-body { grid-template-columns: 1fr; }
  .tier-grid { grid-template-columns: 1fr; }
}
</style>
