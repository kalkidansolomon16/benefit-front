<template>
  <div class="page">

    <div class="page-actions">
      <p class="count-label">{{ meta?.total ?? employees.length }} total</p>
      <div class="header-actions">
        <button class="btn-template" @click="downloadImportTemplate">Download CSV Template</button>
        <button class="btn-import" :disabled="importing" @click="importInput?.click()">
          {{ importing ? 'Importing…' : '↑ Import CSV' }}
        </button>
        <input
          ref="importInput"
          type="file"
          accept=".csv,text/csv"
          class="hidden-input"
          @change="onImportFileChange"
        />
        <button class="btn-export" @click="exportCsv">↓ Export CSV</button>
      </div>
    </div>

    <!-- Search + filters -->
    <div class="filter-bar">
      <input v-model="search" class="search-box" placeholder="Search name, FAN, email or phone…" />
      <select v-model="filterTier" class="select-box">
        <option value="">All packages</option>
        <option v-for="o in TIER_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
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
              <span class="pkg-badge" :class="'pkg-' + empTier(e)">
                {{ empPlanName(e) }}
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
                  class="act-btn act-suspend"
                  title="Employee lost their phone or authenticator app"
                  @click="resetTwoFactor(e)"
                >Reset 2FA</button>
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

    <!-- ── Activate / Deactivate confirm modal ── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="confirmModal.open" class="modal-backdrop" @click.self="confirmModal.open = false">
          <div class="modal-panel confirm-panel">
            <div class="confirm-icon-wrap" :class="confirmModal.isActivate ? 'icon-activate' : 'icon-deactivate'">
              <svg v-if="confirmModal.isActivate" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <svg v-else width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            </div>
            <h2 class="confirm-title">{{ confirmModal.isActivate ? 'Activate Account' : 'Deactivate Account' }}</h2>
            <p class="confirm-desc">
              {{ confirmModal.isActivate
                  ? 'This will allow the employee to log in and access gym facilities.'
                  : 'This will prevent the employee from logging in and using gym services.' }}
            </p>
            <div class="confirm-name">{{ confirmModal.employeeName }}</div>
            <div class="confirm-footer">
              <button class="btn-cancel" @click="confirmModal.open = false">Cancel</button>
              <button
                class="btn-confirm"
                :class="confirmModal.isActivate ? 'btn-confirm-activate' : 'btn-confirm-deactivate'"
                :disabled="toggling !== null"
                @click="doToggleActive"
              >
                <span v-if="toggling !== null" class="spinner-sm"></span>
                <span v-else>{{ confirmModal.isActivate ? 'Yes, Activate' : 'Yes, Deactivate' }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

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

    <!-- Import results modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="importResult.show" class="modal-backdrop" @click.self="importResult.show = false">
          <div class="modal-panel modal-panel--wide">
            <div class="modal-header">
              <h2 class="modal-title">Import Results</h2>
              <button class="modal-close" @click="importResult.show = false">✕</button>
            </div>
            <div class="modal-body import-result-body">
              <p class="modal-sub">
                {{ importResult.created.length }} employee(s) imported,
                {{ importResult.failed.length }} row(s) failed.
              </p>

              <div v-if="importResult.created.length" class="import-section">
                <div class="import-section-head">
                  <p class="import-section-title">Created ({{ importResult.created.length }})</p>
                  <button type="button" class="btn-template" @click="downloadImportedCredentials">
                    ↓ Download Credentials
                  </button>
                </div>
                <div class="import-table-wrap">
                  <table class="import-table">
                    <thead>
                      <tr><th>Name</th><th>Email</th><th>Company</th><th>FAN Number</th><th>Temp Password</th></tr>
                    </thead>
                    <tbody>
                      <tr v-for="c in importResult.created" :key="c.row">
                        <td>{{ c.name }}</td>
                        <td>{{ c.email }}</td>
                        <td>{{ c.company }}</td>
                        <td class="mono">{{ c.fan_number }}</td>
                        <td class="mono">{{ c.temp_password }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p class="pw-note">Share each password with its employee. They must set a new password on first login.</p>
              </div>

              <div v-if="importResult.failed.length" class="import-section">
                <p class="import-section-title import-section-title--error">Failed rows ({{ importResult.failed.length }})</p>
                <ul class="import-error-list">
                  <li v-for="f in importResult.failed" :key="f.row">
                    <strong>Row {{ f.row }}:</strong> {{ f.errors.join(' ') }}
                  </li>
                </ul>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" @click="importResult.show = false">Close</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Toast -->
    <Teleport to="body">
      <Transition name="toast">
        <div v-if="toast.show" class="toast" :class="'toast-' + toast.type">{{ toast.message }}</div>
      </Transition>
    </Teleport>

    <AppPagination
      :page="page"
      :total-pages="meta?.last_page ?? 1"
      :total="meta?.total ?? 0"
      :per-page="10"
      @update:page="v => { page = v; load() }"
    />

  </div>
</template>

<script setup lang="ts">
import { TIER_OPTIONS, canonicalTier } from '@/utils/tier'
import { ref, computed, onMounted, reactive } from 'vue'
import { useApi } from '@/composables/useApi'
import { useAuthStore } from '@/stores/auth'
import AppPagination from '@/components/AppPagination.vue'

const api  = useApi()
const auth = useAuthStore()

// ── Toast ────────────────────────────────────────────────────
const toast = reactive({ show: false, type: 'success', message: '' })
let toastTimer: ReturnType<typeof setTimeout> | null = null
function showToast(msg: string, type: 'success' | 'error' = 'success') {
  if (toastTimer) clearTimeout(toastTimer)
  Object.assign(toast, { show: true, type, message: msg })
  toastTimer = setTimeout(() => { toast.show = false }, 4000)
}

interface Employee {
  id: number
  fan_number: string | null
  level: string | null
  gym_tier: string | null
  is_enrolled: boolean
  payment_status: 'paid' | 'unpaid'
  registration_status: string | null
  admin_approval_status: string | null
  payment_preference: string | null
  user_is_active: boolean
  active_membership_id: number | null
  active_membership?: { plan?: { name: string; tier: string } | null } | null
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
    const res = await api.get<{ data: Employee[]; meta: Meta }>(`employees?page=${page.value}&per_page=10`)
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
    if (filterTier.value && empTier(e) !== canonicalTier(filterTier.value)) return false
    if (filterStatus.value === 'active'        &&  !e.user_is_active) return false
    if (filterStatus.value === 'inactive'      &&   e.user_is_active) return false
    if (filterStatus.value === 'pending_admin' && e.admin_approval_status !== 'pending') return false
    if (filterPayment.value && e.payment_status !== filterPayment.value) return false
    return true
  })
)

function normalizeTier(t?: string | null): string {
  return canonicalTier(t) || 'basic'
}

function tierLabel(t?: string | null) {
  const canon = normalizeTier(t)
  return { basic: 'Basic', basic_plus: 'Basic Plus', premium: 'Premium', platinum: 'Platinum' }[canon] ?? canon
}

function empPlanName(e: Employee): string {
  if (e.active_membership?.plan?.name) return e.active_membership.plan.name
  return tierLabel(e.gym_tier)
}

function empTier(e: Employee): string {
  if (e.active_membership?.plan?.tier) return normalizeTier(e.active_membership.plan.tier)
  return normalizeTier(e.gym_tier)
}

async function suspendMembership(e: Employee) {
  if (!e.active_membership_id) return
  try {
    await api.post(`memberships/${e.active_membership_id}/suspend`)
    e.is_enrolled = false
    e.active_membership_id = null
    showToast('Membership suspended.')
  } catch (err: unknown) {
    showToast((err as Error).message ?? 'Failed to suspend.', 'error')
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
    showToast(`${e.user?.name ?? 'Employee'} has been unbanned.`)
  } catch (err: unknown) {
    showToast(err instanceof Error ? err.message : 'Unban failed.', 'error')
  }
}

// ── Activate / Deactivate confirm modal ──────────────────────
const confirmModal = reactive({
  open: false,
  isActivate: false,
  employeeName: '',
  employeeId: null as number | null,
})

function toggleActive(e: Employee) {
  confirmModal.isActivate   = !e.user_is_active
  confirmModal.employeeName = e.user?.name ?? 'this employee'
  confirmModal.employeeId   = e.id
  confirmModal.open         = true
}

async function resetTwoFactor(e: Employee) {
  const name = e.user?.name ?? 'this employee'
  if (!window.confirm(`Reset two-factor authentication for ${name}? They will be signed out and must scan a new QR code on their next login.`)) return
  try {
    const res = await api.post<{ message: string }>(`employees/${e.id}/reset-2fa`, {})
    showToast(res.message)
  } catch (err: unknown) {
    showToast(err instanceof Error ? err.message : 'Failed to reset two-factor authentication.', 'error')
  }
}

async function doToggleActive() {
  if (!confirmModal.employeeId) return
  const id     = confirmModal.employeeId
  const action = confirmModal.isActivate ? 'activate' : 'deactivate'
  toggling.value = id
  try {
    const res = await api.post<{ employee: Employee }>(`employees/${id}/toggle-active`)
    const idx = employees.value.findIndex(emp => emp.id === id)
    if (idx !== -1) employees.value[idx] = res.employee
    showToast(`Account ${action}d successfully.`)
    confirmModal.open = false
  } catch (err: unknown) {
    showToast(err instanceof Error ? err.message : `Failed to ${action} account.`, 'error')
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

// ── CSV Import ──────────────────────────────────────────────
interface ImportCreated { row: number; name: string; email: string; company: string; fan_number: string; temp_password: string }
interface ImportFailed  { row: number; errors: string[] }

const importInput  = ref<HTMLInputElement | null>(null)
const importing    = ref(false)
const importResult = reactive<{ show: boolean; created: ImportCreated[]; failed: ImportFailed[] }>({
  show: false, created: [], failed: [],
})

function downloadCsv(rows: (string | number)[][], filename: string) {
  const csv  = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const a    = document.createElement('a')
  a.href     = URL.createObjectURL(blob)
  a.download = filename
  a.click()
}

async function downloadImportTemplate() {
  let exampleTier = 'basic'
  try {
    const res  = await api.get<{ tier: string }[]>('membership-plans')
    const list = Array.isArray(res) ? res : (res as any).data ?? []
    if (list.length) exampleTier = list[0].tier
  } catch {
    // fall back to placeholder tier if plans can't be fetched
  }
  downloadCsv([
    ['company', 'first_name', 'middle_name', 'last_name', 'email', 'fan_number', 'package', 'job_title', 'department', 'phone', 'joined_at'],
    ['Acme Ethiopia PLC', 'Abebe', 'Girma', 'Haile', 'abebe.haile@example.com', '1234567890123', exampleTier, 'Accountant', 'Finance', '0912345678', '2026-01-15'],
  ], 'employee_import_template.csv')
}

function downloadImportedCredentials() {
  downloadCsv([
    ['Name', 'Email', 'Company', 'FAN Number', 'Temp Password'],
    ...importResult.created.map(c => [c.name, c.email, c.company, c.fan_number, c.temp_password]),
  ], `imported_employees_credentials_${new Date().toISOString().slice(0, 10)}.csv`)
}

async function onImportFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file  = input.files?.[0]
  if (!file) return

  importing.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/employees/import`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${auth.token}`,
      },
      body: formData,
    })
    const data = await res.json()
    if (!res.ok) {
      showToast(data.message ?? 'Import failed.', 'error')
      return
    }
    importResult.created = data.created ?? []
    importResult.failed  = data.failed ?? []
    importResult.show    = true
    await load()
  } catch (err) {
    showToast(err instanceof Error ? err.message : 'Import failed.', 'error')
  } finally {
    importing.value = false
    input.value = ''
  }
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }

.page-actions   { display: flex; align-items: center; justify-content: space-between; }
.count-label    { font-size: 0.85rem; color: #94a3b8; margin: 0; }
.header-actions { display: flex; align-items: center; gap: 12px; }
.hidden-input   { display: none; }
.btn-export   {
  padding: 9px 18px; background: #8BE000; color: white;
  border: none; border-radius: 10px; font-size: 0.84rem; font-weight: 600;
  cursor: pointer; transition: opacity .15s;
}
.btn-export:hover { opacity: .85; }
.btn-template {
  padding: 9px 14px; background: white; color: #64748b;
  border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 0.8rem; font-weight: 600;
  cursor: pointer; white-space: nowrap; transition: all .15s;
}
.btn-template:hover { background: #f8fafc; border-color: #cbd5e1; color: #0f172a; }
.btn-import {
  padding: 9px 16px; background: #0f172a; color: white; border: none;
  border-radius: 10px; font-size: 0.8rem; font-weight: 600; cursor: pointer;
  white-space: nowrap; transition: opacity .15s;
}
.btn-import:hover:not(:disabled) { opacity: .85; }
.btn-import:disabled { opacity: .55; cursor: default; }

.filter-bar { display: flex; gap: 10px; flex-wrap: wrap; }
.search-box {
  flex: 1; min-width: 280px; padding: 9px 14px;
  background: white; border: 1px solid #e2e8f0; border-radius: 10px;
  font-size: 0.875rem; color: #0f172a; outline: none;
}
.search-box:focus { border-color: #8BE000; box-shadow: 0 0 0 3px rgba(139, 224, 0,0.1); }
.select-box {
  padding: 8px 12px; background: white; border: 1px solid #e2e8f0;
  border-radius: 10px; color: #64748b; font-size: 0.82rem; outline: none; cursor: pointer;
}
.select-box:focus { border-color: #8BE000; }

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
.pkg-basic_plus { background: #d1fae5; color: #72B800; border: 1px solid #a7f3d0; }
.pkg-platinum   { background: #ede9fe; color: #72B800; border: 1px solid #B8F0C0; }

.status-badge {
  display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 600;
}
.status-badge.enrolled        { background: #d1fae5; color: #72B800;  border: 1px solid #a7f3d0; }
.status-badge.not             { background: #fee2e2; color: #dc2626;  border: 1px solid #fecaca; }
.status-badge.status-pending  { background: #fef3c7; color: #d97706;  border: 1px solid #fde68a; }
.status-badge.status-rejected { background: #fee2e2; color: #dc2626;  border: 1px solid #fecaca; }

.pay-badge   { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 600; }
.pay-paid    { background: #d1fae5; color: #72B800; border: 1px solid #a7f3d0; }
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
.modal-panel--wide { max-width: 680px; }

.import-result-body { max-height: 60vh; overflow-y: auto; }
.import-section { display: flex; flex-direction: column; gap: 8px; }
.import-section-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.import-section-title { font-size: 0.85rem; font-weight: 700; color: #0f172a; margin: 0; }
.import-section-title--error { color: #dc2626; }
.import-table-wrap { border: 1px solid #e2e8f0; border-radius: 10px; overflow: auto; max-height: 260px; }
.import-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.import-table th {
  position: sticky; top: 0; background: #f8fafc; text-align: left;
  padding: 8px 12px; font-size: 0.68rem; font-weight: 600; color: #94a3b8;
  letter-spacing: .05em; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;
}
.import-table td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
.import-table tr:last-child td { border-bottom: none; }
.import-error-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.import-error-list li {
  font-size: 0.8rem; color: #7f1d1d; background: #fef2f2; border: 1px solid #fecaca;
  border-radius: 8px; padding: 8px 12px;
}
.pw-note { font-size: 0.76rem; color: #94a3b8; margin: 0; }
.mono { font-family: monospace; }
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

/* Confirm modal */
.confirm-panel {
  max-width: 400px; padding: 32px 28px;
  display: flex; flex-direction: column; align-items: center;
  text-align: center; gap: 12px;
}
.confirm-icon-wrap {
  width: 64px; height: 64px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; margin-bottom: 4px;
}
.icon-activate   { background: #d1fae5; color: #15803d; }
.icon-deactivate { background: #fef3c7; color: #b45309; }
.confirm-title { font-size: 1.1rem; font-weight: 700; color: #0f172a; margin: 0; }
.confirm-desc  { font-size: 0.85rem; color: #64748b; margin: 0; line-height: 1.6; max-width: 300px; }
.confirm-name  {
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
  padding: 8px 18px; font-size: 0.9rem; font-weight: 700; color: #0f172a;
}
.confirm-footer { display: flex; gap: 10px; margin-top: 8px; width: 100%; justify-content: center; }
.btn-confirm {
  padding: 10px 24px; border: none; border-radius: 10px;
  font-size: 0.875rem; font-weight: 600; cursor: pointer;
  transition: opacity .15s; display: flex; align-items: center; gap: 7px;
}
.btn-confirm:disabled { opacity: .55; cursor: not-allowed; }
.btn-confirm:not(:disabled):hover { opacity: .85; }
.btn-confirm-activate   { background: #8BE000; color: white; }
.btn-confirm-deactivate { background: #f59e0b; color: white; }

/* Modal slide-in transition */
.modal-enter-active { transition: all .22s cubic-bezier(.34,1.56,.64,1); }
.modal-leave-active { transition: all .18s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(.92); }

/* Toast */
.toast {
  position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
  padding: 13px 22px; border-radius: 12px; font-size: 0.88rem; font-weight: 500;
  z-index: 999; box-shadow: 0 8px 28px rgba(0,0,0,.14);
  white-space: nowrap; pointer-events: none;
}
.toast-success { background: #0f172a; color: #fff; }
.toast-error   { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.toast-enter-active { transition: all .3s cubic-bezier(.34,1.56,.64,1); }
.toast-leave-active { transition: all .25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(12px); }
</style>
