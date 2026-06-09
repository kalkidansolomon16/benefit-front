<template>
  <div class="page">

    <div class="page-actions">
      <p class="count-label">{{ meta?.total ?? employees.length }} total</p>
      <button class="btn-export" @click="exportCsv">↓ Export CSV</button>
    </div>

    <!-- Search + filters -->
    <div class="filter-bar">
      <input v-model="search" class="search-box" placeholder="Search name, FAN, email or phone…" />
      <select v-model="filterTier" class="select-box">
        <option value="">All packages</option>
        <option value="basic">Basic</option>
        <option value="basic_plus">Basic Plus</option>
        <option value="platinum">Platinum</option>
      </select>
      <select v-model="filterStatus" class="select-box">
        <option value="">All status</option>
        <option value="active">Account Active</option>
        <option value="inactive">Account Inactive</option>
        <option value="pending_admin">Pending Admin</option>
      </select>
      <select v-model="filterPayment" class="select-box">
        <option value="">All payments</option>
        <option value="paid">Paid</option>
        <option value="unpaid">Unpaid</option>
      </select>
    </div>

    <div v-if="loading" class="state-msg">Loading employees…</div>
    <div v-else-if="!filtered.length" class="state-msg">No employees found.</div>

    <!-- Table -->
    <div v-else class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>NAME</th>
            <th>COMPANY</th>
            <th>FAN NUMBER</th>
            <th>EMAIL</th>
            <th>PACKAGE</th>
            <th>ACCOUNT</th>
            <th>PAYMENT</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in filtered" :key="e.id">
            <td class="td-name">{{ e.user?.name ?? '—' }}</td>
            <td class="td-muted">{{ e.company?.name ?? '—' }}</td>
            <td class="td-fan">{{ e.fan_number ?? '—' }}</td>
            <td class="td-email">{{ e.user?.email ?? '—' }}</td>
            <td>
              <span class="pkg-badge" :class="'pkg-' + (e.company?.tier ?? 'basic')">
                {{ tierLabel(e.company?.tier) }}
              </span>
            </td>
            <!-- Account / approval status -->
            <td>
              <span class="status-badge" :class="accountStatusClass(e)">
                {{ accountStatusLabel(e) }}
              </span>
            </td>
            <td>
              <span class="pay-badge" :class="e.payment_status === 'paid' ? 'pay-paid' : 'pay-unpaid'">
                {{ e.payment_status === 'paid' ? 'Paid' : 'Unpaid' }}
              </span>
            </td>
            <td>
              <div class="action-cell">
                <!-- Activate / Deactivate toggle -->
                <button
                  class="act-btn"
                  :class="e.user_is_active ? 'act-deactivate' : 'act-activate'"
                  :disabled="toggling === e.id"
                  @click="toggleActive(e)"
                >
                  <span v-if="toggling === e.id">…</span>
                  <span v-else>{{ e.user_is_active ? 'Deactivate' : 'Activate' }}</span>
                </button>
                <button
                  v-if="e.is_enrolled && e.active_membership_id"
                  class="act-btn act-suspend"
                  @click="suspendMembership(e)"
                >Suspend</button>
                <button
                  v-if="!e.is_banned"
                  class="act-btn act-ban"
                  @click="openBan(e)"
                >Ban</button>
                <button
                  v-else
                  class="act-btn act-release"
                  @click="doUnban(e)"
                >Release</button>
              </div>
              <!-- Ban chip -->
              <div v-if="e.is_banned" class="ban-chip">
                Banned until {{ formatDate(e.banned_until) }}
                <span v-if="e.ban_reason" class="ban-reason"> — {{ e.ban_reason }}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Ban modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="banModal.open" class="modal-backdrop" @click.self="banModal.open = false">
          <div class="modal-panel">
            <div class="modal-header">
              <h2 class="modal-title">Ban Employee</h2>
              <button class="modal-close" @click="banModal.open = false">✕</button>
            </div>
            <div class="modal-body">
              <p class="modal-sub">
                Banning <strong>{{ banModal.employee?.user?.name }}</strong> will prevent them from checking in to any gym during the ban period.
              </p>

              <div class="field">
                <label class="field-label">Ban Duration</label>
                <div class="duration-grid">
                  <button
                    v-for="d in durationOptions"
                    :key="d.days"
                    type="button"
                    class="dur-btn"
                    :class="{ selected: banModal.days === d.days && !banModal.custom }"
                    @click="banModal.days = d.days; banModal.custom = false"
                  >{{ d.label }}</button>
                  <button
                    type="button"
                    class="dur-btn"
                    :class="{ selected: banModal.custom }"
                    @click="banModal.custom = true"
                  >Custom</button>
                </div>
                <div v-if="banModal.custom" class="custom-days-wrap">
                  <input
                    v-model.number="banModal.days"
                    type="number"
                    min="1"
                    max="365"
                    class="input"
                    placeholder="Number of days"
                  />
                  <span class="days-label">days</span>
                </div>
              </div>

              <div class="field">
                <label class="field-label">Reason <span class="optional">(optional)</span></label>
                <textarea
                  v-model="banModal.reason"
                  class="textarea"
                  rows="3"
                  placeholder="e.g. Misuse of gym access, Policy violation…"
                ></textarea>
              </div>

              <div v-if="banModal.error" class="banner-error">{{ banModal.error }}</div>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" @click="banModal.open = false">Cancel</button>
              <button class="btn-ban" :disabled="banModal.loading || !banModal.days" @click="confirmBan">
                <span v-if="banModal.loading" class="spinner-sm"></span>
                <span v-else>Confirm Ban</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Pagination -->
    <div v-if="meta && meta.last_page > 1" class="pagination">
      <button :disabled="page <= 1"             @click="page--; load()" class="pg-btn">‹ Prev</button>
      <span class="pg-info">{{ page }} / {{ meta.last_page }}</span>
      <button :disabled="page >= meta.last_page" @click="page++; load()" class="pg-btn">Next ›</button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useApi } from '@/composables/useApi'

const api = useApi()

interface Employee {
  id: number
  fan_number: string | null
  is_enrolled: boolean
  payment_status: 'paid' | 'unpaid'
  registration_status: string | null
  admin_approval_status: string | null
  payment_preference: string | null
  user_is_active: boolean
  active_membership_id: number | null
  is_banned: boolean
  banned_until: string | null
  ban_reason: string | null
  user?:    { name: string; email: string; phone: string | null }
  company?: { name: string; tier: string }
}
interface Meta { current_page: number; last_page: number; total: number }

const employees   = ref<Employee[]>([])
const loading     = ref(true)
const toggling    = ref<number | null>(null)
const search      = ref('')
const filterTier  = ref('')
const filterStatus  = ref('')
const filterPayment = ref('')
const page          = ref(1)
const meta        = ref<Meta | null>(null)

async function load() {
  loading.value = true
  try {
    const res = await api.get<{ data: Employee[]; meta: Meta }>(`employees?page=${page.value}&per_page=20`)
    employees.value = res.data ?? []
    meta.value      = res.meta ?? null
  } finally {
    loading.value = false
  }
}

onMounted(load)

const filtered = computed(() =>
  employees.value.filter(e => {
    const q = search.value.toLowerCase()
    if (q) {
      const name  = e.user?.name?.toLowerCase() ?? ''
      const fan   = e.fan_number?.toLowerCase() ?? ''
      const email = e.user?.email?.toLowerCase() ?? ''
      const phone = e.user?.phone?.toLowerCase() ?? ''
      if (!name.includes(q) && !fan.includes(q) && !email.includes(q) && !phone.includes(q)) return false
    }
    if (filterTier.value && e.company?.tier !== filterTier.value) return false
    if (filterStatus.value === 'active'        &&  !e.user_is_active) return false
    if (filterStatus.value === 'inactive'      &&   e.user_is_active) return false
    if (filterStatus.value === 'pending_admin' && e.admin_approval_status !== 'pending') return false
    if (filterPayment.value && e.payment_status !== filterPayment.value) return false
    return true
  })
)

function tierLabel(t?: string) {
  return { basic: 'Basic', basic_plus: 'Basic Plus', platinum: 'Platinum' }[t ?? ''] ?? 'Basic'
}

async function suspendMembership(e: Employee) {
  if (!e.active_membership_id) return
  try {
    await api.post(`memberships/${e.active_membership_id}/suspend`)
    e.is_enrolled = false
    e.active_membership_id = null
  } catch (err: unknown) {
    alert((err as Error).message)
  }
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const durationOptions = [
  { days: 1,  label: '1 Day' },
  { days: 3,  label: '3 Days' },
  { days: 7,  label: '1 Week' },
  { days: 30, label: '1 Month' },
]

const banModal = reactive({
  open: false,
  loading: false,
  error: '',
  custom: false,
  days: 7,
  reason: '',
  employee: null as Employee | null,
})

function openBan(e: Employee) {
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
    const updated = await api.post<{ employee: Employee }>(
      `employees/${banModal.employee.id}/ban`,
      { days: banModal.days, ban_reason: banModal.reason || null }
    )
    const idx = employees.value.findIndex(e => e.id === banModal.employee!.id)
    if (idx !== -1) employees.value[idx] = updated.employee
    banModal.open = false
  } catch (err: unknown) {
    banModal.error = err instanceof Error ? err.message : 'Ban failed.'
  } finally {
    banModal.loading = false
  }
}

async function doUnban(e: Employee) {
  try {
    const updated = await api.post<{ employee: Employee }>(`employees/${e.id}/unban`)
    const idx = employees.value.findIndex(emp => emp.id === e.id)
    if (idx !== -1) employees.value[idx] = updated.employee
  } catch (err: unknown) {
    alert(err instanceof Error ? err.message : 'Unban failed.')
  }
}

async function toggleActive(e: Employee) {
  const action = e.user_is_active ? 'deactivate' : 'activate'
  if (!confirm(`${e.user_is_active ? 'Deactivate' : 'Activate'} account for ${e.user?.name ?? 'this employee'}?`)) return
  toggling.value = e.id
  try {
    const res = await api.post<{ employee: Employee }>(`employees/${e.id}/toggle-active`)
    const idx = employees.value.findIndex(emp => emp.id === e.id)
    if (idx !== -1) employees.value[idx] = res.employee
  } catch (err: unknown) {
    alert(err instanceof Error ? err.message : `Failed to ${action} account.`)
  } finally {
    toggling.value = null
  }
}

// ── Account status helpers ────────────────────────────────────
function accountStatusLabel(e: Employee): string {
  if (e.admin_approval_status === 'pending') return 'Pending Admin'
  if (e.admin_approval_status === 'rejected') return 'Admin Rejected'
  if (!e.user_is_active) return 'Inactive'
  return 'Active'
}

function accountStatusClass(e: Employee): string {
  if (e.admin_approval_status === 'pending')  return 'status-pending'
  if (e.admin_approval_status === 'rejected') return 'status-rejected'
  if (!e.user_is_active) return 'not'
  return 'enrolled'
}

function exportCsv() {
  const rows = [
    ['Name', 'Email', 'Phone', 'Company', 'FAN Number', 'Package', 'Status', 'Payment'],
    ...employees.value.map(e => [
      e.user?.name ?? '', e.user?.email ?? '', e.user?.phone ?? '',
      e.company?.name ?? '', e.fan_number ?? '', tierLabel(e.company?.tier),
      e.is_enrolled ? 'Active' : 'Inactive',
      e.payment_status === 'paid' ? 'Paid' : 'Unpaid',
    ]),
  ]
  const csv  = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const a    = document.createElement('a')
  a.href     = URL.createObjectURL(blob)
  a.download = `employees_${new Date().toISOString().slice(0,10)}.csv`
  a.click()
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }

.page-actions { display: flex; align-items: center; justify-content: space-between; }
.count-label  { font-size: 0.85rem; color: #94a3b8; margin: 0; }
.btn-export   {
  padding: 9px 18px; background: #4CD964; color: white;
  border: none; border-radius: 10px; font-size: 0.84rem; font-weight: 600;
  cursor: pointer; transition: opacity .15s;
}
.btn-export:hover { opacity: .85; }

.filter-bar { display: flex; gap: 10px; flex-wrap: wrap; }
.search-box {
  flex: 1; min-width: 280px; padding: 9px 14px;
  background: white; border: 1px solid #e2e8f0; border-radius: 10px;
  font-size: 0.875rem; color: #0f172a; outline: none;
}
.search-box:focus { border-color: #4CD964; box-shadow: 0 0 0 3px rgba(76,217,100,0.1); }
.select-box {
  padding: 8px 12px; background: white; border: 1px solid #e2e8f0;
  border-radius: 10px; color: #64748b; font-size: 0.82rem; outline: none; cursor: pointer;
}
.select-box:focus { border-color: #4CD964; }

.state-msg { text-align: center; color: #94a3b8; padding: 48px; background: white; border-radius: 14px; }

.table-card { background: white; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }

.data-table { width: 100%; border-collapse: collapse; font-size: 0.84rem; }
.data-table th {
  padding: 12px 16px; text-align: left; font-size: 0.7rem; font-weight: 600;
  color: #94a3b8; letter-spacing: 0.06em; text-transform: uppercase;
  border-bottom: 1px solid #f1f5f9; background: white;
}
.data-table td { padding: 14px 16px; border-bottom: 1px solid #f8fafc; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td { background: #f8fafc; }

.td-name  { font-weight: 600; color: #0f172a; }
.td-muted { color: #64748b; }
.td-fan   { font-family: monospace; font-size: 0.8rem; color: #94a3b8; letter-spacing: 0.03em; }
.td-email { font-size: 0.8rem; color: #475569; }
.td-phone { font-size: 0.82rem; color: #475569; white-space: nowrap; }

.pkg-badge {
  display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 600;
}
.pkg-basic      { background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; }
.pkg-basic_plus { background: #d1fae5; color: #2EB84B; border: 1px solid #a7f3d0; }
.pkg-platinum   { background: #ede9fe; color: #2EB84B; border: 1px solid #B8F0C0; }

.status-badge {
  display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 600;
}
.status-badge.enrolled        { background: #d1fae5; color: #2EB84B;  border: 1px solid #a7f3d0; }
.status-badge.not             { background: #fee2e2; color: #dc2626;  border: 1px solid #fecaca; }
.status-badge.status-pending  { background: #fef3c7; color: #d97706;  border: 1px solid #fde68a; }
.status-badge.status-rejected { background: #fee2e2; color: #dc2626;  border: 1px solid #fecaca; }

.pay-badge   { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 600; }
.pay-paid    { background: #d1fae5; color: #2EB84B; border: 1px solid #a7f3d0; }
.pay-unpaid  { background: #fef9c3; color: #a16207; border: 1px solid #fde68a; }

.action-cell { display: flex; gap: 6px; flex-wrap: wrap; }
.act-btn {
  padding: 4px 10px; border-radius: 6px; font-size: 0.74rem; font-weight: 600;
  border: none; cursor: pointer; transition: opacity .15s; white-space: nowrap;
}
.act-btn:hover { opacity: .8; }
.act-activate   { background: #d1fae5; color: #15803d; }
.act-deactivate { background: #fef3c7; color: #b45309; }
.act-suspend    { background: #fee2e2; color: #dc2626; }
.act-ban        { background: #fee2e2; color: #dc2626; }
.act-release    { background: #d1fae5; color: #15803d; }
.act-btn:disabled { opacity: .5; cursor: not-allowed; }

.ban-chip {
  margin-top: 5px; font-size: 0.72rem; color: #b45309;
  background: #fef9c3; border: 1px solid #fde68a;
  padding: 2px 8px; border-radius: 6px; display: inline-block;
}
.ban-reason { color: #92400e; }

/* Modal */
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  z-index: 200; padding: 16px;
}
.modal-panel {
  background: white; border-radius: 16px; width: 100%; max-width: 480px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2); overflow: hidden;
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 22px; border-bottom: 1px solid #f1f5f9;
}
.modal-title { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0; }
.modal-close {
  width: 30px; height: 30px; border-radius: 8px; background: #f1f5f9;
  border: none; cursor: pointer; color: #64748b; font-size: 0.9rem;
  display: flex; align-items: center; justify-content: center;
}
.modal-close:hover { background: #e2e8f0; }
.modal-body { padding: 20px 22px; display: flex; flex-direction: column; gap: 16px; }
.modal-sub  { font-size: 0.86rem; color: #64748b; margin: 0; line-height: 1.5; }
.modal-footer {
  display: flex; gap: 10px; justify-content: flex-end;
  padding: 14px 22px; border-top: 1px solid #f1f5f9;
}

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

.custom-days-wrap {
  display: flex; align-items: center; gap: 8px; margin-top: 8px;
}
.days-label { font-size: 0.84rem; color: #64748b; }
.input {
  padding: 9px 12px; background: #f8fafc; border: 1.5px solid #e2e8f0;
  border-radius: 9px; font-size: 0.875rem; color: #0f172a; outline: none;
  transition: border-color .15s; width: 100%; box-sizing: border-box;
}
.input:focus { border-color: #f59e0b; background: white; }

.textarea {
  padding: 9px 12px; background: #f8fafc; border: 1.5px solid #e2e8f0;
  border-radius: 9px; font-size: 0.875rem; color: #0f172a; outline: none;
  resize: vertical; font-family: inherit; transition: border-color .15s;
}
.textarea:focus { border-color: #f59e0b; background: white; }

.banner-error {
  padding: 9px 14px; background: #fee2e2; border: 1px solid #fecaca;
  border-radius: 8px; color: #dc2626; font-size: 0.82rem;
}

.btn-cancel {
  padding: 8px 18px; background: white; border: 1.5px solid #e2e8f0;
  border-radius: 9px; color: #64748b; font-size: 0.875rem; font-weight: 500; cursor: pointer;
}
.btn-cancel:hover { border-color: #94a3b8; }
.btn-ban {
  display: flex; align-items: center; gap: 7px;
  padding: 8px 20px; background: #f59e0b; border: none;
  border-radius: 9px; color: white; font-size: 0.875rem; font-weight: 600;
  cursor: pointer; transition: opacity .15s;
}
.btn-ban:disabled { opacity: .55; cursor: not-allowed; }
.btn-ban:not(:disabled):hover { opacity: .85; }

.spinner-sm {
  width: 13px; height: 13px;
  border: 2px solid rgba(255,255,255,0.4); border-top-color: white;
  border-radius: 50%; animation: spin .7s linear infinite; display: inline-block;
}

.fade-enter-active, .fade-leave-active { transition: opacity .2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.pagination { display: flex; align-items: center; gap: 12px; justify-content: center; }
.pg-btn {
  padding: 6px 14px; background: white; border: 1px solid #e2e8f0;
  border-radius: 8px; color: #64748b; font-size: 0.8rem; cursor: pointer;
}
.pg-btn:disabled { opacity: .4; cursor: default; }
.pg-btn:not(:disabled):hover { border-color: #4CD964; color: #4CD964; }
.pg-info { font-size: 0.8rem; color: #94a3b8; }
</style>
