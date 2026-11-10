<script setup lang="ts">
import { ref, computed } from 'vue'
import BranchFields from '@/components/BranchFields.vue'
import { emptyBranch, branchValid, branchMissing, branchPayload, type BranchForm } from '@/utils/branches'

// -- Step state -------------------------------------------------------------
const step = ref(1)
const TOTAL_STEPS = 3

// -- Step 1: Company Info ----------------------------------------------------
const companyName = ref('')
const industry = ref('')
const companySize = ref('')
const tin = ref('')
const preferredPayment = ref('')

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

// -- Step 3: Review & submit -------------------------------------------------
// No password here: once FitAccess verifies the application, the account is
// created and the login details (temporary password) are emailed.
const agreeTerms = ref(false)
const loading = ref(false)
const error = ref('')
const submittedRef = ref('')

// -- Branches (other locations of the company) -------------------------------
const hasBranches = ref(false)
const branches = ref<BranchForm[]>([])

function setHasBranches(v: boolean) {
  hasBranches.value = v
  if (v && branches.value.length === 0) branches.value.push(emptyBranch())
}
function removeBranch(i: number) {
  branches.value.splice(i, 1)
  if (branches.value.length === 0) hasBranches.value = false
}
const branchesOk = computed(
  () => !hasBranches.value || branches.value.every((b) => branchValid(b, 'company', false))
)
const branchesMissing = computed(() =>
  hasBranches.value
    ? branches.value.flatMap((b, i) =>
        branchValid(b, 'company', false) ? [] : [`Branch ${i + 1}: ${branchMissing(b, 'company', false).join(', ')}`]
      )
    : []
)

// -- Validation --------------------------------------------------------------
const step1Valid = computed(
  () =>
    companyName.value.trim() &&
    industry.value &&
    companySize.value &&
    tin.value.trim() &&
    branchesOk.value
)
const step2Valid = computed(() => {
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(workEmail.value)
  const phoneOk = /^\d{9}$/.test(phone.value.replace(/\s/g, ''))
  return fullName.value.trim() && jobTitle.value.trim() && emailOk && phoneOk
})
const step3Valid = computed(() => agreeTerms.value)

const industryLabel = computed(() => industries.find((i) => i.value === industry.value)?.label ?? industry.value)

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
    const fd = new FormData()
    fd.append('company_name', companyName.value)
    fd.append('industry', industry.value)
    fd.append('company_size', companySize.value)
    fd.append('tin', tin.value.trim())
    if (preferredPayment.value) fd.append('preferred_payment_method', preferredPayment.value)
    fd.append('contact_name', fullName.value)
    fd.append('job_title', jobTitle.value)
    fd.append('email', workEmail.value)
    fd.append('phone', '+251' + phone.value.replace(/\s/g, ''))
    if (hasBranches.value && branches.value.length) {
      fd.append('branches', JSON.stringify(branches.value.map((b) => branchPayload(b, 'company', false))))
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
      throw new Error(firstError || 'Your application could not be sent. Please try again.')
    }
    const data = await res.json()
    submittedRef.value = data.reference ?? 'received'
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
      <RouterLink to="/" class="brand" aria-label="FitAccess home">
        <span class="brand-name">FitAccess</span>
      </RouterLink>

      <!-- -- Application sent -- -->
      <div v-if="submittedRef" class="card-body done">
        <div class="done-icon">
          <svg width="34" height="34" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
        </div>
        <h1 class="heading done-heading">Thank you!</h1>
        <p class="subtext">
          Your application has been registered<template v-if="submittedRef !== 'received'"> under number
          <strong class="done-ref">{{ submittedRef }}</strong></template>. We have sent a confirmation to
          <strong>{{ workEmail }}</strong>.
        </p>
        <div class="done-steps">
          <p class="done-steps-title">What now?</p>
          <ol>
            <li>Our team will contact you within the next 2 business days to discuss the details.</li>
            <li>We verify your company information, including your TIN.</li>
            <li>Once approved, you receive an email with your login details and a temporary password.
              You will choose your own password when you first sign in.</li>
          </ol>
        </div>
        <div class="actions">
          <RouterLink to="/" class="btn-next active done-btn">Back to the homepage</RouterLink>
        </div>
      </div>

      <!-- Progress Bar -->
      <div v-if="!submittedRef" class="progress-wrap">
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
              {{ ['Company Info', 'Contact', 'Review'][n - 1] }}
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
      <div v-if="!submittedRef && step === 1" class="card-body">
        <h1 class="heading">Register your company</h1>
        <div class="authority-notice">
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Only the person who has authority to represent this company should register here.
        </div>
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
              <label class="field-label">TIN Number <span class="req">*</span></label>
              <input v-model="tin" type="text" class="input" placeholder="Tax ID Number" required />
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

          <!-- Branches -->
          <div class="field-group branches-box">
            <label class="field-label">Does your company have other branches?</label>
            <p class="field-hint">
              Add them now. Once approved, each branch gets its own login (sent to its email) and can manage only
              its own employees, while seeing the other branches read-only. The main account can see and manage every branch.
            </p>
            <div class="branch-choice">
              <button type="button" class="choice-btn" :class="{ selected: !hasBranches }" @click="setHasBranches(false)">
                No, single location
              </button>
              <button type="button" class="choice-btn" :class="{ selected: hasBranches }" @click="setHasBranches(true)">
                Yes, we have branches
              </button>
            </div>

            <template v-if="hasBranches">
              <div v-for="(br, i) in branches" :key="i" class="branch-card">
                <div class="branch-card-head">
                  <span class="branch-card-title">Branch {{ i + 1 }}</span>
                  <button type="button" class="branch-remove" @click="removeBranch(i)">Remove</button>
                </div>
                <BranchFields :model-value="br" kind="company" :with-password="false" />
              </div>
              <button type="button" class="branch-add" @click="branches.push(emptyBranch())">+ Add another branch</button>
              <p v-if="branchesMissing.length" class="field-hint error-hint">Still needed: {{ branchesMissing.join(' · ') }}</p>
            </template>
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
      <div v-else-if="!submittedRef" class="card-body">
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
        <h1 class="heading">Review &amp; submit</h1>
        <p class="subtext">
          Please check your details. After you submit, our team verifies them and creates your
          account. You do not need to choose a password now.
        </p>

        <div class="fields">
          <div class="review-box">
            <p class="review-title">Company</p>
            <dl class="review-list">
              <dt>Company name</dt><dd>{{ companyName }}</dd>
              <dt>Industry</dt><dd>{{ industryLabel }}</dd>
              <dt>Number of employees</dt><dd>{{ companySize }}</dd>
              <dt>TIN number</dt><dd>{{ tin }}</dd>
              <template v-if="hasBranches && branches.length">
                <dt>Other branches</dt><dd>{{ branches.map((b) => b.branch_name).join(', ') }}</dd>
              </template>
            </dl>
          </div>
          <div class="review-box">
            <p class="review-title">Contact person</p>
            <dl class="review-list">
              <dt>Name</dt><dd>{{ fullName }}<template v-if="jobTitle"> ({{ jobTitle }})</template></dd>
              <dt>Work email</dt><dd>{{ workEmail }}</dd>
              <dt>Phone</dt><dd>+251 {{ phone }}</dd>
            </dl>
          </div>
          <p class="review-note">
            Your login details will be sent to <strong>{{ workEmail }}</strong> once your application is approved.
          </p>

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
            <span v-else>Submit application</span>
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
/* -- Review step + thank-you ----------------------------------------- */
.review-box { border: 1.5px solid #e8e4dc; border-radius: 14px; padding: 16px 18px; background: #faf9f6; }
.review-title { font-weight: 700; font-size: 0.95rem; margin: 0 0 10px; }
.review-list { display: grid; grid-template-columns: 150px 1fr; gap: 8px 12px; margin: 0; font-size: 0.9rem; }
.review-list dt { color: #57534e; }
.review-list dd { margin: 0; font-weight: 600; word-break: break-word; }
.review-note { font-size: 0.88rem; color: #44403c; margin: 0; }
.done { text-align: center; }
.done-icon { width: 72px; height: 72px; margin: 8px auto 18px; border-radius: 50%; background: #8BE000; color: #0B0C10; display: flex; align-items: center; justify-content: center; }
.done-heading { font-size: 2.2rem; }
.done-ref { white-space: nowrap; }
.done-steps { text-align: left; margin: 22px 0 6px; padding: 18px 20px; border-radius: 14px; background: #faf9f6; border: 1.5px solid #e8e4dc; }
.done-steps-title { font-weight: 700; margin: 0 0 8px; }
.done-steps ol { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 8px; font-size: 0.92rem; line-height: 1.5; }
.done-btn { display: inline-flex; align-items: center; justify-content: center; text-decoration: none; }
@media (max-width: 520px) { .review-list { grid-template-columns: 1fr; gap: 2px; } .review-list dd { margin-bottom: 8px; } }

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
  text-decoration: none;
  width: fit-content;
}
.brand-icon {
  font-size: 1.6rem;
  color: #8BE000;
  line-height: 1;
}
.brand-name {
  font-size: 1.4rem;
  font-weight: 800;
  color: #8BE000;
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
  background: #0B0C10;
  color: #fff;
  box-shadow: 0 0 0 4px rgba(11, 12, 16, 0.12);
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
  color: #0B0C10;
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
  background: linear-gradient(90deg, #16a34a, #0B0C10);
  border-radius: 99px;
  transition: width 0.4s ease;
}

/* -- Authority notice -------------------------------------- */
.authority-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 9px 14px;
  font-size: 0.82rem;
  color: #92400e;
  font-weight: 500;
  margin-bottom: 14px;
}
.authority-notice svg { flex-shrink: 0; color: #d97706; }

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
  color: #ef4444;
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
  border-color: #0B0C10;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(11, 12, 16, 0.07);
}
.input.input-error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08);
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
  border-color: #0B0C10;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(11, 12, 16, 0.07);
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
  color: #ef4444;
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
  accent-color: #0B0C10;
  flex-shrink: 0;
}
.link {
  color: #0B0C10;
  text-decoration: underline;
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
  background: #0B0C10;
  color: #fff;
  cursor: pointer;
}
.btn-next.active:hover {
  background: #162f58;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(11, 12, 16, 0.3);
}

.signin-link {
  font-size: 0.88rem;
  color: #888;
  text-align: center;
}
.signin-link a {
  color: #0B0C10;
  font-weight: 600;
  text-decoration: none;
}
.signin-link a:hover {
  text-decoration: underline;
}

.error-msg {
  font-size: 0.88rem;
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
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
.branches-box { margin-top: 8px; padding-top: 18px; border-top: 1px solid #e2e8f0; gap: 12px; }
.branch-choice { display: flex; gap: 8px; flex-wrap: wrap; }
.choice-btn {
  padding: 10px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px; background: #fff;
  font-size: 13px; font-weight: 600; color: #475569; cursor: pointer;
}
.choice-btn.selected { border-color: #72B800; background: #f7fee7; color: #3f6212; }
.branch-card { border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 16px; background: #f8fafc; }
.branch-card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.branch-card-title { font-weight: 700; font-size: 14px; color: #0f172a; }
.branch-remove { background: none; border: none; color: #ef4444; font-size: 13px; font-weight: 600; cursor: pointer; }
.branch-add {
  padding: 12px; border: 1.5px dashed #94a3b8; border-radius: 12px; background: #fff;
  color: #334155; font-weight: 600; font-size: 14px; cursor: pointer;
}
.branch-add:hover { background: #f1f5f9; }
</style>
