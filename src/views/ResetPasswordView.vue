<template>
  <div class="auth-wrap">
    <div class="auth-card">
      <!-- Logo -->
      <div class="auth-logo">
        <span class="logo-icon">⚡</span>
        <span class="logo-text">FitAccess</span>
      </div>

      <!-- First-login forced reset -->
      <template v-if="isFirstLogin">
        <h2 class="auth-title">Set Your Password</h2>
        <p class="auth-sub">
          For your security, please set a new password before continuing.
        </p>

        <form @submit.prevent="submitFirstLogin" class="auth-form">
          <div class="field">
            <label>New Password</label>
            <div class="pw-wrap">
              <input
                :type="showPw ? 'text' : 'password'"
                v-model="form.password"
                placeholder="At least 8 characters"
                required
              />
              <button type="button" class="pw-toggle" @click="showPw = !showPw">
                <svg v-if="!showPw" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
          </div>

          <div class="field">
            <label>Confirm Password</label>
            <div class="pw-wrap">
              <input
                :type="showPw2 ? 'text' : 'password'"
                v-model="form.password_confirmation"
                placeholder="Repeat your password"
                required
              />
              <button type="button" class="pw-toggle" @click="showPw2 = !showPw2">
                <svg v-if="!showPw2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
          </div>

          <p v-if="error" class="err-msg">{{ error }}</p>
          <p v-if="success" class="ok-msg">{{ success }}</p>

          <button type="submit" class="btn-primary" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            {{ loading ? 'Saving…' : 'Set Password & Continue' }}
          </button>
        </form>
      </template>

      <!-- Token-based reset (forgot password flow) -->
      <template v-else>
        <h2 class="auth-title">Reset Password</h2>
        <p class="auth-sub">Enter the reset token you received and choose a new password.</p>

        <form @submit.prevent="submitTokenReset" class="auth-form">
          <div class="field">
            <label>Reset Token</label>
            <input v-model="form.token" placeholder="8-character token" required />
          </div>

          <div class="field">
            <label>New Password</label>
            <div class="pw-wrap">
              <input
                :type="showPw ? 'text' : 'password'"
                v-model="form.password"
                placeholder="At least 8 characters"
                required
              />
              <button type="button" class="pw-toggle" @click="showPw = !showPw">
                <svg v-if="!showPw" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
          </div>

          <div class="field">
            <label>Confirm Password</label>
            <div class="pw-wrap">
              <input
                :type="showPw2 ? 'text' : 'password'"
                v-model="form.password_confirmation"
                placeholder="Repeat your password"
                required
              />
              <button type="button" class="pw-toggle" @click="showPw2 = !showPw2">
                <svg v-if="!showPw2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
          </div>

          <p v-if="error" class="err-msg">{{ error }}</p>
          <p v-if="success" class="ok-msg">{{ success }}</p>

          <button type="submit" class="btn-primary" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            {{ loading ? 'Saving…' : 'Reset Password' }}
          </button>

          <router-link to="/login" class="back-link">← Back to Login</router-link>
        </form>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth   = useAuthStore()
const router = useRouter()

// If the user is logged in AND must reset → first-login forced reset
const isFirstLogin = computed(() => auth.isLoggedIn && auth.mustResetPassword)

const form = ref({ token: '', password: '', password_confirmation: '' })
const showPw  = ref(false)
const showPw2 = ref(false)
const loading = ref(false)
const error   = ref('')
const success = ref('')

/* ── First-login reset (authenticated) ─────────────────── */
async function submitFirstLogin() {
  error.value   = ''
  success.value = ''

  if (form.value.password.length < 8) {
    error.value = 'Password must be at least 8 characters.'
    return
  }
  if (form.value.password !== form.value.password_confirmation) {
    error.value = 'Passwords do not match.'
    return
  }

  loading.value = true
  try {
    const res = await fetch('http://localhost:8000/api/v1/auth/first-login-reset', {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept':        'application/json',
        'Authorization': `Bearer ${auth.token}`,
      },
      body: JSON.stringify({
        password:              form.value.password,
        password_confirmation: form.value.password_confirmation,
      }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Failed to reset password.')

    auth.clearMustReset()
    success.value = 'Password set! Redirecting…'

    // Redirect based on role
    setTimeout(() => redirectToDashboard(), 1200)
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

/* ── Token-based reset (unauthenticated) ─────────────────── */
async function submitTokenReset() {
  error.value   = ''
  success.value = ''

  if (form.value.password.length < 8) {
    error.value = 'Password must be at least 8 characters.'
    return
  }
  if (form.value.password !== form.value.password_confirmation) {
    error.value = 'Passwords do not match.'
    return
  }
  if (!form.value.token.trim()) {
    error.value = 'Please enter the reset token.'
    return
  }

  loading.value = true
  try {
    const res = await fetch('http://localhost:8000/api/v1/auth/reset-password', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        token:                 form.value.token,
        password:              form.value.password,
        password_confirmation: form.value.password_confirmation,
      }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Failed to reset password.')

    success.value = 'Password reset successfully! Redirecting to login…'
    setTimeout(() => router.push('/login'), 1500)
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function redirectToDashboard() {
  const role = auth.user?.role ?? ''
  if (['super_admin', 'fitaccess_admin', 'admin_finance', 'admin_support'].includes(role)) {
    router.push('/admin/dashboard')
  } else if (['company_hr', 'company_finance', 'company_ceo'].includes(role)) {
    router.push('/hr/dashboard')
  } else if (['gym_partner', 'gym_staff'].includes(role)) {
    router.push('/partner/dashboard')
  } else if (role === 'employee') {
    router.push('/employee/dashboard')
  } else {
    router.push('/')
  }
}
</script>

<style scoped>
.auth-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  padding: 24px;
}

.auth-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 16px;
  padding: 40px 36px;
  width: 100%;
  max-width: 440px;
}

.auth-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  margin-bottom: 28px;
}

.logo-icon { font-size: 1.6rem; }
.logo-text  { font-size: 1.4rem; font-weight: 700; color: #f1f5f9; }

.auth-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #f1f5f9;
  text-align: center;
  margin: 0 0 8px;
}

.auth-sub {
  font-size: 0.88rem;
  color: #94a3b8;
  text-align: center;
  margin: 0 0 28px;
}

.auth-form { display: flex; flex-direction: column; gap: 18px; }

.field { display: flex; flex-direction: column; gap: 6px; }

.field label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.field input {
  width: 100%;
  padding: 11px 14px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  color: #f1f5f9;
  font-size: 0.95rem;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.field input:focus {
  outline: none;
  border-color: #4CD964;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
}

.pw-wrap { position: relative; }
.pw-wrap input { padding-right: 44px; }

.pw-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
}

.pw-toggle svg { width: 18px; height: 18px; }
.pw-toggle:hover { color: #94a3b8; }

.err-msg {
  background: rgba(239,68,68,0.12);
  border: 1px solid rgba(239,68,68,0.3);
  border-radius: 8px;
  color: #f87171;
  font-size: 0.875rem;
  padding: 10px 14px;
  margin: 0;
}

.ok-msg {
  background: rgba(34,197,94,0.12);
  border: 1px solid rgba(34,197,94,0.3);
  border-radius: 8px;
  color: #4ade80;
  font-size: 0.875rem;
  padding: 10px 14px;
  margin: 0;
}

.btn-primary {
  width: 100%;
  padding: 12px;
  background: #4CD964;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-primary:hover:not(:disabled) { background: #2EB84B; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.back-link {
  text-align: center;
  color: #4CD964;
  font-size: 0.875rem;
  text-decoration: none;
  display: block;
}

.back-link:hover { color: #4CD964; }
</style>
