<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'
import BranchFields from '@/components/BranchFields.vue'
import LocationPicker from '@/components/LocationPicker.vue'
import { CITIES, type PlaceAddress } from '@/utils/geo'
import { emptyBranch, branchValid, branchMissing, branchPayload } from '@/utils/branches'

interface Branch {
  id: number
  name: string
  contact_person: string | null
  city: string | null
  sub_city: string | null
  address: string | null
  landmark: string | null
  latitude: number | null
  longitude: number | null
  phone: string | null
  is_active: boolean
  login_email: string | null
  employee_count: number
  is_mine: boolean
}
interface HeadOffice { name: string; city: string | null; address: string | null; employee_count: number }

const api = useApi()

const loading = ref(true)
const headOffice = ref<HeadOffice | null>(null)
const branches = ref<Branch[]>([])
const canManage = ref(false)
const myBranchId = ref<number | null>(null)

const message = ref<{ text: string; ok: boolean } | null>(null)
const showForm = ref(false)
const form = ref(emptyBranch())
const submitting = ref(false)
const tempPw = ref<{ email: string; password: string } | null>(null)

const formValid = computed(() => branchValid(form.value, 'company'))
const formMissing = computed(() => branchMissing(form.value, 'company'))

const edit = ref<{
  id: number
  name: string
  contact_person: string
  city: string
  address: string
  phone: string
  latitude: number | null
  longitude: number | null
} | null>(null)

// No head-office pin exists, so other pinned branches give the map a starting point
const branchPin = computed(() => {
  const g = branches.value.find((b) => b.latitude != null && b.longitude != null)
  return g ? { lat: g.latitude as number, lng: g.longitude as number, label: g.name } : null
})

function onEditAddress(a: PlaceAddress) {
  if (!edit.value) return
  if (a.city && CITIES.includes(a.city)) edit.value.city = a.city
  if (a.landmark && !edit.value.address.trim()) edit.value.address = a.landmark
}
const saving = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await api.get<{ head_office: HeadOffice; branches: Branch[]; can_manage: boolean; my_branch_id: number | null }>('hr/branches')
    headOffice.value = res.head_office
    branches.value = res.branches
    canManage.value = res.can_manage
    myBranchId.value = res.my_branch_id
  } finally {
    loading.value = false
  }
}

function fail(e: unknown, fallback: string) {
  message.value = { text: e instanceof Error ? e.message : fallback, ok: false }
}

function openForm() {
  form.value = emptyBranch()
  message.value = null
  showForm.value = true
}

async function create() {
  if (!formValid.value || submitting.value) return
  submitting.value = true
  message.value = null
  try {
    const res = await api.post<{ message: string }>('hr/branches', branchPayload(form.value, 'company'))
    message.value = { text: res.message, ok: true }
    showForm.value = false
    await load()
  } catch (e) {
    fail(e, 'Could not create the branch.')
  } finally {
    submitting.value = false
  }
}

async function toggleActive(b: Branch) {
  message.value = null
  try {
    await api.patch(`hr/branches/${b.id}`, { is_active: !b.is_active })
    await load()
  } catch (e) {
    fail(e, 'Could not update the branch.')
  }
}

async function remove(b: Branch) {
  if (!window.confirm(`Remove the branch "${b.name}" and its login? This cannot be undone.`)) return
  message.value = null
  try {
    const res = await api.del<{ message: string }>(`hr/branches/${b.id}`)
    message.value = { text: res.message, ok: true }
    await load()
  } catch (e) {
    fail(e, 'Could not remove the branch.')
  }
}

async function resetPassword(b: Branch) {
  if (!window.confirm(`Issue a new temporary password for "${b.name}"? Their current password stops working.`)) return
  message.value = null
  try {
    const res = await api.post<{ temp_password: string; email: string }>(`hr/branches/${b.id}/reset-password`, {})
    tempPw.value = { email: res.email, password: res.temp_password }
  } catch (e) {
    fail(e, 'Could not reset the password.')
  }
}

function openEdit(b: Branch) {
  edit.value = {
    id: b.id,
    name: b.name,
    contact_person: b.contact_person ?? '',
    city: b.city ?? '',
    address: b.address ?? '',
    phone: b.phone ?? '',
    latitude: b.latitude,
    longitude: b.longitude,
  }
}

async function saveEdit() {
  if (!edit.value || saving.value) return
  saving.value = true
  const { id, ...data } = edit.value
  try {
    await api.patch(`hr/branches/${id}`, data)
    edit.value = null
    message.value = { text: 'Branch updated.', ok: true }
    await load()
  } catch (e) {
    fail(e, 'Could not save the branch.')
  } finally {
    saving.value = false
  }
}

function copyPw() {
  if (tempPw.value) navigator.clipboard?.writeText(tempPw.value.password).catch(() => {})
}

onMounted(load)
</script>

<template>
  <div class="hb">
    <p v-if="message" class="hb-msg" :class="message.ok ? 'ok' : 'err'">{{ message.text }}</p>
    <div v-if="loading" class="hb-empty">Loading branches…</div>

    <template v-else>
      <div class="hb-head">
        <div>
          <h2 class="hb-title">Head office &amp; branches</h2>
          <p class="hb-sub" v-if="canManage">
            Each branch signs in with its own email and password and can manage only its own employees.
            Branches can see the other branches' employees, read-only. This head office can manage everything.
          </p>
          <p class="hb-sub" v-else>You can manage your own branch. The other branches are view-only.</p>
        </div>
        <button v-if="canManage && !showForm" class="hb-btn" @click="openForm">+ Add branch</button>
      </div>

      <div class="hb-grid">
        <div v-if="headOffice" class="hb-card">
          <div class="hb-card-top">
            <h3 class="hb-name">{{ headOffice.name }}</h3>
            <span class="hb-tag main">Head office</span>
          </div>
          <p class="hb-sub">{{ [headOffice.city, headOffice.address].filter(Boolean).join(' · ') || '—' }}</p>
          <p class="hb-sub">{{ headOffice.employee_count }} employee(s)</p>
        </div>

        <div v-for="b in branches" :key="b.id" class="hb-card" :class="{ off: !b.is_active, mine: b.is_mine }">
          <div class="hb-card-top">
            <h3 class="hb-name">{{ b.name }}</h3>
            <span class="hb-tag" :class="b.is_active ? 'on' : 'off'">{{ b.is_active ? 'Active' : 'Inactive' }}</span>
          </div>
          <p class="hb-sub">{{ [b.sub_city, b.city].filter(Boolean).join(', ') }}<template v-if="b.address"> · {{ b.address }}</template></p>
          <p v-if="b.contact_person" class="hb-sub">Manager: {{ b.contact_person }}</p>
          <p v-if="b.login_email" class="hb-sub">Login: {{ b.login_email }}</p>
          <p class="hb-sub">{{ b.employee_count }} employee(s)<template v-if="b.is_mine"> · your branch</template></p>

          <div v-if="canManage" class="hb-actions">
            <button class="hb-btn ghost" @click="openEdit(b)">Edit</button>
            <button class="hb-btn ghost" @click="toggleActive(b)">{{ b.is_active ? 'Deactivate' : 'Activate' }}</button>
            <button class="hb-btn ghost" @click="resetPassword(b)">Reset password</button>
            <button class="hb-btn danger" :disabled="b.employee_count > 0" :title="b.employee_count ? 'Has employees — deactivate instead' : ''" @click="remove(b)">Remove</button>
          </div>
        </div>
      </div>

      <div v-if="showForm" class="hb-section">
        <h2 class="hb-title">New branch</h2>
        <BranchFields :model-value="form" kind="company" :reference="branchPin" />
        <p v-if="!formValid && formMissing.length" class="hb-need">Still needed: {{ formMissing.join(' · ') }}</p>
        <div class="hb-actions end">
          <button class="hb-btn ghost" :disabled="submitting" @click="showForm = false">Cancel</button>
          <button class="hb-btn" :disabled="!formValid || submitting" @click="create">
            {{ submitting ? 'Creating…' : 'Create branch' }}
          </button>
        </div>
      </div>
    </template>

    <!-- Edit branch -->
    <div v-if="edit" class="hb-modal" @click.self="edit = null">
      <div class="hb-modal-card">
        <h3 class="hb-title">Edit branch</h3>
        <label class="hb-label">Name<input v-model="edit.name" class="hb-input" maxlength="100" /></label>
        <label class="hb-label">Manager name<input v-model="edit.contact_person" class="hb-input" maxlength="255" /></label>
        <div class="hb-label">
          Location on the map
          <LocationPicker
            v-model:lat="edit.latitude"
            v-model:lng="edit.longitude"
            locate-label="I'm at this branch now"
            height="220px"
            @address="onEditAddress"
          />
        </div>
        <label class="hb-label">City<input v-model="edit.city" class="hb-input" maxlength="100" /></label>
        <label class="hb-label">Address<input v-model="edit.address" class="hb-input" maxlength="255" /></label>
        <label class="hb-label">Phone<input v-model="edit.phone" class="hb-input" maxlength="20" /></label>
        <div class="hb-actions end">
          <button class="hb-btn ghost" :disabled="saving" @click="edit = null">Cancel</button>
          <button class="hb-btn" :disabled="saving || !edit.name.trim() || !edit.city.trim() || !edit.address.trim()" @click="saveEdit">
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Temporary password (shown once) -->
    <div v-if="tempPw" class="hb-modal" @click.self="tempPw = null">
      <div class="hb-modal-card">
        <h3 class="hb-title">Temporary password</h3>
        <p class="hb-sub">Share this securely with <strong>{{ tempPw.email }}</strong>. It is shown only once; they must change it at first sign-in.</p>
        <code class="hb-code">{{ tempPw.password }}</code>
        <div class="hb-actions end">
          <button class="hb-btn ghost" @click="copyPw">Copy</button>
          <button class="hb-btn" @click="tempPw = null">Done</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hb { display: flex; flex-direction: column; gap: 18px; max-width: 960px; }
.hb-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
.hb-title { font-size: 16px; font-weight: 700; color: #0f172a; margin: 0; }
.hb-sub { font-size: 13px; color: #64748b; margin: 2px 0 0; line-height: 1.45; max-width: 640px; }
.hb-need { font-size: 12px; color: #b91c1c; margin: 0; }
.hb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
.hb-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 4px; }
.hb-card.mine { border-color: #72B800; }
.hb-card.off { opacity: 0.7; }
.hb-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
.hb-name { font-size: 15px; font-weight: 700; margin: 0; color: #0f172a; }
.hb-tag { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 999px; background: #f1f5f9; color: #475569; white-space: nowrap; }
.hb-tag.main { background: #EEF9DC; color: #4D7C0F; }
.hb-tag.on { background: #dcfce7; color: #166534; }
.hb-tag.off { background: #fee2e2; color: #b91c1c; }
.hb-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
.hb-actions.end { justify-content: flex-end; }
.hb-section { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.hb-btn { padding: 9px 14px; border: none; border-radius: 10px; background: #0d1b2e; color: #fff; font-weight: 600; font-size: 13px; cursor: pointer; }
.hb-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.hb-btn.ghost { background: #f1f5f9; color: #0f172a; }
.hb-btn.danger { background: #fee2e2; color: #b91c1c; }
.hb-msg { padding: 10px 14px; border-radius: 10px; font-size: 14px; margin: 0; }
.hb-msg.ok { background: #dcfce7; color: #166534; }
.hb-msg.err { background: #fee2e2; color: #b91c1c; }
.hb-empty { color: #64748b; padding: 24px 0; }
.hb-modal { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); display: flex; align-items: center; justify-content: center; padding: 16px; z-index: 300; }
.hb-modal-card { background: #fff; border-radius: 14px; padding: 20px; max-width: 520px; width: 100%; max-height: calc(100vh - 32px); overflow-y: auto; box-sizing: border-box; display: flex; flex-direction: column; gap: 12px; }
.hb-label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; font-weight: 600; color: #334155; }
.hb-input { padding: 10px 12px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; font-family: inherit; }
.hb-code { display: block; padding: 12px; background: #f1f5f9; border-radius: 10px; font-size: 15px; word-break: break-all; }
</style>
