<script setup lang="ts">
// Import the company's employee list (Excel): download the template and the
// contract, upload the filled file, review what will happen, then confirm.
// Employees already registered are never duplicated; only changes are saved.
import { computed, ref, watch } from 'vue'
import { useApi } from '@/composables/useApi'

interface Change { label: string; old: string; new: string }
interface Row {
  row: number
  action: 'create' | 'update' | 'unchanged' | 'error'
  name: string
  email: string
  phone: string | null
  plan: string | null
  errors?: string[]
  changes?: Record<string, Change>
}
interface Preview { token: string; summary: { create: number; update: number; unchanged: number; error: number; total: number }; rows: Row[] }

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; done: [message: string] }>()

const api = useApi()
const step = ref<'start' | 'review' | 'done'>('start')
const file = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const busy = ref(false)
const error = ref('')
const preview = ref<Preview | null>(null)
const result = ref('')
const filter = ref<'all' | Row['action']>('all')
const dragging = ref(false)

watch(() => props.open, (o) => {
  if (o) {
    step.value = 'start'; file.value = null; preview.value = null; error.value = ''; result.value = ''; filter.value = 'all'
  }
})

const shown = computed(() => (preview.value?.rows ?? []).filter((r) => filter.value === 'all' || r.action === filter.value))
const toSave = computed(() => (preview.value ? preview.value.summary.create + preview.value.summary.update : 0))

async function download(kind: 'template' | 'contract') {
  error.value = ''
  try {
    await api.download(`hr/onboarding/${kind}`, kind === 'template' ? 'FitAccess-employees.xlsx' : 'FitAccess-Employee-Enrolment-and-Consent-Form.pdf')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Download failed.'
  }
}

function pick(f: File | undefined | null) {
  if (!f) return
  if (!/\.(xlsx|csv)$/i.test(f.name)) {
    error.value = 'Please choose the FitAccess Excel template (.xlsx) or a .csv file.'
    return
  }
  error.value = ''
  file.value = f
}
function onDrop(e: DragEvent) {
  dragging.value = false
  pick(e.dataTransfer?.files?.[0])
}

async function check() {
  if (!file.value || busy.value) return
  busy.value = true
  error.value = ''
  try {
    const fd = new FormData()
    fd.append('file', file.value)
    preview.value = await api.upload<Preview>('hr/employees/import/preview', fd)
    filter.value = preview.value.summary.error ? 'error' : 'all'
    step.value = 'review'
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'The file could not be checked.'
  } finally {
    busy.value = false
  }
}

async function confirm() {
  if (!preview.value || busy.value) return
  busy.value = true
  error.value = ''
  try {
    const res = await api.post<{ message: string; invited: number }>('hr/employees/import/confirm', { token: preview.value.token })
    result.value = res.message + (res.invited ? ` ${res.invited} invitation email(s) sent.` : '')
    step.value = 'done'
    emit('done', result.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'The import failed.'
  } finally {
    busy.value = false
  }
}

const LABEL: Record<Row['action'], string> = { create: 'New', update: 'Update', unchanged: 'No change', error: 'Error' }
</script>

<template>
  <Teleport to="body">
    <Transition name="im">
      <div v-if="open" class="im-backdrop" @click.self="emit('close')">
        <div class="im" role="dialog" aria-modal="true" aria-labelledby="im-title">
          <header class="im-head">
            <div>
              <h2 id="im-title">Import employees</h2>
              <p>
                {{ step === 'start' ? 'Add the employees who signed the FitAccess contract.'
                  : step === 'review' ? 'Check the result before anything is saved.'
                  : 'Import complete.' }}
              </p>
            </div>
            <button type="button" class="im-x" aria-label="Close" @click="emit('close')">✕</button>
          </header>

          <!-- 1. Start -->
          <div v-if="step === 'start'" class="im-body">
            <ol class="im-steps">
              <li>
                <span class="im-num">1</span>
                <div>
                  <strong>Give the consent form to your employees</strong>
                  <p>Employees who want to join complete and sign it; keep the signed forms at your company.</p>
                  <button type="button" class="im-dl" @click="download('contract')">Download consent form (PDF)</button>
                </div>
              </li>
              <li>
                <span class="im-num">2</span>
                <div>
                  <strong>Fill in the Excel template</strong>
                  <p>One row per employee who signed, with their plan. Pick the plan from the drop-down list.</p>
                  <button type="button" class="im-dl" @click="download('template')">Download Excel template</button>
                </div>
              </li>
              <li>
                <span class="im-num">3</span>
                <div class="im-grow">
                  <strong>Upload the filled file</strong>
                  <div
                    class="im-drop" :class="{ over: dragging, has: file }" role="button" tabindex="0"
                    @click="fileInput?.click()" @keydown.enter="fileInput?.click()"
                    @dragover.prevent="dragging = true" @dragleave="dragging = false" @drop.prevent="onDrop"
                  >
                    <template v-if="file">📄 <strong>{{ file.name }}</strong> <span class="im-change">Change</span></template>
                    <template v-else>Drop the Excel file here or <u>browse</u><small>.xlsx (or .csv), up to 2,000 employees</small></template>
                  </div>
                  <input ref="fileInput" type="file" accept=".xlsx,.csv" class="im-hidden" @change="pick(($event.target as HTMLInputElement).files?.[0])" />
                </div>
              </li>
            </ol>
            <p class="im-note">
              Already-registered employees (by email, phone or FAN number) are not added twice. Only changed or missing
              details, such as a new phone number or plan, are updated. Each new employee gets an email to create their account.
            </p>
          </div>

          <!-- 2. Review -->
          <div v-else-if="step === 'review' && preview" class="im-body">
            <div class="im-chips">
              <button type="button" :class="{ on: filter === 'all' }" @click="filter = 'all'">All <b>{{ preview.summary.total }}</b></button>
              <button type="button" class="c-create" :class="{ on: filter === 'create' }" @click="filter = 'create'">New <b>{{ preview.summary.create }}</b></button>
              <button type="button" class="c-update" :class="{ on: filter === 'update' }" @click="filter = 'update'">Updates <b>{{ preview.summary.update }}</b></button>
              <button type="button" class="c-unchanged" :class="{ on: filter === 'unchanged' }" @click="filter = 'unchanged'">No change <b>{{ preview.summary.unchanged }}</b></button>
              <button type="button" class="c-error" :class="{ on: filter === 'error' }" @click="filter = 'error'">Errors <b>{{ preview.summary.error }}</b></button>
            </div>
            <p v-if="preview.summary.error" class="im-warn">
              Rows with errors are skipped. You can fix them in the file and import it again later; nothing is duplicated.
            </p>
            <div class="im-table-wrap">
              <table class="im-table">
                <thead><tr><th>Row</th><th>Employee</th><th>Plan</th><th>Result</th></tr></thead>
                <tbody>
                  <tr v-for="r in shown" :key="r.row">
                    <td class="im-rowno">{{ r.row }}</td>
                    <td>
                      <strong>{{ r.name || '—' }}</strong>
                      <span class="im-sub">{{ r.email || '—' }}<template v-if="r.phone"> · {{ r.phone }}</template></span>
                    </td>
                    <td>{{ r.plan || '—' }}</td>
                    <td>
                      <span class="im-badge" :class="`b-${r.action}`">{{ LABEL[r.action] }}</span>
                      <ul v-if="r.errors?.length" class="im-errs"><li v-for="(m, i) in r.errors" :key="i">{{ m }}</li></ul>
                      <ul v-if="r.changes" class="im-chg">
                        <li v-for="(c, k) in r.changes" :key="k">{{ c.label }}: <s>{{ c.old }}</s> → <b>{{ c.new }}</b></li>
                      </ul>
                    </td>
                  </tr>
                  <tr v-if="!shown.length"><td colspan="4" class="im-empty">Nothing in this group.</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 3. Done -->
          <div v-else class="im-body im-done">
            <span class="im-ok" aria-hidden="true">✓</span>
            <p>{{ result }}</p>
            <p class="im-sub2">New employees received an email to create their account. FitAccess will now prepare your invoice.</p>
          </div>

          <p v-if="error" class="im-error" role="alert">{{ error }}</p>

          <footer class="im-foot">
            <template v-if="step === 'start'">
              <button type="button" class="im-btn ghost" @click="emit('close')">Cancel</button>
              <button type="button" class="im-btn" :disabled="!file || busy" @click="check">{{ busy ? 'Checking…' : 'Check file' }}</button>
            </template>
            <template v-else-if="step === 'review'">
              <button type="button" class="im-btn ghost" :disabled="busy" @click="step = 'start'">Back</button>
              <button type="button" class="im-btn" :disabled="!toSave || busy" @click="confirm">
                {{ busy ? 'Importing…' : toSave ? `Import ${toSave} employee${toSave === 1 ? '' : 's'}` : 'Nothing to import' }}
              </button>
            </template>
            <button v-else type="button" class="im-btn" @click="emit('close')">Done</button>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.im-backdrop { position: fixed; inset: 0; z-index: 1500; background: rgba(11,12,16,.5); display: flex; align-items: center; justify-content: center; padding: 16px; }
.im {
  width: 100%; max-width: 860px; max-height: calc(100vh - 32px); display: flex; flex-direction: column;
  background: #fff; border-radius: 22px; box-shadow: 0 24px 60px rgba(0,0,0,.28); overflow: hidden; font-family: var(--font-body, inherit);
}
.im-head { display: flex; justify-content: space-between; gap: 16px; padding: 22px 26px 16px; border-bottom: 1px solid #f0f1ec; }
.im-head h2 { margin: 0 0 4px; font-family: var(--font-heading, inherit); font-size: 22px; color: #0b0c10; }
.im-head p { margin: 0; color: #6b7280; font-size: 14px; }
.im-x { border: none; background: none; font-size: 18px; color: #4b5563; cursor: pointer; align-self: flex-start; }
.im-body { padding: 20px 26px; overflow-y: auto; }
.im-steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 18px; }
.im-steps li { display: flex; gap: 14px; }
.im-steps strong { color: #0b0c10; font-size: 15px; }
.im-steps p { margin: 3px 0 10px; color: #6b7280; font-size: 13.5px; }
.im-num { flex-shrink: 0; width: 28px; height: 28px; border-radius: 50%; background: #0b0c10; color: #8be000; font-weight: 800; font-size: 13px; display: inline-flex; align-items: center; justify-content: center; }
.im-grow { flex: 1; min-width: 0; }
.im-dl { padding: 9px 16px; border-radius: 999px; border: 1.5px solid #0b0c10; background: #fff; color: #0b0c10; font-weight: 700; font-size: 13px; cursor: pointer; font-family: inherit; }
.im-dl:hover { background: #8be000; border-color: #8be000; }
.im-drop {
  margin-top: 10px; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 6px; text-align: center;
  padding: 26px 16px; border: 2px dashed #d9e2c8; border-radius: 18px; background: #fafcf6; color: #4b5563; cursor: pointer; font-size: 14px;
}
.im-drop small { flex-basis: 100%; color: #9ca3af; font-size: 12px; }
.im-drop.over, .im-drop:hover { border-color: #8be000; background: #f3fce6; }
.im-drop.has { border-style: solid; border-color: #8be000; background: #f3fce6; }
.im-change { margin-left: 8px; font-size: 12.5px; color: #3f6b00; text-decoration: underline; }
.im-hidden { display: none; }
.im-note { margin: 18px 0 0; padding: 12px 14px; border-radius: 14px; background: #f6f8f2; color: #4b5563; font-size: 13px; line-height: 1.55; }
.im-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
.im-chips button { padding: 7px 14px; border-radius: 999px; border: 1.5px solid #e5e7eb; background: #fff; font-size: 13px; cursor: pointer; font-family: inherit; color: #374151; }
.im-chips button b { margin-left: 4px; }
.im-chips button.on { border-color: #0b0c10; background: #0b0c10; color: #fff; }
.im-chips .c-create b { color: #4d7c0f; } .im-chips .c-update b { color: #2563eb; } .im-chips .c-error b { color: #dc2626; }
.im-chips button.on b { color: #8be000; }
.im-warn { margin: 0 0 12px; padding: 10px 12px; border-radius: 12px; background: #fffbeb; border: 1px solid #fde68a; color: #92400e; font-size: 13px; }
.im-table-wrap { border: 1px solid #eef0ea; border-radius: 14px; overflow: auto; max-height: 46vh; }
.im-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.im-table th { position: sticky; top: 0; background: #f8faf5; text-align: left; padding: 10px 12px; font-size: 11px; letter-spacing: .06em; text-transform: uppercase; color: #6b7280; }
.im-table td { padding: 10px 12px; border-top: 1px solid #f0f1ec; vertical-align: top; color: #374151; }
.im-rowno { color: #9ca3af; width: 44px; }
.im-sub { display: block; color: #6b7280; font-size: 12px; margin-top: 2px; overflow-wrap: anywhere; }
.im-badge { display: inline-block; padding: 2px 9px; border-radius: 999px; font-size: 11.5px; font-weight: 700; }
.b-create { background: #eefbd6; color: #3f6b00; } .b-update { background: #dbeafe; color: #1d4ed8; }
.b-unchanged { background: #f3f4f6; color: #6b7280; } .b-error { background: #fee2e2; color: #b91c1c; }
.im-errs, .im-chg { margin: 6px 0 0; padding-left: 16px; font-size: 12px; }
.im-errs { color: #b91c1c; } .im-chg { color: #374151; } .im-chg s { color: #9ca3af; }
.im-empty { text-align: center; color: #9ca3af; padding: 18px; }
.im-done { text-align: center; padding: 36px 26px; }
.im-ok { display: inline-flex; width: 58px; height: 58px; border-radius: 50%; background: #8be000; color: #0b0c10; font-size: 28px; font-weight: 800; align-items: center; justify-content: center; margin-bottom: 12px; }
.im-done p { margin: 0 0 6px; font-size: 15px; color: #0b0c10; }
.im-sub2 { color: #6b7280 !important; font-size: 13.5px !important; }
.im-error { margin: 0 26px 12px; padding: 10px 12px; border-radius: 12px; background: #fef2f2; color: #b91c1c; font-size: 13.5px; }
.im-foot { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 26px 20px; border-top: 1px solid #f0f1ec; }
.im-btn { padding: 12px 24px; border-radius: 999px; border: 1.5px solid #0b0c10; background: #0b0c10; color: #fff; font-weight: 700; font-size: 14px; cursor: pointer; font-family: inherit; }
.im-btn:not(:disabled):hover { background: #8be000; border-color: #8be000; color: #0b0c10; }
.im-btn:disabled { background: #e5e7eb; border-color: #e5e7eb; color: #9ca3af; cursor: not-allowed; }
.im-btn.ghost { background: #fff; color: #0b0c10; border-color: #e5e7eb; }
.im-enter-active, .im-leave-active { transition: opacity .18s ease; }
.im-enter-from, .im-leave-to { opacity: 0; }
@media (max-width: 600px) { .im-head, .im-body, .im-foot { padding-left: 16px; padding-right: 16px; } .im-foot { flex-direction: column-reverse; } .im-btn { width: 100%; } }
</style>
