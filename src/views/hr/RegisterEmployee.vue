<template>
  <div class="page">
    <!-- Success banner -->
    <div v-if="success" class="banner-success">✓ {{ success }}</div>
    <!-- Error banner -->
    <div v-if="error" class="banner-error">{{ error }}</div>

    <div class="layout">
    <form @submit.prevent="submit" class="form-body">

      <!-- ── Personal Information ──────────────────────────────── -->
      <div class="form-card">
        <h2 class="section-title"><span class="sec-num">1</span>Personal information</h2>
        <div class="name-row">
          <div class="field">
            <label class="field-label">First name <span class="req">*</span></label>
            <input v-model="form.first_name" class="input" :class="{ 'input-error': errors.first_name }" placeholder="Employee's first name" />
            <p v-if="errors.first_name" class="err-msg">{{ errors.first_name }}</p>
          </div>
          <div class="field">
            <label class="field-label">Middle name <span class="req">*</span></label>
            <input v-model="form.middle_name" class="input" :class="{ 'input-error': errors.middle_name }" placeholder="Father's name" />
            <p v-if="errors.middle_name" class="err-msg">{{ errors.middle_name }}</p>
          </div>
          <div class="field">
            <label class="field-label">Last name <span class="req">*</span></label>
            <input v-model="form.last_name" class="input" :class="{ 'input-error': errors.last_name }" placeholder="Grandfather's name" />
            <p v-if="errors.last_name" class="err-msg">{{ errors.last_name }}</p>
          </div>
        </div>

        <div class="two-col">
          <div class="field">
            <label class="field-label">FAN number (Ethiopian national ID) <span class="req">*</span></label>
            <input
              v-model="form.fan_number"
              class="input input-full"
              :class="{ 'input-error': errors.fan_number }"
              placeholder="Digits only, e.g. 1234567890123"
              maxlength="20"
              @input="form.fan_number = form.fan_number.replace(/\D/g, '')"
            />
            <p v-if="errors.fan_number" class="err-msg">{{ errors.fan_number }}</p>
          </div>
          <div class="field">
            <label class="field-label">Date joined the company</label>
            <div class="date-wrap">
              <input v-model="form.joined_at" type="date" class="input input-full date-input-styled" />
              <svg class="date-icon" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Account Credentials ───────────────────────────────── -->
      <div class="form-card">
        <h2 class="section-title"><span class="sec-num">2</span>Sign-in details</h2>
        <p class="section-hint">The employee will use these to log in. They can change their password after first login.</p>

        <div class="field" style="margin-bottom: 24px;">
          <label class="field-label">E-mail address <span class="req">*</span></label>
          <input
            v-model="form.email"
            type="email"
            class="input input-full"
            :class="{ 'input-error': errors.email }"
            placeholder="Employee's e-mail address"
          />
          <p v-if="errors.email" class="err-msg">{{ errors.email }}</p>
        </div>

        <div class="two-col">
          <div class="field">
            <label class="field-label">Temporary password <span class="req">*</span></label>
            <div class="pw-wrap">
              <input
                v-model="form.temp_password"
                :type="showPw ? 'text' : 'password'"
                class="input input-full"
                :class="{ 'input-error': errors.temp_password }"
                placeholder="12+ characters, A-z, 0-9, symbol"
                autocomplete="new-password"
              />
              <button type="button" class="pw-toggle" @click="showPw = !showPw" :title="showPw ? 'Hide' : 'Show'">
                <svg v-if="!showPw" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
            <p v-if="errors.temp_password" class="err-msg">{{ errors.temp_password }}</p>
          </div>
          <div class="field">
            <label class="field-label">Confirm password <span class="req">*</span></label>
            <div class="pw-wrap">
              <input
                v-model="form.confirm_password"
                :type="showConfirm ? 'text' : 'password'"
                class="input input-full"
                :class="{ 'input-error': errors.confirm_password }"
                placeholder="Type the password again"
                autocomplete="new-password"
              />
              <button type="button" class="pw-toggle" @click="showConfirm = !showConfirm">
                <svg v-if="!showConfirm" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
            <p v-if="errors.confirm_password" class="err-msg">{{ errors.confirm_password }}</p>
          </div>
        </div>
      </div>

      <!-- ── Employee Photo ────────────────────────────────────── -->
      <div class="form-card">
        <h2 class="section-title"><span class="sec-num">3</span>Employee photo</h2>
        <div
          class="photo-zone"
          :class="{ 'photo-zone--over': isDragging, 'photo-zone--filled': photoPreview }"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @drop.prevent="handleDrop"
          @click="photoInput?.click()"
        >
          <img v-if="photoPreview" :src="photoPreview" class="photo-preview" />
          <template v-else>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5">
              <circle cx="12" cy="12" r="3" />
              <path d="M20.45 5.65A2 2 0 0 0 18.5 4H5.5a2 2 0 0 0-1.95 1.65L3 7H1v2h1l-1 10a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2L22 9h1V7h-2l-.55-1.35z" />
            </svg>
            <p class="photo-label">Drop photo here or <span class="browse-link">browse</span></p>
            <p class="photo-hint">JPG or PNG, max 5MB</p>
          </template>
        </div>
        <button v-if="photoPreview" type="button" class="remove-photo" @click="removePhoto">Remove photo</button>
        <input ref="photoInput" type="file" accept="image/jpg,image/jpeg,image/png" class="hidden" @change="handlePhotoSelect" />
      </div>

      <!-- ── Work Details ──────────────────────────────────────── -->
      <div class="form-card">
        <h2 class="section-title"><span class="sec-num">4</span>Work details</h2>
        <div class="two-col">
          <div class="field">
            <label class="field-label">Package <span class="req">*</span></label>
            <select v-model="form.package" class="input select" :class="{ 'input-error': errors.package }">
              <option value="">Select package…</option>
              <option v-for="p in plans" :key="p.tier" :value="p.tier">{{ p.name }}</option>
            </select>
            <p v-if="errors.package" class="err-msg">{{ errors.package }}</p>
          </div>
          <div class="field">
            <label class="field-label">Phone (optional)</label>
            <input v-model="form.phone" type="tel" class="input" placeholder="+251 9xx xxx xxx" />
          </div>
        </div>
        <div v-if="!myBranchId && branchOptions.length" class="field">
          <label class="field-label">Branch (optional)</label>
          <select v-model="form.company_branch_id" class="input select">
            <option value="">Head office</option>
            <option v-for="b in branchOptions" :key="b.id" :value="String(b.id)">{{ b.name }}</option>
          </select>
        </div>
        <p v-else-if="myBranchId" class="section-hint">Employees you register are added to your branch.</p>
        <div class="two-col">
          <div class="field">
            <label class="field-label">Job title (optional)</label>
            <input v-model="form.job_title" class="input" placeholder="e.g. Accountant" />
          </div>
          <div class="field">
            <label class="field-label">Department (optional)</label>
            <input v-model="form.department" class="input" placeholder="e.g. Finance" />
          </div>
        </div>
      </div>

      <!-- ── Payment Preference ────────────────────────────────── -->
      <div class="form-card">
        <h2 class="section-title"><span class="sec-num">5</span>Payment preference</h2>
        <p class="section-hint">Choose how your company will settle the invoice for this employee.</p>
        <p v-if="errors.payment_preference" class="err-msg" style="margin-bottom: 10px;">{{ errors.payment_preference }}</p>

        <div class="pay-options">
          <button
            type="button"
            class="pay-option"
            :class="{ 'pay-option--selected': form.payment_preference === 'pay_now' }"
            @click="form.payment_preference = 'pay_now'"
          >
            <div class="pay-icon">💳</div>
            <div class="pay-info">
              <p class="pay-title">Pay Now</p>
              <p class="pay-desc">Admin will be notified to generate an invoice immediately. Account activates after payment.</p>
            </div>
            <div class="pay-check" :class="{ 'pay-check--on': form.payment_preference === 'pay_now' }">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </button>

          <button
            type="button"
            class="pay-option"
            :class="{ 'pay-option--selected': form.payment_preference === 'pay_later' }"
            @click="form.payment_preference = 'pay_later'"
          >
            <div class="pay-icon">🗓️</div>
            <div class="pay-info">
              <p class="pay-title">Pay Later</p>
              <p class="pay-desc">Invoice will be included in the next billing cycle. Admin approves account when invoice is settled.</p>
            </div>
            <div class="pay-check" :class="{ 'pay-check--on': form.payment_preference === 'pay_later' }">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </button>
        </div>
      </div>

      <!-- Submit -->
      <div class="form-actions">
        <button type="button" class="btn-cancel" @click="reset">Clear Form</button>
        <button type="submit" class="btn-submit" :disabled="loading">
          <span v-if="loading">Registering…</span>
          <span v-else>Register Employee</span>
        </button>
      </div>
    </form>

    <!-- ── Live preview + what happens next ─────────────────────── -->
    <aside class="side">
      <div class="side-card preview">
        <p class="side-kicker">Preview</p>
        <div class="pv-person">
          <div class="pv-avatar">
            <img v-if="photoPreview" :src="photoPreview" alt="" />
            <span v-else>{{ initials || '?' }}</span>
          </div>
          <div class="pv-text">
            <p class="pv-name">{{ fullName || 'New employee' }}</p>
            <p class="pv-sub">{{ [form.job_title, form.department].filter(Boolean).join(' · ') || 'Job title · Department' }}</p>
            <p class="pv-mail">{{ form.email || 'e-mail address' }}</p>
          </div>
        </div>
        <div class="pv-card"><FitCard :plan="planName || 'Package'" /></div>
        <ul class="pv-facts">
          <li><span>FAN</span><strong>{{ form.fan_number || '—' }}</strong></li>
          <li><span>Package</span><strong>{{ planName || '—' }}</strong></li>
          <li><span>Payment</span><strong>{{ form.payment_preference === 'pay_now' ? 'Pay now' : form.payment_preference === 'pay_later' ? 'Pay later' : '—' }}</strong></li>
        </ul>
        <div class="pv-progress" :aria-label="`${filledCount} of ${requiredCount} required fields filled`">
          <div class="pv-bar"><span :style="{ width: `${Math.round((filledCount / requiredCount) * 100)}%` }"></span></div>
          <p>{{ filledCount }} of {{ requiredCount }} required fields filled</p>
        </div>
      </div>

      <div class="side-card next">
        <p class="side-kicker">What happens next</p>
        <ol class="steps">
          <li><span>1</span>FitAccess gives final approval once the payment is settled.</li>
          <li><span>2</span>FitAccess sends the employee's card number to you.</li>
          <li><span>3</span>You press <strong>Send card</strong> on the Employees page to e-mail it to them.</li>
          <li><span>4</span>The employee signs in and enters the number to activate their card.</li>
        </ol>
      </div>
    </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useApi } from '@/composables/useApi'
import FitCard from '@/components/employee/FitCard.vue'

const auth = useAuthStore()
const api  = useApi()

// Head office can place a new employee in any branch; a branch login always uses its own
const myBranchId = useAuthStore().user?.company_branch_id ?? null
const branchOptions = ref<{ id: number; name: string }[]>([])
onMounted(async () => {
  try {
    branchOptions.value = (await api.get<{ branches: { id: number; name: string; is_active: boolean }[] }>('hr/branches'))
      .branches.filter((b) => b.is_active)
  } catch { /* branch list is optional */ }
})

interface Plan { id: number; name: string; tier: string; is_active: boolean }
const plans = ref<Plan[]>([])
onMounted(async () => {
  try {
    const res = await api.get<Plan[]>('membership-plans')
    plans.value = Array.isArray(res) ? res : []
  } catch { plans.value = [] }
})

const form = reactive({
  first_name: '',
  middle_name: '',
  last_name: '',
  fan_number: '',
  email: '',
  temp_password: '',
  confirm_password: '',
  package: '',
  payment_preference: '' as '' | 'pay_now' | 'pay_later',
  job_title: '',
  department: '',
  company_branch_id: '',
  phone: '',
  joined_at: new Date().toISOString().slice(0, 10),
})

// Live preview in the side panel
const fullName = computed(() => [form.first_name, form.middle_name, form.last_name].filter(Boolean).join(' '))
const initials = computed(() => [form.first_name, form.last_name].filter(Boolean).map((s) => s[0]).join('').toUpperCase())
const planName = computed(() => plans.value.find((p) => p.tier === form.package)?.name ?? '')
const REQUIRED = ['first_name', 'middle_name', 'last_name', 'fan_number', 'email', 'temp_password', 'confirm_password', 'package', 'payment_preference'] as const
const requiredCount = REQUIRED.length
const filledCount = computed(() => REQUIRED.filter((k) => !!form[k]).length)

const errors     = reactive<Record<string, string>>({})
const loading    = ref(false)
const success    = ref('')
const error      = ref('')
const isDragging = ref(false)
const photoFile  = ref<File | null>(null)
const photoPreview = ref<string | null>(null)
const photoInput = ref<HTMLInputElement | null>(null)
const showPw      = ref(false)
const showConfirm = ref(false)

function handlePhotoSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) setPhoto(file)
}
function handleDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) setPhoto(file)
}
function setPhoto(file: File) {
  photoFile.value = file
  photoPreview.value = URL.createObjectURL(file)
}
function removePhoto() {
  photoFile.value = null
  photoPreview.value = null
  if (photoInput.value) photoInput.value.value = ''
}

function validate(): boolean {
  Object.keys(errors).forEach((k) => delete errors[k])
  if (!form.first_name)  errors.first_name  = 'First name is required.'
  if (!form.middle_name) errors.middle_name = 'Middle name is required.'
  if (!form.last_name)   errors.last_name   = 'Last name is required.'

  if (!form.fan_number) errors.fan_number = 'FAN number is required.'
  else if (form.fan_number.length < 5 || form.fan_number.length > 20)
    errors.fan_number = 'FAN number must be between 5 and 20 digits.'

  if (!form.email) errors.email = 'Email address is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = 'Please enter a valid email address.'

  if (!form.temp_password) errors.temp_password = 'Temporary password is required.'
  // Same rule as the server (StrongPassword)
  else if (form.temp_password.length < 12) errors.temp_password = 'Password must be at least 12 characters.'
  else if (!/[A-Z]/.test(form.temp_password) || !/[a-z]/.test(form.temp_password) || !/\d/.test(form.temp_password) || !/[^A-Za-z0-9]/.test(form.temp_password))
    errors.temp_password = 'Use upper- and lower-case letters, a number and a symbol.'

  if (!form.confirm_password) errors.confirm_password = 'Please confirm the password.'
  else if (form.temp_password !== form.confirm_password)
    errors.confirm_password = 'Passwords do not match.'

  if (!form.package) errors.package = 'Please select a package.'

  if (!form.payment_preference) errors.payment_preference = 'Please select a payment preference.'

  return Object.keys(errors).length === 0
}

async function submit() {
  success.value = ''
  error.value   = ''
  if (!validate()) return

  loading.value = true
  try {
    const fd = new FormData()
    fd.append('first_name',         form.first_name)
    fd.append('middle_name',        form.middle_name)
    fd.append('last_name',          form.last_name)
    fd.append('fan_number',         form.fan_number)
    fd.append('email',              form.email)
    fd.append('temp_password',      form.temp_password)
    fd.append('payment_preference', form.payment_preference)
    fd.append('package',            form.package)
    if (form.company_branch_id) fd.append('company_branch_id', form.company_branch_id)
    if (form.job_title)   fd.append('job_title',   form.job_title)
    if (form.department)  fd.append('department',  form.department)
    if (form.phone)       fd.append('phone',       form.phone)
    if (form.joined_at)   fd.append('joined_at',   form.joined_at)
    if (photoFile.value)  fd.append('photo',       photoFile.value)

    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/hr/employees`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${auth.token}`,
      },
      body: fd,
    })

    const data = await res.json()

    if (!res.ok) {
      if (res.status === 422 && data.errors) {
        Object.entries(data.errors).forEach(([k, msgs]) => {
          errors[k] = ((msgs as string[])[0]) ?? ''
        })
        error.value = 'Please fix the errors above.'
      } else {
        error.value = data.message ?? 'Registration failed.'
      }
      return
    }

    success.value = data.message ?? 'Employee registered successfully.'
    reset()
  } catch {
    error.value = 'Network error. Please try again.'
  } finally {
    loading.value = false
  }
}

function reset() {
  Object.assign(form, {
    first_name: '', middle_name: '', last_name: '',
    fan_number: '', email: '', temp_password: '', confirm_password: '',
    package: '', payment_preference: '',
    job_title: '', department: '', phone: '', company_branch_id: '',
    joined_at: new Date().toISOString().slice(0, 10),
  })
  Object.keys(errors).forEach((k) => delete errors[k])
  removePhoto()
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 20px; max-width: 1240px; }

/* Form on the left, live preview + next steps on the right */
.layout { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 22px; align-items: start; }
.side { position: sticky; top: 20px; display: flex; flex-direction: column; gap: 18px; }
.side-card { background: #fff; border-radius: 22px; padding: 24px; border: 1px solid #eef0ea; box-shadow: 0 1px 4px rgba(0,0,0,.05); }
.side-kicker { margin: 0 0 16px; font-size: 12px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #6b7280; }
.preview { background: linear-gradient(180deg, #f3fce6 0%, #fff 55%); }
.pv-person { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
.pv-avatar {
  width: 54px; height: 54px; flex-shrink: 0; border-radius: 50%; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: #0b0c10; color: #8be000; font-weight: 800; font-size: 18px;
}
.pv-avatar img { width: 100%; height: 100%; object-fit: cover; }
.pv-text { min-width: 0; }
.pv-name { margin: 0; font-family: var(--font-heading); font-weight: 700; font-size: 17px; color: #0b0c10; overflow-wrap: anywhere; }
.pv-sub, .pv-mail { margin: 2px 0 0; font-size: 13px; color: #6b7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pv-card { display: flex; justify-content: center; margin-bottom: 18px; }
.pv-facts { list-style: none; margin: 0 0 18px; padding: 0; }
.pv-facts li { display: flex; justify-content: space-between; gap: 12px; padding: 9px 0; border-bottom: 1px solid #f0f1ec; font-size: 13.5px; color: #6b7280; }
.pv-facts li:last-child { border-bottom: none; }
.pv-facts strong { color: #0b0c10; text-align: right; overflow-wrap: anywhere; }
.pv-bar { height: 8px; border-radius: 999px; background: #eef0ea; overflow: hidden; }
.pv-bar span { display: block; height: 100%; background: #8be000; border-radius: 999px; transition: width .25s ease; }
.pv-progress p { margin: 8px 0 0; font-size: 12.5px; color: #6b7280; }
.steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 14px; }
.steps li { display: flex; gap: 12px; font-size: 13.5px; line-height: 1.5; color: #374151; }
.steps li span {
  flex-shrink: 0; width: 24px; height: 24px; border-radius: 50%; margin-top: 1px;
  display: inline-flex; align-items: center; justify-content: center;
  background: #f3fce6; border: 1.5px solid #8be000; color: #3f6b00; font-size: 12px; font-weight: 800;
}
@media (max-width: 1100px) {
  .layout { grid-template-columns: 1fr; }
  .side { position: static; order: -1; }
  .next { display: none; }
}

.banner-success {
  padding: 12px 16px; background: #d1fae5; border: 1px solid #a7f3d0;
  border-radius: 10px; color: #72B800; font-size: 0.88rem; font-weight: 500;
}
.banner-error {
  padding: 12px 16px; background: #fee2e2; border: 1px solid #fecaca;
  border-radius: 10px; color: #dc2626; font-size: 0.88rem;
}

/* Same look as the Log in / sign-up forms: floating label on the border,
   pill inputs, icons for e-mail and password, black → lime buttons. */
.form-body   { display: flex; flex-direction: column; gap: 18px; }
.form-card   { background: white; border-radius: 22px; padding: 28px 28px 30px; box-shadow: 0 1px 4px rgba(0,0,0,.05); border: 1px solid #eef0ea; }
.section-title {
  display: flex; align-items: center; gap: 10px;
  font-family: var(--font-heading); font-size: 1.05rem; font-weight: 700; color: #0b0c10;
  margin: 0 0 22px;
}
.sec-num {
  display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px;
  border-radius: 50%; background: #0b0c10; color: #8be000; font-size: 0.78rem; font-weight: 800;
}
.section-hint { font-size: 0.85rem; color: #6b7280; margin: -12px 0 22px; }
.req { color: #dc2626; }

.name-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px 14px; margin-bottom: 24px; }
.two-col  { display: grid; grid-template-columns: 1fr 1fr; gap: 24px 14px; margin-bottom: 24px; }
.two-col:last-child, .name-row:last-child { margin-bottom: 0; }

/* Floating label */
.field { position: relative; display: flex; flex-direction: column; gap: 6px; }
.field-label {
  position: absolute; top: -9px; left: 20px; z-index: 2; max-width: calc(100% - 40px);
  padding: 0 8px; background: #fff; border-radius: 999px;
  font-size: 12.5px; font-weight: 500; color: #374151; line-height: 18px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.input {
  padding: 15px 22px; background-color: #fff; border: 1.5px solid #dfe3d8;
  border-radius: 999px; font-size: 15px; color: #111827; outline: none;
  transition: border-color .15s, box-shadow .15s, background-color .15s;
  font-family: inherit; width: 100%; box-sizing: border-box;
}
.input::placeholder { color: #9ca3af; }
.input:hover { border-color: #b9c2ab; }
.input:focus { border-color: #0b0c10; background-color: #fff; box-shadow: 0 0 0 4px rgba(139, 224, 0, .3); }
.input-error, .input-error:focus { border-color: #fca5a5; box-shadow: 0 0 0 4px rgba(239, 68, 68, .12); }
.input-full   { width: 100%; box-sizing: border-box; }
.err-msg { font-size: 12.5px; color: #dc2626; margin: 0; padding-left: 22px; }

/* E-mail and password icons on the left */
.input[type='email'], .pw-wrap .input {
  padding-left: 54px; background-repeat: no-repeat; background-position: 22px center; background-size: 19px 19px;
}
.input[type='email'] {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect x='2.5' y='5' width='19' height='14' rx='2' fill='%23707070'/%3E%3Cpath d='M3.5 6.5l8.5 6.5 8.5-6.5' fill='none' stroke='%23fff' stroke-width='1.6' stroke-linejoin='round'/%3E%3C/svg%3E");
}
.pw-wrap .input {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect x='4.5' y='10.5' width='15' height='10' rx='2' fill='%23707070'/%3E%3Cpath d='M8 10.5V8a4 4 0 0 1 8 0v2.5' fill='none' stroke='%23707070' stroke-width='2'/%3E%3C/svg%3E");
}

/* Selects: own arrow inside the pill */
.select {
  appearance: none; -webkit-appearance: none; cursor: pointer; padding-right: 50px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 22px center; background-size: 16px 16px;
}

/* Password field with eye toggle */
.pw-wrap { position: relative; }
.pw-wrap .input { padding-right: 54px; }
.pw-toggle {
  position: absolute; right: 18px; top: 50%; transform: translateY(-50%);
  background: none; border: none; color: #9ca3af; cursor: pointer; padding: 4px;
  display: flex; align-items: center; justify-content: center;
}
.pw-toggle:hover { color: #0b0c10; }

/* Date input */
.date-wrap { position: relative; width: 100%; }
.date-input-styled { padding-right: 50px !important; cursor: pointer; color-scheme: light; }
.date-icon { position: absolute; right: 22px; top: 50%; transform: translateY(-50%); color: #6b7280; pointer-events: none; }
.date-input-styled::-webkit-calendar-picker-indicator { opacity: 0; cursor: pointer; position: absolute; right: 0; top: 0; width: 56px; height: 100%; }

/* Photo zone */
.photo-zone {
  border: 2px dashed #d9e2c8; border-radius: 22px; padding: 40px 20px; background: #fafcf6;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; cursor: pointer; transition: border-color .15s, background .15s; min-height: 160px;
}
.photo-zone:hover, .photo-zone--over { border-color: #8BE000; background: #f3fce6; }
.photo-zone--filled { padding: 12px; }
.photo-label { font-size: 0.9rem; color: #4b5563; margin: 0; }
.browse-link { color: #0b0c10; font-weight: 700; text-decoration: underline; text-decoration-color: #8be000; text-underline-offset: 3px; }
.photo-hint  { font-size: 0.72rem; color: #94a3b8; margin: 0; }
.photo-preview { max-height: 180px; border-radius: 10px; object-fit: cover; }
.remove-photo { margin-top: 8px; background: none; border: none; color: #ef4444; font-size: 0.78rem; cursor: pointer; }
.remove-photo:hover { text-decoration: underline; }
.hidden { display: none; }

/* Payment preference */
.pay-options { display: flex; flex-direction: column; gap: 10px; }
.pay-option {
  display: flex; align-items: flex-start; gap: 14px;
  padding: 18px 20px; border: 2px solid #e5e7eb; border-radius: 18px;
  background: white; cursor: pointer; text-align: left; font-family: inherit;
  transition: border-color .15s, background .15s; width: 100%;
}
.pay-option:hover { border-color: #94a3b8; background: #f8fafc; }
.pay-option--selected { border-color: #8BE000; background: #f3fce6; }
.pay-icon  { font-size: 1.5rem; flex-shrink: 0; line-height: 1; margin-top: 2px; }
.pay-info  { flex: 1; }
.pay-title { font-size: 0.9rem; font-weight: 700; color: #0f172a; margin: 0 0 4px; }
.pay-desc  { font-size: 0.78rem; color: #64748b; margin: 0; line-height: 1.5; }
.pay-check {
  width: 20px; height: 20px; border-radius: 50%; border: 2px solid #e2e8f0;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  margin-top: 2px; color: white; transition: all .15s;
}
.pay-check--on { background: #8BE000; border-color: #8BE000; }

/* Submit row */
.form-actions { display: flex; gap: 12px; justify-content: flex-end; }
.btn-cancel {
  padding: 15px 26px; background: white; border: 1.5px solid #e5e7eb;
  border-radius: 999px; color: #374151; font-size: 15px; font-weight: 600; font-family: inherit;
  cursor: pointer; transition: border-color .15s;
}
.btn-cancel:hover { border-color: #0b0c10; }
.btn-submit {
  min-width: 220px; padding: 15px 34px; background: #0b0c10; border: none; border-radius: 999px;
  color: #fff; font-size: 15px; font-weight: 700; font-family: inherit; cursor: pointer;
  transition: background .15s, color .15s;
}
.btn-submit:disabled { background: #e5e7eb; color: #9ca3af; cursor: default; }
.btn-submit:not(:disabled):hover { background: #8BE000; color: #0b0c10; }

@media (max-width: 600px) {
  .name-row { grid-template-columns: 1fr; gap: 24px; }
  .two-col  { grid-template-columns: 1fr; }
  .form-card { padding: 24px 18px; }
  .form-actions { flex-direction: column-reverse; }
  .btn-submit, .btn-cancel { width: 100%; }
}
</style>
