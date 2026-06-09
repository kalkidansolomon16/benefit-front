<template>
  <div class="page">

    <!-- Search -->
    <div class="search-row">
      <div class="search-wrap">
        <svg class="search-icon" width="15" height="15" fill="none" stroke="#94a3b8" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input v-model="search" class="search-input" placeholder="Search by name or email…" @input="debouncedLoad" />
        <button v-if="search" class="search-clear" @click="search = ''; load()">✕</button>
      </div>
      <span class="count-label">{{ employees.length }} pending</span>
    </div>

    <div v-if="loading" class="state-msg">Loading pending approvals…</div>

    <div v-else-if="!employees.length" class="empty-state">
      <div class="empty-icon">✅</div>
      <p class="empty-title">No employees pending approval</p>
      <p class="empty-sub">All HR-approved employees have been reviewed.</p>
    </div>

    <!-- Approval cards -->
    <div v-else class="approval-list">
      <div v-for="e in employees" :key="e.id" class="approval-card">
        <!-- Left: info -->
        <div class="card-left">
          <div class="emp-avatar" :style="{ background: avatarColor(e.name ?? '') }">{{ initials(e.name ?? '') }}</div>
          <div class="emp-info">
            <p class="emp-name">{{ e.name }}</p>
            <p class="emp-meta">{{ e.email }} · FAN: <span class="mono">{{ e.fan_number }}</span></p>
            <p class="emp-company">
              <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              {{ e.company }}
            </p>
          </div>
        </div>

        <!-- Middle: payment info -->
        <div class="card-middle">
          <div class="info-row">
            <span class="info-label">Plan</span>
            <span class="pkg-badge" :class="'pkb-' + e.level">{{ levelLabel(e.level) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Payment Request</span>
            <span class="pref-badge" :class="e.payment_preference === 'pay_now' ? 'pref-now' : 'pref-later'">
              {{ e.payment_preference === 'pay_now' ? '💳 Pay Now' : '⏰ Pay Later' }}
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">Payment Status</span>
            <span class="pay-status" :class="e.payment_status === 'paid' ? 'paid' : 'unpaid'">
              {{ e.payment_status === 'paid' ? 'Paid' : 'Unpaid' }}
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">Registered</span>
            <span class="info-val">{{ e.created_at }}</span>
          </div>
        </div>

        <!-- Right: action -->
        <div class="card-actions">
          <div class="payment-toggle-label">Mark payment as:</div>
          <div class="payment-toggle">
            <button
              class="tog-btn" :class="{ active: paymentMark[e.id] === 'paid' }"
              @click="paymentMark[e.id] = 'paid'"
            >Paid</button>
            <button
              class="tog-btn" :class="{ active: paymentMark[e.id] !== 'paid' }"
              @click="paymentMark[e.id] = 'unpaid'"
            >Unpaid</button>
          </div>
          <button class="btn-approve" :disabled="acting === e.id" @click="adminApprove(e)">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
            {{ acting === e.id ? 'Approving…' : 'Approve & Activate' }}
          </button>
          <button class="btn-reject" :disabled="acting === e.id" @click="adminReject(e)">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
            Reject
          </button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <Teleport to="body">
      <Transition name="toast">
        <div v-if="toast.show" class="toast" :class="'toast-' + toast.type">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path v-if="toast.type==='success'" d="M5 13l4 4L19 7"/>
            <path v-else d="M18 6L6 18M6 6l12 12"/>
          </svg>
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

interface PendingEmployee {
  id: number
  name: string | null
  email: string | null
  fan_number: string
  company: string | null
  company_id: number
  level: string
  payment_preference: 'pay_now' | 'pay_later' | null
  payment_status: string
  admin_approval_status: string | null
  created_at: string
}

const employees  = ref<PendingEmployee[]>([])
const loading    = ref(true)
const acting     = ref<number | null>(null)
const search     = ref('')
const paymentMark = reactive<Record<number, 'paid' | 'unpaid'>>({})

const toast = reactive({ show: false, type: 'success', message: '' })
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(message: string, type: 'success' | 'error' = 'success') {
  if (toastTimer) clearTimeout(toastTimer)
  Object.assign(toast, { show: true, type, message })
  toastTimer = setTimeout(() => { toast.show = false }, 4000)
}

let searchTimer: ReturnType<typeof setTimeout> | null = null
function debouncedLoad() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(load, 300)
}

async function load() {
  loading.value = true
  try {
    const qs = search.value ? `?search=${encodeURIComponent(search.value)}` : ''
    const res = await api.get<{ data: PendingEmployee[] }>(`employees/pending-admin-approval${qs}`)
    employees.value = res.data
    // Default all to 'paid' when pay_now, 'unpaid' when pay_later
    for (const e of res.data) {
      if (!(e.id in paymentMark)) {
        paymentMark[e.id] = e.payment_preference === 'pay_now' ? 'paid' : 'unpaid'
      }
    }
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function adminApprove(e: PendingEmployee) {
  acting.value = e.id
  try {
    await api.post(`employees/${e.id}/admin-approve`, {
      payment_status: paymentMark[e.id] ?? 'unpaid',
    })
    showToast(`${e.name} approved. Account is now active.`)
    employees.value = employees.value.filter(emp => emp.id !== e.id)
  } catch (err: unknown) {
    showToast(err instanceof Error ? err.message : 'Approval failed.', 'error')
  } finally {
    acting.value = null
  }
}

async function adminReject(e: PendingEmployee) {
  if (!confirm(`Reject ${e.name}'s account activation?`)) return
  acting.value = e.id
  try {
    await api.post(`employees/${e.id}/admin-reject`)
    showToast(`${e.name} rejected.`)
    employees.value = employees.value.filter(emp => emp.id !== e.id)
  } catch {
    showToast('Rejection failed.', 'error')
  } finally {
    acting.value = null
  }
}

function levelLabel(level: string) {
  return { chief: 'Platinum', director: 'Basic Plus', manager: 'Basic', staff: 'Basic' }[level] ?? level
}

const COLORS = ['#3b82f6', '#2EB84B', '#4CD964', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']
function avatarColor(name: string) {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xff
  return COLORS[h % COLORS.length]!
}
function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('')
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }

.search-row { display: flex; align-items: center; gap: 12px; }
.search-wrap {
  position: relative; flex: 1;
}
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; }
.search-input {
  width: 100%; padding: 9px 36px 9px 36px; background: white;
  border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 0.85rem; outline: none;
}
.search-input:focus { border-color: #4CD964; box-shadow: 0 0 0 3px rgba(76,217,100,0.1); }
.search-clear {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 0.9rem;
}
.count-label { font-size: 0.82rem; color: #64748b; white-space: nowrap; }

.state-msg { text-align: center; color: #94a3b8; padding: 48px; background: white; border-radius: 14px; }
.empty-state { text-align: center; padding: 60px 20px; background: white; border-radius: 14px; }
.empty-icon  { font-size: 2.5rem; margin-bottom: 12px; }
.empty-title { font-size: 1.1rem; font-weight: 600; color: #0f172a; margin: 0 0 6px; }
.empty-sub   { font-size: 0.88rem; color: #64748b; margin: 0; }

/* Cards */
.approval-list { display: flex; flex-direction: column; gap: 12px; }
.approval-card {
  display: flex; align-items: flex-start; gap: 20px;
  background: white; border-radius: 14px; padding: 20px 24px;
  border: 1.5px solid #e2e8f0; transition: box-shadow .15s;
}
.approval-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.07); }

.card-left { display: flex; align-items: flex-start; gap: 12px; flex: 1; min-width: 0; }
.emp-avatar {
  width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.85rem; font-weight: 700; color: #fff;
}
.emp-info  { min-width: 0; }
.emp-name  { font-size: 0.95rem; font-weight: 700; color: #0f172a; margin: 0 0 3px; }
.emp-meta  { font-size: 0.78rem; color: #64748b; margin: 0 0 4px; }
.mono      { font-family: monospace; font-size: 0.82rem; color: #475569; }
.emp-company {
  display: flex; align-items: center; gap: 4px;
  font-size: 0.78rem; color: #64748b; margin: 0;
}

/* Middle info */
.card-middle { display: flex; flex-direction: column; gap: 8px; min-width: 200px; }
.info-row    { display: flex; align-items: center; gap: 8px; }
.info-label  { font-size: 0.72rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; width: 110px; flex-shrink: 0; }
.info-val    { font-size: 0.82rem; color: #475569; }

.pkg-badge   { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; }
.pkb-chief   { background: rgba(168,85,247,0.12); color: #7c3aed; }
.pkb-director { background: rgba(59,130,246,0.12); color: #1d4ed8; }
.pkb-manager,.pkb-staff { background: rgba(100,116,139,0.12); color: #475569; }

.pref-badge  { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 20px; font-size: 0.78rem; font-weight: 600; }
.pref-now    { background: #EBFAEE; color: #2EB84B; }
.pref-later  { background: #fef3c7; color: #d97706; }

.pay-status  { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
.pay-status.paid   { background: #dcfce7; color: #16a34a; }
.pay-status.unpaid { background: #fee2e2; color: #dc2626; }

/* Actions */
.card-actions { display: flex; flex-direction: column; gap: 8px; min-width: 170px; }
.payment-toggle-label { font-size: 0.72rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
.payment-toggle { display: flex; border: 1.5px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
.tog-btn {
  flex: 1; padding: 6px 0; font-size: 0.8rem; font-weight: 600;
  background: white; border: none; cursor: pointer; color: #64748b;
  transition: background .15s, color .15s;
}
.tog-btn.active { background: #4CD964; color: #fff; }

.btn-approve {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 9px 14px; background: #4CD964; color: #fff;
  border: none; border-radius: 8px; font-size: 0.84rem; font-weight: 600; cursor: pointer;
  transition: background .15s;
}
.btn-approve:hover:not(:disabled) { background: #2EB84B; }
.btn-approve:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-reject {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 9px 14px; background: white; color: #ef4444;
  border: 1.5px solid #fecaca; border-radius: 8px; font-size: 0.84rem; font-weight: 600; cursor: pointer;
  transition: background .15s, border-color .15s;
}
.btn-reject:hover:not(:disabled) { background: #fef2f2; border-color: #ef4444; }
.btn-reject:disabled { opacity: 0.5; cursor: not-allowed; }

/* Toast */
.toast {
  position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 8px;
  padding: 13px 22px; border-radius: 12px; font-size: 0.88rem; font-weight: 500;
  z-index: 999; box-shadow: 0 8px 28px rgba(0,0,0,.14); white-space: nowrap;
}
.toast-success { background: #0f172a; color: #fff; }
.toast-error   { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.toast-enter-active { transition: all .3s cubic-bezier(.34,1.56,.64,1); }
.toast-leave-active { transition: all .25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(12px); }

@media (max-width: 900px) {
  .approval-card { flex-direction: column; }
  .card-middle { min-width: 0; width: 100%; }
  .card-actions { min-width: 0; width: 100%; flex-direction: row; flex-wrap: wrap; align-items: center; }
  .payment-toggle-label { width: 100%; }
  .payment-toggle { width: 120px; }
}
</style>
