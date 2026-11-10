<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'
import { useAuthStore } from '@/stores/auth'
import BranchFields from '@/components/BranchFields.vue'
import { emptyBranch, branchValid, branchMissing, branchPayload } from '@/utils/branches'
import { getActiveGymId, setActiveGymId } from '@/utils/activeGym'

interface Branch {
  id: number
  name: string
  branch_name: string | null
  is_main: boolean
  can_write: boolean
  login_email: string | null
  address: string
  sub_city: string | null
  city: string
  latitude: number | null
  longitude: number | null
  tier: string
  max_capacity: number
  is_active: boolean
}
interface BranchRequest {
  id: number
  branch_name: string
  city: string
  sub_city: string | null
  woreda: string
  status: 'pending' | 'rejected'
  rejection_reason: string | null
  submitted_at: string
}

const api = useApi()
const auth = useAuthStore()

const loading = ref(true)
const branches = ref<Branch[]>([])
const requests = ref<BranchRequest[]>([])
const canRequest = ref(false)
const activeId = ref<string | null>(getActiveGymId())

const showForm = ref(false)
const form = ref(emptyBranch())
const submitting = ref(false)
const message = ref<{ text: string; ok: boolean } | null>(null)
const tempPw = ref<{ email: string; password: string } | null>(null)

const formValid = computed(() => branchValid(form.value, 'gym'))
const formMissing = computed(() => branchMissing(form.value, 'gym'))

const tierLabels: Record<string, string> = {
  basic: 'Basic',
  basic_plus: 'Basic Plus',
  premium: 'Premium',
  platinum: 'Platinum',
}

// The branch currently shown across the portal
const currentId = computed(() => {
  if (activeId.value && branches.value.some((b) => String(b.id) === activeId.value)) {
    return Number(activeId.value)
  }
  const own = auth.user?.gym_id
  if (own && branches.value.some((b) => b.id === own)) return own
  return branches.value[0]?.id ?? null
})

// New branch maps open on the main location (or the first pinned branch)
const mainPin = computed(() => {
  const g = branches.value.find((b) => b.is_main && b.latitude != null) ?? branches.value.find((b) => b.latitude != null)
  return g && g.latitude != null && g.longitude != null
    ? { lat: g.latitude, lng: g.longitude, label: g.branch_name || g.name }
    : null
})

const isOwner = computed(() => auth.user?.role === 'gym_partner' && !auth.user?.gym_id)

async function load() {
  loading.value = true
  try {
    const res = await api.get<{ branches: Branch[]; requests: BranchRequest[]; can_request: boolean }>(
      'partner-portal/branches'
    )
    branches.value = res.branches
    requests.value = res.requests
    canRequest.value = res.can_request
  } finally {
    loading.value = false
  }
}

function switchTo(b: Branch) {
  // Staying on your default branch needs no header
  const isDefault = isOwner.value ? b.is_main : b.id === auth.user?.gym_id
  setActiveGymId(isDefault ? null : b.id)
  // Reload so every page re-fetches data for the chosen branch
  window.location.href = '/partner/dashboard'
}

function openForm() {
  form.value = emptyBranch()
  message.value = null
  showForm.value = true
}

async function submit() {
  if (!formValid.value || submitting.value) return
  submitting.value = true
  message.value = null
  try {
    const res = await api.post<{ message: string }>('partner-portal/branches', branchPayload(form.value, 'gym'))
    message.value = { text: res.message, ok: true }
    showForm.value = false
    await load()
  } catch (e: unknown) {
    message.value = { text: e instanceof Error ? e.message : 'Could not submit the branch.', ok: false }
  } finally {
    submitting.value = false
  }
}

async function resetPassword(b: Branch) {
  if (!window.confirm(`Issue a new temporary password for "${b.name}"? Their current password stops working.`)) return
  message.value = null
  try {
    const res = await api.post<{ temp_password: string; email: string }>(
      `partner-portal/branches/${b.id}/reset-password`, {}
    )
    tempPw.value = { email: res.email, password: res.temp_password }
  } catch (e: unknown) {
    message.value = { text: e instanceof Error ? e.message : 'Could not reset the password.', ok: false }
  }
}

function copyPw() {
  if (tempPw.value) navigator.clipboard?.writeText(tempPw.value.password).catch(() => {})
}

onMounted(load)
</script>

<template>
  <div class="pb">
    <p v-if="message" class="pb-msg" :class="message.ok ? 'ok' : 'err'">{{ message.text }}</p>

    <div v-if="loading" class="pb-empty">Loading branches…</div>

    <template v-else>
      <div class="pb-head">
        <div>
          <h2 class="pb-title">Your locations ({{ branches.length }})</h2>
          <p v-if="!isOwner && branches.length > 1" class="pb-sub">
            You can manage your own branch. The other branches are view-only.
          </p>
          <p v-else-if="isOwner && branches.length > 1" class="pb-sub">
            As the main branch you can view and manage every branch.
          </p>
        </div>
        <button v-if="canRequest && !showForm" class="pb-btn" @click="openForm">+ Add branch</button>
      </div>

      <div class="pb-grid">
        <div v-for="b in branches" :key="b.id" class="pb-card" :class="{ current: b.id === currentId }">
          <div class="pb-card-top">
            <h3 class="pb-name">{{ b.name }}</h3>
            <span v-if="b.is_main" class="pb-tag main">Main</span>
            <span v-else class="pb-tag">Branch</span>
          </div>
          <p class="pb-sub">{{ [b.sub_city, b.city].filter(Boolean).join(', ') }}</p>
          <p class="pb-sub">{{ b.address }}</p>
          <p class="pb-sub">{{ tierLabels[b.tier] ?? b.tier }} · max {{ b.max_capacity }}/hr</p>
          <p v-if="b.login_email && !b.is_main" class="pb-sub">Login: {{ b.login_email }}</p>
          <span class="pb-tag" :class="b.can_write ? 'main' : 'ro'">{{ b.can_write ? 'You can manage' : 'View only' }}</span>

          <div class="pb-card-actions">
            <button v-if="b.id === currentId" class="pb-btn ghost" disabled>Currently viewing</button>
            <button v-else-if="branches.length > 1" class="pb-btn ghost" @click="switchTo(b)">
              {{ b.can_write ? 'Switch to this branch' : 'View (read-only)' }}
            </button>
            <button v-if="isOwner && !b.is_main" class="pb-btn ghost" @click="resetPassword(b)">Reset password</button>
          </div>
        </div>
      </div>

      <div v-if="requests.length" class="pb-section">
        <h2 class="pb-title">Branch requests</h2>
        <div v-for="r in requests" :key="r.id" class="pb-req">
          <div>
            <strong>{{ r.branch_name }}</strong>
            <span class="pb-sub"> — {{ [r.sub_city, r.city].filter(Boolean).join(', ') }} · submitted {{ r.submitted_at }}</span>
            <p v-if="r.status === 'rejected' && r.rejection_reason" class="pb-sub">Reason: {{ r.rejection_reason }}</p>
          </div>
          <span class="pb-tag" :class="r.status">{{ r.status === 'pending' ? 'Awaiting approval' : 'Rejected' }}</span>
        </div>
      </div>

      <div v-if="showForm" class="pb-section pb-form">
        <h2 class="pb-title">New branch</h2>
        <p class="pb-sub">Our team will review it and set its tier. Once approved, the branch signs in with the email and password you set here.</p>
        <BranchFields :model-value="form" kind="gym" :reference="mainPin" />
        <p v-if="!formValid && formMissing.length" class="pb-need">Still needed: {{ formMissing.join(' · ') }}</p>
        <div class="pb-actions">
          <button class="pb-btn ghost" :disabled="submitting" @click="showForm = false">Cancel</button>
          <button class="pb-btn" :disabled="!formValid || submitting" @click="submit">
            {{ submitting ? 'Submitting…' : 'Submit for approval' }}
          </button>
        </div>
      </div>
    </template>

    <!-- Temporary password (shown once) -->
    <div v-if="tempPw" class="pb-modal" @click.self="tempPw = null">
      <div class="pb-modal-card">
        <h3 class="pb-title">Temporary password</h3>
        <p class="pb-sub">Share this securely with <strong>{{ tempPw.email }}</strong>. It is shown only once; they must change it at first sign-in.</p>
        <code class="pb-code">{{ tempPw.password }}</code>
        <div class="pb-actions">
          <button class="pb-btn ghost" @click="copyPw">Copy</button>
          <button class="pb-btn" @click="tempPw = null">Done</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pb { display: flex; flex-direction: column; gap: 18px; max-width: 900px; }
.pb-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.pb-title { font-size: 16px; font-weight: 700; color: #0f172a; margin: 0; }
.pb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 14px; }
.pb-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 4px; align-items: flex-start; }
.pb-card.current { border-color: #0d1b2e; }
.pb-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; width: 100%; }
.pb-card-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
.pb-name { font-size: 15px; font-weight: 700; margin: 0; color: #0f172a; }
.pb-sub { font-size: 13px; color: #64748b; margin: 0; }
.pb-need { font-size: 12px; color: #b91c1c; margin: 0; }
.pb-tag { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 999px; background: #f1f5f9; color: #475569; white-space: nowrap; margin-top: 4px; }
.pb-tag.main { background: #dcfce7; color: #166534; }
.pb-tag.ro { background: #EEF9DC; color: #4D7C0F; }
.pb-tag.pending { background: #fef3c7; color: #b45309; }
.pb-tag.rejected { background: #fee2e2; color: #b91c1c; }
.pb-section { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.pb-req { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 10px 0; border-top: 1px solid #f1f5f9; }
.pb-actions { display: flex; justify-content: flex-end; gap: 10px; }
.pb-btn { padding: 10px 16px; border: none; border-radius: 10px; background: #0d1b2e; color: #fff; font-weight: 600; font-size: 14px; cursor: pointer; }
.pb-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.pb-btn.ghost { background: #f1f5f9; color: #0f172a; }
.pb-msg { padding: 10px 14px; border-radius: 10px; font-size: 14px; margin: 0; }
.pb-msg.ok { background: #dcfce7; color: #166534; }
.pb-msg.err { background: #fee2e2; color: #b91c1c; }
.pb-empty { color: #64748b; padding: 24px 0; }
.pb-modal { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); display: flex; align-items: center; justify-content: center; padding: 16px; z-index: 300; }
.pb-modal-card { background: #fff; border-radius: 14px; padding: 20px; max-width: 420px; width: 100%; display: flex; flex-direction: column; gap: 12px; }
.pb-code { display: block; padding: 12px; background: #f1f5f9; border-radius: 10px; font-size: 15px; word-break: break-all; }
</style>
