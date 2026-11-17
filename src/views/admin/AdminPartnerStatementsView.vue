<script setup lang="ts">
// Admin → Partner statements: monthly FitAccess visits per gym (by member plan),
// what FitAccess owes, the gym's VAT/TOT invoice, and payment with receipt.
import { computed, onMounted, reactive, ref } from 'vue'
import { useApi } from '@/composables/useApi'
import { confirmDialog } from '@/composables/useDialog'
import { useAuthStore } from '@/stores/auth'

interface Line { tier: string; label: string; visits: number; members: number; rate: number; subtotal: number }
interface Statement {
  id: number
  gym: { id: number; name: string; tier: string } | null
  period: string; period_label: string
  total_visits: number; unique_members: number; total_amount: number
  lines: Line[]
  status: 'draft' | 'sent' | 'invoiced' | 'paid'
  sent_at: string | null; invoice_due_on: string | null
  invoice: { number: string; type: string; amount: number | null; note: string | null; file_name: string | null; uploaded_at: string | null } | null
  payment: { reference: string | null; paid_at: string; file_name: string | null; note: string | null } | null
  rates: Record<string, number> | null
  editable: boolean
}

const api = useApi()
const auth = useAuthStore()
const canCreate = auth.hasPermission('billing.create')
const canSend = auth.hasPermission('billing.send')
const canPay = auth.hasPermission('payments.verify')

const lastMonth = (() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7) })()
const period = ref(lastMonth)
const statusFilter = ref('')
const items = ref<Statement[]>([])
const totals = ref({ amount: 0, visits: 0, to_send: 0, to_pay: 0 })
const loading = ref(true)
const busy = ref('')
const toast = reactive({ show: false, type: 'success' as 'success' | 'error', text: '' })
let t: ReturnType<typeof setTimeout> | null = null
function notify(text: string, type: 'success' | 'error' = 'success') {
  if (t) clearTimeout(t)
  Object.assign(toast, { show: true, type, text })
  t = setTimeout(() => (toast.show = false), 4500)
}

async function load() {
  loading.value = true
  try {
    const q = new URLSearchParams({ period: period.value })
    if (statusFilter.value) q.set('status', statusFilter.value)
    const r = await api.get<{ data: Statement[]; totals: typeof totals.value }>(`admin/billing/partner-statements?${q}`)
    items.value = r.data
    totals.value = r.totals
  } catch (e) {
    notify(e instanceof Error ? e.message : 'Could not load statements.', 'error')
  } finally {
    loading.value = false
  }
}
onMounted(load)

const etb = (n: number | null | undefined) => 'ETB ' + Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmt = (d: string | null | undefined) => (d ? new Date(d.length === 10 ? d + 'T00:00:00' : d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '')
const STATUS: Record<string, string> = { draft: 'Draft', sent: 'Sent · waiting for invoice', invoiced: 'Invoice received · to pay', paid: 'Paid' }

async function generate() {
  busy.value = 'generate'
  try {
    const r = await api.post<{ message: string }>('admin/billing/partner-statements/generate', { period: period.value })
    notify(r.message)
    await load()
  } catch (e) { notify(e instanceof Error ? e.message : 'Could not prepare statements.', 'error') } finally { busy.value = '' }
}

async function sendAll() {
  const n = items.value.filter((s) => s.status === 'draft').length
  if (!n || !(await confirmDialog({ title: 'Send all statements?', message: `E-mail ${n} draft statement${n === 1 ? '' : 's'} to the gyms? Each gym then uploads its VAT/TOT invoice.`, confirmText: `Send ${n}` }))) return
  busy.value = 'sendAll'
  try {
    const r = await api.post<{ message: string }>('admin/billing/partner-statements/send-all', { period: period.value })
    notify(r.message)
    await load()
  } catch (e) { notify(e instanceof Error ? e.message : 'Could not send.', 'error') } finally { busy.value = '' }
}

// ── Detail ────────────────────────────────────────────────────
const open = ref<Statement | null>(null)
const rates = reactive<Record<string, number | null>>({})
const pay = reactive({ file: null as File | null, reference: '', note: '' })
const payInput = ref<HTMLInputElement | null>(null)

function show(s: Statement) {
  open.value = s
  Object.keys(rates).forEach((k) => delete rates[k])
  Object.assign(rates, s.rates ?? {})
  Object.assign(pay, { file: null, reference: '', note: '' })
}
const rateTiers = computed(() => [
  { key: 'basic', label: 'Basic plan' }, { key: 'basic_plus', label: 'Basic Plus plan' },
  { key: 'premium', label: 'Premium plan' }, { key: 'other', label: 'Other members' },
])

async function saveRates() {
  if (!open.value) return
  busy.value = 'rates'
  try {
    const r = await api.put<{ message: string; statement: Statement }>(`admin/billing/partner-statements/${open.value.id}/rates`, { rates })
    notify(r.message)
    show(r.statement)
    await load()
  } catch (e) { notify(e instanceof Error ? e.message : 'Could not save the rates.', 'error') } finally { busy.value = '' }
}

async function sendOne() {
  if (!open.value) return
  busy.value = 'send'
  try {
    const r = await api.post<{ message: string; statement: Statement }>(`admin/billing/partner-statements/${open.value.id}/send`, {})
    notify(r.message)
    show(r.statement)
    await load()
  } catch (e) { notify(e instanceof Error ? e.message : 'Could not send.', 'error') } finally { busy.value = '' }
}

async function recordPayment() {
  if (!open.value || !pay.file) return
  busy.value = 'pay'
  try {
    const fd = new FormData()
    fd.append('receipt', pay.file)
    if (pay.reference) fd.append('reference', pay.reference)
    if (pay.note) fd.append('note', pay.note)
    const r = await api.upload<{ message: string; statement: Statement }>(`admin/billing/partner-statements/${open.value.id}/pay`, fd)
    notify(r.message)
    show(r.statement)
    await load()
  } catch (e) { notify(e instanceof Error ? e.message : 'Could not record the payment.', 'error') } finally { busy.value = '' }
}

async function download(kind: 'invoice' | 'receipt') {
  if (!open.value) return
  try { await api.download(`admin/billing/partner-statements/${open.value.id}/file/${kind}`, `${kind}.pdf`) } catch (e) { notify(e instanceof Error ? e.message : 'Download failed.', 'error') }
}
</script>

<template>
  <div class="ps">
    <section class="ps-intro">
      <div>
        <h2>Monthly statements for partner gyms</h2>
        <p>Statements are prepared on the 1st from last month's check-ins, by member plan. Send them to the gyms by the 7th; gyms upload their VAT/TOT invoice within 3 working days; pay them by the 10th and upload the receipt.</p>
      </div>
    </section>

    <div class="ps-bar">
      <label class="ps-field">Month <input v-model="period" type="month" @change="load" /></label>
      <label class="ps-field">Status
        <select v-model="statusFilter" @change="load">
          <option value="">All</option>
          <option value="draft">Draft</option>
          <option value="sent">Waiting for invoice</option>
          <option value="invoiced">To pay</option>
          <option value="paid">Paid</option>
        </select>
      </label>
      <div class="ps-actions">
        <button v-if="canCreate" type="button" class="btn ghost" :disabled="busy !== ''" @click="generate">{{ busy === 'generate' ? 'Preparing…' : 'Prepare / refresh statements' }}</button>
        <button v-if="canSend && totals.to_send" type="button" class="btn" :disabled="busy !== ''" @click="sendAll">{{ busy === 'sendAll' ? 'Sending…' : `Send all drafts (${totals.to_send})` }}</button>
      </div>
    </div>

    <div class="ps-kpis">
      <div class="kpi"><span>Visits</span><strong>{{ totals.visits.toLocaleString() }}</strong></div>
      <div class="kpi"><span>Total owed to gyms</span><strong>{{ etb(totals.amount) }}</strong></div>
      <div class="kpi"><span>Drafts to send</span><strong>{{ totals.to_send }}</strong></div>
      <div class="kpi" :class="{ warn: totals.to_pay }"><span>Invoices to pay</span><strong>{{ totals.to_pay }}</strong></div>
    </div>

    <div class="card">
      <div v-if="loading" class="state">Loading…</div>
      <div v-else-if="!items.length" class="state">No statements for this month yet. Press "Prepare / refresh statements" to create them from the check-ins.</div>
      <table v-else class="tbl">
        <thead><tr><th>Gym</th><th>Visits</th><th>Members</th><th>Amount</th><th>Gym invoice</th><th>Status</th><th></th></tr></thead>
        <tbody>
          <tr v-for="s in items" :key="s.id">
            <td><strong>{{ s.gym?.name }}</strong><span class="sub">{{ s.period_label }}</span></td>
            <td>{{ s.total_visits }}</td>
            <td>{{ s.unique_members }}</td>
            <td class="num">{{ etb(s.total_amount) }}</td>
            <td>
              <template v-if="s.invoice">{{ s.invoice.type }} {{ s.invoice.number }}<span class="sub" :class="{ bad: s.invoice.amount !== null && Math.abs((s.invoice.amount ?? 0) - s.total_amount) > 0.01 }">{{ etb(s.invoice.amount) }}</span></template>
              <span v-else-if="s.status === 'sent'" class="sub">Due {{ fmt(s.invoice_due_on) }}</span>
              <span v-else class="sub">—</span>
            </td>
            <td><span class="chip" :class="`c-${s.status}`">{{ STATUS[s.status] }}</span></td>
            <td><button type="button" class="link" @click="show(s)">Open</button></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Detail -->
    <Teleport to="body">
      <div v-if="open" class="ov" @click.self="open = null">
        <div class="md" role="dialog" aria-modal="true">
          <header class="md-h">
            <div>
              <h3>{{ open.gym?.name }} · {{ open.period_label }}</h3>
              <span class="chip" :class="`c-${open.status}`">{{ STATUS[open.status] }}</span>
            </div>
            <button type="button" class="x" aria-label="Close" @click="open = null">✕</button>
          </header>

          <table class="tbl small">
            <thead><tr><th>Member plan</th><th>Visits</th><th>Members</th><th>Rate / visit</th><th>Amount</th></tr></thead>
            <tbody>
              <tr v-for="l in open.lines" :key="l.tier"><td>{{ l.label }}</td><td>{{ l.visits }}</td><td>{{ l.members }}</td><td class="num">{{ etb(l.rate) }}</td><td class="num">{{ etb(l.subtotal) }}</td></tr>
            </tbody>
            <tfoot><tr><td colspan="4"><strong>Total</strong></td><td class="num"><strong>{{ etb(open.total_amount) }}</strong></td></tr></tfoot>
          </table>

          <details v-if="open.editable && canCreate" class="rates">
            <summary>Rates per visit for this gym</summary>
            <div class="rate-grid">
              <label v-for="r in rateTiers" :key="r.key">{{ r.label }}<input v-model.number="rates[r.key]" type="number" min="0" step="0.01" /></label>
            </div>
            <button type="button" class="btn ghost" :disabled="busy !== ''" @click="saveRates">{{ busy === 'rates' ? 'Saving…' : 'Save rates & recalculate' }}</button>
          </details>

          <section v-if="open.invoice" class="box">
            <strong>Gym invoice</strong>
            <p>{{ open.invoice.type }} invoice {{ open.invoice.number }} · {{ etb(open.invoice.amount) }} · uploaded {{ fmt(open.invoice.uploaded_at) }}</p>
            <p v-if="open.invoice.note" class="note">Note from the gym: {{ open.invoice.note }}</p>
            <p v-if="open.invoice.amount !== null && Math.abs((open.invoice.amount ?? 0) - open.total_amount) > 0.01" class="bad">The invoice amount differs from the statement.</p>
            <button type="button" class="btn ghost" @click="download('invoice')">Download gym invoice</button>
          </section>

          <section v-if="open.payment" class="box ok">
            <strong>Paid {{ fmt(open.payment.paid_at) }}</strong>
            <p v-if="open.payment.reference">Reference: {{ open.payment.reference }}</p>
            <button type="button" class="btn ghost" @click="download('receipt')">Download receipt</button>
          </section>

          <section v-else-if="canPay && (open.status === 'sent' || open.status === 'invoiced')" class="box">
            <strong>Record payment</strong>
            <p v-if="open.status === 'sent'" class="sub">The gym has not uploaded its invoice yet.</p>
            <div class="pay-grid">
              <label>Payment receipt (PDF or image)<input ref="payInput" type="file" accept=".pdf,.jpg,.jpeg,.png" @change="pay.file = ($event.target as HTMLInputElement).files?.[0] ?? null" /></label>
              <label>Bank reference<input v-model="pay.reference" type="text" maxlength="120" placeholder="e.g. FT26314XYZ" /></label>
              <label class="wide">Note to the gym (optional)<input v-model="pay.note" type="text" maxlength="1000" /></label>
            </div>
            <button type="button" class="btn" :disabled="!pay.file || busy !== ''" @click="recordPayment">{{ busy === 'pay' ? 'Saving…' : 'Mark as paid & share receipt' }}</button>
          </section>

          <footer class="md-f">
            <button v-if="canSend && open.editable" type="button" class="btn" :disabled="busy !== ''" @click="sendOne">
              {{ busy === 'send' ? 'Sending…' : open.status === 'sent' ? 'Send again' : 'Send to gym' }}
            </button>
            <button type="button" class="btn ghost" @click="open = null">Close</button>
          </footer>
        </div>
      </div>
    </Teleport>

    <Transition name="fade"><div v-if="toast.show" class="toast" :class="toast.type">{{ toast.text }}</div></Transition>
  </div>
</template>

<style scoped>
.ps { display: flex; flex-direction: column; gap: 16px; }
.ps-intro { background: linear-gradient(180deg, #f3fce6, #fff); border: 1px solid #e3f5c6; border-radius: 16px; padding: 18px 22px; }
.ps-intro h2 { margin: 0 0 4px; font-size: 1.02rem; color: #0f172a; }
.ps-intro p { margin: 0; font-size: .86rem; color: #475569; line-height: 1.55; }
.ps-bar { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 12px; }
.ps-field { display: flex; flex-direction: column; gap: 4px; font-size: .74rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .05em; }
.ps-field input, .ps-field select { padding: 9px 12px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: .9rem; background: #fff; text-transform: none; letter-spacing: 0; font-weight: 600; color: #0f172a; }
.ps-actions { margin-left: auto; display: flex; gap: 8px; flex-wrap: wrap; }
.ps-kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.kpi { background: #fff; border-radius: 14px; padding: 14px 16px; box-shadow: 0 1px 4px rgba(0,0,0,.06); display: flex; flex-direction: column; gap: 2px; }
.kpi span { font-size: .72rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .05em; }
.kpi strong { font-size: 1.2rem; color: #0f172a; }
.kpi.warn { border: 1px solid #fde68a; background: #fffdf5; }
.card { background: #fff; border-radius: 16px; box-shadow: 0 1px 4px rgba(0,0,0,.06); overflow-x: auto; }
.state { padding: 36px; text-align: center; color: #64748b; font-size: .9rem; }
.tbl { width: 100%; border-collapse: collapse; font-size: .86rem; }
.tbl th { text-align: left; padding: 12px 14px; font-size: .7rem; letter-spacing: .06em; text-transform: uppercase; color: #94a3b8; border-bottom: 1px solid #f1f5f9; white-space: nowrap; }
.tbl td { padding: 12px 14px; border-bottom: 1px solid #f8fafc; color: #334155; vertical-align: middle; }
.tbl .num { text-align: right; white-space: nowrap; }
.tbl.small td, .tbl.small th { padding: 9px 10px; }
.tbl tfoot td { border-top: 1px solid #e2e8f0; }
.sub { display: block; font-size: .74rem; color: #94a3b8; margin-top: 2px; }
.bad { color: #dc2626 !important; }
.chip { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: .72rem; font-weight: 700; white-space: nowrap; }
.c-draft { background: #f1f5f9; color: #475569; } .c-sent { background: #dbeafe; color: #1d4ed8; }
.c-invoiced { background: #fef3c7; color: #b45309; } .c-paid { background: #dcfce7; color: #166534; }
.link { border: none; background: none; color: #3f6b00; font-weight: 700; cursor: pointer; text-decoration: underline; }
.btn { padding: 10px 16px; border-radius: 10px; border: 1.5px solid #0b0c10; background: #0b0c10; color: #fff; font-weight: 700; font-size: .84rem; cursor: pointer; }
.btn:hover:not(:disabled) { background: #8be000; border-color: #8be000; color: #0b0c10; }
.btn:disabled { opacity: .55; cursor: default; }
.btn.ghost { background: #fff; color: #0b0c10; border-color: #e2e8f0; }
.btn.ghost:hover:not(:disabled) { border-color: #0b0c10; background: #fff; }
.ov { position: fixed; inset: 0; z-index: 1500; background: rgba(11,12,16,.5); display: flex; align-items: center; justify-content: center; padding: 16px; }
.md { width: 100%; max-width: 760px; max-height: calc(100vh - 32px); overflow-y: auto; background: #fff; border-radius: 20px; padding: 22px 24px; display: flex; flex-direction: column; gap: 16px; box-shadow: 0 24px 60px rgba(0,0,0,.28); }
.md-h { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.md-h h3 { margin: 0 0 6px; font-size: 1.1rem; color: #0f172a; }
.x { border: none; background: none; font-size: 18px; color: #475569; cursor: pointer; }
.rates summary { cursor: pointer; font-weight: 700; font-size: .88rem; color: #334155; }
.rate-grid, .pay-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin: 12px 0; }
.rate-grid label, .pay-grid label { display: flex; flex-direction: column; gap: 4px; font-size: .78rem; font-weight: 600; color: #475569; }
.rate-grid input, .pay-grid input { padding: 9px 12px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: .9rem; }
.pay-grid .wide { grid-column: 1 / -1; }
.box { border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 16px; display: flex; flex-direction: column; gap: 6px; }
.box p { margin: 0; font-size: .86rem; color: #475569; }
.box .note { color: #92400e; }
.box.ok { background: #f0fdf4; border-color: #bbf7d0; }
.box .btn { align-self: flex-start; margin-top: 4px; }
.md-f { display: flex; justify-content: flex-end; gap: 8px; }
.toast { position: fixed; right: 24px; bottom: 24px; z-index: 3000; padding: 12px 18px; border-radius: 12px; color: #fff; font-size: .88rem; font-weight: 600; max-width: 420px; box-shadow: 0 10px 30px rgba(0,0,0,.2); }
.toast.success { background: #0b0c10; } .toast.error { background: #dc2626; }
.fade-enter-active, .fade-leave-active { transition: opacity .2s; } .fade-enter-from, .fade-leave-to { opacity: 0; }
@media (max-width: 900px) { .ps-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } .rate-grid, .pay-grid { grid-template-columns: 1fr; } .ps-actions { margin-left: 0; } }
</style>
