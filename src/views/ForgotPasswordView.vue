<template>
  <div class="auth-wrap">
    <div class="auth-card">
      <div class="auth-logo">
        <span class="logo-icon">⚡</span>
        <span class="logo-text">FitAccess</span>
      </div>

      <!-- Step 1: Enter email -->
      <template v-if="!tokenSent">
        <h2 class="auth-title">Forgot Password?</h2>
        <p class="auth-sub">Enter your email and we'll send you a reset token.</p>

        <form @submit.prevent="requestReset" class="auth-form">
          <div class="field">
            <label>Email Address</label>
            <input type="email" v-model="email" placeholder="you@example.com" required />
          </div>

          <p v-if="error" class="err-msg">{{ error }}</p>

          <button type="submit" class="btn-primary" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            {{ loading ? 'Sending…' : 'Send Reset Token' }}
          </button>

          <router-link to="/login" class="back-link">← Back to Login</router-link>
        </form>
      </template>

      <!-- Step 2: Show the token -->
      <template v-else>
        <h2 class="auth-title">Reset Token Sent</h2>
        <p class="auth-sub">
          A reset token has been generated. In production, this would arrive in your email.
          For now, use the token below.
        </p>

        <div class="token-box">
          <p class="token-label">Your Reset Token</p>
          <div class="token-value">{{ resetToken }}</div>
          <button class="copy-btn" @click="copyToken">
            {{ copied ? '✓ Copied!' : 'Copy Token' }}
          </button>
        </div>

        <div class="info-note">
          Token expires in <strong>1 hour</strong>. Use it on the reset password page.
        </div>

        <router-link to="/reset-password" class="btn-primary btn-link">
          Go to Reset Password →
        </router-link>

        <router-link to="/login" class="back-link">← Back to Login</router-link>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const email      = ref('')
const loading    = ref(false)
const error      = ref('')
const tokenSent  = ref(false)
const resetToken = ref('')
const copied     = ref(false)

async function requestReset() {
  error.value = ''
  loading.value = true

  try {
    const res = await fetch('http://localhost:8000/api/v1/auth/forgot-password', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body:    JSON.stringify({ email: email.value }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Failed to send reset token.')

    resetToken.value = data.token ?? ''
    tokenSent.value  = true
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function copyToken() {
  try {
    await navigator.clipboard.writeText(resetToken.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {}
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
  display: flex;
  flex-direction: column;
  gap: 0;
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

.err-msg {
  background: rgba(239,68,68,0.12);
  border: 1px solid rgba(239,68,68,0.3);
  border-radius: 8px;
  color: #f87171;
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
  text-decoration: none;
}

.btn-primary:hover:not(:disabled) { background: #2EB84B; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-link { margin-top: 4px; }

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
  margin-top: 12px;
}

.back-link:hover { color: #4CD964; }

/* Token display */
.token-box {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  margin-bottom: 16px;
}

.token-label {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
  margin: 0 0 10px;
}

.token-value {
  font-size: 1.8rem;
  font-weight: 800;
  letter-spacing: 0.15em;
  color: #a5b4fc;
  margin-bottom: 14px;
  font-family: monospace;
}

.copy-btn {
  background: #1e293b;
  border: 1px solid #334155;
  color: #94a3b8;
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-btn:hover { border-color: #4CD964; color: #4CD964; }

.info-note {
  font-size: 0.82rem;
  color: #64748b;
  text-align: center;
  margin-bottom: 20px;
}

.info-note strong { color: #94a3b8; }
</style>
