<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AuthShell from '@/components/AuthShell.vue'

const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()

const successMsg = computed(() => {
  if (route.query.registered === 'company')
    return 'Company account created! Please sign in to continue.'
  if (route.query.registered === 'partner')
    return 'Partner application submitted! Our team will review and contact you within 2–3 business days.'
  if (route.query.registered === 'employee')
    return 'Application submitted! Your HR team will review and activate your account shortly.'
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
  if (totpCode.value.length !== 6 || mfaLoading.value) return
  mfaLoading.value = true
  mfaError.value   = ''
  resendNote.value = ''
  try {
    await authStore.confirmMfaSetup(totpCode.value)
    stopTimer()
    proceedAfterLogin()
  } catch (e: unknown) {
    mfaError.value = e instanceof Error ? e.message : 'Something went wrong.'
    totpCode.value = ''
    codeEl.value?.focus()
    // Too many wrong codes / expired: the server ended this attempt
    if (/sign in again/i.test(mfaError.value)) setTimeout(backToSignIn, 2500)
  } finally {
    mfaLoading.value = false
  }
}

// ── Emailed code: digits only, auto-submit at 6, resend countdown ──
const codeEl     = ref<HTMLInputElement | null>(null)
const resendIn   = ref(0)
const resending  = ref(false)
const resendNote = ref('')
let timer: ReturnType<typeof setInterval> | null = null

function stopTimer() {
  if (timer) clearInterval(timer)
  timer = null
}
function startTimer(seconds: number) {
  stopTimer()
  resendIn.value = seconds
  timer = setInterval(() => {
    resendIn.value = Math.max(0, resendIn.value - 1)
    if (resendIn.value === 0) stopTimer()
  }, 1000)
}

function onCodeInput(e: Event) {
  const el = e.target as HTMLInputElement
  totpCode.value = el.value.replace(/\D/g, '').slice(0, 6)
  el.value = totpCode.value
  mfaError.value = ''
  if (totpCode.value.length === 6) handleMfaSetupConfirm()
}

async function resendCode() {
  resending.value = true
  mfaError.value = ''
  try {
    resendNote.value = await authStore.resendMfaCode()
    startTimer(authStore.mfaResendAfter)
  } catch (e) {
    mfaError.value = e instanceof Error ? e.message : 'Could not send a new code.'
  } finally {
    resending.value = false
  }
}

function backToSignIn() {
  stopTimer()
  authStore.clearMfaState()
  totpCode.value = ''
  mfaError.value = ''
  resendNote.value = ''
  password.value = ''
  step.value = 'signin'
}

watch(step, async (s) => {
  if (s !== 'mfa-setup') return
  startTimer(authStore.mfaResendAfter)
  await nextTick()
  codeEl.value?.focus()
})
onBeforeUnmount(stopTimer)
</script>

<template>
  <AuthShell variant="login" prompt="Don't have an account yet?" action-label="Register" action-to="/register">
    <!-- ── Sign in ── -->
    <form v-if="step === 'signin'" class="auth" novalidate @submit.prevent="handleSignIn">
      <div v-if="successMsg" class="auth-ok" role="status">{{ successMsg }}</div>

      <h1 class="auth-title">Already have an account? Log in</h1>
      <p class="auth-sub">Use the email address you registered with FitAccess.</p>

      <div class="fl" :class="{ err: error }">
        <label class="fl-label" for="login-email">Email <span aria-hidden="true">*</span></label>
        <input
          id="login-email"
          v-model="email"
          type="email"
          class="fl-input"
          placeholder="you@company.com"
          autocomplete="username"
          autofocus
          @keydown.enter.prevent="focusPassword"
        />
      </div>

      <div class="fl" :class="{ err: error }">
        <label class="fl-label" for="login-password">Password <span aria-hidden="true">*</span></label>
        <input
          id="login-password"
          ref="passwordEl"
          v-model="password"
          :type="showPass ? 'text' : 'password'"
          class="fl-input has-eye"
          placeholder="Your password"
          autocomplete="current-password"
        />
        <button
          class="fl-eye"
          type="button"
          :aria-label="showPass ? 'Hide password' : 'Show password'"
          @click="showPass = !showPass"
        >
          <svg v-if="!showPass" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
          <svg v-else width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
        </button>
      </div>

      <p v-if="error" class="auth-err" role="alert">{{ error }}</p>

      <RouterLink to="/forgot-password" class="auth-forgot">Forgot password?</RouterLink>

      <button type="submit" class="auth-btn" :disabled="!canSignIn || loading">
        <span v-if="loading" class="auth-spin" aria-hidden="true"></span>
        <span v-else>Log in</span>
      </button>

      <p class="auth-alt">
        New to FitAccess? <RouterLink to="/register">Create an account</RouterLink>
          <span class="join-hint">Registered by your company? <RouterLink to="/join">Create your account here</RouterLink></span>
      </p>
    </form>

    <!-- ── Second step: code sent by email ── -->
    <form v-else-if="step === 'mfa-setup'" class="auth" novalidate @submit.prevent="handleMfaSetupConfirm">
      <span class="auth-mail" aria-hidden="true">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="M3.5 6.5l8.5 6.5 8.5-6.5" /></svg>
      </span>
      <h1 class="auth-title">Check your email</h1>
      <p class="auth-sub">
        We sent a 6-digit sign-in code to
        <strong>{{ authStore.mfaSentTo || 'your email address' }}</strong>.
        Enter it below to finish signing in.
      </p>

      <div class="fl" :class="{ err: mfaError }">
        <label class="fl-label" for="mfa-code">Sign-in code <span aria-hidden="true">*</span></label>
        <input
          id="mfa-code"
          ref="codeEl"
          :value="totpCode"
          type="text"
          inputmode="numeric"
          maxlength="6"
          class="fl-input code"
          placeholder="000000"
          autocomplete="one-time-code"
          @input="onCodeInput"
        />
      </div>

      <p v-if="mfaError" class="auth-err" role="alert">{{ mfaError }}</p>
      <p v-else-if="resendNote" class="auth-ok" role="status">{{ resendNote }}</p>

      <button type="submit" class="auth-btn" :disabled="mfaLoading || totpCode.length !== 6">
        <span v-if="mfaLoading" class="auth-spin" aria-hidden="true"></span>
        <span v-else>Verify &amp; continue</span>
      </button>

      <p class="auth-alt">
        Didn't get it? Check your spam folder, or
        <button v-if="resendIn === 0" type="button" class="auth-linkbtn" :disabled="resending" @click="resendCode">
          {{ resending ? 'sending…' : 'send a new code' }}
        </button>
        <span v-else class="auth-wait">send a new code in {{ resendIn }}s</span>
      </p>
      <button type="button" class="auth-back" @click="backToSignIn">← Use a different account</button>
    </form>
  </AuthShell>
</template>

<style scoped>
.auth {
  display: flex; flex-direction: column; gap: 22px; position: relative; overflow: hidden;
  background: #fff; border: 1px solid #e4e9dc; border-radius: 28px; padding: 40px 40px 34px;
  box-shadow: 0 30px 70px rgba(11, 12, 16, 0.10), 0 2px 8px rgba(11, 12, 16, 0.04);
}
.auth::before { content: ''; position: absolute; inset: 0 0 auto 0; height: 4px; background: linear-gradient(90deg, #4d7c0f, #8be000 60%, #c5f27a); }
.auth .auth-title { font-size: clamp(22px, 2vw, 28px); text-wrap: balance; }
@media (max-width: 560px) { .auth { padding: 28px 18px 24px; border-radius: 22px; } }
.auth-title { margin: 0; text-align: center; font-family: var(--font-heading); font-size: 30px; font-weight: 700; color: #111827; line-height: 1.2; }
.auth-sub { margin: -10px 0 6px; text-align: center; font-size: 15px; color: #374151; line-height: 1.5; }
.auth-ok { padding: 12px 16px; border-radius: 14px; background: #eef9dc; color: #3f6212; font-size: 14px; font-weight: 600; }

/* Floating-label pill inputs */
.fl { position: relative; }
.fl-label {
  position: absolute; top: -9px; left: 26px; z-index: 1; padding: 0 8px; background: #fff;
  border-radius: 999px; font-size: 13px; color: #374151;
}
.fl-label span { color: #dc2626; }
.fl-input {
  width: 100%; box-sizing: border-box; padding: 19px 28px; border: 1.5px solid #e5e7eb; border-radius: 999px;
  background: #f6f8f2; font-size: 16px; font-family: inherit; color: #111827; transition: border-color 0.15s, box-shadow 0.15s;
}
.fl-input::placeholder { color: #9ca3af; }
.fl-input:focus { outline: none; border-color: #0b0c10; background: #fff; box-shadow: 0 0 0 4px rgba(139, 224, 0, 0.3); }
.fl-input.has-eye { padding-right: 60px; }
.fl-input.code { text-align: center; letter-spacing: 0.4em; font-size: 20px; }
.fl.err .fl-input { border-color: #fca5a5; }
.fl-eye {
  position: absolute; right: 18px; top: 50%; transform: translateY(-50%); border: none; background: none;
  color: #9ca3af; cursor: pointer; padding: 6px; display: flex;
}
.fl-eye:hover { color: #0b0c10; }

.auth-err { margin: -8px 0 0; padding: 10px 16px; border-radius: 14px; background: #fef2f2; color: #b91c1c; font-size: 14px; }
.auth-forgot { align-self: center; color: #4d7c0f; font-size: 15px; text-decoration: underline; text-underline-offset: 3px; }
.auth-forgot:hover { color: #0b0c10; }
.auth-btn {
  display: flex; align-items: center; justify-content: center; min-height: 58px; border: none; border-radius: 999px;
  background: #0b0c10; color: #fff; font-size: 17px; font-weight: 700; font-family: inherit; cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.auth-btn:hover:not(:disabled) { background: #8be000; color: #0b0c10; }
.auth-btn:disabled { background: #d1d5db; cursor: not-allowed; }
.auth-spin { width: 20px; height: 20px; border-radius: 50%; border: 3px solid rgba(255, 255, 255, 0.4); border-top-color: #fff; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.auth-alt { margin: 0; text-align: center; font-size: 15px; color: #4b5563; }
.auth-alt a { color: #0b0c10; font-weight: 700; }
.auth-alt a:hover { color: #4d7c0f; }
.auth-mail { align-self: center; width: 72px; height: 72px; border-radius: 50%; background: #eef9dc; color: #4d7c0f; display: flex; align-items: center; justify-content: center; margin-bottom: -6px; }
.auth-linkbtn { border: none; background: none; padding: 0; color: #0b0c10; font-weight: 700; font-size: inherit; font-family: inherit; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
.auth-linkbtn:hover { color: #4d7c0f; }
.auth-linkbtn:disabled { opacity: 0.6; cursor: default; }
.auth-wait { color: #9ca3af; }
.auth-back { align-self: center; border: none; background: none; color: #4b5563; font-size: 14px; font-family: inherit; cursor: pointer; }
.auth-back:hover { color: #0b0c10; }
@media (max-width: 480px) { .auth-title { font-size: 24px; } .fl-input { padding: 17px 22px; } }
.join-hint { display: block; margin-top: 8px; font-size: 13px; color: #6b7280; }
.join-hint a { color: #0b0c10; font-weight: 700; }
</style>
