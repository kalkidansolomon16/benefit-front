<template>
  <div class="mv">

    <!-- Filters -->
    <div class="filters-row">
      <div class="search-wrap">
        <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input v-model="search" class="search-input" placeholder="Search member name or email…" @input="onSearch" />
        <button v-if="search" class="search-clear" @click="search = ''; loadMemberships()">✕</button>
      </div>
      <select v-model="filterStatus" class="filter-select" @change="() => loadMemberships()">
        <option value="">All statuses</option>
        <option value="active">Active</option>
        <option value="suspended">Suspended</option>
      </select>
      <select v-model="filterTier" class="filter-select" @change="() => loadMemberships()">
        <option value="">All plans</option>
        <option value="basic">Fit Basic</option>
        <option value="basic_plus">Fit Basic Plus</option>
        <option value="platinum">Fit Platinum</option>
      </select>
      <select v-model="filterGym" class="filter-select" @change="() => loadMemberships()">
        <option value="">All gyms</option>
        <option v-for="g in gyms" :key="g.id" :value="g.id">{{ g.name }}</option>
      </select>
    </div>

    <!-- Auto-enroll notice -->
    <div class="info-banner">
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="flex-shrink:0;margin-top:2px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <p>
        Memberships are <strong>assigned automatically</strong> when a company activates an employee.
        <strong>Basic</strong> employees access all Basic gyms &mdash;
        <strong>Basic+</strong> gets Basic &amp; Basic+ gyms &mdash;
        <strong>Platinum</strong> gets all gyms.
      </p>
    </div>

    <!-- Stat strip -->
    <div class="stat-strip">
      <div class="stat-tile">
        <p class="tile-lbl">Total</p>
        <p class="tile-val">{{ stats.total }}</p>
      </div>
      <div class="stat-tile">
        <p class="tile-lbl">Active</p>
        <p class="tile-val green">{{ stats.active }}</p>
      </div>
      <div class="stat-tile">
        <p class="tile-lbl">Suspended</p>
        <p class="tile-val amber">{{ stats.suspended }}</p>
      </div>
      <div class="stat-tile">
        <p class="tile-lbl">Expiring Soon</p>
        <p class="tile-val red">{{ stats.expiringSoon }}</p>
      </div>
    </div>

    <!-- Table card -->
    <div class="card">
      <div v-if="loading" class="state-center">
        <div class="spinner"></div>
        <p>Loading memberships…</p>
      </div>

      <div v-else-if="memberships.length === 0" class="state-center">
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.4"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
        <p>No memberships found for the selected filters.</p>
      </div>

      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Member</th>
              <th>FAN</th>
              <th>Gym</th>
              <th>Plan</th>
              <th>Start</th>
              <th>End</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(m, i) in memberships" :key="m.id">
              <td class="td-idx">{{ (currentPage - 1) * perPage + i + 1 }}</td>

              <td>
                <div class="member-cell">
                  <div class="av" :style="{ background: avatarColor(m.employee_name) }">{{ initials(m.employee_name) }}</div>
                  <div>
                    <p class="member-name">{{ m.employee_name }}</p>
                    <p class="member-co">{{ m.company_name }}</p>
                  </div>
                </div>
              </td>

              <td class="td-fan">{{ m.fan_number ?? '—' }}</td>

              <td>
                <p class="gym-name">{{ m.gym_name }}</p>
                <p class="gym-city">{{ m.gym_city }}</p>
              </td>

              <td>
                <span class="plan-badge" :class="'plan-' + m.plan_tier">{{ m.plan_name }}</span>
              </td>

              <td class="td-date">{{ fmtDate(m.start_date) }}</td>
              <td class="td-date" :class="{ 'td-expiring': isExpiringSoon(m.end_date) }">
                {{ fmtDate(m.end_date) }}
                <span v-if="isExpiringSoon(m.end_date)" class="expiry-warn">Soon</span>
              </td>

              <td>
                <span class="status-pill" :class="'st-' + m.status">{{ statusLabel(m.status) }}</span>
                <p v-if="m.status === 'suspended' && m.suspension_reason" class="susp-reason">{{ m.suspension_reason }}</p>
              </td>

              <td>
                <div class="action-cell">
                  <button v-if="m.status === 'active'"    class="act-btn act-suspend"   @click="openSuspend(m)">Suspend</button>
                  <button v-if="m.status === 'suspended'" class="act-btn act-reinstate" @click="reinstate(m)">Reinstate</button>
                  <button class="act-btn act-delete" @click="remove(m)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="totalPages > 1" class="pagination">
          <button class="page-btn" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
          <button class="page-btn" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Suspend Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="suspendModal.open" class="backdrop" @click.self="suspendModal.open = false">
          <div class="modal">
            <div class="modal-head">
              <div>
                <p class="modal-title">Suspend Membership</p>
                <p class="modal-sub">{{ suspendModal.membership?.employee_name }} &mdash; {{ suspendModal.membership?.gym_name }}</p>
              </div>
              <button class="modal-close" @click="suspendModal.open = false">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="field">
                <label class="field-label">Reason <span class="req">*</span></label>
                <textarea v-model="suspendModal.reason" class="field-textarea" rows="3" placeholder="e.g. Pending invoice, Policy violation…"></textarea>
              </div>
              <div v-if="suspendModal.error" class="banner-error">{{ suspendModal.error }}</div>
            </div>
            <div class="modal-foot">
              <button class="btn-cancel" @click="suspendModal.open = false">Cancel</button>
              <button class="btn-danger" :disabled="suspendModal.loading || !suspendModal.reason.trim()" @click="submitSuspend">
                <span v-if="suspendModal.loading" class="spinner-sm"></span>
                <span v-else>Confirm Suspend</span>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'

const api = useApi()

interface MembershipRow {
  id: number
  employee_name: string
  company_name: string
  fan_number: string | null
  gym_name: string
  gym_city: string | null
  plan_name: string
  plan_tier: string
  start_date: string
  end_date: string
  status: 'active' | 'suspended'
  suspension_reason: string | null
}

interface Gym { id: number; name: string; city: string | null }

const memberships = ref<MembershipRow[]>([])
const gyms        = ref<Gym[]>([])
const loading     = ref(true)

const search       = ref('')
const filterStatus = ref('')
const filterTier   = ref('')
const filterGym    = ref<number | ''>('')
const currentPage  = ref(1)
const totalPages   = ref(1)
const perPage      = 15

const stats = computed(() => ({
  total:        memberships.value.length,
  active:       memberships.value.filter(m => m.status === 'active').length,
  suspended:    memberships.value.filter(m => m.status === 'suspended').length,
  expiringSoon: memberships.value.filter(m => isExpiringSoon(m.end_date)).length,
}))

/* ── Toast ───────────────────────────────────────────────────── */
const toast = reactive({ show: false, type: 'success', message: '' })
let toastTimer: ReturnType<typeof setTimeout> | null = null
function showToast(msg: string, type: 'success' | 'error' = 'success') {
  if (toastTimer) clearTimeout(toastTimer)
  Object.assign(toast, { show: true, type, message: msg })
  toastTimer = setTimeout(() => { toast.show = false }, 4000)
}

/* ── Load ────────────────────────────────────────────────────── */
async function loadMemberships(page = 1) {
  loading.value     = true
  currentPage.value = page
  try {
    const params = new URLSearchParams({ page: String(page) })
    if (filterStatus.value) params.set('status',   filterStatus.value)
    if (filterTier.value)   params.set('gym_tier',  filterTier.value)
    if (filterGym.value)    params.set('gym_id',    String(filterGym.value))
    if (search.value)       params.set('search',    search.value)

    const res = await api.get<{ data: any[]; meta?: { last_page: number }; last_page?: number }>(
      `memberships?${params}`
    )
    totalPages.value = res.meta?.last_page ?? res.last_page ?? 1

    let rows: MembershipRow[] = (res.data ?? []).map((m: any) => ({
      id:               m.id,
      employee_name:    m.employee?.user?.name ?? 'Unknown',
      company_name:     m.employee?.company?.name ?? '',
      fan_number:       m.employee?.fan_number ?? null,
      gym_name:         m.gym?.name ?? '—',
      gym_city:         m.gym?.city ?? null,
      plan_name:        m.plan?.name ?? '—',
      plan_tier:        m.plan?.tier ?? 'basic',
      start_date:       m.start_date,
      end_date:         m.end_date,
      status:           m.status,
      suspension_reason: m.suspension_reason ?? null,
    }))

    if (search.value) {
      const q = search.value.toLowerCase()
      rows = rows.filter(m =>
        m.employee_name.toLowerCase().includes(q) ||
        (m.fan_number ?? '').toLowerCase().includes(q)
      )
    }

    memberships.value = rows
  } finally {
    loading.value = false
  }
}

async function loadGyms() {
  try {
    const res = await api.get<any>('gyms')
    const arr = Array.isArray(res) ? res : res.data ?? []
    gyms.value = arr.map((g: any) => ({ id: g.id, name: g.name, city: g.city ?? null }))
  } catch { /* non-fatal */ }
}

onMounted(() => { loadMemberships(); loadGyms() })

let searchTimer: ReturnType<typeof setTimeout> | null = null
function onSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadMemberships(1), 300)
}

function changePage(p: number) { loadMemberships(p) }

/* ── Suspend ─────────────────────────────────────────────────── */
const suspendModal = reactive({
  open: false, loading: false, error: '',
  membership: null as MembershipRow | null,
  reason: '',
})

function openSuspend(m: MembershipRow) {
  Object.assign(suspendModal, { open: true, loading: false, error: '', membership: m, reason: '' })
}

async function submitSuspend() {
  if (!suspendModal.membership || !suspendModal.reason.trim()) return
  suspendModal.loading = true
  suspendModal.error   = ''
  try {
    await api.post(`memberships/${suspendModal.membership.id}/suspend`, { reason: suspendModal.reason })
    const idx = memberships.value.findIndex(m => m.id === suspendModal.membership!.id)
    if (idx !== -1) {
      memberships.value[idx]!.status = 'suspended'
      memberships.value[idx]!.suspension_reason = suspendModal.reason
    }
    suspendModal.open = false
    showToast(`${suspendModal.membership.employee_name}'s membership suspended.`)
  } catch (e: unknown) {
    suspendModal.error = e instanceof Error ? e.message : 'Suspend failed.'
  } finally {
    suspendModal.loading = false
  }
}

/* ── Reinstate ───────────────────────────────────────────────── */
async function reinstate(m: MembershipRow) {
  try {
    await api.post(`memberships/${m.id}/reinstate`)
    m.status = 'active'
    m.suspension_reason = null
    showToast(`${m.employee_name}'s membership reinstated.`)
  } catch (e: unknown) {
    showToast(e instanceof Error ? e.message : 'Reinstate failed.', 'error')
  }
}

/* ── Delete ──────────────────────────────────────────────────── */
async function remove(m: MembershipRow) {
  if (!confirm(`Delete ${m.employee_name}'s membership at ${m.gym_name}?`)) return
  try {
    await api.delete(`memberships/${m.id}`)
    memberships.value = memberships.value.filter(x => x.id !== m.id)
    showToast('Membership deleted.')
  } catch (e: unknown) {
    showToast(e instanceof Error ? e.message : 'Delete failed.', 'error')
  }
}

/* ── Helpers ─────────────────────────────────────────────────── */
function fmtDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
function isExpiringSoon(end: string): boolean {
  const diff = (new Date(end).getTime() - Date.now()) / 86_400_000
  return diff >= 0 && diff <= 30
}
function statusLabel(s: string) {
  return { active: 'Active', suspended: 'Suspended' }[s] ?? s
}
const COLORS = ['#3b82f6','#2EB84B','#4CD964','#f59e0b','#ef4444','#06b6d4','#ec4899']
function avatarColor(name: string) {
  let h = 0; for (const c of (name ?? '')) h = (h * 31 + c.charCodeAt(0)) & 0xff
  return COLORS[h % COLORS.length]
}
function initials(name: string) {
  return (name ?? '').split(' ').filter(Boolean).map(w => w.charAt(0).toUpperCase()).slice(0, 2).join('')
}
</script>

<style scoped>
.mv { display: flex; flex-direction: column; gap: 16px; }

/* ── Filters ─────────────────────────────────────────────────────── */
.filters-row { display: flex; gap: 10px; flex-wrap: wrap; }
.search-wrap { position: relative; flex: 1; min-width: 220px; }
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }
.search-input {
  width: 100%; padding: 9px 34px; border: 1.5px solid #e2e8f0;
  border-radius: 9px; font-size: 0.87rem; color: #334155;
  background: #fff; outline: none; box-sizing: border-box;
}
.search-input:focus { border-color: #4CD964; }
.search-clear {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 0.75rem;
}
.search-clear:hover { color: #ef4444; }
.filter-select {
  padding: 9px 12px; border: 1.5px solid #e2e8f0; border-radius: 9px;
  font-size: 0.87rem; color: #334155; background: #fff;
  outline: none; min-width: 130px; cursor: pointer;
}
.filter-select:focus { border-color: #4CD964; }

/* ── Info banner ─────────────────────────────────────────────────── */
.info-banner {
  display: flex; align-items: flex-start; gap: 10px;
  background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px;
  padding: 12px 16px; color: #1e40af; font-size: 0.83rem; line-height: 1.6;
}
.info-banner p { margin: 0; }

/* ── Stat strip ──────────────────────────────────────────────────── */
.stat-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.stat-tile  { background: #fff; border-radius: 12px; padding: 16px 20px; box-shadow: 0 1px 4px rgba(0,0,0,.06); }
.tile-lbl   { font-size: 0.7rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: .06em; margin: 0 0 4px; }
.tile-val   { font-size: 1.9rem; font-weight: 800; margin: 0; color: #0f172a; }
.tile-val.green { color: #4CD964; }
.tile-val.amber { color: #f59e0b; }
.tile-val.red   { color: #ef4444; }

/* ── Card & table ────────────────────────────────────────────────── */
.card { background: #fff; border-radius: 14px; padding: 20px 24px; box-shadow: 0 1px 4px rgba(0,0,0,.06); }
.state-center {
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; padding: 48px 24px; color: #94a3b8; font-size: 0.88rem; text-align: center;
}
.spinner {
  width: 28px; height: 28px; border: 3px solid #e2e8f0; border-top-color: #4CD964;
  border-radius: 50%; animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.84rem; }
.data-table thead tr { border-bottom: 1.5px solid #f1f5f9; }
.data-table th {
  text-align: left; font-size: 0.7rem; font-weight: 600; color: #94a3b8;
  text-transform: uppercase; letter-spacing: .06em; padding: 0 12px 10px; white-space: nowrap;
}
.data-table td { padding: 12px; border-bottom: 1px solid #f8fafc; vertical-align: middle; }
.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover td { background: #f8fafc; }

.td-idx  { color: #94a3b8; font-size: 0.78rem; width: 36px; }
.td-fan  { font-family: 'Courier New', monospace; font-size: 0.78rem; color: #64748b; }
.td-date { font-size: 0.8rem; color: #64748b; white-space: nowrap; }
.td-expiring { color: #b45309 !important; }
.expiry-warn {
  display: inline-block; margin-left: 5px; font-size: 0.65rem; font-weight: 700;
  background: #fef3c7; color: #b45309; padding: 1px 6px; border-radius: 10px;
  border: 1px solid #fde68a;
}

.member-cell { display: flex; align-items: center; gap: 10px; }
.av {
  width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
  color: #fff; font-size: 0.72rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.member-name { font-size: 0.85rem; font-weight: 600; color: #0f172a; margin: 0 0 2px; }
.member-co   { font-size: 0.72rem; color: #94a3b8; margin: 0; }
.gym-name    { font-size: 0.84rem; font-weight: 600; color: #0f172a; margin: 0 0 2px; }
.gym-city    { font-size: 0.72rem; color: #94a3b8; margin: 0; }

.plan-badge { display: inline-block; padding: 3px 9px; border-radius: 20px; font-size: 0.72rem; font-weight: 600; }
.plan-basic      { background: #f1f5f9; color: #64748b;  border: 1px solid #e2e8f0; }
.plan-basic_plus { background: #d1fae5; color: #15803d;  border: 1px solid #a7f3d0; }
.plan-platinum   { background: #ede9fe; color: #6d28d9;  border: 1px solid #c4b5fd; }

.status-pill { display: inline-block; padding: 3px 9px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
.st-active    { background: #d1fae5; color: #15803d; border: 1px solid #a7f3d0; }
.st-suspended { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
.susp-reason  { font-size: 0.72rem; color: #94a3b8; margin: 3px 0 0; max-width: 160px; }

.action-cell { display: flex; gap: 6px; flex-wrap: wrap; }
.act-btn {
  padding: 4px 10px; border-radius: 6px; font-size: 0.72rem; font-weight: 600;
  border: none; cursor: pointer; transition: opacity .15s; white-space: nowrap;
}
.act-btn:hover { opacity: .8; }
.act-suspend   { background: #fef3c7; color: #b45309; }
.act-reinstate { background: #d1fae5; color: #15803d; }
.act-delete    { background: #fee2e2; color: #dc2626; }

/* ── Pagination ──────────────────────────────────────────────────── */
.pagination {
  display: flex; align-items: center; justify-content: center; gap: 12px;
  padding-top: 16px; border-top: 1px solid #f1f5f9; margin-top: 8px;
}
.page-btn {
  width: 30px; height: 30px; border-radius: 8px; border: 1.5px solid #e2e8f0;
  background: #fff; display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #64748b;
}
.page-btn:hover:not(:disabled) { border-color: #4CD964; color: #4CD964; }
.page-btn:disabled { opacity: .4; cursor: not-allowed; }
.page-info { font-size: 0.82rem; color: #64748b; }

/* ── Suspend modal ───────────────────────────────────────────────── */
.backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 500; padding: 16px;
}
.modal {
  background: #fff; border-radius: 18px; width: 100%; max-width: 460px;
  box-shadow: 0 24px 64px rgba(0,0,0,.18); display: flex; flex-direction: column;
}
.modal-head {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 22px 24px 14px; border-bottom: 1px solid #f1f5f9;
}
.modal-title { font-size: 1.05rem; font-weight: 700; color: #0f172a; margin: 0 0 3px; }
.modal-sub   { font-size: 0.82rem; color: #64748b; margin: 0; }
.modal-close {
  width: 28px; height: 28px; border-radius: 50%; border: none;
  background: #f1f5f9; color: #64748b; cursor: pointer;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.modal-close:hover { background: #e2e8f0; }
.modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
.modal-foot { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 24px; border-top: 1px solid #f1f5f9; }

.field { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 0.78rem; font-weight: 600; color: #334155; }
.req { color: #ef4444; }
.field-textarea {
  padding: 9px 12px; border: 1.5px solid #e2e8f0; border-radius: 9px;
  font-size: 0.875rem; color: #0f172a; background: #fff;
  outline: none; resize: vertical; font-family: inherit;
  width: 100%; box-sizing: border-box; transition: border-color .15s;
}
.field-textarea:focus { border-color: #4CD964; }
.banner-error {
  padding: 10px 14px; background: #fee2e2; border: 1px solid #fecaca;
  border-radius: 8px; color: #dc2626; font-size: 0.82rem;
}
.btn-cancel {
  padding: 9px 20px; background: #fff; color: #64748b;
  border: 1.5px solid #e2e8f0; border-radius: 9px; font-size: 0.84rem;
  cursor: pointer; transition: background .15s;
}
.btn-cancel:hover { background: #f8fafc; }
.btn-danger {
  display: flex; align-items: center; gap: 7px;
  padding: 9px 22px; background: #ef4444; color: #fff;
  border: none; border-radius: 9px; font-size: 0.875rem; font-weight: 600;
  cursor: pointer; transition: opacity .15s;
}
.btn-danger:hover:not(:disabled) { opacity: .88; }
.btn-danger:disabled { opacity: .45; cursor: not-allowed; }
.spinner-sm {
  width: 13px; height: 13px; border: 2px solid rgba(255,255,255,.4);
  border-top-color: #fff; border-radius: 50%;
  animation: spin .7s linear infinite; display: inline-block;
}

/* ── Toast ───────────────────────────────────────────────────────── */
.toast {
  position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 10px;
  padding: 13px 22px; border-radius: 12px; font-size: 0.88rem; font-weight: 500;
  z-index: 999; box-shadow: 0 8px 28px rgba(0,0,0,.14); white-space: nowrap; pointer-events: none;
}
.toast-success { background: #0f172a; color: #fff; }
.toast-success svg { color: #4ade80; }
.toast-error   { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }

/* ── Transitions ─────────────────────────────────────────────────── */
.modal-enter-active { transition: all .22s cubic-bezier(.34,1.56,.64,1); }
.modal-leave-active { transition: all .18s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(.94); }
.toast-enter-active { transition: all .3s cubic-bezier(.34,1.56,.64,1); }
.toast-leave-active { transition: all .25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(12px); }

@media (max-width: 700px) {
  .stat-strip { grid-template-columns: repeat(2, 1fr); }
}
</style>
