<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'

const api = useApi()

interface TelegramStatus { linked: boolean; chat_id: number | null }
interface GenerateCodeResult { code: string; expires_in: number; bot_url: string }

const linked      = ref(false)
const loading     = ref(true)
const codeLoading = ref(false)
const unlinkLoading = ref(false)

const linkCode    = ref('')
const codeExpiry  = ref(0)
const botUrl      = ref('')
const countdown   = ref(0)
let countdownTimer: ReturnType<typeof setInterval> | null = null

const toast = ref('')
const toastType = ref<'success' | 'error'>('success')

function showToast(msg: string, type: 'success' | 'error' = 'success') {
  toast.value = msg
  toastType.value = type
  setTimeout(() => { toast.value = '' }, 4000)
}

onMounted(async () => {
  try {
    const data = await api.get<TelegramStatus>('telegram/status')
    linked.value = data.linked
  } catch {
    // not linked
  } finally {
    loading.value = false
  }
})

async function generateCode() {
  codeLoading.value = true
  try {
    const data = await api.post<GenerateCodeResult>('telegram/generate-code')
    linkCode.value   = data.code
    codeExpiry.value = data.expires_in
    botUrl.value     = data.bot_url
    startCountdown(data.expires_in)
  } catch (e: unknown) {
    showToast(e instanceof Error ? e.message : 'Failed to generate code.', 'error')
  } finally {
    codeLoading.value = false
  }
}

function startCountdown(seconds: number) {
  countdown.value = seconds
  if (countdownTimer) clearInterval(countdownTimer)
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer!)
      linkCode.value = ''
    }
  }, 1000)
}

function formatCountdown(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function copyCode() {
  navigator.clipboard.writeText(linkCode.value)
  showToast('Code copied to clipboard!')
}

async function unlink() {
  if (!confirm('Disconnect your Telegram account?')) return
  unlinkLoading.value = true
  try {
    await api.delete('telegram/unlink')
    linked.value  = false
    linkCode.value = ''
    showToast('Telegram account disconnected.')
  } catch (e: unknown) {
    showToast(e instanceof Error ? e.message : 'Failed to unlink.', 'error')
  } finally {
    unlinkLoading.value = false
  }
}

function openBot() {
  if (botUrl.value) window.open(botUrl.value, '_blank')
}
</script>

<template>
  <div class="settings-page">
    <div class="settings-card">
      <h1 class="settings-title">Account Settings</h1>

      <!-- Telegram Section -->
      <section class="settings-section">
        <div class="section-header">
          <div class="section-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.022 14.51l-2.948-.924c-.64-.203-.654-.64.136-.954l11.52-4.44c.533-.194 1.002.13.832.956z"/>
            </svg>
          </div>
          <div>
            <h2 class="section-title">Telegram Notifications</h2>
            <p class="section-desc">Receive real-time alerts for approvals, rejections, and account updates.</p>
          </div>
        </div>

        <div v-if="loading" class="status-row">
          <span class="spinner-sm"></span> Loading…
        </div>

        <template v-else>
          <!-- Already linked -->
          <div v-if="linked" class="linked-state">
            <div class="linked-badge">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Telegram connected
            </div>
            <p class="linked-note">You will receive notifications for account approvals, rejections, and membership updates directly in Telegram.</p>
            <button class="btn-unlink" :disabled="unlinkLoading" @click="unlink">
              <span v-if="unlinkLoading" class="spinner-sm"></span>
              <span v-else>Disconnect Telegram</span>
            </button>
          </div>

          <!-- Not linked -->
          <div v-else class="unlinked-state">
            <p class="unlinked-note">
              Link your Telegram account to get instant notifications — no more missing important updates.
            </p>

            <!-- Step guide -->
            <div class="steps">
              <div class="step">
                <span class="step-num">1</span>
                <span>Click <strong>Generate Code</strong> below</span>
              </div>
              <div class="step">
                <span class="step-num">2</span>
                <span>Open the FitAccess Bot in Telegram</span>
              </div>
              <div class="step">
                <span class="step-num">3</span>
                <span>Send <code>/link YOUR_CODE</code> to the bot</span>
              </div>
            </div>

            <!-- Code display -->
            <div v-if="linkCode" class="code-block">
              <div class="code-row">
                <span class="code-value">{{ linkCode }}</span>
                <button class="btn-copy" @click="copyCode" title="Copy code">
                  <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <div class="code-meta">
                <span class="expiry" :class="{ urgent: countdown < 60 }">
                  Expires in {{ formatCountdown(countdown) }}
                </span>
              </div>
              <button class="btn-open-bot" @click="openBot">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.022 14.51l-2.948-.924c-.64-.203-.654-.64.136-.954l11.52-4.44c.533-.194 1.002.13.832.956z"/>
                </svg>
                Open FitAccess Bot
              </button>
            </div>

            <button class="btn-generate" :disabled="codeLoading" @click="generateCode">
              <span v-if="codeLoading" class="spinner-sm"></span>
              <span v-else-if="linkCode">Regenerate Code</span>
              <span v-else>Generate Link Code</span>
            </button>
          </div>
        </template>
      </section>
    </div>

    <!-- Toast -->
    <Teleport to="body">
      <transition name="toast-slide">
        <div v-if="toast" class="toast" :class="toastType === 'error' ? 'toast-error' : 'toast-ok'">
          {{ toast }}
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: #f5f2ee;
  padding: 40px 20px;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}

.settings-card {
  max-width: 640px;
  margin: 0 auto;
  background: #fff;
  border: 1px solid #e0dbd4;
  border-radius: 16px;
  padding: 36px 40px;
  box-shadow: 0 2px 12px rgba(0,0,0,.05);
}

.settings-title {
  font-size: 1.6rem;
  font-weight: 800;
  color: #111;
  margin-bottom: 32px;
  letter-spacing: -0.02em;
}

/* Section */
.settings-section {
  border-top: 1px solid #e8e3dd;
  padding-top: 28px;
}

.section-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 24px;
}

.section-icon {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  background: #e8f4fd;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2196f3;
}

.section-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #111;
  margin-bottom: 4px;
}

.section-desc {
  font-size: 0.875rem;
  color: #666;
}

/* Status row */
.status-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #888;
  font-size: 0.9rem;
}

/* Linked state */
.linked-state { display: flex; flex-direction: column; gap: 12px; }

.linked-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 0.85rem;
  font-weight: 600;
  width: fit-content;
}

.linked-note {
  font-size: 0.875rem;
  color: #555;
  line-height: 1.6;
}

.btn-unlink {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  background: #fff;
  border: 1.5px solid #ef4444;
  color: #ef4444;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s, color .15s;
  width: fit-content;
  font-family: inherit;
}
.btn-unlink:hover { background: #fef2f2; }
.btn-unlink:disabled { opacity: .5; cursor: not-allowed; }

/* Unlinked state */
.unlinked-state { display: flex; flex-direction: column; gap: 16px; }

.unlinked-note {
  font-size: 0.9rem;
  color: #555;
  line-height: 1.6;
}

/* Steps */
.steps { display: flex; flex-direction: column; gap: 10px; }

.step {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.9rem;
  color: #333;
}

.step-num {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  background: #111;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.78rem;
  font-weight: 700;
}

.step code {
  background: #f5f2ee;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.82rem;
  color: #333;
}

/* Code block */
.code-block {
  background: #f9f7f5;
  border: 1.5px solid #e0dbd4;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.code-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.code-value {
  font-size: 1.9rem;
  font-weight: 800;
  letter-spacing: 0.25em;
  color: #111;
  font-variant-numeric: tabular-nums;
  font-family: 'Courier New', monospace;
}

.btn-copy {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  background: #111;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s;
  font-family: inherit;
}
.btn-copy:hover { background: #333; }

.code-meta { display: flex; align-items: center; gap: 12px; }

.expiry {
  font-size: 0.8rem;
  color: #888;
}
.expiry.urgent { color: #ef4444; font-weight: 600; }

.btn-open-bot {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 16px;
  background: #2196f3;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s;
  font-family: inherit;
  width: fit-content;
}
.btn-open-bot:hover { background: #1976d2; }

/* Generate button */
.btn-generate {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 22px;
  background: #111;
  color: #fff;
  border: none;
  border-radius: 50px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s, transform .15s;
  font-family: inherit;
  width: fit-content;
}
.btn-generate:hover { background: #333; transform: translateY(-1px); }
.btn-generate:disabled { background: #ccc; cursor: not-allowed; transform: none; }

/* Spinners */
.spinner-sm {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin .65s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Toast */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 500;
  z-index: 9999;
  box-shadow: 0 4px 16px rgba(0,0,0,.15);
}
.toast-ok    { background: #111; color: #fff; }
.toast-error { background: #ef4444; color: #fff; }

.toast-slide-enter-active { transition: all .25s ease; }
.toast-slide-leave-active { transition: all .2s ease; }
.toast-slide-enter-from   { opacity: 0; transform: translateY(12px); }
.toast-slide-leave-to     { opacity: 0; transform: translateY(12px); }

@media (max-width: 600px) {
  .settings-card { padding: 24px 20px; }
  .code-value { font-size: 1.5rem; }
}
</style>
