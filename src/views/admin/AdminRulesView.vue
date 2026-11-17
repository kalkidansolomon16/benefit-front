<script setup lang="ts">
// Admin → Rules & documents: the payment calendar, late fee and deadlines,
// and the employee contract companies receive when they are approved.
import { onMounted, reactive, ref } from 'vue'
import { useApi } from '@/composables/useApi'
import { confirmDialog } from '@/composables/useDialog'
import { useAuthStore } from '@/stores/auth'

interface Rule { key: string; value: number; default: number; label: string; help: string }
interface RulesRes { rules: Rule[]; summary: string[]; contract: { custom: boolean; name: string; uploaded_at: string | null }; app_links?: { android: string | null; ios: string | null } }

const api = useApi()
const auth = useAuthStore()
const canEdit = auth.hasPermission('billing.create')

const loading = ref(true)
const saving = ref(false)
const uploading = ref(false)
const data = ref<RulesRes | null>(null)
const values = reactive<Record<string, number>>({})
const toast = reactive({ show: false, type: 'success' as 'success' | 'error', text: '' })
const fileInput = ref<HTMLInputElement | null>(null)
let t: ReturnType<typeof setTimeout> | null = null

function notify(text: string, type: 'success' | 'error' = 'success') {
  if (t) clearTimeout(t)
  Object.assign(toast, { show: true, type, text })
  t = setTimeout(() => (toast.show = false), 4500)
}

async function load() {
  loading.value = true
  try {
    data.value = await api.get<RulesRes>('settings/rules')
    data.value.rules.forEach((r) => (values[r.key] = r.value))
    appLinks.android = data.value.app_links?.android ?? ''
    appLinks.ios = data.value.app_links?.ios ?? ''
  } catch (e) {
    notify(e instanceof Error ? e.message : 'Could not load the rules.', 'error')
  } finally {
    loading.value = false
  }
}
onMounted(load)

const GROUPS: { title: string; keys: string[] }[] = [
  { title: 'Company invoices', keys: ['staff_list_cutoff_day', 'invoice_draft_day', 'invoice_send_day', 'payment_due_day', 'grace_end_day', 'late_fee_percent', 'negotiation_extension_days'] },
  { title: 'Registration and partners', keys: ['company_signup_deadline_day', 'partner_apply_deadline_day', 'partner_listing_day', 'invite_link_days', 'partner_statement_day', 'partner_payment_day', 'renewal_reminder_days'] },
]
const rule = (k: string) => data.value?.rules.find((r) => r.key === k)

// Mobile app store links, shown in employee invitation and card e-mails
const appLinks = reactive({ android: '', ios: '' })
const savingLinks = ref(false)
async function saveLinks() {
  savingLinks.value = true
  try {
    const r = await api.put<{ message: string }>('settings/app-links', { android: appLinks.android || null, ios: appLinks.ios || null })
    notify(r.message)
  } catch (e) {
    notify(e instanceof Error ? e.message : 'Could not save the links.', 'error')
  } finally {
    savingLinks.value = false
  }
}

async function save() {
  saving.value = true
  try {
    const r = await api.put<{ message: string; summary: string[] }>('settings/rules', { ...values })
    if (data.value) data.value.summary = r.summary
    notify(r.message)
  } catch (e) {
    notify(e instanceof Error ? e.message : 'Could not save.', 'error')
  } finally {
    saving.value = false
  }
}

async function upload(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  uploading.value = true
  try {
    const fd = new FormData()
    fd.append('file', f)
    const r = await api.upload<{ message: string }>('settings/contract', fd)
    notify(r.message)
    load()
  } catch (err) {
    notify(err instanceof Error ? err.message : 'Upload failed.', 'error')
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

async function resetContract() {
  if (!(await confirmDialog({ title: 'Use the official consent form?', message: 'The uploaded file will be removed and companies will receive the official Employee Enrolment and Consent Form (FA-EMP-01) again.', confirmText: 'Remove upload', danger: true }))) return
  try {
    const r = await api.del<{ message: string }>('settings/contract')
    notify(r.message)
    load()
  } catch (err) {
    notify(err instanceof Error ? err.message : 'Could not reset.', 'error')
  }
}

async function dl(path: string, name: string) {
  try { await api.download(path, name) } catch (e) { notify(e instanceof Error ? e.message : 'Download failed.', 'error') }
}
</script>

<template>
  <div class="rules">
    <div v-if="loading" class="state">Loading rules…</div>

    <template v-else-if="data">
      <section class="card summary">
        <h2>FitAccess monthly calendar</h2>
        <ul><li v-for="s in data.summary" :key="s">{{ s }}</li></ul>
      </section>

      <form class="grid" @submit.prevent="save">
        <section v-for="g in GROUPS" :key="g.title" class="card">
          <h2>{{ g.title }}</h2>
          <div v-for="k in g.keys" :key="k" class="row">
            <label :for="`r-${k}`">
              <strong>{{ rule(k)?.label }}</strong>
              <span>{{ rule(k)?.help }} Default: {{ rule(k)?.default }}.</span>
            </label>
            <input :id="`r-${k}`" v-model.number="values[k]" type="number" min="0" max="90" :disabled="!canEdit" />
          </div>
        </section>
        <div class="actions">
          <button v-if="canEdit" type="submit" class="btn" :disabled="saving">{{ saving ? 'Saving…' : 'Save rules' }}</button>
          <p v-else class="muted">You can view the rules. Changing them needs the billing permission.</p>
        </div>
      </form>
      <section class="card">
        <h2>Mobile app links</h2>
        <p class="muted">
          Employee e-mails (account invitation and card number) tell employees they can also use the FitAccess app.
          Add the store links so they get "Get it on Google Play" and "Download on the App Store" buttons.
        </p>
        <div class="links">
          <label>Google Play link<input v-model="appLinks.android" type="url" placeholder="https://play.google.com/store/apps/details?id=…" :disabled="!canEdit" /></label>
          <label>App Store link<input v-model="appLinks.ios" type="url" placeholder="https://apps.apple.com/app/…" :disabled="!canEdit" /></label>
        </div>
        <button v-if="canEdit" type="button" class="btn" :disabled="savingLinks" @click="saveLinks">{{ savingLinks ? 'Saving…' : 'Save app links' }}</button>
      </section>

      <section class="card">
        <h2>Employee contract</h2>
        <p class="muted">
          The Employee Enrolment and Consent Form is sent to every company when it is approved, together with the
          Excel template. Companies give it to their employees; only those who sign are added to the staff list.
        </p>
        <div class="doc">
          <span class="doc-ico" aria-hidden="true">📄</span>
          <div>
            <strong>{{ data.contract.name }}</strong>
            <span v-if="data.contract.uploaded_at" class="muted"> · uploaded {{ new Date(data.contract.uploaded_at).toLocaleDateString('en-GB') }}</span>
          </div>
        </div>
        <div class="doc-actions">
          <button type="button" class="btn ghost" @click="dl('settings/contract', 'FitAccess-Employee-Enrolment-and-Consent-Form.pdf')">Download contract</button>
          <button type="button" class="btn ghost" @click="dl('settings/employee-template', 'FitAccess-employees.xlsx')">Download Excel template</button>
          <template v-if="canEdit">
            <button type="button" class="btn" :disabled="uploading" @click="fileInput?.click()">{{ uploading ? 'Uploading…' : 'Upload a newer version (PDF or Word)' }}</button>
            <button v-if="data.contract.custom" type="button" class="btn danger" @click="resetContract">Use official form</button>
            <input ref="fileInput" type="file" accept=".docx,.doc,.pdf" class="hidden" @change="upload" />
          </template>
        </div>
      </section>
    </template>

    <Transition name="fade">
      <div v-if="toast.show" class="toast" :class="toast.type">{{ toast.text }}</div>
    </Transition>
  </div>
</template>

<style scoped>
.rules { display: flex; flex-direction: column; gap: 18px; max-width: 1100px; }
.state { padding: 40px; text-align: center; color: #64748b; }
.card { background: #fff; border-radius: 16px; padding: 22px 24px; box-shadow: 0 1px 4px rgba(0,0,0,.06); }
.card h2 { margin: 0 0 14px; font-size: 1.02rem; color: #0f172a; }
.summary { background: linear-gradient(180deg, #f3fce6, #fff); border: 1px solid #e3f5c6; }
.summary ul { margin: 0; padding-left: 18px; color: #374151; font-size: .9rem; line-height: 1.7; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.row { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 12px 0; border-top: 1px solid #f1f5f9; }
.row:first-of-type { border-top: none; }
.row label { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.row strong { font-size: .88rem; color: #0f172a; }
.row span { font-size: .76rem; color: #64748b; }
.row input { width: 86px; flex-shrink: 0; padding: 9px 12px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: .95rem; font-weight: 700; text-align: center; }
.row input:focus { outline: none; border-color: #8be000; box-shadow: 0 0 0 3px rgba(139,224,0,.25); }
.actions { grid-column: 1 / -1; display: flex; justify-content: flex-end; }
.btn { padding: 10px 20px; border-radius: 10px; border: 1.5px solid #0b0c10; background: #0b0c10; color: #fff; font-weight: 700; font-size: .85rem; cursor: pointer; }
.btn:hover:not(:disabled) { background: #8be000; border-color: #8be000; color: #0b0c10; }
.btn:disabled { opacity: .6; cursor: default; }
.btn.ghost { background: #fff; color: #0b0c10; border-color: #e2e8f0; }
.btn.ghost:hover { border-color: #0b0c10; background: #fff; }
.btn.danger { background: #fff; color: #dc2626; border-color: #fecaca; }
.btn.danger:hover { background: #fee2e2; color: #b91c1c; border-color: #fecaca; }
.muted { color: #64748b; font-size: .84rem; margin: 0 0 12px; }
.doc { display: flex; align-items: center; gap: 12px; padding: 14px; border: 1px dashed #d9e2c8; border-radius: 12px; background: #fafcf6; margin-bottom: 14px; }
.doc-ico { font-size: 1.6rem; }
.doc strong { font-size: .9rem; color: #0f172a; }
.doc-actions { display: flex; flex-wrap: wrap; gap: 10px; }
.hidden { display: none; }
.toast { position: fixed; right: 24px; bottom: 24px; z-index: 3000; padding: 12px 18px; border-radius: 12px; color: #fff; font-size: .88rem; font-weight: 600; box-shadow: 0 10px 30px rgba(0,0,0,.2); max-width: 420px; }
.toast.success { background: #0b0c10; } .toast.error { background: #dc2626; }
.fade-enter-active, .fade-leave-active { transition: opacity .2s; } .fade-enter-from, .fade-leave-to { opacity: 0; }
@media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
.links { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
.links label { display: flex; flex-direction: column; gap: 4px; font-size: .8rem; font-weight: 600; color: #475569; }
.links input { padding: 9px 12px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: .88rem; }
@media (max-width: 900px) { .links { grid-template-columns: 1fr; } }
</style>
