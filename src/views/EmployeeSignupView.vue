<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// ── Steps ──────────────────────────────────────────────────────────────────
const step        = ref(1)
const TOTAL_STEPS = 3

// ── Step 1: Personal Identity ──────────────────────────────────────────────
const firstName        = ref('')
const fathersName      = ref('')
const grandfathersName = ref('')
const phone            = ref('')
const email            = ref('')
const password         = ref('')
const confirmPassword  = ref('')
const showPass         = ref(false)
const showConfirm      = ref(false)

const strengthRules = computed(() => [
  { id: 'len',     label: 'At least 8 characters',       ok: password.value.length >= 8 },
  { id: 'upper',   label: 'One uppercase letter (A–Z)',   ok: /[A-Z]/.test(password.value) },
  { id: 'lower',   label: 'One lowercase letter (a–z)',   ok: /[a-z]/.test(password.value) },
  { id: 'number',  label: 'One number (0–9)',              ok: /[0-9]/.test(password.value) },
  { id: 'special', label: 'One special character (!@#…)', ok: /[^A-Za-z0-9]/.test(password.value) },
])
const strengthScore = computed(() => strengthRules.value.filter(r => r.ok).length)
const strengthLabel = computed(() => {
  const s = strengthScore.value
  if (s <= 1) return { text: 'Very weak',   color: '#dc2626' }
  if (s === 2) return { text: 'Weak',        color: '#2EB84B' }
  if (s === 3) return { text: 'Fair',        color: '#eab308' }
  if (s === 4) return { text: 'Strong',      color: '#22c55e' }
  return               { text: 'Very strong', color: '#16a34a' }
})
const passwordStrong = computed(() => strengthScore.value === 5)
const passwordMatch  = computed(() =>
  passwordStrong.value && confirmPassword.value.length > 0 && password.value === confirmPassword.value
)

// ── Step 2: Employer Linking ───────────────────────────────────────────────
interface PublicCompany { id: number; name: string; industry: string; city: string }
const companies       = ref<PublicCompany[]>([])
const companySearch   = ref('')
const companyId       = ref<number | null>(null)
const companyName     = ref('')
const showCompanyDrop = ref(false)
const companyDropRef  = ref<HTMLElement | null>(null)
const staffId         = ref('')
const jobPosition     = ref('')
const department      = ref('')
const branch          = ref('')

const filteredCompanies = computed(() => {
  const q = companySearch.value.toLowerCase()
  if (!q) return companies.value
  return companies.value.filter(c => c.name.toLowerCase().includes(q))
})

function openDrop()  { showCompanyDrop.value = true }
function closeDrop() { showCompanyDrop.value = false }

function selectCompany(c: PublicCompany) {
  companyId.value       = c.id
  companyName.value     = c.name
  companySearch.value   = c.name
  showCompanyDrop.value = false
}

function clearCompany() {
  companyId.value       = null
  companyName.value     = ''
  companySearch.value   = ''
  showCompanyDrop.value = false
}

function highlight(text: string): string {
  const q = companySearch.value.trim()
  if (!q) return text
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>')
}

function onDocClick(e: MouseEvent) {
  if (companyDropRef.value && !companyDropRef.value.contains(e.target as Node)) closeDrop()
}

onMounted(async () => {
  document.addEventListener('click', onDocClick)
  try {
    const res = await fetch('http://localhost:8000/api/v1/public/companies', {
      headers: { Accept: 'application/json' },
    })
    const data = await res.json()
    companies.value = data.data ?? []
  } catch { /* ignore */ }
})
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

// ── Step 3: Review & Note ──────────────────────────────────────────────────
const requestNote = ref('')
const loading     = ref(false)
const error       = ref('')

// ── Validation ─────────────────────────────────────────────────────────────
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const step1Valid = computed(() =>
  firstName.value.trim() &&
  fathersName.value.trim() &&
  grandfathersName.value.trim() &&
  /^\d{9}$/.test(phone.value.replace(/\s/g, '')) &&
  emailRegex.test(email.value) &&
  passwordMatch.value
)
const step2Valid = computed(() =>
  companyId.value !== null && staffId.value.trim().length > 0
)
const canProceed = computed(() => {
  if (step.value === 1) return step1Valid.value
  if (step.value === 2) return step2Valid.value
  return true
})

function onStaffIdInput(e: Event) {
  staffId.value = (e.target as HTMLInputElement).value
}

function next() { if (canProceed.value) { error.value = ''; step.value++ } }
function back() { error.value = ''; step.value-- }

async function handleSubmit() {
  loading.value = true
  error.value   = ''
  try {
    const res = await fetch('http://localhost:8000/api/v1/auth/register/employee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        first_name:        firstName.value,
        fathers_name:      fathersName.value,
        grandfathers_name: grandfathersName.value,
        phone:             '+251' + phone.value.replace(/\s/g, ''),
        email:             email.value,
        password:          password.value,
        company_id:        companyId.value,
        staff_id:          staffId.value,
        job_position:      jobPosition.value,
        department:        department.value,
        branch:            branch.value,
        request_note:      requestNote.value,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      const firstErr = data.errors
        ? Object.values(data.errors as Record<string, string[]>)[0][0]
        : data.message
      throw new Error(firstErr || 'Registration failed.')
    }
    router.push('/login?registered=employee')
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
        <span class="brand-icon">✦</span>
        <span class="brand-name">FitAccess</span>
        <span class="brand-tag">Employee Portal</span>
      </div>

      <!-- Progress -->
      <div class="progress-wrap">
        <div class="progress-steps">
          <div v-for="n in TOTAL_STEPS" :key="n" class="progress-step"
               :class="{ done: n < step, active: n === step }">
            <div class="step-dot">
              <svg v-if="n < step" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
              <span v-else>{{ n }}</span>
            </div>
            <span class="step-label">{{ ['Identity', 'Employer', 'Review'][n - 1] }}</span>
          </div>
        </div>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }"></div>
        </div>
      </div>

      <!-- ── STEP 1: Personal Identity ── -->
      <div v-if="step === 1" class="card-body">
        <h1 class="heading">Personal Identity</h1>
        <p class="subtext">Enter your full Ethiopian name exactly as it appears on your ID.</p>

        <div class="fields">
          <div class="name-grid">
            <div class="field-group">
              <label class="field-label">First Name <span class="req">*</span></label>
              <input v-model="firstName" class="input" placeholder="e.g. Kebede" />
            </div>
            <div class="field-group">
              <label class="field-label">Father's Name <span class="req">*</span></label>
              <input v-model="fathersName" class="input" placeholder="e.g. Alemu" />
            </div>
            <div class="field-group">
              <label class="field-label">Grandfather's Name <span class="req">*</span></label>
              <input v-model="grandfathersName" class="input" placeholder="e.g. Tadesse" />
            </div>
          </div>

          <div class="field-group">
            <label class="field-label">Phone Number <span class="req">*</span></label>
            <div class="phone-wrap">
              <div class="phone-prefix"><span class="flag">🇪🇹</span><span>+251</span></div>
              <input v-model="phone" type="tel" class="input phone-input" placeholder="91 123 4567" maxlength="11" />
            </div>
            <p class="field-hint">9-digit Ethiopian number (e.g. 911234567)</p>
          </div>

          <div class="field-group">
            <label class="field-label">Email Address <span class="req">*</span></label>
            <input v-model="email" type="email" class="input" placeholder="kebede@example.com" autocomplete="email" />
          </div>

          <div class="field-group">
            <label class="field-label">Password <span class="req">*</span></label>
            <div class="pass-wrap">
              <input v-model="password" :type="showPass ? 'text' : 'password'" class="input"
                :class="{ 'input-error': password && !passwordStrong, 'input-ok': passwordStrong }"
                placeholder="Create a strong password" autocomplete="new-password" />
              <button class="toggle-pass" type="button" @click="showPass = !showPass" tabindex="-1">
                <svg v-if="!showPass" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
            <div v-if="password.length > 0" class="strength-wrap">
              <div class="strength-bar">
                <div v-for="n in 5" :key="n" class="strength-segment"
                  :style="{ background: n <= strengthScore ? strengthLabel.color : '#e5e7eb', transition: `background 0.25s ease ${(n-1)*0.05}s` }">
                </div>
              </div>
              <span class="strength-score-label" :style="{ color: strengthLabel.color }">{{ strengthLabel.text }}</span>
              <ul class="strength-rules">
                <li v-for="rule in strengthRules" :key="rule.id" class="strength-rule" :class="{ 'rule-ok': rule.ok }">
                  <span class="rule-icon">
                    <svg v-if="rule.ok" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
                    <svg v-else width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/></svg>
                  </span>
                  {{ rule.label }}
                </li>
              </ul>
            </div>
          </div>

          <div class="field-group">
            <label class="field-label">Confirm Password <span class="req">*</span></label>
            <div class="pass-wrap">
              <input v-model="confirmPassword" :type="showConfirm ? 'text' : 'password'" class="input"
                :class="{ 'input-error': confirmPassword && password !== confirmPassword, 'input-ok': passwordMatch }"
                placeholder="Repeat your password" autocomplete="new-password" />
              <button class="toggle-pass" type="button" @click="showConfirm = !showConfirm" tabindex="-1">
                <svg v-if="!showConfirm" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
            <p v-if="confirmPassword && password !== confirmPassword" class="field-hint error-hint">Passwords do not match.</p>
            <p v-else-if="passwordMatch" class="field-hint ok-hint">✓ Passwords match</p>
          </div>
        </div>

        <div class="actions">
          <button class="btn-next" :class="{ active: step1Valid }" :disabled="!step1Valid" @click="next">
            Continue
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
        <p class="signin-link">Already have an account? <RouterLink to="/login">Sign in</RouterLink></p>
      </div>

      <!-- ── STEP 2: Employer Linking ── -->
      <div v-else-if="step === 2" class="card-body">
        <button class="back-btn" @click="back">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <h1 class="heading">Employer Linking</h1>
        <p class="subtext">Connect your FitAccess account to your workplace.</p>

        <div class="fields">
          <div class="field-group" ref="companyDropRef" style="position:relative">
            <label class="field-label">Company / Employer Name <span class="req">*</span></label>

            <div v-if="companyId" class="company-selected">
              <div class="company-selected-inner">
                <span class="company-selected-icon">🏢</span>
                <span class="company-selected-name">{{ companyName }}</span>
              </div>
              <button type="button" class="company-selected-clear" @click="clearCompany">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                Change
              </button>
            </div>

            <div v-else class="search-input-wrap">
              <svg class="search-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                v-model="companySearch"
                class="input search-input"
                placeholder="Type to search active companies…"
                @focus="openDrop"
                @input="openDrop"
                autocomplete="off"
              />
            </div>

            <div v-if="showCompanyDrop && !companyId" class="company-drop">
              <div v-if="companies.length === 0" class="drop-empty">
                <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
                Loading companies…
              </div>
              <div v-else-if="filteredCompanies.length === 0" class="drop-empty">No companies match "{{ companySearch }}"</div>
              <div v-else>
                <div v-if="!companySearch" class="drop-header">{{ companies.length }} active companies</div>
                <div v-for="c in filteredCompanies" :key="c.id" class="drop-item" @mousedown.prevent="selectCompany(c)">
                  <div class="drop-name" v-html="highlight(c.name)"></div>
                  <div class="drop-meta">{{ c.city }} &nbsp;·&nbsp; {{ c.industry }}</div>
                </div>
              </div>
            </div>

            <p v-if="!companyId" class="field-hint">Only active companies registered in FitAccess appear here.</p>
          </div>

          <div class="field-group">
            <label class="field-label">Employee ID / Staff ID Number <span class="req">*</span></label>
            <input
              :value="staffId"
              @input="onStaffIdInput"
              class="input mono"
              placeholder="e.g. EMP-001 or 0012345"
            />
            <p class="field-hint">Enter your staff ID exactly as given by your employer.</p>
          </div>

          <div class="field-row">
            <div class="field-group">
              <label class="field-label">Job Position</label>
              <input v-model="jobPosition" class="input" placeholder="e.g. Senior Accountant" />
            </div>
            <div class="field-group">
              <label class="field-label">Department</label>
              <input v-model="department" class="input" placeholder="e.g. Finance" />
            </div>
          </div>

          <div class="field-group">
            <label class="field-label">Branch</label>
            <input v-model="branch" class="input" placeholder="e.g. Bole Branch, Head Office" />
          </div>
        </div>

        <div class="actions">
          <button class="btn-next" :class="{ active: step2Valid }" :disabled="!step2Valid" @click="next">
            Continue
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>

      <!-- ── STEP 3: Review & Submit ── -->
      <div v-else class="card-body">
        <button class="back-btn" @click="back">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <h1 class="heading">Review & Submit</h1>
        <p class="subtext">Double-check your details before sending your application to HR.</p>

        <div class="review-card">
          <div class="review-section">
            <p class="review-section-label">PERSONAL</p>
            <div class="review-row"><span class="review-key">Full Name</span><span class="review-val">{{ firstName }} {{ fathersName }} {{ grandfathersName }}</span></div>
            <div class="review-row"><span class="review-key">Email</span><span class="review-val">{{ email }}</span></div>
            <div class="review-row"><span class="review-key">Phone</span><span class="review-val">+251 {{ phone }}</span></div>
          </div>
          <div class="review-section">
            <p class="review-section-label">EMPLOYER</p>
            <div class="review-row"><span class="review-key">Company</span><span class="review-val">{{ companyName }}</span></div>
            <div class="review-row"><span class="review-key">Staff ID</span><span class="review-val mono">{{ staffId }}</span></div>
            <div v-if="jobPosition" class="review-row"><span class="review-key">Position</span><span class="review-val">{{ jobPosition }}</span></div>
            <div v-if="department"  class="review-row"><span class="review-key">Department</span><span class="review-val">{{ department }}</span></div>
            <div v-if="branch"      class="review-row"><span class="review-key">Branch</span><span class="review-val">{{ branch }}</span></div>
          </div>
        </div>

        <div class="field-group" style="margin-top:16px">
          <label class="field-label">Request Note to HR <span class="optional">(optional)</span></label>
          <textarea
            v-model="requestNote"
            class="input textarea"
            rows="3"
            placeholder="e.g. I prefer the Bole branch gym. Please activate by end of month."
            maxlength="1000"
          ></textarea>
          <p class="field-hint">{{ requestNote.length }}/1000 — Your HR team will see this note.</p>
        </div>

        <p v-if="error" class="error-msg">{{ error }}</p>

        <div class="actions" style="margin-top:20px">
          <button class="btn-next" :class="{ active: !loading }" :disabled="loading" @click="handleSubmit">
            <span v-if="loading" class="spinner"></span>
            <span v-else>Submit Application</span>
          </button>
        </div>
        <p class="signin-link">Already have an account? <RouterLink to="/login">Sign in</RouterLink></p>
      </div>

    </div>

    <footer class="signup-footer">
      <p class="footer-notice">Protected by FitAccess Ethiopia &nbsp;·&nbsp; <a href="#">Privacy Policy</a></p>
    </footer>
  </div>
</template>

<style scoped>
.signup-page {
  min-height: 100vh; background: #f0ede8;
  display: flex; flex-direction: column; align-items: center;
  padding: 40px 16px 0; font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}
.signup-card {
  width: 100%; max-width: 700px; background: #fff;
  border: 1px solid #e0dbd4; border-radius: 16px;
  padding: 40px 48px 48px; box-shadow: 0 2px 12px rgba(0,0,0,.06); margin-bottom: 24px;
}
.brand { display: flex; align-items: center; gap: 8px; margin-bottom: 28px; }
.brand-icon { font-size: 1.6rem; color: #4CD964; }
.brand-name { font-size: 1.4rem; font-weight: 800; color: #4CD964; letter-spacing: -0.01em; }
.brand-tag  { margin-left: 6px; font-size: 0.7rem; font-weight: 700; background: #4CD964; color: #fff; padding: 3px 9px; border-radius: 20px; letter-spacing: 0.05em; }

.progress-wrap { margin-bottom: 36px; }
.progress-steps { display: flex; justify-content: space-between; margin-bottom: 12px; }
.progress-step  { display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1; }
.step-dot { width: 28px; height: 28px; border-radius: 50%; background: #eee; color: #aaa; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; transition: all 0.3s; }
.progress-step.active .step-dot { background: #4CD964; color: #fff; box-shadow: 0 0 0 4px rgba(224,56,106,.15); }
.progress-step.done   .step-dot { background: #16a34a; color: #fff; }
.step-label { font-size: 0.72rem; color: #aaa; font-weight: 500; transition: color 0.3s; }
.progress-step.active .step-label { color: #4CD964; font-weight: 600; }
.progress-step.done   .step-label { color: #16a34a; }
.progress-track { height: 3px; background: #e8e4df; border-radius: 99px; overflow: hidden; margin-top: 4px; }
.progress-fill  { height: 100%; background: linear-gradient(90deg, #16a34a, #4CD964); border-radius: 99px; transition: width 0.4s ease; }

.card-body { display: flex; flex-direction: column; }
.back-btn  { display: flex; align-items: center; background: none; border: none; color: #555; cursor: pointer; padding: 0; margin-bottom: 20px; width: fit-content; transition: color 0.2s; }
.back-btn:hover { color: #111; }
.heading { font-size: 1.8rem; font-weight: 800; color: #111; line-height: 1.2; margin-bottom: 8px; letter-spacing: -0.02em; }
.subtext { font-size: 0.95rem; color: #666; margin-bottom: 28px; line-height: 1.5; }

.fields { display: flex; flex-direction: column; gap: 18px; margin-bottom: 28px; }
.name-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.field-row  { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.field-group { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 0.85rem; font-weight: 600; color: #333; }
.req { color: #4CD964; }
.optional { color: #aaa; font-weight: 400; }
.field-hint { font-size: 0.78rem; color: #999; margin-top: 2px; }
.error-hint { color: #4CD964 !important; }
.ok-hint    { color: #16a34a !important; font-weight: 500; }

.input {
  width: 100%; padding: 13px 16px; font-size: 0.95rem; color: #111;
  background: #f9f7f5; border: 1.5px solid #ddd8d2; border-radius: 10px;
  outline: none; transition: border-color 0.2s, box-shadow 0.2s;
  font-family: inherit; box-sizing: border-box;
}
.input:focus       { border-color: #4CD964; background: #fff; box-shadow: 0 0 0 3px rgba(224,56,106,.07); }
.input.input-error { border-color: #4CD964; }
.input.input-ok    { border-color: #16a34a; }
.input::placeholder { color: #aaa; }
.mono { font-family: 'Courier New', monospace; letter-spacing: 0.12em; font-size: 1rem; }
.textarea { resize: vertical; min-height: 80px; }

.phone-wrap { display: flex; border-radius: 10px; overflow: hidden; border: 1.5px solid #ddd8d2; background: #f9f7f5; transition: border-color .2s; }
.phone-wrap:focus-within { border-color: #4CD964; background: #fff; box-shadow: 0 0 0 3px rgba(224,56,106,.07); }
.phone-prefix { display: flex; align-items: center; gap: 6px; padding: 0 14px; background: #f0ede8; border-right: 1.5px solid #ddd8d2; font-size: 0.9rem; font-weight: 600; color: #333; white-space: nowrap; }
.flag { font-size: 1.1rem; }
.phone-input { border: none !important; border-radius: 0 !important; box-shadow: none !important; background: transparent !important; flex: 1; }

.pass-wrap { position: relative; }
.pass-wrap .input { padding-right: 48px; }
.toggle-pass { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #888; cursor: pointer; transition: color .2s; }
.toggle-pass:hover { color: #333; }

.strength-wrap { display: flex; flex-direction: column; gap: 8px; margin-top: 6px; padding: 14px 16px; background: #f9f7f5; border: 1.5px solid #e8e4df; border-radius: 10px; }
.strength-bar { display: flex; gap: 5px; }
.strength-segment { flex: 1; height: 5px; border-radius: 99px; }
.strength-score-label { font-size: 0.8rem; font-weight: 700; }
.strength-rules { display: flex; flex-direction: column; gap: 5px; margin-top: 2px; }
.strength-rule { display: flex; align-items: center; gap: 7px; font-size: 0.8rem; color: #aaa; }
.rule-ok { color: #16a34a; }
.rule-icon { width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

.search-input-wrap { position: relative; display: flex; align-items: center; }
.search-ico   { position: absolute; left: 12px; color: #94a3b8; pointer-events: none; }
.search-input { padding-left: 36px; }
.company-selected { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #f0fdf4; border: 1.5px solid #16a34a; border-radius: 10px; }
.company-selected-inner { display: flex; align-items: center; gap: 10px; }
.company-selected-icon  { font-size: 1.2rem; }
.company-selected-name  { font-size: 0.95rem; font-weight: 600; color: #166534; }
.company-selected-clear { display: flex; align-items: center; gap: 5px; background: none; border: 1px solid #16a34a; border-radius: 6px; padding: 4px 10px; color: #16a34a; font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all .15s; white-space: nowrap; }
.company-selected-clear:hover { background: #16a34a; color: #fff; }
.company-drop { position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 100; background: #fff; border: 1.5px solid #e2e8f0; border-radius: 12px; box-shadow: 0 12px 32px rgba(0,0,0,.12); max-height: 260px; overflow-y: auto; }
.drop-header { padding: 8px 14px 4px; font-size: 0.7rem; font-weight: 700; color: #94a3b8; letter-spacing: .08em; text-transform: uppercase; }
.drop-item  { padding: 10px 14px; cursor: pointer; transition: background .12s; border-radius: 8px; margin: 2px 4px; }
.drop-item:hover { background: #f0fdf4; }
.drop-name  { font-size: 0.9rem; font-weight: 600; color: #0f172a; }
.drop-meta  { font-size: 0.74rem; color: #94a3b8; margin-top: 2px; }
.drop-empty { padding: 20px; text-align: center; color: #94a3b8; font-size: 0.85rem; display: flex; flex-direction: column; align-items: center; gap: 6px; }
.drop-name mark { background: #fef08a; color: #0f172a; border-radius: 2px; padding: 0 1px; font-weight: 700; }

.review-card { background: #f9f7f5; border: 1.5px solid #e8e4df; border-radius: 12px; overflow: hidden; }
.review-section { padding: 14px 18px; border-bottom: 1px solid #e8e4df; }
.review-section:last-child { border-bottom: none; }
.review-section-label { font-size: 0.65rem; font-weight: 700; color: #94a3b8; letter-spacing: .1em; text-transform: uppercase; margin: 0 0 10px; }
.review-row { display: flex; gap: 12px; margin-bottom: 6px; font-size: 0.85rem; }
.review-row:last-child { margin-bottom: 0; }
.review-key { color: #94a3b8; min-width: 90px; flex-shrink: 0; }
.review-val { color: #0f172a; font-weight: 500; word-break: break-all; }

.actions { margin-bottom: 16px; }
.btn-next { width: 100%; padding: 15px; border-radius: 50px; font-size: 0.97rem; font-weight: 700; border: none; background: #ccc; color: #888; cursor: not-allowed; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all .2s; font-family: inherit; }
.btn-next.active { background: #4CD964; color: #fff; cursor: pointer; }
.btn-next.active:hover { background: #c72d5a; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(224,56,106,.35); }

.signin-link { font-size: 0.88rem; color: #888; text-align: center; }
.signin-link a { color: #4CD964; font-weight: 600; text-decoration: none; }
.signin-link a:hover { text-decoration: underline; }

.error-msg { font-size: 0.88rem; color: #4CD964; background: #fff0f4; border: 1px solid #fad0db; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; }

.spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }

.signup-footer { padding: 20px 0 32px; text-align: center; }
.footer-notice { font-size: .8rem; color: #aaa; }
.footer-notice a { color: #888; text-decoration: underline; }

/* ── Plan grid ─────────────────────────────────────────── */
.plans-loading, .plans-empty {
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; padding: 40px 0; color: #94a3b8; font-size: 0.9rem;
  margin-bottom: 20px;
}
.plans-spinner {
  width: 28px; height: 28px;
  border: 3px solid #e2e8f0; border-top-color: #4CD964;
  border-radius: 50%; animation: spin .7s linear infinite;
}

.plan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}
.plan-card {
  border: 2px solid #e0dbd4; border-radius: 12px; padding: 16px;
  cursor: pointer; transition: all .2s; background: #f9f7f5;
}
.plan-card:hover { border-color: #4CD964; background: #fff; box-shadow: 0 4px 14px rgba(224,56,106,.12); }
.plan-card--selected { border-color: #4CD964; background: #fff8fa; box-shadow: 0 4px 14px rgba(224,56,106,.15); }

.plan-card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 10px; }
.plan-tier-badge {
  display: inline-block; font-size: 0.62rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.08em;
  background: #ffe4ec; color: #4CD964;
  padding: 2px 8px; border-radius: 20px; margin-bottom: 4px;
}
.plan-card-name { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0; }

.plan-check {
  width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
  border: 2px solid #ddd8d2;
  display: flex; align-items: center; justify-content: center;
  transition: all .2s;
}
.plan-check--on { background: #4CD964; border-color: #4CD964; }

.plan-price-row { display: flex; align-items: baseline; gap: 2px; margin-bottom: 10px; }
.plan-currency { font-size: 0.7rem; font-weight: 600; color: #94a3b8; }
.plan-amount   { font-size: 1.3rem; font-weight: 800; color: #4CD964; line-height: 1; }
.plan-period   { font-size: 0.65rem; color: #94a3b8; }

.plan-features { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 5px; }
.plan-features li { display: flex; align-items: flex-start; gap: 6px; font-size: 0.78rem; color: #475569; line-height: 1.4; }
.plan-features li svg { flex-shrink: 0; color: #16a34a; margin-top: 1px; }

.plan-tier-chip {
  font-size: 0.72rem !important; font-weight: 700;
  background: #ffe4ec; color: #4CD964;
  padding: 2px 9px; border-radius: 20px;
}

@media (max-width: 640px) {
  .signup-card { padding: 28px 22px 36px; }
  .name-grid   { grid-template-columns: 1fr; }
  .field-row   { grid-template-columns: 1fr; }
  .plan-grid   { grid-template-columns: 1fr; }
  .step-label  { display: none; }
}
</style>
