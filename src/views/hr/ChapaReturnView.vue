<template>
  <div class="return-page">
    <div class="return-card">

      <!-- Loading -->
      <template v-if="state === 'loading'">
        <div class="spinner"></div>
        <p class="return-title">Verifying your payment…</p>
        <p class="return-sub">Please wait, this only takes a moment.</p>
      </template>

      <!-- Success -->
      <template v-else-if="state === 'success'">
        <div class="icon-wrap icon-success">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <p class="return-title">Payment Successful!</p>
        <p class="return-sub">{{ message }}</p>
        <div v-if="invoice" class="invoice-box">
          <p class="inv-label">{{ invoice.invoice_number }}</p>
          <p class="inv-period">{{ invoice.billing_period }}</p>
          <p class="inv-amount">ETB {{ Number(invoice.total_amount).toLocaleString() }}</p>
          <span class="inv-status">Paid</span>
        </div>
        <button class="btn-primary" @click="goToBilling">View Billing</button>
      </template>

      <!-- Failed -->
      <template v-else-if="state === 'failed'">
        <div class="icon-wrap icon-failed">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <p class="return-title">Payment Failed</p>
        <p class="return-sub">{{ message }}</p>
        <div class="action-row">
          <button class="btn-outline" @click="goToBilling">Back to Billing</button>
          <button class="btn-primary" @click="retry">Try Again</button>
        </div>
      </template>

      <!-- No tx_ref -->
      <template v-else>
        <div class="icon-wrap icon-failed">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <p class="return-title">Invalid Return</p>
        <p class="return-sub">No transaction reference found. Please return to billing and try again.</p>
        <button class="btn-primary" @click="goToBilling">Back to Billing</button>
      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth   = useAuthStore()
const API    = import.meta.env.VITE_API_BASE_URL

type State = 'loading' | 'success' | 'failed' | 'invalid'

const state   = ref<State>('loading')
const message = ref('')
const invoice = ref<any>(null)

onMounted(async () => {
  const params = new URLSearchParams(window.location.search)
  const txRef  = params.get('tx_ref')

  if (!txRef) {
    state.value = 'invalid'
    return
  }

  try {
    const res  = await fetch(`${API}/hr/billing/chapa/verify?tx_ref=${encodeURIComponent(txRef)}`, {
      headers: { Authorization: `Bearer ${auth.token}`, Accept: 'application/json' },
    })
    const data = await res.json()

    if (res.ok && data.status === 'success') {
      state.value   = 'success'
      message.value = data.message
      invoice.value = data.invoice ?? null
    } else {
      state.value   = 'failed'
      message.value = data.message || 'Payment could not be confirmed.'
    }
  } catch {
    state.value   = 'failed'
    message.value = 'Network error — please check your connection and try again.'
  }
})

function goToBilling() {
  router.push('/hr/billing')
}

function retry() {
  router.push('/hr/billing')
}
</script>

<style scoped>
.return-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  padding: 24px;
}

.return-card {
  background: #fff;
  border-radius: 20px;
  padding: 48px 40px;
  max-width: 440px;
  width: 100%;
  text-align: center;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

/* Spinner */
.spinner {
  width: 48px; height: 48px;
  border: 3px solid #e2e8f0;
  border-top-color: #4CD964;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Icon */
.icon-wrap {
  width: 72px; height: 72px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 4px;
}
.icon-success { background: #d1fae5; color: #15803d; }
.icon-failed  { background: #fee2e2; color: #dc2626; }

.return-title {
  font-size: 1.3rem; font-weight: 700; color: #0f172a; margin: 0;
}
.return-sub {
  font-size: 0.9rem; color: #64748b; margin: 0; line-height: 1.6; max-width: 320px;
}

/* Invoice summary box */
.invoice-box {
  background: #f8fafc; border: 1px solid #e2e8f0;
  border-radius: 12px; padding: 14px 20px;
  display: flex; flex-direction: column; gap: 4px; width: 100%;
}
.inv-label  { font-size: 0.8rem; color: #94a3b8; margin: 0; }
.inv-period { font-size: 0.9rem; font-weight: 600; color: #0f172a; margin: 0; }
.inv-amount { font-size: 1.1rem; font-weight: 700; color: #0f172a; margin: 0; }
.inv-status {
  display: inline-block; margin-top: 4px;
  padding: 2px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 700;
  background: #d1fae5; color: #15803d;
}

/* Buttons */
.btn-primary {
  padding: 12px 28px; background: #4CD964; color: #fff;
  border: none; border-radius: 10px; font-size: 0.9rem; font-weight: 600;
  cursor: pointer; transition: opacity 0.15s; width: 100%;
}
.btn-primary:hover { opacity: 0.85; }

.btn-outline {
  padding: 12px 28px; background: #fff; color: #475569;
  border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 0.9rem; font-weight: 600;
  cursor: pointer; transition: border-color 0.15s;
}
.btn-outline:hover { border-color: #94a3b8; }

.action-row { display: flex; gap: 10px; width: 100%; }
.action-row .btn-outline,
.action-row .btn-primary { flex: 1; }
</style>
