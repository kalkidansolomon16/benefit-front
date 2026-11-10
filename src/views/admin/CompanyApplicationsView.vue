<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'
import { useAuthStore } from '@/stores/auth'
import CredentialsDialog from '@/components/CredentialsDialog.vue'
import type { IssuedLogin } from '@/utils/credentials'

// Employer applications from the public form. Nothing exists for these companies
// until an admin approves: that creates the company, the HR login and every
// branch login, and emails them a temporary password.

interface AppBranch {
  branch_name: string
  contact_person: string
  email: string
  city: string
  sub_city: string | null
  woreda: string
  contact_phone: string | null
}

interface CompanyApp {
  id: number
  reference: string | null
  company_name: string
  industry: string
  company_size: string | null
  tin_number: string
  preferred_payment_method: string | null
  contact_name: string
  job_title: string | null
  contact_email: string
  contact_phone: string
  branches: AppBranch[]
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  company_id: number | null
  submitted_at: string | null
  reviewed_at: string | null
}

const api = useApi()
const auth = useAuthStore()
const canDecide = computed(() => auth.hasPermission('companies.create'))

const status = ref<'pending' | 'approved' | 'rejected' | 'all'>('pending')
const filters = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' },
] as const

const apps = ref<CompanyApp[]>([])
const pendingCount = ref(0)
const loading = ref(true)
const loadError = ref('')

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const q = status.value === 'all' ? '' : `?status=${status.value}`
    const res = await api.get<{ data: CompanyApp[]; pending_count: number }>(`company-applications${q}`)
    apps.value = res.data
    pendingCount.value = res.pending_count
  } catch (e: unknown) {
    loadError.value = e instanceof Error ? e.message : 'Could not load applications.'
  } finally {
    loading.value = false
  }
}
onMounted(load)

const INDUSTRY: Record<string, string> = {
  banking: 'Banking & Finance', telecom: 'Telecom & Technology', airline: 'Aviation & Transport',
  government: 'Government & Public Sector', ngo: 'NGO / International Organisation',
  hospital: 'Healthcare & Pharmaceuticals', real_estate: 'Manufacturing & Industry',
  international_school: 'Education', tech: 'Tech & IT', embassy: 'Embassy / Diplomatic Mission',
  insurance: 'Insurance', other: 'Other',
}
const PAYMENT: Record<string, string> = {
  cbe_transfer: 'Bank Transfer / CBE', telebirr_enterprise: 'Telebirr Enterprise', awash_bank: 'Awash Bank',
  chapa: 'Chapa', cash: 'Cash', other: 'Other',
}
const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''

// -- Approve ---------------------------------------------------
const tiers = [
  { value: 'basic', label: 'Basic' },
  { value: 'basic_plus', label: 'Basic Plus' },
  { value: 'platinum', label: 'Platinum' },
]
const approving = ref<CompanyApp | null>(null)
const approveTier = ref('')
const approveBusy = ref(false)
const approveError = ref('')
const issued = ref<IssuedLogin[]>([])

function openApprove(a: CompanyApp) {
  approving.value = a
  approveTier.value = ''
  approveError.value = ''
}
async function confirmApprove() {
  if (!approving.value || !approveTier.value) return
  approveBusy.value = true
  approveError.value = ''
  try {
    const res = await api.post<{ message: string; credentials: IssuedLogin[] }>(
      `company-applications/${approving.value.id}/approve`,
      { tier: approveTier.value },
    )
    approving.value = null
    flash(res.message)
    issued.value = res.credentials ?? []
    await load()
  } catch (e: unknown) {
    approveError.value = e instanceof Error ? e.message : 'Approval failed.'
  } finally {
    approveBusy.value = false
  }
}

// -- Reject ----------------------------------------------------
const rejecting = ref<CompanyApp | null>(null)
const rejectReason = ref('')
const rejectBusy = ref(false)
const rejectError = ref('')

function openReject(a: CompanyApp) {
  rejecting.value = a
  rejectReason.value = ''
  rejectError.value = ''
}
async function confirmReject() {
  if (!rejecting.value) return
  rejectBusy.value = true
  rejectError.value = ''
  try {
    const res = await api.post<{ message: string }>(`company-applications/${rejecting.value.id}/reject`, {
      reason: rejectReason.value.trim() || null,
    })
    rejecting.value = null
    flash(res.message)
    await load()
  } catch (e: unknown) {
    rejectError.value = e instanceof Error ? e.message : 'Rejection failed.'
  } finally {
    rejectBusy.value = false
  }
}

// -- Toast -----------------------------------------------------
const toast = ref('')
function flash(msg: string) {
  toast.value = msg
  setTimeout(() => (toast.value = ''), 4000)
}
</script>

<template>
  <div class="ca">
    <div class="ca-head">
      <div>
        <h1 class="ca-title">Company applications</h1>
        <p class="ca-sub">
          Employers who applied from the website. Verify their details (TIN, contact) and approve to
          create their account — the login details are emailed with a temporary password.
        </p>
      </div>
      <span v-if="pendingCount" class="ca-pending">{{ pendingCount }} pending</span>
    </div>

    <div class="ca-filters">
      <button
        v-for="f in filters"
        :key="f.value"
        type="button"
        class="ca-filter"
        :class="{ active: status === f.value }"
        @click="status = f.value; load()"
      >{{ f.label }}</button>
    </div>

    <p v-if="loading" class="ca-state">Loading applications…</p>
    <p v-else-if="loadError" class="ca-state ca-state--err">{{ loadError }}</p>
    <p v-else-if="!apps.length" class="ca-state">No {{ status === 'all' ? '' : status }} company applications.</p>

    <div v-else class="ca-list">
      <article v-for="a in apps" :key="a.id" class="ca-card">
        <header class="ca-card-head">
          <div class="ca-avatar">{{ a.company_name.slice(0, 2).toUpperCase() }}</div>
          <div class="ca-card-info">
            <h3>{{ a.company_name }}</h3>
            <p>{{ a.reference ?? `#${a.id}` }} · submitted {{ fmtDate(a.submitted_at) }}</p>
          </div>
          <span class="ca-status" :class="`ca-status--${a.status}`">{{ a.status }}</span>
        </header>

        <div class="ca-grid">
          <div>
            <p class="ca-label">Company</p>
            <p class="ca-val">{{ INDUSTRY[a.industry] ?? a.industry }}</p>
            <p class="ca-subval">{{ a.company_size ? `${a.company_size} employees` : 'Size not given' }}</p>
          </div>
          <div>
            <p class="ca-label">TIN</p>
            <p class="ca-val ca-mono">{{ a.tin_number }}</p>
            <p v-if="a.preferred_payment_method" class="ca-subval">Pays by {{ PAYMENT[a.preferred_payment_method] ?? a.preferred_payment_method }}</p>
          </div>
          <div>
            <p class="ca-label">Contact person</p>
            <p class="ca-val">{{ a.contact_name }}</p>
            <p v-if="a.job_title" class="ca-subval">{{ a.job_title }}</p>
          </div>
          <div>
            <p class="ca-label">Contact</p>
            <p class="ca-val"><a :href="`mailto:${a.contact_email}`">{{ a.contact_email }}</a></p>
            <p class="ca-subval"><a :href="`tel:${a.contact_phone}`">{{ a.contact_phone }}</a></p>
          </div>
        </div>

        <div v-if="a.branches?.length" class="ca-branches">
          <p class="ca-label">Branches ({{ a.branches.length }})</p>
          <div v-for="(b, i) in a.branches" :key="i" class="ca-branch">
            <strong>{{ b.branch_name }}</strong>
            <span>{{ [b.woreda, b.sub_city, b.city].filter(Boolean).join(', ') }}</span>
            <span>{{ b.contact_person }} · {{ b.email }}</span>
          </div>
        </div>

        <p v-if="a.status === 'rejected' && a.rejection_reason" class="ca-reason">Reason: {{ a.rejection_reason }}</p>
        <p v-if="a.status !== 'pending' && a.reviewed_at" class="ca-reviewed">Reviewed {{ fmtDate(a.reviewed_at) }}</p>

        <div v-if="a.status === 'pending' && canDecide" class="ca-actions">
          <button type="button" class="ca-btn ca-btn--approve" @click="openApprove(a)">
            Approve &amp; create account{{ a.branches?.length ? `s (${a.branches.length + 1})` : '' }}
          </button>
          <button type="button" class="ca-btn ca-btn--reject" @click="openReject(a)">Reject</button>
        </div>
      </article>
    </div>

    <!-- Approve modal -->
    <Teleport to="body">
      <div v-if="approving" class="ca-overlay" @click.self="approving = null">
        <div class="ca-modal" role="dialog" aria-modal="true">
          <h3>Approve {{ approving.company_name }}</h3>
          <p>
            This creates the company, an HR login for <strong>{{ approving.contact_email }}</strong>
            <template v-if="approving.branches?.length"> and {{ approving.branches.length }} branch login(s)</template>,
            each with a temporary password sent by email.
          </p>
          <p class="ca-label">Plan tier</p>
          <div class="ca-tiers">
            <button
              v-for="t in tiers"
              :key="t.value"
              type="button"
              class="ca-tier"
              :class="{ selected: approveTier === t.value }"
              @click="approveTier = t.value"
            >{{ t.label }}</button>
          </div>
          <p v-if="approveError" class="ca-err">{{ approveError }}</p>
          <div class="ca-modal-actions">
            <button type="button" class="ca-btn ca-btn--ghost" @click="approving = null">Cancel</button>
            <button
              type="button"
              class="ca-btn ca-btn--approve"
              :disabled="!approveTier || approveBusy"
              @click="confirmApprove"
            >{{ approveBusy ? 'Creating…' : 'Approve' }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Reject modal -->
    <Teleport to="body">
      <div v-if="rejecting" class="ca-overlay" @click.self="rejecting = null">
        <div class="ca-modal" role="dialog" aria-modal="true">
          <h3>Reject {{ rejecting.company_name }}</h3>
          <p>The applicant is informed by email. You can include a reason.</p>
          <textarea v-model="rejectReason" rows="3" maxlength="500" placeholder="Reason (optional), e.g. TIN could not be verified"></textarea>
          <p v-if="rejectError" class="ca-err">{{ rejectError }}</p>
          <div class="ca-modal-actions">
            <button type="button" class="ca-btn ca-btn--ghost" @click="rejecting = null">Cancel</button>
            <button type="button" class="ca-btn ca-btn--reject" :disabled="rejectBusy" @click="confirmReject">
              {{ rejectBusy ? 'Rejecting…' : 'Reject application' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <CredentialsDialog
      v-if="issued.length"
      title="Company approved — logins created"
      :logins="issued"
      @close="issued = []"
    />

    <Teleport to="body">
      <Transition name="ca-toast">
        <div v-if="toast" class="ca-toast">{{ toast }}</div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.ca { display: flex; flex-direction: column; gap: 18px; }
.ca-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
.ca-title { margin: 0 0 4px; font-size: 1.5rem; color: #0B0C10; }
.ca-sub { margin: 0; color: #57534e; font-size: 0.9rem; max-width: 720px; line-height: 1.5; }
.ca-pending { padding: 6px 14px; border-radius: 999px; background: #8BE000; color: #0B0C10; font-weight: 700; font-size: 0.85rem; white-space: nowrap; }
.ca-filters { display: flex; gap: 8px; flex-wrap: wrap; }
.ca-filter { padding: 8px 18px; border-radius: 999px; border: 1.5px solid #e7e5e4; background: #fff; font-weight: 600; font-size: 0.88rem; cursor: pointer; color: #0B0C10; }
.ca-filter.active { background: #0B0C10; border-color: #0B0C10; color: #fff; }
.ca-state { padding: 40px; text-align: center; color: #78716c; background: #fff; border-radius: 14px; }
.ca-state--err { color: #b91c1c; }
.ca-list { display: flex; flex-direction: column; gap: 14px; }
.ca-card { background: #fff; border: 1.5px solid #ececec; border-radius: 16px; padding: 18px 20px; display: flex; flex-direction: column; gap: 14px; }
.ca-card-head { display: flex; align-items: center; gap: 12px; }
.ca-avatar { width: 44px; height: 44px; border-radius: 12px; background: #0B0C10; color: #8BE000; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ca-card-info { flex: 1; min-width: 0; }
.ca-card-info h3 { margin: 0; font-size: 1.05rem; color: #0B0C10; }
.ca-card-info p { margin: 2px 0 0; font-size: 0.8rem; color: #78716c; }
.ca-status { padding: 4px 12px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; text-transform: capitalize; }
.ca-status--pending { background: #fef3c7; color: #92400e; }
.ca-status--approved { background: #EEF9DC; color: #3f6212; }
.ca-status--rejected { background: #fee2e2; color: #b91c1c; }
.ca-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.ca-label { margin: 0 0 4px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #78716c; }
.ca-val { margin: 0; font-size: 0.9rem; font-weight: 600; color: #0B0C10; word-break: break-word; }
.ca-val a, .ca-subval a { color: inherit; }
.ca-subval { margin: 2px 0 0; font-size: 0.82rem; color: #57534e; }
.ca-mono { font-family: Consolas, Menlo, monospace; }
.ca-branches { border-top: 1px dashed #e7e5e4; padding-top: 12px; display: flex; flex-direction: column; gap: 6px; }
.ca-branch { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 0.85rem; color: #44403c; }
.ca-reason { margin: 0; font-size: 0.85rem; color: #b91c1c; }
.ca-reviewed { margin: 0; font-size: 0.78rem; color: #78716c; }
.ca-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.ca-btn { padding: 10px 20px; border-radius: 999px; border: none; font-weight: 700; font-size: 0.88rem; cursor: pointer; }
.ca-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.ca-btn--approve { background: #8BE000; color: #0B0C10; }
.ca-btn--reject { background: #fff; color: #b91c1c; border: 1.5px solid #fecaca; }
.ca-btn--ghost { background: #f5f5f4; color: #0B0C10; }
.ca-overlay { position: fixed; inset: 0; z-index: 1500; background: rgba(11, 12, 16, 0.5); display: flex; align-items: center; justify-content: center; padding: 16px; }
.ca-modal { width: 100%; max-width: 460px; background: #fff; border-radius: 18px; padding: 24px; display: flex; flex-direction: column; gap: 10px; }
.ca-modal h3 { margin: 0; font-size: 1.15rem; color: #0B0C10; }
.ca-modal p { margin: 0; font-size: 0.88rem; line-height: 1.5; color: #44403c; }
.ca-modal textarea { width: 100%; }
.ca-tiers { display: flex; gap: 8px; flex-wrap: wrap; }
.ca-tier { flex: 1; min-width: 110px; padding: 12px; border-radius: 12px; border: 1.5px solid #e7e5e4; background: #fff; font-weight: 700; cursor: pointer; color: #0B0C10; }
.ca-tier.selected { border-color: #0B0C10; background: #0B0C10; color: #fff; }
.ca-err { color: #b91c1c !important; font-weight: 600; }
.ca-modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px; }
.ca-toast { position: fixed; bottom: 24px; right: 24px; z-index: 2100; background: #0B0C10; color: #fff; padding: 12px 18px; border-radius: 12px; font-size: 0.9rem; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); max-width: 420px; }
.ca-toast-enter-active, .ca-toast-leave-active { transition: opacity 0.2s, transform 0.2s; }
.ca-toast-enter-from, .ca-toast-leave-to { opacity: 0; transform: translateY(8px); }
@media (max-width: 900px) { .ca-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 520px) { .ca-grid { grid-template-columns: 1fr; } .ca-head { flex-direction: column; } }
</style>
