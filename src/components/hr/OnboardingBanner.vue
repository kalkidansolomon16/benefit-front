<script setup lang="ts">
// HR → Employees: deadlines and next steps at a glance (import deadline,
// payment window, invitations and cards still to send) with the bulk actions.
import { computed, onMounted, ref } from 'vue'
import { useApi } from '@/composables/useApi'
import { confirmDialog } from '@/composables/useDialog'

interface Status {
  import_deadline: string | null
  days_left: number | null
  next_period: { label: string; window: string; due_date: string; closes_on: string; staff_list_deadline: string; send_date: string }
  rules: string[]
  late_fee_percent: number
  counts: { employees: number; awaiting_account: number; accounts_created: number; cards_to_send: number; cards_active: number }
  open_invoice: { number: string; status: string; due_date: string | null; closes_on: string | null; total: number; late_fee: number } | null
}

const emit = defineEmits<{ import: []; changed: [message: string, type?: 'success' | 'error'] }>()
const api = useApi()
const s = ref<Status | null>(null)
const busy = ref<'' | 'cards' | 'invites'>('')

async function load() {
  try { s.value = await api.get<Status>('hr/onboarding') } catch { /* banner is optional */ }
}
defineExpose({ load })
onMounted(load)

const fmt = (d: string | null) => (d ? new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '')

const listDaysLeft = computed(() => {
  const d = s.value?.next_period.staff_list_deadline
  if (!d) return -1
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return Math.round((new Date(d + 'T00:00:00').getTime() - today.getTime()) / 86400000)
})
const deadlineTone = computed(() => (listDaysLeft.value >= 0 && listDaysLeft.value <= 3 ? 'soon' : ''))
const invoiceTone = computed(() => {
  const st = s.value?.open_invoice?.status
  return st === 'closed' ? 'late' : st === 'overdue' ? 'soon' : ''
})

async function sendCards() {
  const n = s.value?.counts.cards_to_send ?? 0
  if (!(await confirmDialog({ title: 'Send card numbers?', message: `Email ${n} employee${n === 1 ? '' : 's'} their own FitAccess card number?`, confirmText: 'Send cards' }))) return
  busy.value = 'cards'
  try {
    const r = await api.post<{ message: string }>('hr/employees/send-cards', { only_new: true })
    emit('changed', r.message)
    load()
  } catch (e) {
    emit('changed', e instanceof Error ? e.message : 'Cards could not be sent.', 'error')
  } finally { busy.value = '' }
}

async function resendInvites() {
  const n = s.value?.counts.awaiting_account ?? 0
  if (!(await confirmDialog({ title: 'Resend invitations?', message: `Email a new account-creation link to ${n} employee${n === 1 ? '' : 's'} who have not created their account yet?`, confirmText: 'Resend' }))) return
  busy.value = 'invites'
  try {
    const r = await api.post<{ message: string }>('hr/employees/resend-invites')
    emit('changed', r.message)
    load()
  } catch (e) {
    emit('changed', e instanceof Error ? e.message : 'Invitations could not be sent.', 'error')
  } finally { busy.value = '' }
}
</script>

<template>
  <section v-if="s" class="ob">
    <div class="ob-cards">
      <div class="ob-card" :class="deadlineTone">
        <span class="ob-k">Staff list for {{ s.next_period.label }}</span>
        <strong>Due {{ fmt(s.next_period.staff_list_deadline) }}</strong>
        <span class="ob-v">
          <template v-if="listDaysLeft === 0">Today is the last day to add or change employees</template>
          <template v-else-if="listDaysLeft > 0">{{ listDaysLeft }} day{{ listDaysLeft === 1 ? '' : 's' }} left. Employees added later start the next working day; extra days go on the next invoice</template>
        </span>
      </div>

      <div class="ob-card" :class="invoiceTone">
        <span class="ob-k">{{ s.open_invoice ? `Invoice ${s.open_invoice.number}` : `Invoice for ${s.next_period.label}` }}</span>
        <template v-if="s.open_invoice">
          <strong>ETB {{ s.open_invoice.total.toLocaleString() }}</strong>
          <span class="ob-v">
            <template v-if="s.open_invoice.status === 'closed'">Closed, access paused. Request an exception on Billing</template>
            <template v-else-if="s.open_invoice.status === 'overdue'">Overdue: grace period until {{ fmt(s.open_invoice.closes_on) }}</template>
            <template v-else>Payment due {{ fmt(s.open_invoice.due_date) }}</template>
          </span>
        </template>
        <template v-else>
          <strong>Sent by {{ fmt(s.next_period.send_date) }}</strong>
          <span class="ob-v">Payment due {{ fmt(s.next_period.due_date) }}, grace period until {{ fmt(s.next_period.closes_on) }}</span>
        </template>
      </div>
      <div class="ob-card">
        <span class="ob-k">Accounts</span>
        <strong>{{ s.counts.accounts_created }} / {{ s.counts.employees }}</strong>
        <span class="ob-v">
          <template v-if="s.counts.awaiting_account">{{ s.counts.awaiting_account }} haven't created their account</template>
          <template v-else>Everyone has an account</template>
        </span>
      </div>

      <div class="ob-card">
        <span class="ob-k">Cards</span>
        <strong>{{ s.counts.cards_active }} active</strong>
        <span class="ob-v">
          <template v-if="s.counts.cards_to_send">{{ s.counts.cards_to_send }} e-mailed, waiting for the employee to activate</template>
          <template v-else>FitAccess e-mails each employee their card after payment</template>
        </span>
      </div>
    </div>

    <div class="ob-actions">
      <button v-if="s.counts.awaiting_account" type="button" class="ob-btn" :disabled="!!busy" @click="resendInvites">
        {{ busy === 'invites' ? 'Sending…' : 'Resend invitations' }}
      </button>
      <details class="ob-rules">
        <summary>Payment rules</summary>
        <ul><li v-for="r in s.rules" :key="r">{{ r }}</li></ul>
      </details>
    </div>
  </section>
</template>

<style scoped>
.ob { display: flex; flex-direction: column; gap: 14px; margin-bottom: 18px; }
.ob-cards { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.ob-card {
  display: flex; flex-direction: column; gap: 3px; padding: 16px 18px; background: #fff; border-radius: 16px;
  border: 1px solid #eef0ea; box-shadow: 0 1px 3px rgba(0,0,0,.04); min-width: 0;
}
.ob-card.soon { border-color: #fde68a; background: #fffdf5; }
.ob-card.late { border-color: #fecaca; background: #fff8f8; }
.ob-card.ready { border-color: #c9ef8a; background: #f7fdec; }
.ob-k { font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #6b7280; }
.ob-card strong { font-size: 17px; color: #0b0c10; overflow-wrap: anywhere; }
.ob-v { font-size: 12.5px; color: #4b5563; line-height: 1.4; }
.ob-card.soon .ob-v { color: #92400e; } .ob-card.late .ob-v { color: #b91c1c; } .ob-card.ready .ob-v { color: #3f6b00; }
.ob-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.ob-btn {
  padding: 10px 18px; border-radius: 999px; border: 1.5px solid #e5e7eb; background: #fff; color: #0b0c10;
  font-weight: 700; font-size: 13.5px; cursor: pointer; font-family: inherit;
}
.ob-btn:hover:not(:disabled) { border-color: #0b0c10; }
.ob-btn.primary { background: #0b0c10; border-color: #0b0c10; color: #fff; }
.ob-btn.primary:hover { background: #8be000; border-color: #8be000; color: #0b0c10; }
.ob-btn.lime { background: #8be000; border-color: #8be000; }
.ob-btn:disabled { opacity: .6; cursor: default; }
.ob-rules { margin-left: auto; font-size: 13px; color: #4b5563; }
.ob-rules summary { cursor: pointer; font-weight: 600; color: #374151; }
.ob-rules ul { margin: 8px 0 0; padding-left: 18px; max-width: 520px; line-height: 1.5; }
@media (max-width: 1100px) { .ob-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 560px) { .ob-cards { grid-template-columns: 1fr; } .ob-rules { margin-left: 0; } }
</style>
