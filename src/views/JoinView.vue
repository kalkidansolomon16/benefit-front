<script setup lang="ts">
// Employees imported by their company create their account here, from the
// link in their invitation email. They confirm the details their company
// listed (birth date, first name, last name, email) and choose a password.
import AuthShell from '@/components/AuthShell.vue'
import '@/assets/auth-form.css'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const API: string = import.meta.env.VITE_API_BASE_URL
const route = useRoute()
const router = useRouter()

const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))
const invite = reactive({ checked: false, valid: true, company: '', message: '', already: false })

const form = reactive({ birth_date: '', first_name: '', last_name: '', email: '', password: '', password_confirmation: '' })
const show = reactive({ pass: false, repeat: false })
const busy = ref(false)
const error = ref('')
const done = ref(false)

const checks = computed(() => ({
  length: form.password.length >= 12,
  upper: /[A-Z]/.test(form.password),
  lower: /[a-z]/.test(form.password),
  digit: /\d/.test(form.password),
  symbol: /[^A-Za-z0-9]/.test(form.password),
}))
const strong = computed(() => Object.values(checks.value).every(Boolean))
const repeatOk = computed(() => form.password_confirmation !== '' && form.password_confirmation === form.password)
const maxBirth = new Date(new Date().setFullYear(new Date().getFullYear() - 16)).toISOString().slice(0, 10)
const ready = computed(() =>
  !!form.birth_date && !!form.first_name.trim() && !!form.last_name.trim()
  && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) && strong.value && repeatOk.value,
)

onMounted(async () => {
  if (typeof route.query.email === 'string') form.email = route.query.email
  if (!token.value) {
    invite.checked = true
    return
  }
  try {
    const res = await fetch(`${API}/public/join/${encodeURIComponent(token.value)}`, { headers: { Accept: 'application/json' } })
    const data = await res.json().catch(() => ({}))
    invite.valid = !!data.valid
    invite.company = data.company ?? ''
    invite.message = data.message ?? ''
    invite.already = !!data.already
    if (data.email) form.email = data.email
  } catch {
    invite.valid = true // still let them try with their details
  } finally {
    invite.checked = true
  }
})

async function submit() {
  if (!ready.value || busy.value) return
  busy.value = true
  error.value = ''
  try {
    const res = await fetch(`${API}/public/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ ...form, email: form.email.trim(), token: token.value || undefined }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const first = data.errors ? (Object.values(data.errors as Record<string, string[]>)[0]?.[0]) : null
      throw new Error(first || data.message || 'Your account could not be created.')
    }
    done.value = true
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Your account could not be created.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <AuthShell variant="join" prompt="Already have an account?" action-label="Log in" action-to="/login">
    <div class="signup-card af join">
      <!-- Done -->
      <div v-if="done" class="join-done">
        <span class="join-ok" aria-hidden="true">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
        </span>
        <h1 class="heading">Your account is ready</h1>
        <p class="subtext">
          You can sign in now to explore gyms, trainings and news. Your card number will be sent to you after your
          company completes the payment. Enter it on the Cards page to start using partner gyms.
        </p>
        <button type="button" class="btn-next active" @click="router.push({ path: '/login', query: { email: form.email } })">Log in</button>
      </div>

      <template v-else>
        <h1 class="heading">Create your FitAccess account</h1>
        <p class="subtext">
          <template v-if="invite.company">{{ invite.company }} registered you for FitAccess. </template>
          Enter your details exactly as your company provided them and choose a password.
        </p>

        <div v-if="invite.checked && !invite.valid" class="join-note" :class="{ ok: invite.already }" role="status">
          {{ invite.message }}
          <RouterLink v-if="invite.already" to="/login">Log in</RouterLink>
        </div>

        <form v-if="!invite.already" class="fields" novalidate @submit.prevent="submit">
          <div class="field-group">
            <label class="field-label" for="j-birth">Birth date <span class="req">*</span></label>
            <input id="j-birth" v-model="form.birth_date" type="date" class="input" required :max="maxBirth" autocomplete="bday" />
          </div>
          <div class="field-group">
            <label class="field-label" for="j-first">First name <span class="req">*</span></label>
            <input id="j-first" v-model="form.first_name" class="input" required placeholder="First name" autocomplete="given-name" />
          </div>
          <div class="field-group">
            <label class="field-label" for="j-last">Last name <span class="req">*</span></label>
            <input id="j-last" v-model="form.last_name" class="input" required placeholder="Last name (grandfather's name)" autocomplete="family-name" />
          </div>
          <div class="field-group">
            <label class="field-label" for="j-email">Email <span class="req">*</span></label>
            <input id="j-email" v-model="form.email" type="email" class="input" required placeholder="E-mail" autocomplete="email" />
          </div>
          <div class="field-group">
            <label class="field-label" for="j-pass">Password <span class="req">*</span></label>
            <div class="pass-wrap">
              <input
                id="j-pass" v-model="form.password" :type="show.pass ? 'text' : 'password'" class="input"
                :class="{ 'input-ok': strong }" placeholder="12+ characters: A–Z, a–z, 0–9 and a symbol"
                autocomplete="new-password"
              />
              <button class="toggle-pass" type="button" :aria-label="show.pass ? 'Hide password' : 'Show password'" @click="show.pass = !show.pass">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5C7 5 2.7 8.1 1 12.5 2.7 16.9 7 20 12 20s9.3-3.1 11-7.5C21.3 8.1 17 5 12 5zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" /></svg>
              </button>
            </div>
            <ul v-if="form.password" class="pw-rules">
              <li :class="{ ok: checks.length }">12+ characters</li>
              <li :class="{ ok: checks.upper }">Uppercase</li>
              <li :class="{ ok: checks.lower }">Lowercase</li>
              <li :class="{ ok: checks.digit }">Digit</li>
              <li :class="{ ok: checks.symbol }">Special character</li>
            </ul>
          </div>
          <div class="field-group">
            <label class="field-label" for="j-repeat">Repeat password <span class="req">*</span></label>
            <div class="pass-wrap">
              <input
                id="j-repeat" v-model="form.password_confirmation" :type="show.repeat ? 'text' : 'password'" class="input"
                :class="{ 'input-ok': repeatOk, 'input-error': form.password_confirmation && !repeatOk }"
                placeholder="Password (repeat)" autocomplete="new-password"
              />
              <button class="toggle-pass" type="button" :aria-label="show.repeat ? 'Hide password' : 'Show password'" @click="show.repeat = !show.repeat">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5C7 5 2.7 8.1 1 12.5 2.7 16.9 7 20 12 20s9.3-3.1 11-7.5C21.3 8.1 17 5 12 5zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" /></svg>
              </button>
            </div>
          </div>

          <p v-if="error" class="join-error" role="alert">{{ error }}</p>

          <button type="submit" class="btn-next" :class="{ active: ready && !busy }" :disabled="!ready || busy">
            {{ busy ? 'Creating your account…' : 'Create account' }}
          </button>
          <p class="join-help">Details don't match? Your HR team can check what they entered for you.</p>
        </form>
      </template>
    </div>
  </AuthShell>
</template>

<style scoped>
.join { max-width: 640px; width: 100%; margin: 0 auto; box-sizing: border-box; }
.fields { display: flex; flex-direction: column; }
.field-group { display: flex; flex-direction: column; }
.input { width: 100%; box-sizing: border-box; outline: none; font-family: inherit; }
.pass-wrap { position: relative; }
.toggle-pass {
  position: absolute; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer;
  padding: 4px; display: inline-flex;
}
.pw-rules { display: flex; flex-wrap: wrap; gap: 6px; list-style: none; margin: 10px 0 0; padding: 0 0 0 20px; }
.pw-rules li { font-size: 12px; padding: 3px 9px; border-radius: 999px; background: #f3f4f6; color: #6b7280; }
.pw-rules li.ok { background: #eefbd6; color: #3f6b00; }
.btn-next { width: 100%; border: none; cursor: pointer; font-weight: 700; font-family: inherit; margin-top: 6px; }
.btn-next:disabled { cursor: not-allowed; }
.join-error { margin: 0; padding: 12px 16px; border-radius: 14px; background: #fef2f2; color: #b91c1c; font-size: 14px; line-height: 1.5; }
.join-note { margin: 0 0 22px; padding: 12px 16px; border-radius: 14px; background: #fffbeb; border: 1px solid #fde68a; color: #92400e; font-size: 14px; }
.join-note.ok { background: #f3fce6; border-color: #d9f2a8; color: #3f6b00; }
.join-note a { margin-left: 6px; font-weight: 700; color: #0b0c10; }
.join-help { margin: 0; text-align: center; font-size: 13px; color: #6b7280; }
.join-done { text-align: center; }
.join-ok {
  display: inline-flex; width: 64px; height: 64px; border-radius: 50%; align-items: center; justify-content: center;
  background: #8be000; color: #0b0c10; margin-bottom: 18px;
}
</style>
