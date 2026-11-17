<script setup lang="ts">
// Partner portal → Statements: FitAccess's monthly statement of member visits,
// the gym's VAT/TOT invoice upload, and FitAccess's payment receipt.
import { onMounted, reactive, ref } from 'vue'
import { useApi } from '@/composables/useApi'

interface Line { tier: string; label: string; visits: number; members: number; rate: number; subtotal: number }
interface Statement {
  id: number
  gym: { id: number; name: string } | null
  period_label: string
  total_visits: number; unique_members: number; total_amount: number
  lines: Line[]
  status: 'sent' | 'invoiced' | 'paid'
  invoice_due_on: string | null
  invoice: { number: string; type: string; amount: number | null; note: string | null; file_name: string | null; uploaded_at: string | null } | null
  payment: { reference: string | null; paid_at: string; file_name: string | null; note: string | null } | null
}

const api = useApi()
const items = ref<Statement[]>([])
const loading = ref(true)
const error = ref('')
const open = ref<number | null>(null)
const form = reactive({ type: 'VAT' as 'VAT' | 'TOT', number: '', amount: '' as string | number, note: '', file: null as File | null })
const busy = ref(false)
const msg = reactive({ text: '', type: 'success' as 'success' | 'error' })

async function load() {
  loading.value = true
  try {
    items.value = (await api.get<{ data: Statement[] }>('partner-portal/statements')).data
    const first = items.value[0]
    if (open.value === null && first) toggle(first)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not load statements.'
  } finally {
    loading.value = false
  }
}
onMounted(load)

const etb = (n: number | null | undefined) => 'ETB ' + Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmt = (d: string | null | undefined) => (d ? new Date(d.length === 10 ? d + 'T00:00:00' : d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '')
const STATUS: Record<string, string> = { sent: 'Upload your invoice', invoiced: 'Invoice sent · awaiting payment', paid: 'Paid' }

function toggle(s: Statement) {
  open.value = open.value === s.id ? null : s.id
  Object.assign(form, { type: s.invoice?.type ?? 'VAT', number: s.invoice?.number ?? '', amount: s.invoice?.amount ?? s.total_amount, note: s.invoice?.note ?? '', file: null })
  msg.text = ''
}

async function submit(s: Statement) {
  if (!form.file || !form.number) return
  busy.value = true
  msg.text = ''
  try {
    const fd = new FormData()
    fd.append('file', form.file)
    fd.append('invoice_type', form.type)
    fd.append('invoice_number', form.number)
    fd.append('amount', String(form.amount))
    if (form.note) fd.append('note', form.note)
    const r = await api.upload<{ message: string }>(`partner-portal/statements/${s.id}/invoice`, fd)
    Object.assign(msg, { text: r.message, type: 'success' })
    await load()
  } catch (e) {
    Object.assign(msg, { text: e instanceof Error ? e.message : 'Upload failed.', type: 'error' })
  } finally {
    busy.value = false
  }
}

async function download(s: Statement, kind: 'invoice' | 'receipt') {
  try { await api.download(`partner-portal/statements/${s.id}/file/${kind}`, `${kind}.pdf`) } catch (e) {
    Object.assign(msg, { text: e instanceof Error ? e.message : 'Download failed.', type: 'error' })
  }
}
</script>

<template>
  <div class="pst">
    <header class="pst-head">
      <h1>Statements</h1>
      <p>Each month FitAccess sends a statement of member visits to your center by the 7th. Upload your VAT or TOT invoice within 3 working days; FitAccess pays by the 10th and shares the payment receipt here.</p>
    </header>

    <div v-if="loading" class="state">Loading statements…</div>
    <div v-else-if="error" class="state err">{{ error }}</div>
    <div v-else-if="!items.length" class="state">No statements yet. Your first statement arrives after your first month of FitAccess visits.</div>

    <article v-for="s in items" :key="s.id" class="st" :class="{ open: open === s.id }">
      <button type="button" class="st-row" :aria-expanded="open === s.id" @click="toggle(s)">
        <span class="st-period">{{ s.period_label }}<small v-if="s.gym">{{ s.gym.name }}</small></span>
        <span class="st-visits">{{ s.total_visits }} visits</span>
        <span class="st-amount">{{ etb(s.total_amount) }}</span>
        <span class="chip" :class="`c-${s.status}`">{{ STATUS[s.status] }}</span>
      </button>

      <div v-if="open === s.id" class="st-body">
        <table class="tbl">
          <thead><tr><th>Member plan</th><th>Visits</th><th>Members</th><th>Rate / visit</th><th>Amount</th></tr></thead>
          <tbody><tr v-for="l in s.lines" :key="l.tier"><td>{{ l.label }}</td><td>{{ l.visits }}</td><td>{{ l.members }}</td><td class="num">{{ etb(l.rate) }}</td><td class="num">{{ etb(l.subtotal) }}</td></tr></tbody>
          <tfoot><tr><td colspan="4"><strong>Amount due to you</strong></td><td class="num"><strong>{{ etb(s.total_amount) }}</strong></td></tr></tfoot>
        </table>

        <!-- Paid -->
        <div v-if="s.payment" class="box ok">
          <strong>Paid on {{ fmt(s.payment.paid_at) }}</strong>
          <p v-if="s.payment.reference">Bank reference: {{ s.payment.reference }}</p>
          <p v-if="s.payment.note">{{ s.payment.note }}</p>
          <button type="button" class="btn" @click="download(s, 'receipt')">Download payment receipt</button>
        </div>

        <!-- Invoice upload / replace -->
        <form v-else class="box" @submit.prevent="submit(s)">
          <strong>{{ s.invoice ? 'Your invoice (you can replace it until it is paid)' : 'Upload your invoice' }}</strong>
          <p v-if="!s.invoice && s.invoice_due_on" class="due">Please upload it by {{ fmt(s.invoice_due_on) }}.</p>
          <p v-if="s.invoice">{{ s.invoice.type }} {{ s.invoice.number }} · {{ etb(s.invoice.amount) }} · uploaded {{ fmt(s.invoice.uploaded_at) }}
            <button type="button" class="link" @click="download(s, 'invoice')">Download</button></p>
          <div class="grid">
            <label>Invoice type
              <select v-model="form.type"><option value="VAT">VAT invoice</option><option value="TOT">TOT invoice</option></select>
            </label>
            <label>Invoice number<input v-model="form.number" type="text" maxlength="80" required /></label>
            <label>Amount (ETB)<input v-model="form.amount" type="number" min="0" step="0.01" required /></label>
            <label>Invoice file (PDF or photo)<input type="file" accept=".pdf,.jpg,.jpeg,.png" required @change="form.file = ($event.target as HTMLInputElement).files?.[0] ?? null" /></label>
            <label class="wide">Note to FitAccess (optional, e.g. if a number looks wrong)<input v-model="form.note" type="text" maxlength="1000" /></label>
          </div>
          <p v-if="msg.text" class="msg" :class="msg.type">{{ msg.text }}</p>
          <button type="submit" class="btn" :disabled="busy || !form.file || !form.number">{{ busy ? 'Uploading…' : s.invoice ? 'Replace invoice' : 'Send invoice to FitAccess' }}</button>
        </form>
      </div>
    </article>
  </div>
</template>

<style scoped>
.pst { display: flex; flex-direction: column; gap: 14px; max-width: 980px; }
.pst-head h1 { margin: 0 0 6px; font-size: 1.5rem; color: #0f172a; }
.pst-head p { margin: 0; font-size: .9rem; color: #475569; line-height: 1.55; max-width: 760px; }
.state { padding: 32px; text-align: center; color: #64748b; background: #fff; border-radius: 14px; }
.state.err { color: #dc2626; }
.st { background: #fff; border-radius: 16px; box-shadow: 0 1px 4px rgba(0,0,0,.06); overflow: hidden; border: 1px solid transparent; }
.st.open { border-color: #d9f2a8; }
.st-row { width: 100%; display: grid; grid-template-columns: minmax(0, 1.4fr) auto auto auto; align-items: center; gap: 16px; padding: 16px 18px; background: none; border: none; cursor: pointer; text-align: left; font-family: inherit; }
.st-period { font-weight: 800; color: #0f172a; }
.st-period small { display: block; font-weight: 500; color: #94a3b8; font-size: .76rem; }
.st-visits { color: #475569; font-size: .88rem; }
.st-amount { font-weight: 800; color: #0f172a; white-space: nowrap; }
.chip { padding: 4px 11px; border-radius: 999px; font-size: .74rem; font-weight: 700; white-space: nowrap; }
.c-sent { background: #fef3c7; color: #b45309; } .c-invoiced { background: #dbeafe; color: #1d4ed8; } .c-paid { background: #dcfce7; color: #166534; }
.st-body { padding: 0 18px 18px; display: flex; flex-direction: column; gap: 14px; }
.tbl { width: 100%; border-collapse: collapse; font-size: .86rem; }
.tbl th { text-align: left; padding: 9px 10px; font-size: .7rem; letter-spacing: .06em; text-transform: uppercase; color: #94a3b8; border-bottom: 1px solid #f1f5f9; }
.tbl td { padding: 9px 10px; border-bottom: 1px solid #f8fafc; color: #334155; }
.tbl .num { text-align: right; white-space: nowrap; }
.tbl tfoot td { border-top: 1px solid #e2e8f0; }
.box { border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; }
.box.ok { background: #f0fdf4; border-color: #bbf7d0; }
.box p { margin: 0; font-size: .86rem; color: #475569; }
.due { color: #b45309 !important; font-weight: 600; }
.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.grid label { display: flex; flex-direction: column; gap: 4px; font-size: .78rem; font-weight: 600; color: #475569; }
.grid input, .grid select { padding: 9px 12px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: .9rem; background: #fff; }
.grid .wide { grid-column: 1 / -1; }
.btn { align-self: flex-start; padding: 10px 18px; border-radius: 10px; border: none; background: #0b0c10; color: #fff; font-weight: 700; font-size: .86rem; cursor: pointer; }
.btn:hover:not(:disabled) { background: #8be000; color: #0b0c10; }
.btn:disabled { opacity: .55; cursor: default; }
.link { border: none; background: none; color: #3f6b00; font-weight: 700; cursor: pointer; text-decoration: underline; padding: 0 0 0 6px; }
.msg { font-weight: 600; } .msg.success { color: #166534 !important; } .msg.error { color: #dc2626 !important; }
@media (max-width: 700px) { .st-row { grid-template-columns: 1fr auto; } .st-visits { display: none; } .grid { grid-template-columns: 1fr; } }
</style>
