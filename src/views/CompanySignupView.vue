<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// -- Step state -------------------------------------------------------------
const step = ref(1)
const TOTAL_STEPS = 3

// -- Step 1: Company Info ----------------------------------------------------
const companyName = ref('')
const industry = ref('')
const companySize = ref('')
const tin = ref('')
const preferredPayment = ref('')
const licenseFile = ref<File | null>(null)
const licensePreview = ref('')
const licenseError = ref('')

function onLicenseChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  licenseError.value = ''
  if (!file) {
    licenseFile.value = null
    licensePreview.value = ''
    return
  }

  const allowed = ['application/pdf', 'image/jpeg', 'image/png']
  if (!allowed.includes(file.type)) {
    licenseError.value = 'Only PDF, JPG, or PNG files are accepted.'
    input.value = ''
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    licenseError.value = 'File must be under 5 MB.'
    input.value = ''
    return
  }

  licenseFile.value = file
  licensePreview.value = file.type === 'application/pdf' ? 'pdf' : URL.createObjectURL(file)
}

function removeLicense() {
  licenseFile.value = null
  licensePreview.value = ''
  licenseError.value = ''
}

const industries = [
  { value: 'banking', label: 'Banking & Finance' },
  { value: 'telecom', label: 'Telecom & Technology' },
  { value: 'airline', label: 'Aviation & Transport' },
  { value: 'government', label: 'Government & Public Sector' },
  { value: 'ngo', label: 'NGO / International Organisation' },
  { value: 'hospital', label: 'Healthcare & Pharmaceuticals' },
  { value: 'real_estate', label: 'Manufacturing & Industry' },
  { value: 'international_school', label: 'Education' },
  { value: 'tech', label: 'Tech & IT' },
  { value: 'embassy', label: 'Embassy / Diplomatic Mission' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'other', label: 'Other' },
]

const paymentMethods = [
  { value: 'cbe_transfer', label: 'Bank Transfer / CBE' },
  { value: 'telebirr_enterprise', label: 'Telebirr Enterprise' },
  { value: 'awash_bank', label: 'Awash Bank' },
  { value: 'chapa', label: 'Chapa' },
  { value: 'cash', label: 'Cash' },
  { value: 'other', label: 'Other' },
]
const companySizes = ['10 – 50', '51 – 200', '201 – 500', '501 – 1,000', '1,000+']

// -- Step 2: Contact Person --------------------------------------------------
const fullName = ref('')
const jobTitle = ref('')
const workEmail = ref('')
const phone = ref('')

// -- Step 3: Account ---------------------------------------------------------
const password = ref('')
const confirmPassword = ref('')
const showPass = ref(false)
const showConfirm = ref(false)
const agreeTerms = ref(false)
const loading = ref(false)
const error = ref('')

// -- Password strength rules --------------------------------------------------
const strengthRules = computed(() => [
  { id: 'len', label: 'At least 8 characters', ok: password.value.length >= 8 },
  { id: 'upper', label: 'One uppercase letter (A–Z)', ok: /[A-Z]/.test(password.value) },
  { id: 'lower', label: 'One lowercase letter (a–z)', ok: /[a-z]/.test(password.value) },
  { id: 'number', label: 'One number (0–9)', ok: /[0-9]/.test(password.value) },
  { id: 'special', label: 'One special character (!@#…)', ok: /[^A-Za-z0-9]/.test(password.value) },
])

const strengthScore = computed(() => strengthRules.value.filter((r) => r.ok).length) // 0–5

const strengthLabel = computed(() => {
  const s = strengthScore.value
  if (s <= 1) return { text: 'Very weak', color: '#dc2626' }
  if (s === 2) return { text: 'Weak', color: '#2EB84B' }
  if (s === 3) return { text: 'Fair', color: '#eab308' }
  if (s === 4) return { text: 'Strong', color: '#22c55e' }
  return { text: 'Very strong', color: '#16a34a' }
})

const passwordStrong = computed(() => strengthScore.value === 5)

// -- Validation --------------------------------------------------------------
const step1Valid = computed(
  () => companyName.value.trim() && industry.value && companySize.value && !!licenseFile.value
)
const step2Valid = computed(() => {
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(workEmail.value)
  const phoneOk = /^\d{9}$/.test(phone.value.replace(/\s/g, ''))
  return fullName.value.trim() && jobTitle.value.trim() && emailOk && phoneOk
})
const passwordMatch = computed(
  () =>
    passwordStrong.value &&
    confirmPassword.value.length > 0 &&
    password.value === confirmPassword.value
)
const step3Valid = computed(() => passwordMatch.value && agreeTerms.value)

const canProceed = computed(() => {
  if (step.value === 1) return step1Valid.value
  if (step.value === 2) return step2Valid.value
  return step3Valid.value
})

function next() {
  if (!canProceed.value) return
  error.value = ''
  step.value++
}
function back() {
  error.value = ''
  step.value--
}

async function handleSubmit() {
  if (!step3Valid.value) return
  loading.value = true
  error.value = ''
  try {
    // Use FormData so the binary licence file is included in the upload
    const fd = new FormData()
    fd.append('company_name', companyName.value)
    fd.append('industry', industry.value)
    fd.append('company_size', companySize.value)
    fd.append('tin', tin.value)
    if (preferredPayment.value) fd.append('preferred_payment_method', preferredPayment.value)
    fd.append('contact_name', fullName.value)
    fd.append('job_title', jobTitle.value)
    fd.append('email', workEmail.value)
    fd.append('phone', '+251' + phone.value.replace(/\s/g, ''))
    fd.append('password', password.value)
    if (licenseFile.value) {
      fd.append('business_license', licenseFile.value)
    }

    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/register/company`, {
      method: 'POST',
      headers: { Accept: 'application/json' }, // no Content-Type — browser sets multipart boundary
      body: fd,
    })
    if (!res.ok) {
      const data = await res.json()
      // Surface first Laravel validation error if present
      const firstError = data.errors
        ? (Object.values(data.errors as Record<string, string[]>)[0]?.[0] ?? 'Validation error')
        : data.message
      throw new Error(firstError || 'Registration failed. Please try again.')
    }
    router.push('/login?registered=company')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Something went wrong.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="signup-page">
    <div class="signup-card">
      <!-- Brand -->
      <div class="brand">
        <span class="brand-name">FitAccess</span>
      </div>

      <!-- Progress Bar -->
      <div class="progress-wrap">
        <div class="progress-steps">
          <div
            v-for="n in TOTAL_STEPS"
            :key="n"
            class="progress-step"
            :class="{ done: n < step, active: n === step }"
          >
            <div class="step-dot">
              <svg
                v-if="n < step"
                width="12"
                height="12"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                viewBox="0 0 24 24"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
              <span v-else>{{ n }}</span>
            </div>
            <span class="step-label">
              {{ ['Company Info', 'Contact', 'Account'][n - 1] }}
            </span>
          </div>
        </div>
        <div class="progress-track">
          <div
            class="progress-fill"
            :style="{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }"
          ></div>
        </div>
      </div>

      <!-- -- STEP 1: Company Info -- -->
      <div v-if="step === 1" class="card-body">
        <h1 class="heading">Register your company</h1>
        <p class="subtext">Tell us about your Ethiopian organisation. All billing is in ETB.</p>

        <div class="fields">
          <div class="field-group">
            <label class="field-label">Company Name <span class="req">*</span></label>
            <input
              v-model="companyName"
              type="text"
              class="input"
              placeholder="e.g. Commercial Bank of Ethiopia"
            />
          </div>

          <div class="field-group">
            <label class="field-label">Industry <span class="req">*</span></label>
            <div class="select-wrap">
              <select v-model="industry" class="input select-input">
                <option value="" disabled>Select your industry</option>
                <option v-for="ind in industries" :key="ind.value" :value="ind.value">
                  {{ ind.label }}
                </option>
              </select>
              <svg
                class="select-arrow"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </div>

          <div class="field-row">
            <div class="field-group">
              <label class="field-label">Number of Employees <span class="req">*</span></label>
              <div class="select-wrap">
                <select v-model="companySize" class="input select-input">
                  <option value="" disabled>Select size</option>
                  <option v-for="s in companySizes" :key="s" :value="s">{{ s }}</option>
                </select>
                <svg
                  class="select-arrow"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>
            <div class="field-group">
              <label class="field-label">TIN Number <span class="optional">(optional)</span></label>
              <input v-model="tin" type="text" class="input" placeholder="Tax ID Number" />
            </div>
          </div>

          <!-- -- Preferred Payment Method -- -->
          <div class="field-group">
            <label class="field-label"
              >Preferred Payment Method <span class="optional">(optional)</span></label
            >
            <div class="select-wrap">
              <select v-model="preferredPayment" class="input select-input">
                <option value="">Select payment method…</option>
                <option v-for="pm in paymentMethods" :key="pm.value" :value="pm.value">
                  {{ pm.label }}
                </option>
              </select>
              <svg
                class="select-arrow"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </div>

          <!-- -- Business Licence Upload -- -->
          <div class="field-group">
            <label class="field-label">
              Business Licence <span class="req">*</span>
              <span class="field-hint-inline">PDF, JPG or PNG · max 5 MB</span>
            </label>

            <!-- Empty state: drop zone -->
            <div
              v-if="!licenseFile"
              class="upload-zone"
              :class="{ 'upload-zone-error': licenseError }"
              @click="($refs.licenseInput as HTMLInputElement).click()"
              @dragover.prevent
              @drop.prevent="e => { ($refs.licenseInput as HTMLInputElement).files = e.dataTransfer?.files ?? null; onLicenseChange({ target: $refs.licenseInput } as unknown as Event) }"
            >
              <div class="upload-icon">
                <svg
                  width="28"
                  height="28"
                  fill="none"
                  stroke="#94a3b8"
                  stroke-width="1.5"
                  viewBox="0 0 24 24"
                >
                  <polyline points="16 16 12 12 8 16" />
                  <line x1="12" y1="12" x2="12" y2="21" />
                  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                </svg>
              </div>
              <div class="upload-text">
                <span class="upload-cta">Click to upload</span> or drag & drop
              </div>
              <div class="upload-sub">
                Renewed business licence — issued by Addis Ababa Trade Bureau
              </div>
              <input
                ref="licenseInput"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                class="upload-input-hidden"
                @change="onLicenseChange"
              />
            </div>

            <!-- Filled state: preview -->
            <div v-else class="upload-preview">
              <!-- PDF preview -->
              <div v-if="licensePreview === 'pdf'" class="preview-pdf">
                <span class="preview-pdf-icon"
                  ><svg
                    width="28"
                    height="28"
                    fill="none"
                    stroke="#94a3b8"
                    stroke-width="1.5"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" /></svg
                ></span>
                <div class="preview-info">
                  <span class="preview-name">{{ licenseFile.name }}</span>
                  <span class="preview-size"
                    >{{ (licenseFile.size / 1024).toFixed(0) }} KB · PDF</span
                  >
                </div>
              </div>
              <!-- Image preview -->
              <img v-else :src="licensePreview" alt="Licence preview" class="preview-img" />

              <button
                type="button"
                class="preview-remove"
                @click="removeLicense"
                aria-label="Remove file"
              >
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  viewBox="0 0 24 24"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p v-if="licenseError" class="field-hint error-hint">{{ licenseError }}</p>
            <p v-else class="field-hint">
              Your licence will be reviewed by the FitAccess team (2–3 business days) before your
              account is activated.
            </p>
          </div>
        </div>

        <div class="actions">
          <button
            class="btn-next"
            :class="{ active: step1Valid }"
            :disabled="!step1Valid"
            @click="next"
          >
            Continue
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              viewBox="0 0 24 24"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <p class="signin-link">
          Already have an account? <RouterLink to="/login">Sign in</RouterLink>
        </p>
      </div>

      <!-- -- STEP 2: Contact Person -- -->
      <div v-else-if="step === 2" class="card-body">
        <button class="back-btn" @click="back">
          <svg
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            viewBox="0 0 24 24"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 class="heading">Contact person</h1>
        <p class="subtext">Who should we reach out to about your FitAccess account?</p>

        <div class="fields">
          <div class="field-row">
            <div class="field-group">
              <label class="field-label">Full Name <span class="req">*</span></label>
              <input v-model="fullName" type="text" class="input" placeholder="e.g. Tigist Haile" />
            </div>
            <div class="field-group">
              <label class="field-label">Job Title <span class="req">*</span></label>
              <input v-model="jobTitle" type="text" class="input" placeholder="e.g. HR Director" />
            </div>
          </div>

          <div class="field-group">
            <label class="field-label">Work Email <span class="req">*</span></label>
            <input
              v-model="workEmail"
              type="email"
              class="input"
              placeholder="tigist@company.com.et"
              autocomplete="email"
            />
          </div>

          <div class="field-group">
            <label class="field-label">Phone Number <span class="req">*</span></label>
            <div class="phone-wrap">
              <div class="phone-prefix">
                <span class="flag">🇪🇹</span>
                <span>+251</span>
              </div>
              <input
                v-model="phone"
                type="tel"
                class="input phone-input"
                placeholder="91 123 4567"
                maxlength="11"
              />
            </div>
            <p class="field-hint">Enter 9-digit Ethiopian mobile number (e.g. 911234567)</p>
          </div>
        </div>

        <div class="actions">
          <button
            class="btn-next"
            :class="{ active: step2Valid }"
            :disabled="!step2Valid"
            @click="next"
          >
            Continue
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              viewBox="0 0 24 24"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <!-- -- STEP 3: Create Account -- -->
      <div v-else class="card-body">
        <button class="back-btn" @click="back">
          <svg
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            viewBox="0 0 24 24"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 class="heading">Create your password</h1>
        <p class="subtext">
          Almost done! Set a secure password for <strong>{{ workEmail }}</strong>
        </p>

        <div class="fields">
          <!-- Password field -->
          <div class="field-group">
            <label class="field-label">Password <span class="req">*</span></label>
            <div class="pass-wrap">
              <input
                v-model="password"
                :type="showPass ? 'text' : 'password'"
                class="input"
                :class="{ 'input-error': password && !passwordStrong, 'input-ok': passwordStrong }"
                placeholder="Create a strong password"
                autocomplete="new-password"
              />
              <button class="toggle-pass" type="button" @click="showPass = !showPass" tabindex="-1">
                <svg
                  v-if="!showPass"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <svg
                  v-else
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
                  />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              </button>
            </div>

            <!-- Strength meter (visible once user starts typing) -->
            <div v-if="password.length > 0" class="strength-wrap">
              <!-- Coloured bar segments -->
              <div class="strength-bar">
                <div
                  v-for="n in 5"
                  :key="n"
                  class="strength-segment"
                  :style="{
                    background: n <= strengthScore ? strengthLabel.color : '#e5e7eb',
                    transition: `background 0.25s ease ${(n - 1) * 0.05}s`,
                  }"
                ></div>
              </div>
              <!-- Score label -->
              <span class="strength-score-label" :style="{ color: strengthLabel.color }">
                {{ strengthLabel.text }}
              </span>

              <!-- Requirement checklist -->
              <ul class="strength-rules">
                <li
                  v-for="rule in strengthRules"
                  :key="rule.id"
                  class="strength-rule"
                  :class="{ 'rule-ok': rule.ok, 'rule-fail': !rule.ok }"
                >
                  <span class="rule-icon">
                    <svg
                      v-if="rule.ok"
                      width="13"
                      height="13"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="3"
                      viewBox="0 0 24 24"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    <svg
                      v-else
                      width="13"
                      height="13"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="3"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="12" cy="12" r="9" />
                    </svg>
                  </span>
                  {{ rule.label }}
                </li>
              </ul>
            </div>
          </div>

          <!-- Confirm password -->
          <div class="field-group">
            <label class="field-label">Confirm Password <span class="req">*</span></label>
            <div class="pass-wrap">
              <input
                v-model="confirmPassword"
                :type="showConfirm ? 'text' : 'password'"
                class="input"
                :class="{
                  'input-error': confirmPassword && password !== confirmPassword,
                  'input-ok': confirmPassword && password === confirmPassword && passwordStrong,
                }"
                placeholder="Repeat your password"
                autocomplete="new-password"
              />
              <button
                class="toggle-pass"
                type="button"
                @click="showConfirm = !showConfirm"
                tabindex="-1"
              >
                <svg
                  v-if="!showConfirm"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <svg
                  v-else
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
                  />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              </button>
            </div>
            <p v-if="confirmPassword && password !== confirmPassword" class="field-hint error-hint">
              Passwords do not match.
            </p>
            <p
              v-else-if="confirmPassword && password === confirmPassword && passwordStrong"
              class="field-hint ok-hint"
            >
              ? Passwords match
            </p>
          </div>

          <label class="checkbox-row">
            <input v-model="agreeTerms" type="checkbox" class="checkbox" />
            <span
              >I agree to the <a href="#" class="link">Terms of Service</a> and
              <a href="#" class="link">Privacy Policy</a> of FitAccess Ethiopia.</span
            >
          </label>
        </div>

        <p v-if="error" class="error-msg">{{ error }}</p>

        <div class="actions">
          <button
            class="btn-next"
            :class="{ active: step3Valid && !loading }"
            :disabled="!step3Valid || loading"
            @click="handleSubmit"
          >
            <span v-if="loading" class="spinner"></span>
            <span v-else>Create Company Account</span>
          </button>
        </div>

        <p class="signin-link">
          Already have an account? <RouterLink to="/login">Sign in</RouterLink>
        </p>
      </div>
    </div>
    <!-- /card -->

    <!-- Footer -->
    <footer class="signup-footer">
      <p class="footer-notice">
        Protected by FitAccess Ethiopia &nbsp;·&nbsp;
        <a href="#">Privacy Policy</a> &nbsp;·&nbsp;
        <a href="#">Terms of Service</a>
      </p>
    </footer>
  </div>
</template>

<style scoped>
/* -- Page -------------------------------------------------- */
.signup-page {
  min-height: 100vh;
  background: #f0ede8;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 40px 16px 0;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}

/* -- Card -------------------------------------------------- */
.signup-card {
  width: 100%;
  max-width: 640px;
  background: #ffffff;
  border: 1px solid #e0dbd4;
  border-radius: 16px;
  padding: 40px 48px 48px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 24px;
}

/* -- Brand ------------------------------------------------- */
.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 28px;
}
.brand-icon {
  font-size: 1.6rem;
  color: #4cd964;
  line-height: 1;
}
.brand-name {
  font-size: 1.4rem;
  font-weight: 800;
  color: #4cd964;
  letter-spacing: -0.01em;
}

/* -- Progress ---------------------------------------------- */
.progress-wrap {
  margin-bottom: 36px;
}
.progress-steps {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}
.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1;
}
.step-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #eee;
  color: #aaa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  transition: all 0.3s;
}
.progress-step.active .step-dot {
  background: #1b3a6b;
  color: #fff;
  box-shadow: 0 0 0 4px rgba(27, 58, 107, 0.12);
}
.progress-step.done .step-dot {
  background: #16a34a;
  color: #fff;
}
.step-label {
  font-size: 0.72rem;
  color: #aaa;
  font-weight: 500;
  white-space: nowrap;
  transition: color 0.3s;
}
.progress-step.active .step-label {
  color: #1b3a6b;
  font-weight: 600;
}
.progress-step.done .step-label {
  color: #16a34a;
}

.progress-track {
  height: 3px;
  background: #e8e4df;
  border-radius: 99px;
  overflow: hidden;
  margin-top: 4px;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #16a34a, #1b3a6b);
  border-radius: 99px;
  transition: width 0.4s ease;
}

/* -- Card Body --------------------------------------------- */
.card-body {
  display: flex;
  flex-direction: column;
}

.back-btn {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  color: #555;
  cursor: pointer;
  padding: 0;
  margin-bottom: 20px;
  width: fit-content;
  transition: color 0.2s;
}
.back-btn:hover {
  color: #111;
}

.heading {
  font-size: 1.8rem;
  font-weight: 800;
  color: #111;
  line-height: 1.2;
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}
.subtext {
  font-size: 0.95rem;
  color: #666;
  margin-bottom: 28px;
  line-height: 1.5;
}
.subtext strong {
  color: #333;
}

/* -- Fields ------------------------------------------------ */
.fields {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-bottom: 28px;
}
.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
}
.req {
  color: #4cd964;
}
.optional {
  color: #aaa;
  font-weight: 400;
}

.input {
  width: 100%;
  padding: 14px 16px;
  font-size: 0.97rem;
  color: #111;
  background: #f9f7f5;
  border: 1.5px solid #ddd8d2;
  border-radius: 10px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: inherit;
  box-sizing: border-box;
}
.input::placeholder {
  color: #aaa;
}
.input:focus {
  border-color: #1b3a6b;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(27, 58, 107, 0.07);
}
.input.input-error {
  border-color: #4cd964;
  box-shadow: 0 0 0 3px rgba(224, 56, 106, 0.08);
}
.input.input-ok {
  border-color: #16a34a;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.08);
}

/* -- Password strength ------------------------------------- */
.strength-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
  padding: 14px 16px;
  background: #f9f7f5;
  border: 1.5px solid #e8e4df;
  border-radius: 10px;
}

.strength-bar {
  display: flex;
  gap: 5px;
}
.strength-segment {
  flex: 1;
  height: 5px;
  border-radius: 99px;
  background: #e5e7eb;
}

.strength-score-label {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.strength-rules {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 2px;
}
.strength-rule {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.8rem;
  color: #999;
  transition: color 0.2s;
}
.strength-rule.rule-ok {
  color: #16a34a;
}
.strength-rule.rule-fail {
  color: #aaa;
}

.rule-icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.rule-ok .rule-icon {
  color: #16a34a;
}
.rule-fail .rule-icon {
  color: #d1d5db;
}

.ok-hint {
  color: #16a34a;
  font-size: 0.82rem;
  font-weight: 500;
}

.select-wrap {
  position: relative;
}
.select-input {
  appearance: none;
  cursor: pointer;
  padding-right: 40px;
}
.select-arrow {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #888;
}

/* -- Phone ------------------------------------------------- */
.phone-wrap {
  display: flex;
  gap: 0;
  border-radius: 10px;
  overflow: hidden;
  border: 1.5px solid #ddd8d2;
  background: #f9f7f5;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.phone-wrap:focus-within {
  border-color: #1b3a6b;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(27, 58, 107, 0.07);
}
.phone-prefix {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 14px;
  background: #f0ede8;
  border-right: 1.5px solid #ddd8d2;
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  flex-shrink: 0;
}
.flag {
  font-size: 1.1rem;
}
.phone-input {
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  background: transparent !important;
  flex: 1;
}

.field-hint {
  font-size: 0.78rem;
  color: #999;
  margin-top: 2px;
}
.error-hint {
  color: #4cd964;
}

/* -- Pass wrap --------------------------------------------- */
.pass-wrap {
  position: relative;
}
.pass-wrap .input {
  padding-right: 48px;
}
.toggle-pass {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  transition: color 0.2s;
}
.toggle-pass:hover {
  color: #333;
}

/* -- Checkbox ---------------------------------------------- */
.checkbox-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.88rem;
  color: #555;
  line-height: 1.5;
  cursor: pointer;
}
.checkbox {
  width: 16px;
  height: 16px;
  margin-top: 2px;
  accent-color: #1b3a6b;
  flex-shrink: 0;
}
.link {
  color: #1b3a6b;
  text-decoration: underline;
}

/* -- Upload zone ------------------------------------------- */
.field-hint-inline {
  font-weight: 400;
  color: #aaa;
  font-size: 0.78rem;
  margin-left: 6px;
}

.upload-zone {
  border: 2px dashed #ddd8d2;
  border-radius: 10px;
  padding: 28px 20px;
  text-align: center;
  cursor: pointer;
  background: #f9f7f5;
  transition: all 0.2s;
}
.upload-zone:hover {
  border-color: #1b3a6b;
  background: #ebfaee;
}
.upload-zone-error {
  border-color: #4cd964;
  background: #fff8f9;
}

.upload-icon {
  font-size: 2rem;
  margin-bottom: 8px;
}
.upload-text {
  font-size: 0.92rem;
  color: #555;
  margin-bottom: 4px;
}
.upload-cta {
  font-weight: 600;
  color: #1b3a6b;
  text-decoration: underline;
}
.upload-sub {
  font-size: 0.78rem;
  color: #aaa;
}
.upload-input-hidden {
  display: none;
}

.upload-preview {
  position: relative;
  border: 1.5px solid #c8e6c9;
  border-radius: 10px;
  overflow: hidden;
  background: #f0fdf4;
}
.preview-pdf {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
}
.preview-pdf-icon {
  font-size: 2rem;
}
.preview-info {
  display: flex;
  flex-direction: column;
}
.preview-name {
  font-size: 0.88rem;
  font-weight: 600;
  color: #166534;
  word-break: break-all;
}
.preview-size {
  font-size: 0.75rem;
  color: #16a34a;
  margin-top: 2px;
}
.preview-img {
  width: 100%;
  max-height: 180px;
  object-fit: contain;
  display: block;
  background: #fff;
}
.preview-remove {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.preview-remove:hover {
  background: #4cd964;
}

/* -- Actions ----------------------------------------------- */
.actions {
  margin-bottom: 16px;
}
.btn-next {
  width: 100%;
  padding: 15px;
  border-radius: 50px;
  font-size: 0.97rem;
  font-weight: 700;
  border: none;
  background: #ccc;
  color: #888;
  cursor: not-allowed;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  font-family: inherit;
}
.btn-next.active {
  background: #1b3a6b;
  color: #fff;
  cursor: pointer;
}
.btn-next.active:hover {
  background: #162f58;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(27, 58, 107, 0.3);
}

.signin-link {
  font-size: 0.88rem;
  color: #888;
  text-align: center;
}
.signin-link a {
  color: #1b3a6b;
  font-weight: 600;
  text-decoration: none;
}
.signin-link a:hover {
  text-decoration: underline;
}

.error-msg {
  font-size: 0.88rem;
  color: #4cd964;
  background: #fff0f4;
  border: 1px solid #fad0db;
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 16px;
}

/* -- Spinner ----------------------------------------------- */
.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* -- Footer ------------------------------------------------ */
.signup-footer {
  padding: 20px 0 32px;
  text-align: center;
}
.footer-notice {
  font-size: 0.8rem;
  color: #aaa;
}
.footer-notice a {
  color: #888;
  text-decoration: underline;
}

/* -- Responsive -------------------------------------------- */
@media (max-width: 600px) {
  .signup-card {
    padding: 28px 22px 36px;
  }
  .field-row {
    grid-template-columns: 1fr;
  }
  .heading {
    font-size: 1.5rem;
  }
  .step-label {
    display: none;
  }
}
</style>
