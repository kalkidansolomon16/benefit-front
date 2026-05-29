<template>
  <div class="page">

    <!-- Header -->
    <div class="page-hd">
      <p class="page-desc">Add bank accounts companies will use when paying invoices.</p>
      <button class="btn-add" @click="openAdd">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Payment Method
      </button>
    </div>

    <div v-if="loading" class="state-msg">Loading payment methods…</div>

    <div v-else-if="methods.length === 0" class="empty-state">
      <div class="empty-icon">🏦</div>
      <p class="empty-title">No payment methods yet</p>
      <p class="empty-sub">Add a bank account so companies know where to send payments.</p>
    </div>

    <!-- Methods grid -->
    <div v-else class="methods-grid">
      <div v-for="m in methods" :key="m.id" class="method-card">
        <div class="method-card-top">
          <div class="bank-icon">🏦</div>
          <div class="method-info">
            <p class="method-bank">{{ m.bank_name }}</p>
            <p class="method-holder">{{ m.account_name }}</p>
          </div>
          <span class="status-dot" :class="m.is_active ? 'dot-active' : 'dot-inactive'"
                :title="m.is_active ? 'Active' : 'Inactive'"></span>
        </div>

        <div class="method-account">
          <span class="acct-label">Account No.</span>
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
              <div class="field">
                <label>Bank Name <span class="req">*</span></label>
                <input v-model="form.bank_name" placeholder="e.g. Commercial Bank of Ethiopia" />
              </div>
              <div class="field">
                <label>Account Holder Name <span class="req">*</span></label>
                <input v-model="form.account_name" placeholder="e.g. FitAccess Ethiopia PLC" />
              </div>
              <div class="field">
                <label>Account Number <span class="req">*</span></label>
                <input v-model="form.account_number" placeholder="e.g. 1000123456789" />
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
import { ref, reactive, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'

interface Method {
  id: number; bank_name: string; account_name: string
  account_number: string; instructions: string | null; is_active: boolean
}

const api     = useApi()
const methods = ref<Method[]>([])
const loading = ref(true)
const saving  = ref(false)
const formError = ref('')

const modal = reactive({ show: false, editId: null as number | null })
const form  = reactive({ bank_name: '', account_name: '', account_number: '', instructions: '', is_active: true })

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
  Object.assign(form, { bank_name: '', account_name: '', account_number: '', instructions: '', is_active: true })
  formError.value = ''
  modal.editId = null
  modal.show = true
}
function openEdit(m: Method) {
  Object.assign(form, { bank_name: m.bank_name, account_name: m.account_name, account_number: m.account_number, instructions: m.instructions ?? '', is_active: m.is_active })
  formError.value = ''
  modal.editId = m.id
  modal.show = true
}

async function save() {
  formError.value = ''
  if (!form.bank_name.trim() || !form.account_name.trim() || !form.account_number.trim()) {
    formError.value = 'Bank name, account holder and account number are required.'
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
.method-card-top { display: flex; align-items: center; gap: 12px; }
.bank-icon { font-size: 1.8rem; flex-shrink: 0; }
.method-info { flex: 1; }
.method-bank   { font-size: 0.95rem; font-weight: 700; color: #0f172a; margin: 0 0 2px; }
.method-holder { font-size: 0.78rem; color: #64748b; margin: 0; }
.status-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.dot-active   { background: #4CD964; }
.dot-inactive { background: #94a3b8; }

.method-account { display: flex; align-items: center; gap: 10px; background: #f8fafc; border-radius: 8px; padding: 10px 14px; }
.acct-label  { font-size: 0.72rem; color: #94a3b8; text-transform: uppercase; letter-spacing: .05em; }
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
.modal { background: white; border-radius: 18px; width: 100%; max-width: 480px; box-shadow: 0 24px 64px rgba(0,0,0,.18); }
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
</style>
