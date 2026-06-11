<template>
  <div class="page">

    <!-- Header -->
    <div class="page-hd">
      <p class="page-desc">Add payment methods (bank accounts, mobile wallets, etc.) that companies use when paying invoices.</p>
      <button class="btn-add" @click="openAdd">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Payment Method
      </button>
    </div>

    <div v-if="loading" class="state-msg">Loading payment methods…</div>

    <div v-else-if="methods.length === 0" class="empty-state">
      <div class="empty-icon">💳</div>
      <p class="empty-title">No payment methods yet</p>
      <p class="empty-sub">Add a bank account or mobile wallet so companies know where to send payments.</p>
    </div>

    <!-- Methods grid -->
    <div v-else class="methods-grid">
      <div v-for="m in pmPaginatedMethods" :key="m.id" class="method-card">
        <div class="method-card-top">
          <div class="method-icon">{{ typeIcon(m.type) }}</div>
          <div class="method-info">
            <div class="method-name-row">
              <p class="method-bank">{{ m.bank_name }}</p>
              <span class="type-badge" :class="'type-' + m.type">{{ typeLabel(m.type) }}</span>
            </div>
            <p class="method-holder">{{ m.account_name }}</p>
          </div>
          <span class="status-dot" :class="m.is_active ? 'dot-active' : 'dot-inactive'"
                :title="m.is_active ? 'Active' : 'Inactive'"></span>
        </div>

        <div class="method-account">
          <span class="acct-label">{{ accountLabel(m.type) }}</span>
          <span class="acct-number">{{ m.account_number }}</span>
        </div>

        <p v-if="m.instructions" class="method-note">{{ m.instructions }}</p>

        <div class="method-actions">
          <button class="act-btn act-edit" @click="openEdit(m)">Edit</button>
          <button class="act-btn act-toggle" @click="toggle(m)">
            {{ m.is_active ? 'Deactivate' : 'Activate' }}
          </button>
          <button class="act-btn act-del" @click="remove(m)">Delete</button>
        </div>
      </div>
    </div>

    <AppPagination
      v-if="!loading && methods.length"
      v-model:page="pmPage"
      :total-pages="pmTotalPages"
      :total="methods.length"
      :per-page="pmPerPage"
    />

    <!-- Add / Edit Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="modal.show" class="modal-backdrop" @click.self="modal.show = false">
          <div class="modal">
            <div class="modal-header">
              <p class="modal-title">{{ modal.editId ? 'Edit' : 'Add' }} Payment Method</p>
              <button class="modal-close" @click="modal.show = false">✕</button>
            </div>

            <div class="modal-body">

              <!-- Type selector -->
              <div class="field">
                <label>Payment Type <span class="req">*</span></label>
                <div class="type-grid">
                  <button
                    v-for="t in PAYMENT_TYPES" :key="t.value"
                    type="button"
                    class="type-option"
                    :class="{ selected: form.type === t.value }"
                    @click="selectType(t.value)"
                  >
                    <span class="type-opt-icon">{{ t.icon }}</span>
                    <span class="type-opt-label">{{ t.label }}</span>
                  </button>
                </div>
              </div>

              <div class="field">
                <label>{{ currentTypeConfig.providerLabel }} <span class="req">*</span></label>
                <input v-model="form.bank_name" :placeholder="currentTypeConfig.providerPlaceholder" />
              </div>
              <div class="field">
                <label>Account Holder Name <span class="req">*</span></label>
                <input v-model="form.account_name" placeholder="e.g. FitAccess Ethiopia PLC" />
              </div>
              <div class="field">
                <label>{{ currentTypeConfig.accountLabel }} <span class="req">*</span></label>
                <input v-model="form.account_number" :placeholder="currentTypeConfig.accountPlaceholder" />
              </div>
              <div class="field">
                <label>Transfer Instructions <span class="opt">(optional)</span></label>
                <textarea v-model="form.instructions" rows="3"
                  placeholder="e.g. Include your company name in the transfer note" />
              </div>
              <label class="check-row">
                <input type="checkbox" v-model="form.is_active" />
                <span>Active (visible to companies)</span>
              </label>
              <p v-if="formError" class="form-error">{{ formError }}</p>
            </div>

            <div class="modal-footer">
              <button class="btn-cancel" @click="modal.show = false">Cancel</button>
              <button class="btn-save" :disabled="saving" @click="save">
                {{ saving ? 'Saving…' : (modal.editId ? 'Save Changes' : 'Add Method') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Toast -->
    <Teleport to="body">
      <Transition name="toast">
        <div v-if="toast.show" class="toast" :class="'toast-' + toast.type">{{ toast.message }}</div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'
import AppPagination from '@/components/AppPagination.vue'

interface Method {
  id: number
  type: string
  bank_name: string
  account_name: string
  account_number: string
  instructions: string | null
  is_active: boolean
}

interface TypeConfig {
  value: string
  label: string
  icon: string
  providerLabel: string
  providerPlaceholder: string
  accountLabel: string
  accountPlaceholder: string
}

const PAYMENT_TYPES: TypeConfig[] = [
  {
    value: 'bank',
    label: 'Bank Transfer',
    icon: '🏦',
    providerLabel: 'Bank Name',
    providerPlaceholder: 'e.g. Commercial Bank of Ethiopia',
    accountLabel: 'Account Number',
    accountPlaceholder: 'e.g. 1000123456789',
  },
  {
    value: 'telebirr',
    label: 'Telebirr',
    icon: '📱',
    providerLabel: 'Provider',
    providerPlaceholder: 'Telebirr',
    accountLabel: 'Phone Number',
    accountPlaceholder: 'e.g. 0911 234 567',
  },
  {
    value: 'cbe_birr',
    label: 'CBE Birr',
    icon: '📲',
    providerLabel: 'Provider',
    providerPlaceholder: 'CBE Birr',
    accountLabel: 'Phone Number',
    accountPlaceholder: 'e.g. 0911 234 567',
  },
  {
    value: 'mpesa',
    label: 'M-Pesa',
    icon: '💚',
    providerLabel: 'Provider',
    providerPlaceholder: 'M-Pesa',
    accountLabel: 'Phone Number',
    accountPlaceholder: 'e.g. 0711 234 567',
  },
  {
    value: 'other',
    label: 'Other',
    icon: '💳',
    providerLabel: 'Method Name',
    providerPlaceholder: 'e.g. Western Union, PayPal',
    accountLabel: 'Account / Reference',
    accountPlaceholder: 'e.g. REF-001 or account number',
  },
]

function getTypeConfig(type: string): TypeConfig {
  return PAYMENT_TYPES.find(t => t.value === type) ?? PAYMENT_TYPES[0]!
}

function typeIcon(type: string): string  { return getTypeConfig(type).icon }
function typeLabel(type: string): string { return getTypeConfig(type).label }
function accountLabel(type: string): string { return getTypeConfig(type).accountLabel }

const api     = useApi()
const methods = ref<Method[]>([])
const loading = ref(true)

const pmPage    = ref(1)
const pmPerPage = 10
const pmTotalPages    = computed(() => Math.max(1, Math.ceil(methods.value.length / pmPerPage)))
const pmPaginatedMethods = computed(() =>
  methods.value.slice((pmPage.value - 1) * pmPerPage, pmPage.value * pmPerPage)
)
const saving  = ref(false)
const formError = ref('')

const modal = reactive({ show: false, editId: null as number | null })
const form  = reactive({
  type: 'bank',
  bank_name: '',
  account_name: '',
  account_number: '',
  instructions: '',
  is_active: true,
})

const currentTypeConfig = computed<TypeConfig>(() => getTypeConfig(form.type))

function selectType(type: string) {
  form.type = type
  // Auto-fill provider name for mobile wallets
  const config = getTypeConfig(type)
  if (['telebirr', 'cbe_birr', 'mpesa'].includes(type) && !form.bank_name) {
    form.bank_name = config.providerPlaceholder
  }
  // Clear auto-filled provider if user switched away and it still matches the old placeholder
  if (type === 'bank' || type === 'other') {
    const prev = PAYMENT_TYPES.find(t => ['telebirr','cbe_birr','mpesa'].includes(t.value) && t.providerPlaceholder === form.bank_name)
    if (prev) form.bank_name = ''
  }
}

const toast = reactive({ show: false, type: 'success', message: '' })
let toastTimer: ReturnType<typeof setTimeout> | null = null
function showToast(msg: string, type: 'success' | 'error' = 'success') {
  if (toastTimer) clearTimeout(toastTimer)
  Object.assign(toast, { show: true, type, message: msg })
  toastTimer = setTimeout(() => { toast.show = false }, 4000)
}

async function load() {
  loading.value = true
  try {
    methods.value = await api.get<Method[]>('admin/billing/payment-methods')
  } finally {
    loading.value = false
  }
}
onMounted(load)

function openAdd() {
  Object.assign(form, { type: 'bank', bank_name: '', account_name: '', account_number: '', instructions: '', is_active: true })
  formError.value = ''
  modal.editId = null
  modal.show = true
}

function openEdit(m: Method) {
  Object.assign(form, {
    type: m.type || 'bank',
    bank_name: m.bank_name,
    account_name: m.account_name,
    account_number: m.account_number,
    instructions: m.instructions ?? '',
    is_active: m.is_active,
  })
  formError.value = ''
  modal.editId = m.id
  modal.show = true
}

async function save() {
  formError.value = ''
  if (!form.bank_name.trim() || !form.account_name.trim() || !form.account_number.trim()) {
    formError.value = `${currentTypeConfig.value.providerLabel}, account holder and ${currentTypeConfig.value.accountLabel.toLowerCase()} are required.`
    return
  }
  saving.value = true
  try {
    if (modal.editId) {
      await api.put(`admin/billing/payment-methods/${modal.editId}`, form)
      showToast('Payment method updated.')
    } else {
      await api.post('admin/billing/payment-methods', form)
      showToast('Payment method added.')
    }
    modal.show = false
    await load()
  } catch (e: unknown) {
    formError.value = e instanceof Error ? e.message : 'Failed to save.'
  } finally {
    saving.value = false
  }
}

async function toggle(m: Method) {
  try {
    await api.patch(`admin/billing/payment-methods/${m.id}/toggle`)
    await load()
    showToast(m.is_active ? 'Payment method deactivated.' : 'Payment method activated.')
  } catch {
    showToast('Failed to update status.', 'error')
  }
}

async function remove(m: Method) {
  if (!confirm(`Delete "${m.bank_name}" payment method?`)) return
  try {
    await api.delete(`admin/billing/payment-methods/${m.id}`)
    showToast('Payment method deleted.')
    await load()
  } catch {
    showToast('Failed to delete.', 'error')
  }
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 20px; }
.page-hd { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.page-desc { font-size: 0.84rem; color: #64748b; margin: 0; }
.btn-add {
  display: flex; align-items: center; gap: 7px;
  padding: 10px 20px; background: #0f172a; color: white;
  border: none; border-radius: 10px; font-size: 0.84rem; font-weight: 600;
  cursor: pointer; transition: opacity .15s;
}
.btn-add:hover { opacity: .85; }
.state-msg { text-align: center; color: #94a3b8; padding: 48px; background: white; border-radius: 14px; }
.empty-state { background: white; border-radius: 14px; padding: 56px 24px; text-align: center; }
.empty-icon  { font-size: 2.5rem; margin-bottom: 12px; }
.empty-title { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0 0 6px; }
.empty-sub   { font-size: 0.85rem; color: #94a3b8; margin: 0; }

/* Methods grid */
.methods-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.method-card {
  background: white; border-radius: 16px; padding: 20px;
  border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,.05);
}
.method-card-top { display: flex; align-items: flex-start; gap: 12px; }
.method-icon { font-size: 1.8rem; flex-shrink: 0; line-height: 1; margin-top: 2px; }
.method-info { flex: 1; min-width: 0; }
.method-name-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 2px; }
.method-bank   { font-size: 0.95rem; font-weight: 700; color: #0f172a; margin: 0; }
.method-holder { font-size: 0.78rem; color: #64748b; margin: 0; }
.status-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
.dot-active   { background: #4CD964; }
.dot-inactive { background: #94a3b8; }

/* Type badge on card */
.type-badge {
  display: inline-block; padding: 2px 8px; border-radius: 20px;
  font-size: 0.68rem; font-weight: 700; letter-spacing: .03em; text-transform: uppercase;
}
.type-bank     { background: #dbeafe; color: #1d4ed8; }
.type-telebirr { background: #fef3c7; color: #b45309; }
.type-cbe_birr { background: #dcfce7; color: #15803d; }
.type-mpesa    { background: #d1fae5; color: #065f46; }
.type-other    { background: #f1f5f9; color: #475569; }

.method-account { display: flex; align-items: center; gap: 10px; background: #f8fafc; border-radius: 8px; padding: 10px 14px; }
.acct-label  { font-size: 0.72rem; color: #94a3b8; text-transform: uppercase; letter-spacing: .05em; white-space: nowrap; }
.acct-number { font-family: monospace; font-size: 0.9rem; font-weight: 600; color: #0f172a; letter-spacing: .04em; }
.method-note { font-size: 0.78rem; color: #64748b; margin: 0; font-style: italic; }

.method-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.act-btn { padding: 6px 14px; border-radius: 7px; font-size: 0.76rem; font-weight: 600; cursor: pointer; border: none; transition: opacity .15s; }
.act-btn:hover { opacity: .8; }
.act-edit   { background: #f1f5f9; color: #0f172a; }
.act-toggle { background: #e0f2fe; color: #2EB84B; }
.act-del    { background: #fee2e2; color: #dc2626; }

/* Modal */
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; z-index: 500; padding: 16px; }
.modal { background: white; border-radius: 18px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; box-shadow: 0 24px 64px rgba(0,0,0,.18); }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 22px 24px 16px; border-bottom: 1px solid #f1f5f9; }
.modal-title  { font-size: 1.05rem; font-weight: 700; color: #0f172a; margin: 0; }
.modal-close  { width: 28px; height: 28px; border-radius: 50%; border: none; background: #f1f5f9; color: #64748b; cursor: pointer; font-size: 0.75rem; }
.modal-close:hover { background: #e2e8f0; }
.modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 5px; }
.field label { font-size: 0.8rem; font-weight: 600; color: #374151; }
.req { color: #ef4444; }
.opt { color: #94a3b8; font-weight: 400; }
.field input, .field textarea {
  padding: 10px 12px; border: 1.5px solid #e2e8f0; border-radius: 9px;
  font-size: 0.88rem; color: #0f172a; background: #fff; font-family: inherit;
  outline: none; transition: border-color .15s;
}
.field input:focus, .field textarea:focus { border-color: #4CD964; }
.field textarea { resize: vertical; min-height: 72px; }

/* Type selector grid */
.type-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}
.type-option {
  display: flex; flex-direction: column; align-items: center; gap: 5px;
  padding: 10px 6px; border: 1.5px solid #e2e8f0; border-radius: 10px;
  background: #fff; cursor: pointer; transition: all .15s; font-family: inherit;
}
.type-option:hover { border-color: #94a3b8; background: #f8fafc; }
.type-option.selected { border-color: #4CD964; background: #EBFAEE; }
.type-opt-icon  { font-size: 1.4rem; line-height: 1; }
.type-opt-label { font-size: 0.68rem; font-weight: 600; color: #374151; text-align: center; line-height: 1.2; }
.type-option.selected .type-opt-label { color: #15803d; }

.check-row { display: flex; align-items: center; gap: 8px; font-size: 0.84rem; color: #374151; cursor: pointer; }
.check-row input { width: 16px; height: 16px; accent-color: #4CD964; }
.form-error { font-size: 0.8rem; color: #ef4444; margin: 0; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid #f1f5f9; }
.btn-cancel { padding: 9px 20px; background: white; color: #64748b; border: 1.5px solid #e2e8f0; border-radius: 9px; font-size: 0.84rem; font-weight: 500; cursor: pointer; }
.btn-cancel:hover { background: #f8fafc; }
.btn-save { padding: 9px 22px; background: #0f172a; color: white; border: none; border-radius: 9px; font-size: 0.84rem; font-weight: 600; cursor: pointer; transition: opacity .15s; }
.btn-save:hover:not(:disabled) { opacity: .85; }
.btn-save:disabled { opacity: .45; cursor: default; }

/* Modal transition */
.modal-enter-active { transition: all .22s cubic-bezier(.34,1.56,.64,1); }
.modal-leave-active { transition: all .18s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(.94); }

/* Toast */
.toast { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%); padding: 13px 22px; border-radius: 12px; font-size: 0.88rem; font-weight: 500; z-index: 999; box-shadow: 0 8px 28px rgba(0,0,0,.14); white-space: nowrap; pointer-events: none; }
.toast-success { background: #0f172a; color: #fff; }
.toast-error   { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.toast-enter-active { transition: all .3s cubic-bezier(.34,1.56,.64,1); }
.toast-leave-active { transition: all .25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(12px); }

@media (max-width: 480px) {
  .type-grid { grid-template-columns: repeat(3, 1fr); }
}
</style>
