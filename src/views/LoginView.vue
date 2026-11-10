<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()

const successMsg = computed(() => {
  if (route.query.registered === 'company')
    return '🎉 Company account created! Please sign in to continue.'
  if (route.query.registered === 'partner')
    return '✅ Partner application submitted! Our team will review and contact you within 2–3 business days.'
  if (route.query.registered === 'employee')
    return '✅ Application submitted! Your HR team will review and activate your account shortly.'
  if (route.query.session === 'expired')
    return 'Your session has expired. Please sign in again.'
  return ''
})

// Email + password are entered together; MFA (privileged accounts) follows
const step     = ref<'signin' | 'mfa-setup'>('signin')
const email    = ref('')
const password = ref('')
const showPass = ref(false)
const loading  = ref(false)
const error    = ref('')

const emailValid   = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value))
const canSignIn    = computed(() => emailValid.value && password.value.length >= 1)
const passwordEl   = ref<HTMLInputElement | null>(null)

// MFA state
const totpCode    = ref('')
const mfaError    = ref('')
const mfaLoading  = ref(false)

/** Enter in the email field moves on to the password field */
function focusPassword() {
  if (password.value) handleSignIn()
  else passwordEl.value?.focus()
}

function proceedAfterLogin() {
  // Force password reset if flagged (router guard also handles this)
  if (authStore.mustResetPassword) {
    router.push('/reset-password')
    return
  }

  const redirectTo = route.query.redirect as string | undefined
  if (redirectTo) {
    router.push(redirectTo)
  } else if (authStore.isAdmin) {
    router.push('/admin/dashboard')
  } else if (authStore.isHR) {
    router.push('/hr/dashboard')
  } else if (authStore.isEmployee) {
    router.push('/employee/dashboard')
  } else if (authStore.isPartner) {
    router.push('/partner/dashboard')
  } else {
    router.push('/')
  }
}

async function handleSignIn() {
  if (!canSignIn.value) return
  loading.value = true
  error.value   = ''
  try {
    await authStore.login(email.value, password.value)

    if (authStore.mfaSetupRequired) {
      step.value = 'mfa-setup'
      return
    }

    proceedAfterLogin()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Something went wrong.'
  } finally {
    loading.value = false
  }
}

async function handleMfaSetupConfirm() {
  if (!totpCode.value) return
  mfaLoading.value = true
  mfaError.value   = ''
  try {
    await authStore.confirmMfaSetup(totpCode.value)
    proceedAfterLogin()
  } catch (e: unknown) {
    mfaError.value = e instanceof Error ? e.message : 'Something went wrong.'
  } finally {
    mfaLoading.value = false
  }
}
</script>

<template>
  <div class="login-page">

    <div class="back-row">
      <RouterLink to="/" class="back-home"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Back to home</RouterLink>
    </div>

    <!-- Card -->
    <div class="login-card">

      <!-- Logo (goes to the home page) -->
      <RouterLink to="/" class="brand" aria-label="FitAccess home">
        <img src="/logo.png" alt="FitAccess" class="brand-icon" />
        <span class="brand-name">FitAccess</span>
      </RouterLink>

      <!-- ── Sign in: email + password on one page ── -->
      <template v-if="step === 'signin'">
        <form class="card-body" novalidate @submit.prevent="handleSignIn">
          <div v-if="successMsg" class="success-msg">{{ successMsg }}</div>
          <h1 class="heading">Sign in</h1>
          <p class="subtext">Already have an account? Enter your email and password to sign in.</p>

          <div class="field-wrap">
            <label class="field-label" for="login-email">Email address</label>
            <input
              id="login-email"
              v-model="email"
              type="email"
              placeholder="you@company.com"
              class="input"
              :class="{ 'input-error': error }"
              autocomplete="username"
              autofocus
              @keydown.enter.prevent="focusPassword"
            />
          </div>

          <div class="field-wrap">
            <label class="field-label" for="login-password">Password</label>
            <div class="pass-wrap">
              <input
                id="login-password"
                ref="passwordEl"
                v-model="password"
                :type="showPass ? 'text' : 'password'"
                placeholder="Password"
                class="input"
                :class="{ 'input-error': error }"
                autocomplete="current-password"
              />
              <button
                class="toggle-pass"
                type="button"
                :aria-label="showPass ? 'Hide password' : 'Show password'"
                @click="showPass = !showPass"
              >
                <svg v-if="!showPass" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="forgot-row">
            <RouterLink to="/forgot-password" class="link-forgot">Forgot password?</RouterLink>
          </div>

          <p v-if="error" class="error-msg">{{ error }}</p>

          <div class="actions">
            <button
              type="submit"
              class="btn-continue"
              :class="{ active: canSignIn && !loading }"
              :disabled="!canSignIn || loading"
            >
              <span v-if="loading" class="spinner"></span>
              <span v-else>Sign in</span>
            </button>
          </div>

          <p class="new-row">
            New to FitAccess?
            <RouterLink :to="{ path: '/', hash: '#audiences' }" class="link-signup">Create an account</RouterLink>
          </p>
        </form>
      </template>

      <!-- ── Step 3 : MFA setup (every privileged login) ── -->
      <template v-else-if="step === 'mfa-setup'">
        <div class="card-body">
          <h1 class="heading">{{ authStore.mfaEnrolled ? 'Two-factor authentication' : 'Set up two-factor authentication' }}</h1>
          <p class="subtext">{{ authStore.mfaMessage }}</p>

          <div class="qr-wrap" v-if="authStore.mfaQrCode">
            <img :src="authStore.mfaQrCode" alt="Scan with an authenticator app" width="180" height="180" />
          </div>
          <p v-if="authStore.mfaSecret" class="manual-secret">
            Can't scan? Enter this key manually: <code>{{ authStore.mfaSecret }}</code>
          </p>

          <div class="field-wrap">
            <input
              v-model="totpCode"
              type="text"
              inputmode="numeric"
              maxlength="6"
              placeholder="Enter the 6-digit code"
              class="input code-input"
              autocomplete="one-time-code"
              @keyup.enter="handleMfaSetupConfirm"
            />
          </div>

          <p v-if="mfaError" class="error-msg">{{ mfaError }}</p>

          <div class="actions">
            <button
              class="btn-continue"
              :class="{ active: !mfaLoading && totpCode }"
              :disabled="mfaLoading || !totpCode"
              @click="handleMfaSetupConfirm"
            >
              <span v-if="mfaLoading" class="spinner"></span>
              <span v-else>Enable & continue</span>
            </button>
          </div>
        </div>
      </template>

    </div><!-- /card -->

    <!-- Footer -->
    <footer class="login-footer">
      <p class="footer-notice">
        This site is protected by reCAPTCHA Enterprise and the
        <a href="#">FitAccess privacy policy</a> and
        <a href="#">Terms of Service</a> apply.
      </p>
      <div class="footer-links">
        <a href="#">Terms</a>
        <a href="#">Privacy</a>
      </div>
    </footer>

  </div>
</template>

<style scoped>
/* ── Page ─────────────────────────────────────────────── */
.login-page {
  min-height: 100vh;
  background: #f0ede8;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px 0;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}

/* ── Card ─────────────────────────────────────────────── */
.login-card {
  width: 100%;
  max-width: 580px;
  background: #ffffff;
  border: 1px solid #e0dbd4;
  border-radius: 16px;
  padding: 40px 48px 48px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

/* ── Brand ────────────────────────────────────────────── */
.brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 32px;
  text-decoration: none;
}
.back-row { width: 100%; max-width: 580px; }
/* Field labels + "New to FitAccess?" row */
.field-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #0B0C10;
  margin-bottom: 6px;
}
.new-row {
  margin: 24px 0 0;
  padding-top: 20px;
  border-top: 1px solid #ece8e2;
  font-size: 0.92rem;
  color: #555;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

/* "Back to home" link above the card */
.back-home {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 14px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #0B0C10;
  text-decoration: none;
  padding: 6px 2px;
}
.back-home:hover { color: #5E9A00; text-decoration: underline; text-underline-offset: 4px; }

.brand-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}
.brand-name {
  font-size: 1.4rem;
  font-weight: 800;
  color: #8BE000;
  letter-spacing: -0.01em;
}

/* ── Card body ────────────────────────────────────────── */
.card-body {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* Back button */
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
.back-btn:hover { color: #111; }

/* Heading */
.heading {
  font-size: 2rem;
  font-weight: 800;
  color: #111;
  line-height: 1.2;
  margin-bottom: 10px;
  letter-spacing: -0.02em;
}

.subtext {
  font-size: 0.97rem;
  color: #666;
  margin-bottom: 28px;
}

.email-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: #444;
  background: #f5f2ee;
  padding: 6px 12px;
  border-radius: 20px;
  width: fit-content;
  margin-bottom: 24px;
}

/* ── Inputs ───────────────────────────────────────────── */
.field-wrap { margin-bottom: 8px; }
.field-wrap + .field-wrap { margin-top: 18px; }

.input {
  width: 100%;
  padding: 16px 18px;
  font-size: 1rem;
  color: #111;
  background: #f9f7f5;
  border: 1.5px solid #ddd8d2;
  border-radius: 10px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: inherit;
}
.input::placeholder { color: #aaa; }
.input:focus {
  border-color: #111;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(0,0,0,0.06);
}
.input.input-error { border-color: #8BE000; }

/* Password wrap */
.pass-wrap {
  position: relative;
}
.pass-wrap .input { padding-right: 50px; }
.toggle-pass {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}
.toggle-pass:hover { color: #333; }

/* Forgot */
.forgot-row {
  display: flex;
  justify-content: flex-end;
  margin: 8px 0 16px;
}
.link-forgot {
  font-size: 0.85rem;
  color: #555;
  text-decoration: underline;
  transition: color 0.2s;
}
.link-forgot:hover { color: #111; }

/* Error */
.error-msg {
  font-size: 0.85rem;
  color: #dc2626;
  margin-bottom: 12px;
  padding: 10px 14px;
  background: #fef2f2;
  border-radius: 8px;
  border: 1px solid #fecaca;
}

/* ── Actions row ──────────────────────────────────────── */
.actions {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 24px;
}

/* Continue / Sign in button */
.btn-continue {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 13px 28px;
  border-radius: 50px;
  font-size: 0.97rem;
  font-weight: 600;
  font-family: inherit;
  border: none;
  cursor: not-allowed;
  background: #d9d5d0;
  color: #fff;
  transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
  flex-shrink: 0;
}
.btn-continue.active {
  background: #111;
  cursor: pointer;
}
.btn-continue.active:hover {
  background: #222;
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(0,0,0,0.18);
}
.btn-continue.active:active { transform: translateY(0); }
.btn-continue:disabled { opacity: 1; }

/* Success message */
.success-msg {
  font-size: 0.9rem;
  color: #166534;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 20px;
  line-height: 1.5;
}

/* Signup link */
.link-signup {
  font-size: 0.95rem;
  color: #111;
  font-weight: 500;
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color 0.2s;
}
.link-signup:hover { color: #8BE000; }

/* Loading spinner */
.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── MFA steps ────────────────────────────────────────── */
.code-input {
  text-align: center;
  letter-spacing: 0.3em;
  font-size: 1.2rem;
  font-weight: 600;
}

.qr-wrap {
  display: flex;
  justify-content: center;
  padding: 16px;
  background: #fff;
  border: 1.5px solid #ddd8d2;
  border-radius: 12px;
  margin-bottom: 16px;
}
.qr-wrap img { display: block; }

.manual-secret {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 20px;
  text-align: center;
}
.manual-secret code {
  background: #f5f2ee;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 600;
  letter-spacing: 0.05em;
}

/* ── Footer ───────────────────────────────────────────── */
.login-footer {
  width: 100%;
  max-width: 1200px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 8px;
  margin-top: 32px;
  flex-wrap: wrap;
}

.footer-notice {
  font-size: 0.78rem;
  color: #999;
  line-height: 1.6;
  max-width: 420px;
}
.footer-notice a {
  color: #666;
  font-weight: 600;
  text-decoration: underline;
}
.footer-notice a:hover { color: #111; }

.footer-links {
  display: flex;
  gap: 20px;
  flex-shrink: 0;
}
.footer-links a {
  font-size: 0.85rem;
  font-weight: 600;
  color: #444;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.footer-links a:hover { color: #111; }

/* ── Responsive ───────────────────────────────────────── */
@media (max-width: 600px) {
  .login-card { padding: 32px 24px 36px; }
  .heading    { font-size: 1.6rem; }
  .login-footer { flex-direction: column; align-items: flex-start; }
}
</style>
