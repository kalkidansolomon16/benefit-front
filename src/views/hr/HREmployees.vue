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
      <input v-model="search" class="search-input" placeholder="Search name or FAN number…" @input="debouncedLoad" />
      <button v-if="search" class="search-clear" @click="search = ''; load()">✕</button>
    </div>

    <div v-if="loading" class="state-msg">Loading employees…</div>

    <!-- Pending tab: approval cards -->
    <div v-else-if="activeTab === 'pending' && employees.length" class="pending-list">
      <div v-for="e in employees" :key="e.id" class="pending-card">
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
              <span v-if="e.email" class="emp-email">{{ e.email }}</span>
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
            <th>PACKAGE</th>
            <th>DEPARTMENT</th>
            <th>JOINED</th>
            <th>STATUS</th>
            <th v-if="activeTab === 'all'">ACTION</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in employees" :key="e.id">
            <td class="td-employee">
              <div class="emp-avatar" :style="{ background: avatarColor(e.name) }">{{ initials(e.name) }}</div>
              <div>
                <p class="emp-name">{{ e.name }}</p>
                <p class="emp-sub">{{ e.job_title || '—' }}</p>
              </div>
            </td>
            <td class="td-fan">{{ e.fan_number }}</td>
            <td><span class="pkg-badge" :class="'pkb-' + e.package">{{ tierLabel(e.package) }}</span></td>
            <td class="td-dept">{{ e.department || '—' }}</td>
            <td class="td-date">{{ e.enrolled_at }}</td>
            <td>
              <span class="reg-badge" :class="'reg-' + (e.registration_status ?? 'approved')">
                {{ regLabel(e.registration_status) }}
              </span>
            </td>
            <td v-if="activeTab === 'all'">
              <div class="row-actions" v-if="e.registration_status === 'pending'">
                <button class="act-approve" :disabled="acting === e.id" @click="approve(e)">Approve</button>
                <button class="act-reject"  :disabled="acting === e.id" @click="reject(e)">Reject</button>
              </div>
              <span v-else class="td-no-action">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Plan Selection Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="approvalModal.show" class="modal-backdrop" @click.self="approvalModal.show = false">
          <div class="modal">
            <div class="modal-header">
              <div>
                <p class="modal-title">Approve Employee</p>
                <p class="modal-sub">Select a membership plan for <strong>{{ approvalModal.employee?.name }}</strong></p>
              </div>
              <button class="modal-close" @click="approvalModal.show = false">✕</button>
            </div>

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

            <div class="modal-footer">
              <button class="btn-cancel" @click="approvalModal.show = false">Cancel</button>
              <button
                class="btn-confirm"
                :disabled="!approvalModal.selectedPlan || acting === approvalModal.employee?.id"
                @click="confirmApprove"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
                {{ acting === approvalModal.employee?.id ? 'Approving…' : 'Approve & Activate' }}
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
import { ref, reactive, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'

const api = useApi()

interface Emp {
  id: number; name: string; email: string; phone: string
  fan_number: string; package: string; status: string
  job_title: string; department: string; branch: string
  request_note: string; registration_status: string; enrolled_at: string
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

// Plan selection modal state
const plans       = ref<Plan[]>([])
const plansLoading = ref(false)
const approvalModal = reactive<{
  show: boolean
  employee: Emp | null
  selectedPlan: string
}>({ show: false, employee: null, selectedPlan: '' })

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
  load()
}

onMounted(load)

// ── Approve / Reject ──────────────────────────────────────────
async function approve(e: Emp) {
  // Fetch plans and open modal
  plansLoading.value = true
  approvalModal.employee     = e
  approvalModal.selectedPlan = ''
  approvalModal.show         = true

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
  if (!e || !approvalModal.selectedPlan) return

  acting.value = e.id
  try {
    await api.post(`hr/employees/${e.id}/approve`, { plan: approvalModal.selectedPlan })
    approvalModal.show = false
    showToast(`${e.name} approved and activated.`)
    await load()
  } catch {
    showToast('Failed to approve. Please try again.', 'error')
  } finally {
    acting.value = null
  }
}

async function reject(e: Emp) {
  if (!confirm(`Reject ${e.name}'s application?`)) return
  acting.value = e.id
  try {
    await api.post(`hr/employees/${e.id}/reject`)
    showToast(`${e.name}'s application rejected.`)
    await load()
  } catch {
    showToast('Failed to reject. Please try again.', 'error')
  } finally {
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
function regLabel(s: string) {
  return { pending: 'Pending', approved: 'Active', rejected: 'Rejected' }[s] ?? s
}
const COLORS = ['#3b82f6','#7c3aed','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899']
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
.emp-email { font-size: 0.75rem; color: #64748b; }
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
  padding: 9px 20px; background: #14b8a6; color: white;
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

.mono { font-family: monospace; }

/* Package badges */
.pkg-badge   { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 600; }
.pkb-basic      { background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; }
.pkb-basic_plus { background: #d1fae5; color: #059669; border: 1px solid #a7f3d0; }
.pkb-platinum   { background: #ede9fe; color: #7c3aed; border: 1px solid #ddd6fe; }

/* Registration status badges */
.reg-badge  { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 600; }
.reg-pending  { background: #fef9c3; color: #a16207; border: 1px solid #fde68a; }
.reg-approved { background: #d1fae5; color: #059669; border: 1px solid #a7f3d0; }
.reg-rejected { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }

/* Inline table approve/reject */
.row-actions { display: flex; gap: 6px; }
.act-approve {
  padding: 4px 12px; background: #d1fae5; color: #059669;
  border: none; border-radius: 6px; font-size: 0.72rem; font-weight: 600; cursor: pointer;
}
.act-approve:hover:not(:disabled) { background: #059669; color: white; }
.act-reject {
  padding: 4px 12px; background: #fee2e2; color: #dc2626;
  border: none; border-radius: 6px; font-size: 0.72rem; font-weight: 600; cursor: pointer;
}
.act-reject:hover:not(:disabled) { background: #dc2626; color: white; }
.act-approve:disabled, .act-reject:disabled { opacity: .5; cursor: default; }

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
.plan-card:hover { border-color: #14b8a6; background: #f0fdfa; }
.plan-card--selected { border-color: #14b8a6; background: #f0fdfa; box-shadow: 0 0 0 3px rgba(20,184,166,.15); }
.plan-check {
  position: absolute; top: 10px; right: 10px;
  width: 20px; height: 20px; border-radius: 50%; background: #e2e8f0;
  display: flex; align-items: center; justify-content: center;
}
.plan-card--selected .plan-check { background: #14b8a6; color: white; }
.plan-name  { font-size: 0.92rem; font-weight: 700; color: #0f172a; margin: 0; }
.plan-price { font-size: 0.82rem; font-weight: 600; color: #14b8a6; margin: 0; }
.plan-price span { font-size: 0.72rem; color: #94a3b8; font-weight: 400; }
.plan-features { list-style: none; padding: 0; margin: 4px 0 0; display: flex; flex-direction: column; gap: 3px; }
.plan-features li { font-size: 0.73rem; color: #64748b; padding-left: 12px; position: relative; }
.plan-features li::before { content: '•'; position: absolute; left: 0; color: #14b8a6; }

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
  padding: 9px 22px; background: #14b8a6; color: white;
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
</style>
