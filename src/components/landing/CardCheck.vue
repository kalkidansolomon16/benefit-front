<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'

/** Public "Check if your FitAccess card is active" widget (12-digit card number). */

const LENGTH = 12
const digits = ref<string[]>(Array(LENGTH).fill(''))
const boxes = ref<HTMLInputElement[]>([])

type Result =
  | { kind: 'active'; card: string; plan: string | null; validUntil: string | null }
  | { kind: 'inactive'; card: string }
  | { kind: 'not_found'; card: string }
  | { kind: 'error'; message: string }

const loading = ref(false)
const result = ref<Result | null>(null)

const value = computed(() => digits.value.join(''))
const complete = computed(() => /^\d{12}$/.test(value.value))

function setBox(el: unknown, i: number) {
  if (el) boxes.value[i] = el as HTMLInputElement
}

function focusBox(i: number) {
  const el = boxes.value[Math.max(0, Math.min(LENGTH - 1, i))]
  el?.focus()
  el?.select()
}

function fillFrom(start: number, text: string) {
  const only = text.replace(/\D/g, '').slice(0, LENGTH - start)
  only.split('').forEach((d, k) => { digits.value[start + k] = d })
  return only.length
}

function onInput(i: number, e: Event) {
  const el = e.target as HTMLInputElement
  const typed = el.value.replace(/\D/g, '')
  if (!typed) {
    digits.value[i] = ''
    el.value = ''
    return
  }
  const n = fillFrom(i, typed)
  el.value = digits.value[i] ?? ''
  result.value = null
  focusBox(i + n)
  maybeSubmit()
}

function onKeydown(i: number, e: KeyboardEvent) {
  if (e.key === 'Backspace' && !digits.value[i] && i > 0) {
    e.preventDefault()
    digits.value[i - 1] = ''
    focusBox(i - 1)
    result.value = null
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault(); focusBox(i - 1)
  } else if (e.key === 'ArrowRight') {
    e.preventDefault(); focusBox(i + 1)
  } else if (e.key === 'Enter') {
    submit()
  }
}

function onPaste(i: number, e: ClipboardEvent) {
  const text = e.clipboardData?.getData('text') ?? ''
  if (!/\d/.test(text)) return
  e.preventDefault()
  // A full number pasted anywhere fills from the first box
  const start = text.replace(/\D/g, '').length >= LENGTH ? 0 : i
  const n = fillFrom(start, text)
  result.value = null
  focusBox(start + n)
  maybeSubmit()
}

function maybeSubmit() {
  if (complete.value) nextTick(submit)
}

function reset() {
  digits.value = Array(LENGTH).fill('')
  result.value = null
  nextTick(() => focusBox(0))
}

function formatDate(d: string | null) {
  if (!d) return null
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

async function submit() {
  if (!complete.value || loading.value) return
  loading.value = true
  result.value = null
  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/public/card-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ card_number: value.value }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.status === 429) {
      result.value = { kind: 'error', message: 'Too many checks. Please wait a minute and try again.' }
    } else if (res.status === 422) {
      result.value = { kind: 'error', message: data.message ?? 'This is not a valid FitAccess card number. Please check the 12 digits.' }
    } else if (!res.ok) {
      throw new Error()
    } else if (data.status === 'active') {
      result.value = { kind: 'active', card: data.card_number, plan: data.plan ?? null, validUntil: data.valid_until ?? null }
    } else if (data.status === 'inactive') {
      result.value = { kind: 'inactive', card: data.card_number }
    } else {
      result.value = { kind: 'not_found', card: data.card_number }
    }
  } catch {
    result.value = { kind: 'error', message: 'We could not check your card right now. Please try again later.' }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section id="check-card" class="lp-section cc-section">
    <div class="lp-container cc-grid">
      <div class="cc-copy">
        <h2 class="lp-h2 cc-title">Is your <span class="hl">FitAccess card active?</span></h2>
        <p class="cc-lead">
          Type in your 12-digit card number to confirm that your membership is ready to use.
        </p>
        <p class="cc-hint">
          You will find your 12-digit card number in the FitAccess app and on your employee dashboard.
        </p>
      </div>

      <div class="cc-visual">
        <span class="cc-ring cc-ring--1" aria-hidden="true"></span>
        <span class="cc-ring cc-ring--2" aria-hidden="true"></span>

        <form class="cc-card" @submit.prevent="submit">
          <div class="cc-brand" aria-hidden="true">
            <img src="/logo.png" alt="" />
            <span>FitAccess</span>
          </div>

          <label class="cc-label" for="cc-box-0">Enter your 12-digit FitAccess card number</label>

          <div class="cc-boxes" role="group" aria-label="Card number">
            <template v-for="g in 3" :key="g">
              <div class="cc-group">
                <input
                  v-for="k in 4"
                  :id="`cc-box-${(g - 1) * 4 + k - 1}`"
                  :key="k"
                  :ref="(el) => setBox(el, (g - 1) * 4 + k - 1)"
                  class="cc-box"
                  :class="{ filled: !!digits[(g - 1) * 4 + k - 1] }"
                  type="text"
                  inputmode="numeric"
                  autocomplete="off"
                  maxlength="12"
                  :aria-label="`Digit ${(g - 1) * 4 + k}`"
                  :value="digits[(g - 1) * 4 + k - 1]"
                  @input="onInput((g - 1) * 4 + k - 1, $event)"
                  @keydown="onKeydown((g - 1) * 4 + k - 1, $event)"
                  @paste="onPaste((g - 1) * 4 + k - 1, $event)"
                  @focus="($event.target as HTMLInputElement).select()"
                />
              </div>
            </template>
          </div>

          <div class="cc-actions">
            <button type="submit" class="cc-btn" :disabled="!complete || loading">
              {{ loading ? 'Checking…' : 'Check card' }}
            </button>
            <button v-if="value.length" type="button" class="cc-clear" @click="reset">Clear</button>
          </div>

          <div class="cc-result" aria-live="polite">
            <div v-if="result?.kind === 'active'" class="cc-msg cc-msg--ok">
              <span class="cc-icon">✓</span>
              <div>
                <strong>Card {{ result.card }} is active.</strong>
                <span v-if="result.plan"> Plan: {{ result.plan }}.</span>
                <span v-if="result.validUntil"> Valid until {{ formatDate(result.validUntil) }}.</span>
                <span> You can use all FitAccess partner facilities included in your plan.</span>
              </div>
            </div>
            <div v-else-if="result?.kind === 'inactive'" class="cc-msg cc-msg--warn">
              <span class="cc-icon">!</span>
              <div>
                <strong>Card {{ result.card }} is not active.</strong>
                <span> Please contact your company's HR team to reactivate your FitAccess membership.</span>
              </div>
            </div>
            <div v-else-if="result?.kind === 'not_found'" class="cc-msg cc-msg--warn">
              <span class="cc-icon">?</span>
              <div>
                <strong>We could not find card {{ result.card }}.</strong>
                <span> Please check the number in your FitAccess app or dashboard and try again.</span>
              </div>
            </div>
            <div v-else-if="result?.kind === 'error'" class="cc-msg cc-msg--warn">
              <span class="cc-icon">!</span>
              <div>{{ result.message }}</div>
            </div>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cc-section { background: #fff; overflow: hidden; }
.hl { color: #8BE000; }

.cc-grid {
  display: grid;
  grid-template-columns: 1fr 1.15fr;
  gap: 56px;
  align-items: center;
}

.cc-title { text-align: left; margin: 0 0 18px; }
.cc-lead { font-size: 1.05rem; line-height: 1.6; color: #0B0C10; margin: 0 0 10px; }
.cc-hint { font-size: 0.9rem; line-height: 1.6; color: #0B0C10; opacity: 0.7; margin: 0; }

/* Card panel with soft rings behind it */
.cc-visual { position: relative; padding: 48px 0; }
.cc-ring {
  position: absolute;
  left: 50%;
  top: 50%;
  border-radius: 50%;
  border: 2px solid rgba(139, 224, 0, 0.18);
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.cc-ring--1 { width: 480px; height: 480px; }
.cc-ring--2 { width: 380px; height: 380px; }

.cc-card {
  position: relative;
  background: #EEF9DC;
  border: 1px solid #D6F0AE;
  border-radius: 26px;
  padding: 34px 36px 30px;
  min-height: 320px;
  display: flex;
  flex-direction: column;
}

.cc-brand {
  align-self: flex-end;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.5rem;
  font-weight: 900;
  font-style: italic;
  color: #0B0C10;
  opacity: 0.35;
  margin-bottom: 42px;
}
.cc-brand img { width: 26px; height: 26px; object-fit: contain; }

.cc-label {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0B0C10;
  margin-bottom: 16px;
}

.cc-boxes { display: flex; gap: 16px; flex-wrap: nowrap; }
.cc-group { display: flex; gap: 6px; flex: 1; min-width: 0; }
.cc-box {
  flex: 1;
  min-width: 0;
  width: 100%;
  height: 52px;
  border: 1.5px solid #C9DDA8;
  border-radius: 10px;
  background: #fff;
  text-align: center;
  font-size: 1.25rem;
  font-weight: 700;
  color: #0B0C10;
  font-family: inherit;
  padding: 0;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.cc-box:focus { outline: none; border-color: #0B0C10; box-shadow: 0 0 0 3px rgba(139, 224, 0, 0.45); }
.cc-box.filled { border-color: #8BE000; }

.cc-actions { display: flex; align-items: center; gap: 16px; margin-top: 22px; }
.cc-btn {
  border: none;
  border-radius: 999px;
  background: #0B0C10;
  color: #fff;
  font: inherit;
  font-weight: 700;
  font-size: 0.95rem;
  padding: 12px 28px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, opacity 0.2s;
}
.cc-btn:hover:not(:disabled) { background: #8BE000; color: #0B0C10; }
.cc-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.cc-clear {
  background: none;
  border: none;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  color: #0B0C10;
  text-decoration: underline;
  cursor: pointer;
}

.cc-result { margin-top: 18px; }
.cc-msg {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  border-radius: 14px;
  padding: 14px 16px;
  font-size: 0.92rem;
  line-height: 1.5;
  color: #0B0C10;
  background: #fff;
}
.cc-msg--ok { border: 1.5px solid #8BE000; }
.cc-msg--warn { border: 1.5px solid #0B0C10; }
.cc-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 0.8rem;
}
.cc-msg--ok .cc-icon { background: #8BE000; color: #0B0C10; }
.cc-msg--warn .cc-icon { background: #0B0C10; color: #fff; }

@media (max-width: 960px) {
  .cc-grid { grid-template-columns: 1fr; gap: 12px; }
  .cc-title, .cc-copy { text-align: center; }
}
@media (max-width: 520px) {
  .cc-card { padding: 24px 16px 22px; min-height: 0; }
  .cc-brand { margin-bottom: 24px; font-size: 1.2rem; }
  .cc-boxes { gap: 8px; }
  .cc-group { gap: 3px; }
  .cc-box { height: 40px; font-size: 1rem; border-radius: 7px; }
  .cc-ring--1 { width: 340px; height: 340px; }
  .cc-ring--2 { width: 260px; height: 260px; }
}
</style>
