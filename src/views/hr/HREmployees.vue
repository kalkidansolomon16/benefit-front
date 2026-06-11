<template>
  <div class="page">

    <!-- Header -->
    <div class="page-header">
      <div class="tabs">
        <button
          v-for="tab in tabs" :key="tab.key"
          class="tab" :class="{ 'tab--active': activeTab === tab.key }"
          @click="switchTab(tab.key)"
        >
          {{ tab.label }}
          <span v-if="tab.key === 'pending' && pendingCount > 0" class="tab-badge">{{ pendingCount }}</span>
        </button>
      </div>
      <p class="count-label">{{ total }} {{ activeTab === 'pending' ? 'pending' : activeTab === 'all' ? 'total' : activeTab }}</p>
    </div>

    <!-- Search -->
    <div class="search-wrap">
      <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input v-model="search" class="search-input" placeholder="Search name, FAN, email or phone…" @input="debouncedLoad" />
      <button v-if="search" class="search-clear" @click="search = ''; load()">✕</button>
    </div>

    <div v-if="loading" class="state-msg">Loading employees…</div>

    <!-- Pending tab: approval cards -->
    <div v-else-if="activeTab === 'pending' && employees.length" class="pending-list">
      <div v-for="e in paginatedEmployees" :key="e.id" class="pending-card">
        <div class="pending-card-left">
          <div class="emp-avatar" :style="{ background: avatarColor(e.name) }">{{ initials(e.name) }}</div>
          <div class="emp-info">
            <p class="emp-name">{{ e.name }}</p>
            <p class="emp-meta">
              <span class="mono">{{ e.fan_number }}</span>
              <span v-if="e.job_title"> · {{ e.job_title }}</span>
              <span v-if="e.department"> · {{ e.department }}</span>
              <span v-if="e.branch"> · {{ e.branch }}</span>
            </p>
            <div class="emp-tags">
              <span class="pkg-badge" :class="'pkb-' + e.package">{{ tierLabel(e.package) }}</span>
              <span v-if="e.email" class="emp-contact">
                <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                {{ e.email }}
              </span>
              <span v-if="e.phone" class="emp-contact">
                <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.68 2.81a2 2 0 0 1-.45 2.11L7.91 9.4a16 16 0 0 0 6.69 6.69l1.27-1.27a2 2 0 0 1 2.11-.45c.9.32 1.85.55 2.81.68A2 2 0 0 1 22 16.92z"/></svg>
                {{ e.phone }}
              </span>
            </div>
          </div>
        </div>

        <!-- Request note -->
        <div v-if="e.request_note" class="request-note">
          <svg width="13" height="13" fill="none" stroke="#64748b" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span>{{ e.request_note }}</span>
        </div>

        <!-- Actions -->
        <div class="pending-actions">
          <button class="btn-approve" :disabled="acting === e.id" @click="approve(e)">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
            {{ acting === e.id ? 'Approving…' : 'Approve' }}
          </button>
          <button class="btn-reject" :disabled="acting === e.id" @click="reject(e)">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
            Reject
          </button>
        </div>
      </div>
    </div>

    <!-- Empty states -->
    <div v-else-if="!employees.length && activeTab === 'pending'" class="empty-state">
      <div class="empty-icon">✅</div>
      <p class="empty-title">No pending approvals</p>
      <p class="empty-sub">All employee applications have been reviewed.</p>
    </div>
    <div v-else-if="!employees.length" class="state-msg">No employees found.</div>

    <!-- All / Approved / Rejected: table -->
    <div v-else class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>EMPLOYEE</th>
            <th>FAN NUMBER</th>
            <th>EMAIL</th>
            <th>PHONE</th>
            <th>PACKAGE</th>
            <th>DEPARTMENT</th>
            <th>JOINED</th>
            <th>STATUS</th>
            <th v-if="activeTab === 'all'">ACTION</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in paginatedEmployees" :key="e.id">
            <td class="td-employee">
              <div class="emp-avatar" :style="{ background: avatarColor(e.name) }">{{ initials(e.name) }}</div>
              <div>
                <p class="emp-name">{{ e.name }}</p>
                <p class="emp-sub">{{ e.job_title || '—' }}</p>
              </div>
            </td>
            <td class="td-fan">{{ e.fan_number }}</td>
            <td class="td-contact">
              <span v-if="e.email" class="td-contact-val">
                <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                {{ e.email }}
              </span>
              <span v-else class="td-no-action">—</span>
            </td>
            <td class="td-contact">
              <span v-if="e.phone" class="td-contact-val">
                <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.68 2.81a2 2 0 0 1-.45 2.11L7.91 9.4a16 16 0 0 0 6.69 6.69l1.27-1.27a2 2 0 0 1 2.11-.45c.9.32 1.85.55 2.81.68A2 2 0 0 1 22 16.92z"/></svg>
                {{ e.phone }}
              </span>
              <span v-else class="td-no-action">—</span>
            </td>
            <td><span class="pkg-badge" :class="'pkb-' + e.package">{{ tierLabel(e.package) }}</span></td>
            <td class="td-dept">{{ e.department || '—' }}</td>
            <td class="td-date">{{ e.enrolled_at }}</td>
            <td>
              <span class="reg-badge" :class="e.registration_status === 'approved' && e.admin_approval_status === 'pending' ? 'reg-admin-pending' : 'reg-' + (e.registration_status ?? 'approved')">
                {{ regLabel(e.registration_status, e.admin_approval_status) }}
              </span>
            </td>
            <td v-if="activeTab === 'all'">
              <div class="action-cell">
                <template v-if="e.registration_status === 'pending'">
                  <button class="act-btn act-approve" :disabled="acting === e.id" @click="approve(e)">Approve</button>
                  <button class="act-btn act-reject"  :disabled="acting === e.id" @click="reject(e)">Reject</button>
                </template>
                <button v-if="!e.is_banned" class="act-btn act-ban" @click="openBan(e)">Ban</button>
                <button v-else class="act-btn act-release" @click="doUnban(e)">Release</button>
              </div>
              <div v-if="e.is_banned" class="ban-chip">
                Banned until {{ formatDate(e.banned_until) }}
                <span v-if="e.ban_reason" class="ban-reason"> — {{ e.ban_reason }}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AppPagination
      v-model:page="empPage"
      :total-pages="empTotalPages"
      :total="employees.length"
      :per-page="empPerPage"
    />

    <!-- Plan + Payment Preference Approval Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="approvalModal.show" class="modal-backdrop" @click.self="approvalModal.show = false">
          <div class="modal modal-wide">
            <div class="modal-header">
              <div>
                <p class="modal-title">Approve Employee</p>
                <p class="modal-sub">Approving <strong>{{ approvalModal.employee?.name }}</strong> — pending admin final confirmation</p>
              </div>
              <button class="modal-close" @click="approvalModal.show = false">✕</button>
            </div>

            <!-- Step indicator -->
            <div class="modal-steps">
              <div class="modal-step" :class="{ active: approvalModal.step === 1, done: approvalModal.step > 1 }">
                <span class="step-num">1</span> Select Plan
              </div>
              <div class="step-line"></div>
              <div class="modal-step" :class="{ active: approvalModal.step === 2 }">
                <span class="step-num">2</span> Payment Option
              </div>
            </div>

            <!-- Step 1: Plan selection -->
            <div v-if="approvalModal.step === 1">
              <div v-if="plansLoading" class="plans-loading">Loading plans…</div>
              <div v-else-if="plans.length" class="plan-grid">
                <button
                  v-for="p in plans" :key="p.tier"
                  class="plan-card"
                  :class="{ 'plan-card--selected': approvalModal.selectedPlan === p.tier }"
                  @click="approvalModal.selectedPlan = p.tier"
                >
                  <div class="plan-check">
                    <svg v-if="approvalModal.selectedPlan === p.tier" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <p class="plan-name">{{ p.name }}</p>
                  <p class="plan-price">ETB {{ Number(p.monthly_fee_etb).toLocaleString() }}<span>/mo</span></p>
                  <ul class="plan-features">
                    <li v-for="f in (p.features ?? []).slice(0, 3)" :key="f">{{ f }}</li>
                  </ul>
                </button>
              </div>
              <div v-else class="plans-empty">No active plans found. Please add plans from the Admin panel first.</div>
            </div>

            <!-- Step 2: Payment preference -->
            <div v-else-if="approvalModal.step === 2" class="payment-step">
              <p class="payment-step-label">How will the invoice for <strong>{{ approvalModal.employee?.name }}</strong> be handled?</p>
              <div class="payment-options">
                <button
                  class="payment-option"
                  :class="{ selected: approvalModal.paymentPreference === 'pay_now' }"
                  @click="approvalModal.paymentPreference = 'pay_now'"
                >
                  <div class="pay-option-icon pay-now">
                    <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                  </div>
                  <div class="pay-option-body">
                    <p class="pay-option-title">Pay Now</p>
                    <p class="pay-option-desc">Notify admin to generate an invoice immediately. Employee activates after payment is confirmed.</p>
                  </div>
                  <div class="pay-option-check" v-if="approvalModal.paymentPreference === 'pay_now'">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                </button>

                <button
                  class="payment-option"
                  :class="{ selected: approvalModal.paymentPreference === 'pay_later' }"
                  @click="approvalModal.paymentPreference = 'pay_later'"
                >
                  <div class="pay-option-icon pay-later">
                    <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </div>
                  <div class="pay-option-body">
                    <p class="pay-option-title">Pay Later</p>
                    <p class="pay-option-desc">Invoice will be settled in the next billing cycle. Employee activates after admin confirms.</p>
                  </div>
                  <div class="pay-option-check" v-if="approvalModal.paymentPreference === 'pay_later'">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                </button>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-cancel" @click="approvalModal.step === 1 ? approvalModal.show = false : approvalModal.step--">
                {{ approvalModal.step === 1 ? 'Cancel' : '← Back' }}
              </button>
              <button
                v-if="approvalModal.step === 1"
                class="btn-confirm"
                :disabled="!approvalModal.selectedPlan"
                @click="approvalModal.step = 2"
              >
                Next: Payment Option →
              </button>
              <button
                v-else
                class="btn-confirm"
                :disabled="!approvalModal.paymentPreference || acting === approvalModal.employee?.id"
                @click="confirmApprove"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
                {{ acting === approvalModal.employee?.id ? 'Submitting…' : approvalModal.paymentPreference === 'pay_now' ? 'Approve & Notify Admin' : 'Approve & Pay Later' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Ban Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="banModal.open" class="modal-backdrop" @click.self="banModal.open = false">
          <div class="modal ban-modal">
            <div class="modal-header">
              <div>
                <p class="modal-title">Ban Employee</p>
                <p class="modal-sub">Banning <strong>{{ banModal.employee?.name }}</strong> will prevent them from checking in to any gym.</p>
              </div>
              <button class="modal-close" @click="banModal.open = false">✕</button>
            </div>
            <div class="modal-body">
              <div class="field">
                <label class="field-label">Ban Duration</label>
                <div class="duration-grid">
                  <button
                    v-for="d in durationOptions" :key="d.days"
                    type="button" class="dur-btn"
                    :class="{ selected: banModal.days === d.days && !banModal.custom }"
                    @click="banModal.days = d.days; banModal.custom = false"
                  >{{ d.label }}</button>
                  <button
                    type="button" class="dur-btn"
                    :class="{ selected: banModal.custom }"
                    @click="banModal.custom = true"
                  >Custom</button>
                </div>
                <div v-if="banModal.custom" class="custom-days-wrap">
                  <input v-model.number="banModal.days" type="number" min="1" max="365" class="days-input" placeholder="Number of days" />
                  <span class="days-label">days</span>
                </div>
              </div>
              <div class="field">
                <label class="field-label">Reason <span class="optional">(optional)</span></label>
                <textarea v-model="banModal.reason" class="ban-textarea" rows="3" placeholder="e.g. Misuse of gym access, Policy violation…"></textarea>
              </div>
              <div v-if="banModal.error" class="banner-error">{{ banModal.error }}</div>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" @click="banModal.open = false">Cancel</button>
              <button class="btn-ban-confirm" :disabled="banModal.loading || !banModal.days" @click="confirmBan">
                <span v-if="banModal.loading" class="spinner-sm"></span>
                <span v-else>Confirm Ban</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Reject Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="hrRejectModal.show" class="modal-backdrop" @click.self="hrRejectModal.show = false">
          <div class="modal">
            <div class="modal-header">
              <div>
                <p class="modal-title">Reject Employee Application</p>
                <p class="modal-sub">Rejecting <strong>{{ hrRejectModal.employee?.name }}</strong> — they will be notified.</p>
              </div>
              <button class="modal-close" @click="hrRejectModal.show = false">✕</button>
            </div>
            <div class="modal-body">
              <div class="field">
                <label>Rejection Reason <span class="req">*</span></label>
                <textarea v-model="hrRejectModal.reason" rows="3" placeholder="e.g. Not eligible for this membership tier, duplicate registration…" />
              </div>
              <p v-if="hrRejectModal.error" class="form-error">{{ hrRejectModal.error }}</p>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" @click="hrRejectModal.show = false">Cancel</button>
              <button class="btn-reject-confirm" :disabled="hrRejectModal.loading" @click="confirmHrReject">
                {{ hrRejectModal.loading ? 'Rejecting…' : 'Confirm Reject' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Toast -->
    <Teleport to="body">
      <Transition name="toast">
        <div v-if="toast.show" class="toast" :class="'toast-' + toast.type">
          <svg v-if="toast.type === 'success'" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          <svg v-else width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
          {{ toast.message }}
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useApi } from '@/composables/useApi'
import AppPagination from '@/components/AppPagination.vue'

const api = useApi()

interface Emp {
  id: number; name: string; email: string; phone: string
  fan_number: string; package: string; status: string
  job_title: string; department: string; branch: string
  request_note: string; registration_status: string; enrolled_at: string
  admin_approval_status: string | null; payment_preference: string | null
  is_banned: boolean; banned_until: string | null; ban_reason: string | null
}

interface Plan {
  id: number; name: string; tier: string
  monthly_fee_etb: string | number; features: string[] | null
}

const employees    = ref<Emp[]>([])
const total        = ref(0)
const pendingCount = ref(0)
const loading      = ref(true)
const search       = ref('')
const activeTab    = ref<'all' | 'pending' | 'approved' | 'rejected'>('all')
const acting       = ref<number | null>(null)
const hrRejectModal = reactive({ show: false, employee: null as Emp | null, reason: '', error: '', loading: false })

const empPage    = ref(1)
const empPerPage = 20
const empTotalPages   = computed(() => Math.max(1, Math.ceil(employees.value.length / empPerPage)))
const paginatedEmployees = computed(() => employees.value.slice((empPage.value - 1) * empPerPage, empPage.value * empPerPage))

// Plan selection modal state
const plans       = ref<Plan[]>([])
const plansLoading = ref(false)
const approvalModal = reactive<{
  show: boolean
  step: number
  employee: Emp | null
  selectedPlan: string
  paymentPreference: 'pay_now' | 'pay_later' | ''
}>({ show: false, step: 1, employee: null, selectedPlan: '', paymentPreference: '' })

const tabs = [
  { key: 'all',      label: 'All' },
  { key: 'pending',  label: 'Pending Approval' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
] as const

// ── Toast ────────────────────────────────────────────────────
const toast = reactive({ show: false, type: 'success', message: '' })
let toastTimer: ReturnType<typeof setTimeout> | null = null
function showToast(message: string, type: 'success' | 'error' = 'success') {
  if (toastTimer) clearTimeout(toastTimer)
  Object.assign(toast, { show: true, type, message })
  toastTimer = setTimeout(() => { toast.show = false }, 4000)
}

// ── Debounce ─────────────────────────────────────────────────
let searchTimer: ReturnType<typeof setTimeout> | null = null
function debouncedLoad() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(load, 300)
}

// ── Data ─────────────────────────────────────────────────────
async function load() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (search.value)           params.set('search', search.value)
    if (activeTab.value !== 'all') params.set('status', activeTab.value)
    const qs = params.toString()
    const res = await api.get<{ data: Emp[]; total: number; pending_count: number }>(
      `hr/employees${qs ? '?' + qs : ''}`
    )
    employees.value    = res.data
    total.value        = res.total
    pendingCount.value = res.pending_count ?? 0
  } finally {
    loading.value = false
  }
}

function switchTab(tab: typeof activeTab.value) {
  activeTab.value = tab
  search.value    = ''
  empPage.value   = 1
  load()
}

watch(employees, () => { empPage.value = 1 })

onMounted(load)

// ── Ban / Unban ───────────────────────────────────────────────
const durationOptions = [
  { days: 1,  label: '1 Day' },
  { days: 3,  label: '3 Days' },
  { days: 7,  label: '1 Week' },
  { days: 30, label: '1 Month' },
]

const banModal = reactive({
  open: false, loading: false, error: '',
  custom: false, days: 7, reason: '',
  employee: null as Emp | null,
})

function openBan(e: Emp) {
  banModal.employee = e
  banModal.days     = 7
  banModal.reason   = ''
  banModal.custom   = false
  banModal.error    = ''
  banModal.open     = true
}

async function confirmBan() {
  if (!banModal.employee || !banModal.days) return
  banModal.loading = true
  banModal.error   = ''
  try {
    const res = await api.post<{ employee: Emp }>(
      `hr/employees/${banModal.employee.id}/ban`,
      { days: banModal.days, ban_reason: banModal.reason || null }
    )
    const idx = employees.value.findIndex(e => e.id === banModal.employee!.id)
    if (idx !== -1) employees.value[idx] = res.employee
    banModal.open = false
    showToast(`${res.employee.name} banned successfully.`)
  } catch (err: unknown) {
    banModal.error = err instanceof Error ? err.message : 'Ban failed.'
  } finally {
    banModal.loading = false
  }
}

async function doUnban(e: Emp) {
  try {
    const res = await api.post<{ employee: Emp }>(`hr/employees/${e.id}/unban`)
    const idx = employees.value.findIndex(emp => emp.id === e.id)
    if (idx !== -1) employees.value[idx] = res.employee
    showToast(`${res.employee.name}'s ban lifted.`)
  } catch (err: unknown) {
    showToast(err instanceof Error ? err.message : 'Unban failed.', 'error')
  }
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Approve / Reject ──────────────────────────────────────────
async function approve(e: Emp) {
  // Fetch plans and open modal (step 1)
  plansLoading.value = true
  approvalModal.employee          = e
  approvalModal.selectedPlan      = ''
  approvalModal.paymentPreference = ''
  approvalModal.step              = 1
  approvalModal.show              = true

  try {
    const res = await api.get<Plan[]>('membership-plans')
    const list = Array.isArray(res) ? res : (res as any).data ?? []
    plans.value = list

    // Default to 'basic' if available, otherwise the first plan
    const defaultPlan = list.find((p: Plan) => p.tier === 'basic') ?? list[0]
    if (defaultPlan) approvalModal.selectedPlan = defaultPlan.tier
  } catch {
    plans.value = []
  } finally {
    plansLoading.value = false
  }
}

async function confirmApprove() {
  const e = approvalModal.employee
  if (!e || !approvalModal.selectedPlan || !approvalModal.paymentPreference) return

  acting.value = e.id
  try {
    await api.post(`hr/employees/${e.id}/approve`, {
      plan:               approvalModal.selectedPlan,
      payment_preference: approvalModal.paymentPreference,
    })
    approvalModal.show = false
    const msg = approvalModal.paymentPreference === 'pay_now'
      ? `${e.name} approved — admin notified to generate invoice.`
      : `${e.name} approved — pending admin confirmation before activation.`
    showToast(msg)
    await load()
  } catch {
    showToast('Failed to approve. Please try again.', 'error')
  } finally {
    acting.value = null
  }
}

function reject(e: Emp) {
  hrRejectModal.employee = e
  hrRejectModal.reason   = ''
  hrRejectModal.error    = ''
  hrRejectModal.loading  = false
  hrRejectModal.show     = true
}

async function confirmHrReject() {
  if (!hrRejectModal.reason.trim()) { hrRejectModal.error = 'Please provide a rejection reason.'; return }
  const e = hrRejectModal.employee!
  hrRejectModal.loading = true
  acting.value = e.id
  try {
    await api.post(`hr/employees/${e.id}/reject`, { reason: hrRejectModal.reason })
    hrRejectModal.show = false
    showToast(`${e.name}'s application rejected.`)
    await load()
  } catch {
    hrRejectModal.error = 'Failed to reject. Please try again.'
  } finally {
    hrRejectModal.loading = false
    acting.value = null
  }
}

// ── Helpers ───────────────────────────────────────────────────
function tierLabel(t: string) {
  // Try matched plan name first, then humanise the tier key
  const found = plans.value.find(p => p.tier === t)
  if (found) return found.name
  return { basic: 'Basic', basic_plus: 'Basic Plus', platinum: 'Platinum' }[t]
    ?? t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
function regLabel(s: string, adminStatus?: string | null) {
  if (s === 'approved' && adminStatus === 'pending') return 'Pending Admin'
  if (s === 'approved' && adminStatus === 'approved') return 'Active'
  if (s === 'approved' && adminStatus === 'rejected') return 'Admin Rejected'
  return { pending: 'Pending HR', approved: 'Active', rejected: 'Rejected' }[s] ?? s
}
const COLORS = ['#3b82f6','#2EB84B','#4CD964','#f59e0b','#ef4444','#06b6d4','#ec4899']
function avatarColor(name: string) {
  let h = 0; for (const c of (name ?? '')) h = (h * 31 + c.charCodeAt(0)) & 0xff
  return COLORS[h % COLORS.length]
}
function initials(name: string) {
  return (name ?? '').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }

/* ── Header & Tabs ──────────────────────────────────────────── */
.page-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
.count-label { font-size: 0.82rem; color: #94a3b8; margin: 0; }

.tabs { display: flex; gap: 4px; background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 4px; }
.tab {
  padding: 7px 14px; border-radius: 7px; font-size: 0.82rem; font-weight: 500;
  border: none; background: none; color: #64748b; cursor: pointer; transition: all .15s;
  display: flex; align-items: center; gap: 6px; white-space: nowrap;
}
.tab:hover { background: #f8fafc; color: #0f172a; }
.tab--active { background: #0f172a; color: #fff; font-weight: 600; }
.tab-badge {
  background: #ef4444; color: #fff; font-size: 0.65rem; font-weight: 700;
  padding: 1px 6px; border-radius: 20px; min-width: 18px; text-align: center;
}

/* ── Search ─────────────────────────────────────────────────── */
.search-wrap {
  position: relative; background: white; border: 1px solid #e2e8f0;
  border-radius: 12px; display: flex; align-items: center;
}
.search-icon  { position: absolute; left: 14px; flex-shrink: 0; }
.search-input {
  width: 100%; padding: 12px 40px; background: transparent;
  border: none; outline: none; font-size: 0.875rem; color: #0f172a;
}
.search-input::placeholder { color: #94a3b8; }
.search-clear {
  position: absolute; right: 14px; background: none; border: none;
  color: #94a3b8; cursor: pointer; font-size: 0.75rem;
}
.search-clear:hover { color: #ef4444; }

.state-msg { text-align: center; color: #94a3b8; padding: 48px; background: white; border-radius: 14px; }

/* ── Pending cards ──────────────────────────────────────────── */
.pending-list { display: flex; flex-direction: column; gap: 12px; }
.pending-card {
  background: white; border-radius: 14px; padding: 18px 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,.06); border-left: 4px solid #f59e0b;
  display: flex; flex-direction: column; gap: 12px;
}
.pending-card-left { display: flex; gap: 14px; align-items: flex-start; }
.emp-info { flex: 1; }
.emp-name { font-size: 0.97rem; font-weight: 700; color: #0f172a; margin: 0 0 3px; }
.emp-meta { font-size: 0.78rem; color: #64748b; margin: 0 0 6px; }
.emp-tags { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.emp-contact { display: inline-flex; align-items: center; gap: 4px; font-size: 0.75rem; color: #64748b; }
.emp-sub  { font-size: 0.75rem; color: #94a3b8; margin: 2px 0 0; }

.request-note {
  display: flex; align-items: flex-start; gap: 8px;
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
  padding: 10px 14px; font-size: 0.82rem; color: #475569; line-height: 1.5;
  font-style: italic;
}

.pending-actions { display: flex; gap: 10px; }
.btn-approve {
  display: flex; align-items: center; gap: 6px;
  padding: 9px 20px; background: #4CD964; color: white;
  border: none; border-radius: 9px; font-size: 0.84rem; font-weight: 600;
  cursor: pointer; transition: opacity .15s;
}
.btn-approve:hover:not(:disabled) { opacity: .85; }
.btn-approve:disabled { opacity: .5; cursor: default; }
.btn-reject {
  display: flex; align-items: center; gap: 6px;
  padding: 9px 20px; background: white; color: #ef4444;
  border: 1.5px solid #fecaca; border-radius: 9px; font-size: 0.84rem; font-weight: 600;
  cursor: pointer; transition: all .15s;
}
.btn-reject:hover:not(:disabled) { background: #fee2e2; border-color: #ef4444; }
.btn-reject:disabled { opacity: .5; cursor: default; }

/* ── Empty pending state ────────────────────────────────────── */
.empty-state {
  background: white; border-radius: 14px; padding: 56px 24px;
  text-align: center; box-shadow: 0 1px 4px rgba(0,0,0,.06);
}
.empty-icon  { font-size: 2.5rem; margin-bottom: 12px; }
.empty-title { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0 0 6px; }
.empty-sub   { font-size: 0.85rem; color: #94a3b8; margin: 0; }

/* ── Table ──────────────────────────────────────────────────── */
.table-card { background: white; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.06); }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.84rem; }
.data-table th {
  padding: 12px 18px; text-align: left; font-size: 0.7rem; font-weight: 600;
  color: #94a3b8; letter-spacing: .06em; text-transform: uppercase;
  border-bottom: 1px solid #f1f5f9;
}
.data-table td { padding: 14px 18px; border-bottom: 1px solid #f8fafc; vertical-align: middle; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td { background: #f8fafc; }

.td-employee { display: flex; align-items: center; gap: 12px; }
.emp-avatar  {
  width: 38px; height: 38px; border-radius: 50%;
  color: white; font-size: 0.75rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.td-fan  { font-family: monospace; font-size: 0.8rem; color: #94a3b8; letter-spacing: .04em; }
.td-dept { color: #64748b; font-size: 0.82rem; }
.td-date { color: #64748b; font-size: 0.82rem; }
.td-no-action { color: #cbd5e1; }
.td-contact { font-size: 0.8rem; }
.td-contact-val { display: flex; align-items: center; gap: 5px; color: #64748b; }

.mono { font-family: monospace; }

/* Package badges */
.pkg-badge   { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 600; }
.pkb-basic      { background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; }
.pkb-basic_plus { background: #d1fae5; color: #2EB84B; border: 1px solid #a7f3d0; }
.pkb-platinum   { background: #ede9fe; color: #2EB84B; border: 1px solid #B8F0C0; }

/* Registration status badges */
.reg-badge  { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 600; }
.reg-pending  { background: #fef9c3; color: #a16207; border: 1px solid #fde68a; }
.reg-approved { background: #d1fae5; color: #2EB84B; border: 1px solid #a7f3d0; }
.reg-rejected { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }

/* Action cell */
.action-cell { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.act-btn {
  padding: 4px 10px; border-radius: 6px; font-size: 0.72rem; font-weight: 600;
  border: none; cursor: pointer; transition: opacity .15s; white-space: nowrap;
}
.act-btn:hover:not(:disabled) { opacity: .8; }
.act-btn:disabled { opacity: .5; cursor: default; }
.act-approve { background: #d1fae5; color: #2EB84B; }
.act-approve:hover:not(:disabled) { background: #2EB84B; color: white; }
.act-reject  { background: #fee2e2; color: #dc2626; }
.act-reject:hover:not(:disabled)  { background: #dc2626; color: white; }
.act-ban     { background: #fef3c7; color: #b45309; }
.act-release { background: #d1fae5; color: #15803d; }

.ban-chip {
  margin-top: 5px; font-size: 0.72rem; color: #b45309;
  background: #fef9c3; border: 1px solid #fde68a;
  padding: 2px 8px; border-radius: 6px; display: inline-block;
}
.ban-reason { color: #92400e; }

/* ── Reject Modal ────────────────────────────────────────────── */
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(15,23,42,.45);
  display: flex; align-items: center; justify-content: center; z-index: 600; padding: 16px;
}
.modal {
  background: white; border-radius: 16px; width: 100%; max-width: 440px;
  box-shadow: 0 20px 60px rgba(0,0,0,.18);
}
.modal-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 20px 24px 0; gap: 12px;
}
.modal-title { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0; }
.modal-sub   { font-size: 0.84rem; color: #64748b; margin: 4px 0 0; }
.modal-close { flex-shrink: 0; background: none; border: none; color: #94a3b8; font-size: 1.1rem; cursor: pointer; padding: 0; }
.modal-body  { padding: 16px 24px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 0 24px 20px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 0.8rem; font-weight: 600; color: #374151; }
.field textarea {
  padding: 10px 12px; border: 1.5px solid #e2e8f0; border-radius: 8px;
  font-size: 0.87rem; font-family: inherit; resize: vertical; outline: none;
  transition: border-color .15s;
}
.field textarea:focus { border-color: #ef4444; box-shadow: 0 0 0 3px rgba(239,68,68,.08); }
.req { color: #ef4444; margin-left: 2px; }
.form-error { font-size: 0.8rem; color: #ef4444; margin: 6px 0 0; }
.btn-cancel {
  padding: 9px 18px; background: white; border: 1.5px solid #e2e8f0;
  border-radius: 8px; font-size: 0.84rem; font-weight: 600; color: #64748b; cursor: pointer;
}
.btn-cancel:hover { background: #f8fafc; }
.btn-reject-confirm {
  padding: 9px 18px; background: #ef4444; color: white;
  border: none; border-radius: 8px; font-size: 0.84rem; font-weight: 600; cursor: pointer;
}
.btn-reject-confirm:hover:not(:disabled) { background: #dc2626; }
.btn-reject-confirm:disabled { opacity: .55; cursor: not-allowed; }
.modal-enter-active { transition: all .2s cubic-bezier(.34,1.56,.64,1); }
.modal-leave-active { transition: all .15s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(.95); }

/* ── Ban Modal ───────────────────────────────────────────────── */
.ban-modal { max-width: 480px; }
.modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 0.78rem; font-weight: 600; color: #334155; }
.optional    { font-size: 0.72rem; color: #94a3b8; font-weight: 400; }
.duration-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
.dur-btn {
  padding: 7px 4px; border-radius: 8px; border: 1.5px solid #e2e8f0;
  background: #f8fafc; font-size: 0.78rem; font-weight: 600; color: #475569;
  cursor: pointer; transition: all .15s; font-family: inherit; text-align: center;
}
.dur-btn:hover    { border-color: #f59e0b; color: #b45309; }
.dur-btn.selected { border-color: #f59e0b; background: #fffbeb; color: #b45309; }
.custom-days-wrap { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
.days-label { font-size: 0.84rem; color: #64748b; }
.days-input {
  padding: 9px 12px; background: #f8fafc; border: 1.5px solid #e2e8f0;
  border-radius: 9px; font-size: 0.875rem; color: #0f172a; outline: none;
  transition: border-color .15s; width: 100%; box-sizing: border-box;
}
.days-input:focus { border-color: #f59e0b; background: white; }
.ban-textarea {
  padding: 9px 12px; background: #f8fafc; border: 1.5px solid #e2e8f0;
  border-radius: 9px; font-size: 0.875rem; color: #0f172a; outline: none;
  resize: vertical; font-family: inherit; transition: border-color .15s; width: 100%; box-sizing: border-box;
}
.ban-textarea:focus { border-color: #f59e0b; background: white; }
.banner-error {
  padding: 9px 14px; background: #fee2e2; border: 1px solid #fecaca;
  border-radius: 8px; color: #dc2626; font-size: 0.82rem;
}
.btn-ban-confirm {
  display: flex; align-items: center; gap: 7px;
  padding: 8px 20px; background: #f59e0b; border: none;
  border-radius: 9px; color: white; font-size: 0.875rem; font-weight: 600;
  cursor: pointer; transition: opacity .15s;
}
.btn-ban-confirm:disabled { opacity: .55; cursor: not-allowed; }
.btn-ban-confirm:not(:disabled):hover { opacity: .85; }
.spinner-sm {
  width: 13px; height: 13px;
  border: 2px solid rgba(255,255,255,0.4); border-top-color: white;
  border-radius: 50%; animation: spin .7s linear infinite; display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }
.fade-enter-active, .fade-leave-active { transition: opacity .2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ── Plan Selection Modal ────────────────────────────────────── */
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 500; padding: 16px;
}
.modal {
  background: white; border-radius: 18px; width: 100%; max-width: 640px;
  box-shadow: 0 24px 64px rgba(0,0,0,.18); display: flex; flex-direction: column;
  max-height: 90vh; overflow: hidden;
}
.modal-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 22px 24px 16px; border-bottom: 1px solid #f1f5f9;
}
.modal-title { font-size: 1.05rem; font-weight: 700; color: #0f172a; margin: 0 0 3px; }
.modal-sub   { font-size: 0.84rem; color: #64748b; margin: 0; }
.modal-sub strong { color: #0f172a; }
.modal-close {
  width: 28px; height: 28px; border-radius: 50%; border: none;
  background: #f1f5f9; color: #64748b; font-size: 0.75rem;
  cursor: pointer; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
}
.modal-close:hover { background: #e2e8f0; color: #0f172a; }

.plans-loading, .plans-empty {
  padding: 32px 24px; text-align: center; color: #94a3b8; font-size: 0.88rem;
}

.plan-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 12px; padding: 20px 24px; overflow-y: auto;
}
.plan-card {
  position: relative; background: #f8fafc; border: 2px solid #e2e8f0;
  border-radius: 14px; padding: 16px 14px 14px; text-align: left;
  cursor: pointer; transition: all .15s; display: flex; flex-direction: column; gap: 6px;
}
.plan-card:hover { border-color: #4CD964; background: #f0fdfa; }
.plan-card--selected { border-color: #4CD964; background: #f0fdfa; box-shadow: 0 0 0 3px rgba(20,184,166,.15); }
.plan-check {
  position: absolute; top: 10px; right: 10px;
  width: 20px; height: 20px; border-radius: 50%; background: #e2e8f0;
  display: flex; align-items: center; justify-content: center;
}
.plan-card--selected .plan-check { background: #4CD964; color: white; }
.plan-name  { font-size: 0.92rem; font-weight: 700; color: #0f172a; margin: 0; }
.plan-price { font-size: 0.82rem; font-weight: 600; color: #4CD964; margin: 0; }
.plan-price span { font-size: 0.72rem; color: #94a3b8; font-weight: 400; }
.plan-features { list-style: none; padding: 0; margin: 4px 0 0; display: flex; flex-direction: column; gap: 3px; }
.plan-features li { font-size: 0.73rem; color: #64748b; padding-left: 12px; position: relative; }
.plan-features li::before { content: '•'; position: absolute; left: 0; color: #4CD964; }

.modal-footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 16px 24px; border-top: 1px solid #f1f5f9;
}
.btn-cancel {
  padding: 9px 20px; background: white; color: #64748b;
  border: 1.5px solid #e2e8f0; border-radius: 9px; font-size: 0.84rem; font-weight: 500;
  cursor: pointer; transition: all .15s;
}
.btn-cancel:hover { background: #f8fafc; border-color: #cbd5e1; color: #0f172a; }
.btn-confirm {
  display: flex; align-items: center; gap: 6px;
  padding: 9px 22px; background: #4CD964; color: white;
  border: none; border-radius: 9px; font-size: 0.84rem; font-weight: 600;
  cursor: pointer; transition: opacity .15s;
}
.btn-confirm:hover:not(:disabled) { opacity: .85; }
.btn-confirm:disabled { opacity: .45; cursor: default; }

/* Modal transition */
.modal-enter-active { transition: all .22s cubic-bezier(.34,1.56,.64,1); }
.modal-leave-active { transition: all .18s ease; }
.modal-enter-from  { opacity: 0; transform: scale(.94); }
.modal-leave-to    { opacity: 0; transform: scale(.96); }

/* ── Toast ──────────────────────────────────────────────────── */
.toast {
  position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 10px;
  padding: 13px 22px; border-radius: 12px; font-size: 0.88rem; font-weight: 500;
  z-index: 999; box-shadow: 0 8px 28px rgba(0,0,0,.14); white-space: nowrap; pointer-events: none;
}
.toast-success { background: #0f172a; color: #fff; }
.toast-success svg { color: #4ade80; }
.toast-error   { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.toast-enter-active { transition: all .3s cubic-bezier(.34,1.56,.64,1); }
.toast-leave-active { transition: all .25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(12px); }

/* ── Approval modal extras ─────────────────────────────────── */
.modal-wide { max-width: 620px; }
.modal-steps {
  display: flex; align-items: center; gap: 0;
  padding: 0 24px 20px; margin-bottom: 4px;
}
.modal-step {
  display: flex; align-items: center; gap: 8px;
  font-size: 0.82rem; font-weight: 500; color: #94a3b8;
}
.modal-step.active { color: #4CD964; font-weight: 700; }
.modal-step.done   { color: #2EB84B; }
.step-num {
  width: 22px; height: 22px; border-radius: 50%;
  background: #f1f5f9; color: #64748b;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; font-weight: 700;
}
.modal-step.active .step-num { background: #4CD964; color: #fff; }
.modal-step.done   .step-num { background: #2EB84B; color: #fff; }
.step-line { flex: 1; height: 2px; background: #e2e8f0; margin: 0 12px; }

.payment-step { padding: 0 24px 8px; }
.payment-step-label { font-size: 0.88rem; color: #475569; margin: 0 0 16px; }
.payment-options { display: flex; flex-direction: column; gap: 12px; }
.payment-option {
  display: flex; align-items: flex-start; gap: 14px;
  padding: 16px; border: 2px solid #e2e8f0; border-radius: 12px;
  background: white; cursor: pointer; text-align: left;
  transition: border-color .15s, box-shadow .15s;
}
.payment-option:hover { border-color: #b8f0c0; }
.payment-option.selected { border-color: #4CD964; background: #EBFAEE; }
.pay-option-icon {
  width: 44px; height: 44px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.pay-option-icon.pay-now    { background: #EBFAEE; color: #2EB84B; }
.pay-option-icon.pay-later  { background: #fef3c7; color: #d97706; }
.pay-option-body { flex: 1; }
.pay-option-title { font-size: 0.92rem; font-weight: 700; color: #0f172a; margin: 0 0 4px; }
.pay-option-desc  { font-size: 0.8rem; color: #64748b; margin: 0; line-height: 1.5; }
.pay-option-check { color: #4CD964; flex-shrink: 0; margin-top: 2px; }

.reg-admin-pending { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
</style>
