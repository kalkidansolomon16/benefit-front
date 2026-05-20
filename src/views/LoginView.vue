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
  return ''
})

// Two-step state
const step     = ref<'email' | 'password'>('email')
const email    = ref('')
const password = ref('')
const showPass = ref(false)
const loading  = ref(false)
const error    = ref('')

const emailValid   = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value))
const canContinue  = computed(() => emailValid.value)
const canSignIn    = computed(() => password.value.length >= 1)

function goToPassword() {
  if (!canContinue.value) return
  error.value = ''
  step.value  = 'password'
}

function goBack() {
  step.value     = 'email'
  password.value = ''
  error.value    = ''
}

async function handleSignIn() {
  if (!canSignIn.value) return
  loading.value = true
  error.value   = ''
  try {
    await authStore.login(email.value, password.value)
    // Redirect based on role
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
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Something went wrong.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">

    <!-- Card -->
    <div class="login-card">

      <!-- Logo -->
      <div class="brand">
        <span class="brand-icon">✦</span>
        <span class="brand-name">FitAccess</span>
      </div>

      <!-- ── Step 1 : Email ── -->
      <template v-if="step === 'email'">
        <div class="card-body">
          <div v-if="successMsg" class="success-msg">{{ successMsg }}</div>
          <h1 class="heading">Enter your email</h1>
          <p class="subtext">Sign in to your FitAccess Ethiopia account to manage your team's wellness.</p>

          <div class="field-wrap">
            <input
              v-model="email"
              type="email"
              placeholder="Email address"
              class="input"
              :class="{ 'input-error': error }"
              autocomplete="email"
              autofocus
              @keyup.enter="goToPassword"
            />
          </div>

          <p v-if="error" class="error-msg">{{ error }}</p>

          <div class="actions">
            <button
              class="btn-continue"
              :class="{ active: canContinue }"
              :disabled="!canContinue"
              @click="goToPassword"
            >
              Continue
            </button>
            <RouterLink to="/signup/company" class="link-signup">Sign up for free</RouterLink>
          </div>
        </div>
      </template>

      <!-- ── Step 2 : Password ── -->
      <template v-else>
        <div class="card-body">
          <!-- Back -->
          <button class="back-btn" @click="goBack">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>

          <h1 class="heading">Welcome back</h1>
          <p class="subtext email-chip">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M4 4h16v16H4z"/><path d="M4 4l8 8 8-8"/>
            </svg>
            {{ email }}
          </p>

          <div class="field-wrap">
            <div class="pass-wrap">
              <input
                v-model="password"
                :type="showPass ? 'text' : 'password'"
                placeholder="Password"
                class="input"
                :class="{ 'input-error': error }"
                autocomplete="current-password"
                autofocus
                @keyup.enter="handleSignIn"
              />
              <button class="toggle-pass" type="button" @click="showPass = !showPass" tabindex="-1">
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
            <a href="#" class="link-forgot">Forgot password?</a>
          </div>

          <p v-if="error" class="error-msg">{{ error }}</p>

          <div class="actions">
            <button
              class="btn-continue"
              :class="{ active: canSignIn && !loading }"
              :disabled="!canSignIn || loading"
              @click="handleSignIn"
            >
              <span v-if="loading" class="spinner"></span>
              <span v-else>Sign in</span>
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
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 32px;
}
.brand-icon {
  font-size: 1.6rem;
  color: #e0386a;
  line-height: 1;
}
.brand-name {
  font-size: 1.4rem;
  font-weight: 800;
  color: #e0386a;
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
.input.input-error { border-color: #e0386a; }

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
  color: #e0386a;
  margin-bottom: 12px;
  padding: 10px 14px;
  background: #fff0f3;
  border-radius: 8px;
  border: 1px solid #fcd5de;
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
.link-signup:hover { color: #e0386a; }

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
