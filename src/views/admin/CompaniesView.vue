<template>
  <div class="page">

    <!-- Header -->
    <div class="page-actions">
      <p class="count-label">{{ meta?.total ?? companies.length }} registered</p>
      <button class="btn-primary" @click="showForm = true">+ Register Company</button>
    </div>

    <!-- Filters -->
    <div class="filter-bar">
      <div class="search-wrap">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          v-model="search"
          class="search-box"
          placeholder="Search by company name…"
          @input="onSearchInput"
        />
        <button v-if="search" class="search-clear" @click="clearSearch" title="Clear">✕</button>
      </div>
      <select v-model="filterTier" class="select-box" @change="resetAndLoad">
        <option value="">All Tiers</option>
        <option value="basic">Basic</option>
        <option value="basic_plus">Basic Plus</option>
        <option value="platinum">Platinum</option>
      </select>
      <select v-model="filterLicense" class="select-box" @change="resetAndLoad">
        <option value="">All License States</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>
      <select v-model="filterActive" class="select-box" @change="resetAndLoad">
        <option value="">All Statuses</option>
        <option value="true">Active</option>
        <option value="false">Inactive</option>
      </select>
      <button v-if="hasFilters" class="btn-clear-all" @click="clearAll">Clear all</button>
    </div>

    <div v-if="loading" class="state-msg">Loading companies…</div>
    <div v-else-if="!companies.length" class="state-msg">No companies found.</div>

    <!-- Company cards -->
    <div v-else class="company-list">
      <div v-for="c in companies" :key="c.id" class="company-card" @click="openDrawer(c)">
        <div class="cc-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </div>
        <div class="cc-body">
          <p class="cc-name">{{ c.name }}</p>
          <p class="cc-joined">Joined {{ c.created_at?.slice(0, 10) ?? '—' }}</p>
          <div class="cc-badges">
            <span class="badge tier-badge" :class="'tier-' + c.tier">{{ tierLabel(c.tier) }}</span>
            <span class="badge lic-badge"  :class="'lic-'  + c.business_license_status">{{ c.business_license_status ?? 'No License' }}</span>
            <span class="badge status-badge" :class="c.is_active ? 'active' : 'inactive'">{{ c.is_active ? 'Active' : 'Inactive' }}</span>
          </div>
        </div>
        <div class="cc-stats">
          <div class="cc-stat"><span class="cc-num">{{ c.employees_count ?? 0 }}</span><span class="cc-sub">total</span></div>
          <div class="cc-stat"><span class="cc-num teal">{{ c.enrolled_employees_count ?? 0 }}</span><span class="cc-sub">active</span></div>
        </div>
        <div class="cc-actions" @click.stop>
          <button v-if="c.business_license_status === 'pending'" class="act-btn approve" @click="approveLicense(c)">Approve</button>
          <button v-if="c.business_license_status === 'pending'" class="act-btn reject"  @click="rejectLicense(c)">Reject</button>
          <a v-if="c.business_license_url" :href="c.business_license_url" target="_blank" class="act-link">View doc</a>
          <button class="act-btn toggle" @click="toggleActive(c)">{{ c.is_active ? 'Deactivate' : 'Activate' }}</button>
        </div>
        <svg class="cc-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    </div>

    <!-- ── Company Detail Drawer ──────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="drawer">
        <div v-if="drawer.open" class="drawer-overlay" @click.self="closeDrawer">
          <div class="drawer">

            <!-- Drawer header -->
            <div class="drawer-header">
              <div class="drawer-title-wrap">
                <div class="drawer-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </div>
                <div>
                  <h2 class="drawer-title">{{ drawer.company?.name }}</h2>
                  <p class="drawer-sub">{{ drawer.company?.city }} · {{ tierLabel(drawer.company?.tier ?? '') }}</p>
                </div>
              </div>
              <button class="drawer-close" @click="closeDrawer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <!-- Stat strip -->
            <div class="drawer-stats">
              <div class="ds-stat">
                <p class="ds-val">{{ drawer.employees.length }}</p>
                <p class="ds-lbl">Total Employees</p>
              </div>
              <div class="ds-divider"></div>
              <div class="ds-stat">
                <p class="ds-val teal">{{ drawer.employees.filter(e => e.is_enrolled).length }}</p>
                <p class="ds-lbl">Enrolled</p>
              </div>
              <div class="ds-divider"></div>
              <div class="ds-stat">
                <p class="ds-val amber">{{ drawer.employees.filter(e => e.registration_status === 'pending').length }}</p>
                <p class="ds-lbl">Pending</p>
              </div>
              <div class="ds-divider"></div>
              <div class="ds-stat">
                <p class="ds-val">{{ drawer.employees.filter(e => e.package === 'platinum').length }}</p>
                <p class="ds-lbl">Platinum</p>
              </div>
            </div>

            <!-- Search -->
            <div class="drawer-search-wrap">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" class="drawer-search-icon"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input v-model="drawerSearch" class="drawer-search" placeholder="Search employees…" />
            </div>

            <!-- Loading -->
            <div v-if="drawer.loading" class="drawer-loading">
              <div class="drawer-spinner"></div>
              <p>Loading employees…</p>
            </div>

            <!-- Empty -->
            <div v-else-if="filteredDrawerEmployees.length === 0" class="drawer-empty">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              <p>{{ drawerSearch ? 'No employees match your search.' : 'No employees yet.' }}</p>
            </div>

            <!-- Employee list -->
            <div v-else class="drawer-emp-list">
              <div
                v-for="emp in filteredDrawerEmployees"
                :key="emp.id"
                class="emp-row"
              >
                <!-- Avatar -->
                <div class="emp-avatar">{{ (emp.name ?? '?').slice(0,2).toUpperCase() }}</div>

                <!-- Info -->
                <div class="emp-info">
                  <p class="emp-name">{{ emp.name ?? '—' }}</p>
                  <p class="emp-meta">
                    <span v-if="emp.job_title">{{ emp.job_title }}</span>
                    <span v-if="emp.job_title && emp.department" class="dot">·</span>
                    <span v-if="emp.department">{{ emp.department }}</span>
                  </p>
                  <p class="emp-fan">FAN: {{ emp.fan_number ?? '—' }}</p>
                </div>

                <!-- Badges -->
                <div class="emp-badges">
                  <span class="pkg-badge" :class="`pkg-${emp.package}`">
                    {{ packageLabel(emp.package) }}
                  </span>
                  <span class="reg-badge" :class="`reg-${emp.registration_status}`">
                    {{ emp.registration_status }}
                  </span>
                  <span class="mem-badge" :class="`mem-${emp.membership_status}`">
                    {{ emp.membership_status }}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Pagination -->
    <div v-if="meta && meta.last_page > 1" class="pagination">
      <button :disabled="page <= 1"             @click="page--; load()" class="pg-btn">‹ Prev</button>
      <span class="pg-info">Page {{ page }} of {{ meta.last_page }} &nbsp;·&nbsp; {{ meta.total }} total</span>
      <button :disabled="page >= meta.last_page" @click="page++; load()" class="pg-btn">Next ›</button>
    </div>

  </div>

  <!-- ── Toast notification ────────────────────────────────────── -->
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="toast.show" class="toast" :class="'toast-' + toast.type">
        <svg v-if="toast.type === 'success'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {{ toast.message }}
      </div>
    </Transition>
  </Teleport>

  <!-- ── Register Company Modal ───────────────────────────────── -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showForm" class="modal-backdrop" @click.self="closeModal">
        <div class="modal-panel">

          <div class="modal-header">
            <h2 class="modal-title">Register Company</h2>
            <button class="modal-close" @click="closeModal">✕</button>
          </div>

          <!-- Error only — success now shows as toast -->
          <div v-if="formError" class="banner-error">{{ formError }}</div>

          <form @submit.prevent="submitForm" class="modal-form">

            <!-- Company Info -->
            <div class="form-section">
              <p class="section-label">COMPANY INFORMATION</p>
              <div class="form-row">
                <div class="field">
                  <label class="field-label">Company Name *</label>
                  <input v-model="form.name" class="input" :class="{ err: fe.name }" placeholder="Ethiopian Airlines" />
                  <p v-if="fe.name" class="err-msg">{{ fe.name }}</p>
                </div>
                <div class="field">
                  <label class="field-label">Industry *</label>
                  <select v-model="form.industry" class="input" :class="{ err: fe.industry }">
                    <option value="">Select industry…</option>
                    <option v-for="ind in industries" :key="ind.value" :value="ind.value">{{ ind.label }}</option>
                  </select>
                  <p v-if="fe.industry" class="err-msg">{{ fe.industry }}</p>
                </div>
              </div>
              <div class="form-row">
                <div class="field">
                  <label class="field-label">Package Tier *</label>
                  <select v-model="form.tier" class="input" :class="{ err: fe.tier }">
                    <option value="">Select tier…</option>
                    <option value="basic">Basic</option>
                    <option value="basic_plus">Basic Plus</option>
                    <option value="platinum">Platinum</option>
                  </select>
                  <p v-if="fe.tier" class="err-msg">{{ fe.tier }}</p>
                </div>
                <div class="field">
                  <label class="field-label">TIN Number</label>
                  <input v-model="form.tin_number" class="input" placeholder="Optional" />
                </div>
              </div>
              <div class="form-row">
                <div class="field">
                  <label class="field-label">Preferred Payment Method</label>
                  <select v-model="form.preferred_payment_method" class="input">
                    <option value="">Select payment method…</option>
                    <option value="cbe_transfer">Bank Transfer / CBE</option>
                    <option value="telebirr_enterprise">Telebirr Enterprise</option>
                    <option value="awash_bank">Awash Bank</option>
                    <option value="chapa">Chapa</option>
                    <option value="cash">Cash</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div class="field"><!-- spacer --></div>
              </div>
            </div>

            <!-- Contact -->
            <div class="form-section">
              <p class="section-label">HR CONTACT</p>
              <div class="form-row">
                <div class="field">
                  <label class="field-label">Contact Person *</label>
                  <input v-model="form.contact_person" class="input" :class="{ err: fe.contact_person }" placeholder="Full Name" />
                  <p v-if="fe.contact_person" class="err-msg">{{ fe.contact_person }}</p>
                </div>
                <div class="field">
                  <label class="field-label">Contact Email * <span class="hint">(used for HR login)</span></label>
                  <input v-model="form.contact_email" type="email" class="input" :class="{ err: fe.contact_email }" placeholder="hr@company.com" />
                  <p v-if="fe.contact_email" class="err-msg">{{ fe.contact_email }}</p>
                </div>
              </div>
              <div class="form-row">
                <div class="field">
                  <label class="field-label">Phone *</label>
                  <input v-model="form.contact_phone" class="input" :class="{ err: fe.contact_phone }" placeholder="+251 9xx xxx xxxx" />
                  <p v-if="fe.contact_phone" class="err-msg">{{ fe.contact_phone }}</p>
                </div>
                <div class="field">
                  <label class="field-label">City</label>
                  <input v-model="form.city" class="input" placeholder="Addis Ababa" />
                </div>
              </div>
            </div>

            <!-- HR Account -->
            <div class="form-section">
              <p class="section-label">HR ACCOUNT PASSWORD</p>
              <div class="form-row">
                <div class="field">
                  <label class="field-label">Initial Password *</label>
                  <div class="pw-wrap">
                    <input
                      v-model="form.hr_password"
                      :type="showPw ? 'text' : 'password'"
                      class="input"
                      :class="{ err: fe.hr_password }"
                      placeholder="Minimum 6 characters"
                    />
                    <button type="button" class="pw-toggle" @click="showPw = !showPw">
                      <svg v-if="!showPw" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    </button>
                  </div>
                  <p v-if="fe.hr_password" class="err-msg">{{ fe.hr_password }}</p>
                  <p class="field-hint">The HR user will log in with the contact email and this password.</p>
                </div>
                <div class="field field-center">
                  <label class="field-label">Activate Immediately</label>
                  <label class="toggle-row">
                    <input v-model="form.is_active" type="checkbox" class="toggle-cb" />
                    <span class="toggle-track"></span>
                    <span class="toggle-text">{{ form.is_active ? 'Active' : 'Inactive' }}</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Modal footer -->
            <div class="modal-footer">
              <button type="button" class="btn-cancel" @click="closeModal">Cancel</button>
              <button type="submit" class="btn-submit" :disabled="formLoading">
                {{ formLoading ? 'Creating…' : 'Create Company' }}
              </button>
            </div>

          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useApi } from '@/composables/useApi'
import { useAuthStore } from '@/stores/auth'

const api  = useApi()
const auth = useAuthStore()

interface Company {
  id: number; name: string; industry: string; tier: string; is_active: boolean
  contact_person: string; contact_email: string; contact_phone: string
  business_license_status: string | null; business_license_url: string | null
  employees_count: number; enrolled_employees_count: number; created_at: string
}
interface Meta { current_page: number; last_page: number; total: number }

const companies     = ref<Company[]>([])
const loading       = ref(true)
const search        = ref('')
const filterTier    = ref('')
const filterLicense = ref('')
const filterActive  = ref('')
const page          = ref(1)
const meta          = ref<Meta | null>(null)

const hasFilters = computed(() =>
  search.value || filterTier.value || filterLicense.value || filterActive.value
)

/* ── Debounce timer ───────────────────────────────────────────── */
let searchTimer: ReturnType<typeof setTimeout> | null = null
function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    load()
  }, 350)
}

function resetAndLoad() {
  page.value = 1
  load()
}

function clearSearch() {
  search.value = ''
  page.value   = 1
  load()
}

function clearAll() {
  search.value        = ''
  filterTier.value    = ''
  filterLicense.value = ''
  filterActive.value  = ''
  page.value          = 1
  load()
}

/* ── Table data ───────────────────────────────────────────────── */
async function load() {
  loading.value = true
  try {
    const params = new URLSearchParams({ page: String(page.value) })
    if (search.value)        params.set('search',         search.value)
    if (filterTier.value)    params.set('tier',           filterTier.value)
    if (filterLicense.value) params.set('license_status', filterLicense.value)
    if (filterActive.value)  params.set('is_active',      filterActive.value)
    const res = await api.get<{ data: Company[]; meta: Meta }>(`companies?${params.toString()}`)
    companies.value = res.data ?? []
    meta.value      = res.meta ?? null
  } finally {
    loading.value = false
  }
}
onMounted(load)

/* ── Card helpers ─────────────────────────────────────────────── */
function tierLabel(t: string) {
  return { basic: 'Basic', basic_plus: 'Basic Plus', platinum: 'Platinum' }[t] ?? t
}
async function approveLicense(c: Company) {
  await api.patch(`companies/${c.id}/license-status`, { status: 'approved' })
  c.business_license_status = 'approved'; c.is_active = true
}
async function rejectLicense(c: Company) {
  await api.patch(`companies/${c.id}/license-status`, { status: 'rejected' })
  c.business_license_status = 'rejected'
}
async function toggleActive(c: Company) {
  const res = await api.patch<{ is_active: boolean }>(`companies/${c.id}/toggle-active`, {})
  c.is_active = res.is_active
}

/* ── Toast ────────────────────────────────────────────────────── */
const toast = reactive({ show: false, type: 'success', message: '' })
let toastTimer: ReturnType<typeof setTimeout> | null = null
function showToast(message: string, type: 'success' | 'error' = 'success') {
  if (toastTimer) clearTimeout(toastTimer)
  toast.message = message
  toast.type    = type
  toast.show    = true
  toastTimer    = setTimeout(() => { toast.show = false }, 4000)
}

/* ── Company Detail Drawer ───────────────────────────────────── */
interface Employee {
  id: number; name: string; email: string; fan_number: string
  job_title: string; department: string; branch: string
  package: string; registration_status: string
  membership_status: string; is_enrolled: boolean; enrolled_at: string
}

const drawer = reactive<{
  open: boolean; loading: boolean; company: Company | null; employees: Employee[]
}>({ open: false, loading: false, company: null, employees: [] })

const drawerSearch = ref('')

const filteredDrawerEmployees = computed(() => {
  if (!drawerSearch.value) return drawer.employees
  const q = drawerSearch.value.toLowerCase()
  return drawer.employees.filter(e =>
    e.name?.toLowerCase().includes(q) ||
    e.fan_number?.toLowerCase().includes(q) ||
    e.job_title?.toLowerCase().includes(q) ||
    e.department?.toLowerCase().includes(q)
  )
})

async function openDrawer(c: Company) {
  drawer.company   = c
  drawer.employees = []
  drawer.open      = true
  drawer.loading   = true
  drawerSearch.value = ''
  try {
    const res = await api.get<{ data?: { employees?: Employee[] }; employees?: Employee[] }>(`companies/${c.id}`)
    drawer.employees = res.data?.employees ?? res.employees ?? []
  } finally {
    drawer.loading = false
  }
}

function closeDrawer() {
  drawer.open    = false
  drawer.company = null
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && drawer.open) closeDrawer()
}
onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))

function packageLabel(pkg: string) {
  return pkg === 'platinum' ? 'Platinum' : pkg === 'basic_plus' ? 'Basic Plus' : 'Basic'
}

/* ── Register Company modal ───────────────────────────────────── */
const showForm    = ref(false)
const formLoading = ref(false)
const formError   = ref('')
const showPw      = ref(false)
const fe          = reactive<Record<string, string>>({})

const industries = [
  { value: 'banking',            label: 'Banking & Finance' },
  { value: 'telecom',            label: 'Telecom & Technology' },
  { value: 'airline',            label: 'Aviation & Transport' },
  { value: 'government',         label: 'Government & Public Sector' },
  { value: 'ngo',                label: 'NGO / International Organisation' },
  { value: 'hospital',           label: 'Healthcare & Pharmaceuticals' },
  { value: 'real_estate',        label: 'Manufacturing & Industry' },
  { value: 'international_school', label: 'Education' },
  { value: 'tech',               label: 'Tech & IT' },
  { value: 'embassy',            label: 'Embassy / Diplomatic Mission' },
  { value: 'insurance',          label: 'Insurance' },
  { value: 'other',              label: 'Other' },
]

const form = reactive({
  name: '', industry: '', tier: '',
  contact_person: '', contact_email: '', contact_phone: '',
  city: 'Addis Ababa', tin_number: '',
  preferred_payment_method: '',
  hr_password: '', is_active: true,
})

function closeModal() {
  if (formLoading.value) return
  showForm.value  = false
  formError.value = ''
  Object.keys(fe).forEach(k => delete fe[k])
  // Reset form fields
  Object.assign(form, {
    name: '', industry: '', tier: '',
    contact_person: '', contact_email: '', contact_phone: '',
    city: 'Addis Ababa', tin_number: '',
    preferred_payment_method: '',
    hr_password: '', is_active: true,
  })
}

async function submitForm() {
  formError.value = ''
  Object.keys(fe).forEach(k => delete fe[k])

  // Client-side validation
  if (!form.name)           fe.name           = 'Company name is required.'
  if (!form.industry)       fe.industry       = 'Industry is required.'
  if (!form.tier)           fe.tier           = 'Tier is required.'
  if (!form.contact_person) fe.contact_person = 'Contact person is required.'
  if (!form.contact_email)  fe.contact_email  = 'Email is required.'
  if (!form.contact_phone)  fe.contact_phone  = 'Phone is required.'
  if (!form.hr_password)    fe.hr_password    = 'Password is required.'
  else if (form.hr_password.length < 6) fe.hr_password = 'Minimum 6 characters.'
  if (Object.keys(fe).length) return

  formLoading.value = true
  try {
    const res = await fetch('http://localhost:8000/api/v1/companies/admin-create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${auth.token}`,
      },
      body: JSON.stringify({ ...form }),
    })
    const data = await res.json()
    if (!res.ok) {
      if (res.status === 422 && data.errors) {
        Object.entries(data.errors).forEach(([k, msgs]) => {
          fe[k] = (msgs as string[])[0]
        })
        formError.value = 'Please fix the highlighted fields.'
      } else {
        formError.value = data.message ?? 'Registration failed.'
      }
      return
    }
    // ✅ Stop loading first, then close so the guard doesn't block it
    formLoading.value = false
    closeModal()
    await load()
    showToast(data.message ?? 'Company registered successfully.')
  } catch (err) {
    formLoading.value = false
    throw err
  }
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }

.page-actions { display: flex; align-items: center; justify-content: space-between; }
.count-label  { font-size: 0.85rem; color: #94a3b8; margin: 0; }
.btn-primary  {
  padding: 9px 18px; background: #14b8a6; color: white;
  border: none; border-radius: 10px; font-size: 0.84rem; font-weight: 600;
  cursor: pointer; transition: opacity .15s;
}
.btn-primary:hover { opacity: .85; }

.filter-bar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }

/* Search with icon */
.search-wrap {
  flex: 1; min-width: 220px; position: relative; display: flex; align-items: center;
}
.search-icon {
  position: absolute; left: 12px; color: #94a3b8; pointer-events: none;
}
.search-box {
  width: 100%; padding: 9px 36px 9px 36px;
  background: white; border: 1px solid #e2e8f0; border-radius: 10px;
  font-size: 0.875rem; color: #0f172a; outline: none; transition: border-color .15s;
}
.search-box:focus { border-color: #14b8a6; box-shadow: 0 0 0 3px rgba(20,184,166,.08); }
.search-clear {
  position: absolute; right: 10px; background: none; border: none;
  color: #94a3b8; cursor: pointer; font-size: 0.75rem; padding: 2px 4px; line-height: 1;
}
.search-clear:hover { color: #ef4444; }

/* Clear all */
.btn-clear-all {
  padding: 8px 14px; background: #fff1f2; border: 1px solid #fecaca;
  border-radius: 9px; color: #ef4444; font-size: 0.78rem; font-weight: 600;
  cursor: pointer; white-space: nowrap; transition: background .15s;
}
.btn-clear-all:hover { background: #fee2e2; }
.select-box {
  padding: 8px 12px; background: white; border: 1px solid #e2e8f0;
  border-radius: 10px; color: #64748b; font-size: 0.82rem; outline: none; cursor: pointer;
}

.state-msg { text-align: center; color: #94a3b8; padding: 48px; background: white; border-radius: 14px; }

/* Company cards */
.company-list { background: white; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.company-card {
  display: flex; align-items: center; gap: 16px;
  padding: 18px 20px; border-bottom: 1px solid #f1f5f9;
  transition: background .12s; cursor: pointer;
}
.company-card:last-child { border-bottom: none; }
.company-card:hover { background: #f8fafc; }
.cc-icon {
  width: 44px; height: 44px; background: #f0fdf9; border-radius: 10px;
  color: #14b8a6; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.cc-body   { flex: 1; min-width: 0; }
.cc-name   { font-size: 0.95rem; font-weight: 600; color: #0f172a; margin: 0 0 2px; }
.cc-joined { font-size: 0.75rem; color: #94a3b8; margin: 0 0 6px; }
.cc-badges { display: flex; gap: 6px; flex-wrap: wrap; }
.badge { display: inline-block; padding: 2px 9px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
.tier-basic      { background: #f1f5f9; color: #64748b; }
.tier-basic_plus { background: #d1fae5; color: #059669; }
.tier-platinum   { background: #ede9fe; color: #7c3aed; }
.lic-pending     { background: #fef9c3; color: #a16207; }
.lic-approved    { background: #d1fae5; color: #059669; }
.lic-rejected    { background: #fee2e2; color: #dc2626; }
.status-badge.active   { background: #d1fae5; color: #059669; }
.status-badge.inactive { background: #fee2e2; color: #dc2626; }
.cc-stats { display: flex; gap: 20px; flex-shrink: 0; }
.cc-stat  { text-align: center; }
.cc-num   { display: block; font-size: 1.1rem; font-weight: 700; color: #0f172a; }
.cc-num.teal { color: #14b8a6; }
.cc-sub   { display: block; font-size: 0.68rem; color: #94a3b8; }
.cc-actions { display: flex; gap: 6px; flex-shrink: 0; flex-wrap: wrap; }
.act-btn {
  padding: 4px 10px; border-radius: 6px; font-size: 0.72rem; font-weight: 600;
  border: none; cursor: pointer; transition: opacity .15s;
}
.act-btn:hover { opacity: .8; }
.approve { background: #d1fae5; color: #059669; }
.reject  { background: #fee2e2; color: #dc2626; }
.toggle  { background: #eff6ff; color: #3b82f6; }
.act-link { font-size: 0.72rem; color: #3b82f6; text-decoration: none; align-self: center; }
.cc-chevron { flex-shrink: 0; }

/* Pagination */
.pagination { display: flex; align-items: center; gap: 12px; justify-content: center; }
.pg-btn {
  padding: 6px 14px; background: white; border: 1px solid #e2e8f0;
  border-radius: 8px; color: #64748b; font-size: 0.8rem; cursor: pointer;
}
.pg-btn:disabled { opacity: .4; cursor: default; }
.pg-btn:not(:disabled):hover { border-color: #14b8a6; color: #14b8a6; }
.pg-info { font-size: 0.8rem; color: #94a3b8; }

/* ── Modal ─────────────────────────────────────────────────────── */
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  z-index: 200; padding: 16px;
}
.modal-panel {
  background: white; border-radius: 16px; width: 100%; max-width: 680px;
  max-height: 90vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px; border-bottom: 1px solid #f1f5f9; position: sticky; top: 0; background: white; z-index: 1;
}
.modal-title { font-size: 1.1rem; font-weight: 700; color: #0f172a; margin: 0; }
.modal-close {
  width: 32px; height: 32px; border-radius: 8px; background: #f1f5f9;
  border: none; cursor: pointer; font-size: 0.9rem; color: #64748b;
  display: flex; align-items: center; justify-content: center;
}
.modal-close:hover { background: #e2e8f0; }

.modal-form { padding: 0 24px 24px; }

.banner-success {
  margin: 16px 24px 0;
  padding: 10px 14px; background: #d1fae5; border: 1px solid #a7f3d0;
  border-radius: 8px; color: #059669; font-size: 0.84rem;
}
.banner-error {
  margin: 16px 24px 0;
  padding: 10px 14px; background: #fee2e2; border: 1px solid #fecaca;
  border-radius: 8px; color: #dc2626; font-size: 0.84rem;
}

.form-section { margin-top: 20px; }
.section-label {
  font-size: 0.68rem; font-weight: 700; color: #94a3b8;
  letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 12px;
}
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
.form-row:last-child { margin-bottom: 0; }

.field { display: flex; flex-direction: column; gap: 5px; }
.field-label { font-size: 0.75rem; font-weight: 500; color: #64748b; }
.hint { font-size: 0.68rem; color: #94a3b8; font-weight: 400; }
.field-hint { font-size: 0.7rem; color: #94a3b8; margin: 0; }

.input {
  padding: 9px 12px; background: #f8fafc; border: 1.5px solid #e2e8f0;
  border-radius: 9px; font-size: 0.875rem; color: #0f172a; outline: none;
  transition: border-color .15s;
}
.input:focus { border-color: #14b8a6; background: white; }
.input.err   { border-color: #ef4444; }
.err-msg     { font-size: 0.7rem; color: #ef4444; margin: 0; }

/* Password field */
.pw-wrap { position: relative; }
.pw-wrap .input { width: 100%; box-sizing: border-box; padding-right: 40px; }
.pw-toggle {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  background: none; border: none; color: #94a3b8; cursor: pointer; padding: 2px;
}

/* Toggle switch */
.field-center { justify-content: center; }
.toggle-row { display: flex; align-items: center; gap: 10px; cursor: pointer; }
.toggle-cb  { display: none; }
.toggle-track {
  width: 40px; height: 22px; background: #e2e8f0; border-radius: 11px;
  position: relative; transition: background .2s; flex-shrink: 0;
}
.toggle-track::after {
  content: ''; position: absolute; left: 3px; top: 3px;
  width: 16px; height: 16px; border-radius: 50%; background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2); transition: left .2s;
}
.toggle-cb:checked + .toggle-track { background: #14b8a6; }
.toggle-cb:checked + .toggle-track::after { left: 21px; }
.toggle-text { font-size: 0.84rem; color: #64748b; }

/* Modal footer */
.modal-footer {
  display: flex; gap: 12px; justify-content: flex-end;
  margin-top: 24px; padding-top: 20px; border-top: 1px solid #f1f5f9;
}
.btn-cancel {
  padding: 9px 20px; background: white; border: 1.5px solid #e2e8f0;
  border-radius: 9px; color: #64748b; font-size: 0.875rem; font-weight: 500; cursor: pointer;
}
.btn-cancel:hover { border-color: #94a3b8; }
.btn-submit {
  padding: 9px 24px; background: #14b8a6; border: none;
  border-radius: 9px; color: white; font-size: 0.875rem; font-weight: 600; cursor: pointer;
  transition: opacity .15s;
}
.btn-submit:disabled { opacity: .6; cursor: default; }
.btn-submit:not(:disabled):hover { opacity: .85; }

/* ── Toast ─────────────────────────────────────────────────────── */
.toast {
  position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 10px;
  padding: 13px 22px; border-radius: 12px;
  font-size: 0.9rem; font-weight: 500; z-index: 999;
  box-shadow: 0 8px 28px rgba(0,0,0,0.14); white-space: nowrap;
  pointer-events: none;
}
.toast-success { background: #0f172a; color: #fff; }
.toast-success svg { color: #4ade80; }
.toast-error   { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }

.toast-enter-active { transition: all .3s cubic-bezier(.34,1.56,.64,1); }
.toast-leave-active { transition: all .25s ease; }
.toast-enter-from   { opacity: 0; transform: translateX(-50%) translateY(16px); }
.toast-leave-to     { opacity: 0; transform: translateX(-50%) translateY(8px); }

/* Modal fade */
.fade-enter-active, .fade-leave-active { transition: opacity .2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 600px) {
  .form-row { grid-template-columns: 1fr; }
}

/* ── Drawer ─────────────────────────────────────────────────────── */
.drawer-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.35);
  z-index: 300;
  display: flex; justify-content: flex-end;
}
.drawer {
  width: 100%; max-width: 520px;
  height: 100vh; background: #fff;
  display: flex; flex-direction: column;
  box-shadow: -8px 0 40px rgba(0,0,0,0.15);
  overflow: hidden;
}

/* Header */
.drawer-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px; border-bottom: 1px solid #f1f5f9; flex-shrink: 0;
  background: #fff;
}
.drawer-title-wrap { display: flex; align-items: center; gap: 12px; min-width: 0; }
.drawer-icon {
  width: 40px; height: 40px; border-radius: 10px;
  background: #f0fdf9; color: #14b8a6;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.drawer-title { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0 0 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.drawer-sub   { font-size: 0.75rem; color: #94a3b8; margin: 0; }
.drawer-close {
  width: 32px; height: 32px; border-radius: 8px;
  background: #f8fafc; border: none; cursor: pointer;
  color: #64748b; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.drawer-close:hover { background: #f1f5f9; color: #0f172a; }

/* Stat strip */
.drawer-stats {
  display: flex; align-items: center; padding: 16px 24px;
  border-bottom: 1px solid #f1f5f9; flex-shrink: 0; gap: 0;
}
.ds-stat   { flex: 1; text-align: center; }
.ds-val    { font-size: 1.4rem; font-weight: 800; color: #0f172a; margin: 0 0 2px; line-height: 1; }
.ds-val.teal  { color: #14b8a6; }
.ds-val.amber { color: #d97706; }
.ds-lbl    { font-size: 0.68rem; color: #94a3b8; margin: 0; }
.ds-divider { width: 1px; background: #f1f5f9; align-self: stretch; margin: 0 4px; }

/* Search */
.drawer-search-wrap {
  position: relative; padding: 14px 24px; flex-shrink: 0;
  border-bottom: 1px solid #f1f5f9;
}
.drawer-search-icon {
  position: absolute; left: 36px; top: 50%; transform: translateY(-50%); pointer-events: none;
}
.drawer-search {
  width: 100%; padding: 9px 14px 9px 36px;
  background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px;
  font-size: 0.875rem; color: #0f172a; outline: none; box-sizing: border-box;
  transition: border-color 0.2s; font-family: inherit;
}
.drawer-search:focus { border-color: #14b8a6; background: #fff; }
.drawer-search::placeholder { color: #94a3b8; }

/* Loading / Empty */
.drawer-loading, .drawer-empty {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; flex: 1;
  color: #94a3b8; font-size: 0.88rem;
}
.drawer-spinner {
  width: 30px; height: 30px;
  border: 3px solid #e2e8f0; border-top-color: #14b8a6;
  border-radius: 50%; animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Employee list */
.drawer-emp-list {
  flex: 1; overflow-y: auto; padding: 8px 0;
}
.emp-row {
  display: flex; align-items: center; gap: 14px;
  padding: 12px 24px; border-bottom: 1px solid #f8fafc;
  transition: background 0.12s;
}
.emp-row:last-child { border-bottom: none; }
.emp-row:hover { background: #f8fafc; }

.emp-avatar {
  width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
  background: linear-gradient(135deg, #e0f2fe, #bfdbfe);
  color: #1e40af; font-size: 0.82rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.emp-info   { flex: 1; min-width: 0; }
.emp-name   { font-size: 0.88rem; font-weight: 600; color: #0f172a; margin: 0 0 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.emp-meta   { font-size: 0.75rem; color: #64748b; margin: 0 0 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.emp-fan    { font-size: 0.7rem; color: #94a3b8; margin: 0; font-feature-settings: 'tnum'; }
.dot        { margin: 0 4px; }

.emp-badges { display: flex; flex-direction: column; gap: 3px; align-items: flex-end; flex-shrink: 0; }

/* Package badge */
.pkg-badge { padding: 2px 8px; border-radius: 10px; font-size: 0.68rem; font-weight: 700; }
.pkg-platinum   { background: #ede9fe; color: #7c3aed; }
.pkg-basic_plus { background: #d1fae5; color: #059669; }
.pkg-basic      { background: #f1f5f9; color: #64748b; }

/* Registration status badge */
.reg-badge { padding: 2px 8px; border-radius: 10px; font-size: 0.68rem; font-weight: 600; text-transform: capitalize; }
.reg-pending  { background: #fef9c3; color: #92400e; }
.reg-approved { background: #dcfce7; color: #166534; }
.reg-rejected { background: #fee2e2; color: #991b1b; }

/* Membership status badge */
.mem-badge { padding: 2px 8px; border-radius: 10px; font-size: 0.68rem; font-weight: 600; text-transform: capitalize; }
.mem-active    { background: #dcfce7; color: #166534; }
.mem-inactive  { background: #f1f5f9; color: #64748b; }
.mem-suspended { background: #fff7ed; color: #c2410c; }

/* Drawer slide transition */
.drawer-enter-active { transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1); }
.drawer-leave-active { transition: transform 0.22s ease-in; }
.drawer-enter-from, .drawer-leave-to { transform: translateX(100%); }
</style>
