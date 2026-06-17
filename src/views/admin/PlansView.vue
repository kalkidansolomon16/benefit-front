<template>
  <div class="plans-page">

    <!-- Header row -->
    <div class="page-header">
      <div>
        <p class="page-desc">{{ activePlans }} active plan{{ activePlans !== 1 ? 's' : '' }} · {{ plans.length }} total</p>
      </div>
      <button class="btn-add" @click="openCreate">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Plan
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading plans…</p>
    </div>

    <!-- Empty -->
    <div v-else-if="plans.length === 0" class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.4"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      <p>No plans yet. Click <strong>Add Plan</strong> to create the first one.</p>
    </div>

    <!-- Plans Grid -->
    <div v-else class="plans-grid">
      <div
        v-for="plan in paginatedPlans"
        :key="plan.id"
        class="plan-card"
        :class="{ 'plan-card--inactive': !plan.is_active }"
      >
        <!-- Top -->
        <div class="plan-top">
          <div class="plan-top-left">
            <span class="tier-badge">{{ { basic: 'Basic', basic_plus: 'Basic+', platinum: 'Platinum' }[plan.tier] ?? plan.tier }}</span>
            <span v-if="!plan.is_active" class="inactive-badge">Inactive</span>
          </div>
          <div class="plan-actions">
            <button class="icon-btn" title="Edit" @click="openEdit(plan)">
              <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button
              class="icon-btn"
              :title="plan.is_active ? 'Deactivate' : 'Activate'"
              @click="toggleActive(plan)"
            >
              <svg v-if="plan.is_active" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
              <svg v-else width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </button>
            <button class="icon-btn icon-btn--danger" title="Delete" @click="confirmDelete(plan)">
              <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </div>
        </div>

        <!-- Name & price -->
        <h3 class="plan-name">{{ plan.name }}</h3>
        <div class="plan-price">
          <span class="price-currency">ETB</span>
          <span class="price-amount">{{ Number(plan.monthly_fee_etb).toLocaleString() }}</span>
          <span class="price-period">/mo per employee</span>
        </div>

        <!-- Meta chips -->
        <div class="plan-meta">
          <span v-if="plan.target_level" class="meta-chip">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            {{ levelLabel(plan.target_level) }}
          </span>
          <span v-if="plan.duration_months" class="meta-chip">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {{ plan.duration_months }} month{{ plan.duration_months !== 1 ? 's' : '' }}
          </span>
          <span class="meta-chip">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            {{ plan.memberships_count }} membership{{ plan.memberships_count !== 1 ? 's' : '' }}
          </span>
        </div>

        <!-- Features -->
        <ul v-if="plan.features?.length" class="plan-features">
          <li v-for="f in plan.features" :key="f">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
            {{ f }}
          </li>
        </ul>
        <p v-else class="no-features">No features listed yet.</p>
      </div>
    </div>

    <AppPagination
      v-model:page="planPage"
      :total-pages="planTotalPages"
      :total="plans.length"
      :per-page="planPerPage"
    />

    <!-- -- Add / Edit Modal --------------------------------------- -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
          <div class="modal">
            <div class="modal-header">
              <h2 class="modal-title">{{ editing ? 'Edit Plan' : 'New Plan' }}</h2>
              <button class="modal-close" @click="closeModal">
                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div class="modal-body">
              <div class="fields">

                <!-- Name -->
                <div class="field-group">
                  <label class="field-label">Plan Name <span class="req">*</span></label>
                  <input v-model="form.name" type="text" class="input" placeholder="e.g. Premium Plus" />
                </div>

                <!-- Tier key -->
                <div class="field-group">
                  <label class="field-label">
                    Tier <span class="req">*</span>
                    <span class="label-hint">Controls which gyms employees on this plan can access</span>
                  </label>
                  <select v-model="form.tier" class="input" :disabled="!!editing">
                    <option value="">— Select tier —</option>
                    <option value="basic">Basic — access Basic gyms only</option>
                    <option value="basic_plus">Basic+ — access Basic & Basic+ gyms</option>
                    <option value="platinum">Platinum — access all gyms</option>
                  </select>
                  <p v-if="editing" class="field-hint">Tier cannot be changed after creation.</p>
                </div>

                <!-- Fee + Duration row -->
                <div class="field-row">
                  <div class="field-group">
                    <label class="field-label">Monthly Fee (ETB) <span class="req">*</span></label>
                    <input v-model="form.monthly_fee_etb" type="number" min="0" step="100" class="input" placeholder="e.g. 7200" />
                  </div>
                  <div class="field-group">
                    <label class="field-label">Duration (months)</label>
                    <input v-model="form.duration_months" type="number" min="1" class="input" placeholder="1" />
                  </div>
                </div>

                <!-- Target Level -->
                <div class="field-group">
                  <label class="field-label">Target Employee Level</label>
                  <div class="select-wrap">
                    <select v-model="form.target_level" class="input select-input">
                      <option value="all">All Levels</option>
                      <option value="staff">Staff / Manager</option>
                      <option value="director">Director</option>
                      <option value="chief">Chief / Executive</option>
                    </select>
                    <svg class="select-arrow" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
                  </div>
                </div>

                <!-- Features -->
                <div class="field-group">
                  <label class="field-label">Features</label>
                  <div class="features-list">
                    <div
                      v-for="(f, i) in form.features"
                      :key="i"
                      class="feature-row"
                    >
                      <input
                        v-model="form.features[i]"
                        type="text"
                        class="input feature-input"
                        :placeholder="`Feature ${i + 1}`"
                      />
                      <button type="button" class="remove-feature" @click="removeFeature(i)">
                        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                    <button type="button" class="btn-add-feature" @click="addFeature">
                      <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Add feature
                    </button>
                  </div>
                </div>

                <!-- Active toggle -->
                <label class="toggle-row">
                  <div class="toggle-track" :class="{ 'toggle-on': form.is_active }" @click="form.is_active = !form.is_active">
                    <div class="toggle-thumb"></div>
                  </div>
                  <span class="toggle-label">{{ form.is_active ? 'Active (visible to HR admins)' : 'Inactive (hidden)' }}</span>
                </label>

              </div>

              <p v-if="modalError" class="modal-error">{{ modalError }}</p>
            </div>

            <div class="modal-footer">
              <button class="btn-cancel" @click="closeModal">Cancel</button>
              <button
                class="btn-save"
                :class="{ active: formValid && !saving }"
                :disabled="!formValid || saving"
                @click="savePlan"
              >
                <span v-if="saving" class="spinner-sm"></span>
                <span v-else>{{ editing ? 'Save Changes' : 'Create Plan' }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- -- Delete Confirm Modal ----------------------------------- -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="deleteTarget" class="modal-backdrop" @click.self="deleteTarget = null">
          <div class="modal modal--sm">
            <div class="modal-header">
              <h2 class="modal-title">Delete Plan</h2>
              <button class="modal-close" @click="deleteTarget = null">
                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div class="modal-body">
              <p class="delete-msg">Are you sure you want to delete <strong>{{ deleteTarget.name }}</strong>? This cannot be undone.</p>
              <p v-if="deleteError" class="modal-error">{{ deleteError }}</p>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" @click="deleteTarget = null">Cancel</button>
              <button class="btn-delete" :disabled="deleting" @click="deletePlan">
                <span v-if="deleting" class="spinner-sm"></span>
                <span v-else>Delete</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Toast -->
    <Transition name="toast-fade">
      <div v-if="toast" class="toast" :class="`toast--${toast.type}`">{{ toast.msg }}</div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'
import AppPagination from '@/components/AppPagination.vue'

const api = useApi()

interface Plan {
  id: number
  name: string
  tier: string
  monthly_fee_etb: string | number
  duration_months: number | null
  features: string[] | null
  target_level: string | null
  is_active: boolean
  memberships_count: number
}

const plans   = ref<Plan[]>([])
const loading = ref(true)

const activePlans = computed(() => plans.value.filter(p => p.is_active).length)

const planPage    = ref(1)
const planPerPage = 10
const planTotalPages  = computed(() => Math.max(1, Math.ceil(plans.value.length / planPerPage)))
const paginatedPlans  = computed(() => plans.value.slice((planPage.value - 1) * planPerPage, planPage.value * planPerPage))

async function fetchPlans() {
  loading.value = true
  try {
    plans.value = await api.get<Plan[]>('membership-plans?all=true')
  } finally {
    loading.value = false
  }
}
onMounted(fetchPlans)

// -- Form modal ---------------------------------------------------
const showModal  = ref(false)
const editing    = ref<Plan | null>(null)
const saving     = ref(false)
const modalError = ref('')

const form = reactive({
  name:             '',
  tier:             '',
  monthly_fee_etb:  '' as string | number,
  duration_months:  1 as number | null,
  features:         [] as string[],
  target_level:     'all',
  is_active:        true,
})

const formValid = computed(() =>
  form.name.trim().length > 0 &&
  form.tier.trim().length > 0 &&
  Number(form.monthly_fee_etb) >= 0
)

function openCreate() {
  editing.value        = null
  form.name            = ''
  form.tier            = ''
  form.monthly_fee_etb = ''
  form.duration_months = 1
  form.features        = []
  form.target_level    = 'all'
  form.is_active       = true
  modalError.value     = ''
  showModal.value      = true
}

function openEdit(plan: Plan) {
  editing.value        = plan
  form.name            = plan.name
  form.tier            = plan.tier
  form.monthly_fee_etb = plan.monthly_fee_etb
  form.duration_months = plan.duration_months ?? 1
  form.features        = plan.features ? [...plan.features] : []
  form.target_level    = plan.target_level ?? 'all'
  form.is_active       = plan.is_active
  modalError.value     = ''
  showModal.value      = true
}

function closeModal() {
  showModal.value  = false
  editing.value    = null
  modalError.value = ''
}

function addFeature() { form.features.push('') }
function removeFeature(i: number) { form.features.splice(i, 1) }

async function savePlan() {
  if (!formValid.value) return
  saving.value     = true
  modalError.value = ''
  try {
    const payload = {
      name:             form.name.trim(),
      tier:             form.tier.trim(),
      monthly_fee_etb:  Number(form.monthly_fee_etb),
      duration_months:  form.duration_months ?? 1,
      features:         form.features.filter(f => f.trim()),
      target_level:     form.target_level,
      is_active:        form.is_active,
    }

    if (editing.value) {
      const updated = await api.patch<Plan>(`membership-plans/${editing.value.id}`, payload)
      const idx = plans.value.findIndex(p => p.id === editing.value!.id)
      if (idx !== -1) plans.value[idx] = updated
      showToast('Plan updated.', 'success')
    } else {
      const created = await api.post<Plan>('membership-plans', payload)
      plans.value.push(created)
      showToast('Plan created.', 'success')
    }
    closeModal()
  } catch (e: unknown) {
    modalError.value = e instanceof Error ? e.message : 'Failed to save plan.'
  } finally {
    saving.value = false
  }
}

// -- Toggle active ------------------------------------------------
async function toggleActive(plan: Plan) {
  try {
    const res = await api.patch<{ is_active: boolean; message: string }>(`membership-plans/${plan.id}/toggle-active`, {})
    plan.is_active = res.is_active
    showToast(res.message, 'success')
  } catch {
    showToast('Failed to update status.', 'error')
  }
}

// -- Delete -------------------------------------------------------
const deleteTarget = ref<Plan | null>(null)
const deleteError  = ref('')
const deleting     = ref(false)

function confirmDelete(plan: Plan) {
  deleteTarget.value = plan
  deleteError.value  = ''
}

async function deletePlan() {
  if (!deleteTarget.value) return
  deleting.value    = true
  deleteError.value = ''
  try {
    await api.delete(`membership-plans/${deleteTarget.value.id}`)
    plans.value    = plans.value.filter(p => p.id !== deleteTarget.value!.id)
    deleteTarget.value = null
    showToast('Plan deleted.', 'success')
  } catch (e: unknown) {
    deleteError.value = e instanceof Error ? e.message : 'Could not delete plan.'
  } finally {
    deleting.value = false
  }
}

// -- Toast --------------------------------------------------------
const toast = ref<{ msg: string; type: 'success' | 'error' } | null>(null)
function showToast(msg: string, type: 'success' | 'error') {
  toast.value = { msg, type }
  setTimeout(() => { toast.value = null }, 3000)
}

// -- Helpers ------------------------------------------------------
function levelLabel(level: string): string {
  const map: Record<string, string> = {
    all: 'All Levels', staff: 'Staff / Manager',
    manager: 'Manager', director: 'Director', chief: 'Chief / Executive',
  }
  return map[level] ?? level
}
</script>

<style scoped>
.plans-page { display: flex; flex-direction: column; gap: 20px; }

/* Header */
.page-header {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
}
.page-desc { font-size: 0.83rem; color: #94a3b8; margin: 0; }
.btn-add {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 9px 18px; background: #1b3a6b; color: #fff;
  border: none; border-radius: 9px; font-size: 0.88rem; font-weight: 600;
  cursor: pointer; font-family: inherit; transition: background .15s;
}
.btn-add:hover { background: #162f58; }

/* Loading / Empty */
.loading-state, .empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; padding: 70px 20px; color: #94a3b8;
  font-size: 0.9rem;
}
.spinner {
  width: 32px; height: 32px;
  border: 3px solid #e2e8f0; border-top-color: #1b3a6b;
  border-radius: 50%; animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Plans grid */
.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

/* Plan card */
.plan-card {
  background: #fff; border-radius: 14px; padding: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  display: flex; flex-direction: column; gap: 10px;
  transition: box-shadow .2s;
}
.plan-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.09); }
.plan-card--inactive { opacity: 0.6; }

.plan-top { display: flex; align-items: center; justify-content: space-between; }
.plan-top-left { display: flex; align-items: center; gap: 8px; }

.tier-badge {
  font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.08em; padding: 3px 9px; border-radius: 20px;
  background: #EBFAEE; color: #1b3a6b;
}
.inactive-badge {
  font-size: 0.68rem; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.06em; padding: 3px 9px; border-radius: 20px;
  background: #fff1f2; color: #e11d48;
}

.plan-actions { display: flex; gap: 4px; }
.icon-btn {
  width: 30px; height: 30px; border-radius: 7px; border: none;
  background: transparent; color: #94a3b8; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: color .15s, background .15s;
}
.icon-btn:hover { color: #475569; background: #f1f5f9; }
.icon-btn--danger:hover { color: #e11d48; background: #fff1f2; }

.plan-name {
  font-size: 1.1rem; font-weight: 700; color: #0f172a; margin: 0;
}

.plan-price {
  display: flex; align-items: baseline; gap: 3px;
}
.price-currency { font-size: 0.75rem; font-weight: 600; color: #94a3b8; }
.price-amount   { font-size: 1.6rem; font-weight: 800; color: #1b3a6b; line-height: 1; }
.price-period   { font-size: 0.72rem; color: #94a3b8; }

.plan-meta { display: flex; flex-wrap: wrap; gap: 6px; }
.meta-chip {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 0.72rem; color: #64748b;
  background: #f8fafc; padding: 3px 9px; border-radius: 20px;
}

.plan-features {
  list-style: none; padding: 0; margin: 0;
  display: flex; flex-direction: column; gap: 5px;
}
.plan-features li {
  display: flex; align-items: flex-start; gap: 7px;
  font-size: 0.8rem; color: #475569;
}
.plan-features li svg { flex-shrink: 0; color: #4CD964; margin-top: 1px; }
.no-features { font-size: 0.78rem; color: #cbd5e1; margin: 0; }

/* -- Modal ----------------------------------------------------- */
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.45);
  z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px;
}
.modal {
  background: #fff; border-radius: 16px; width: 100%; max-width: 520px;
  max-height: 90vh; display: flex; flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  overflow: hidden;
}
.modal--sm { max-width: 400px; }

.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px 16px; border-bottom: 1px solid #f1f5f9;
  flex-shrink: 0;
}
.modal-title { font-size: 1.05rem; font-weight: 700; color: #0f172a; margin: 0; }
.modal-close {
  width: 30px; height: 30px; border-radius: 8px; border: none;
  background: #f8fafc; color: #64748b; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.modal-close:hover { background: #f1f5f9; color: #0f172a; }

.modal-body { padding: 20px 24px; overflow-y: auto; flex: 1; }
.modal-footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 16px 24px; border-top: 1px solid #f1f5f9; flex-shrink: 0;
}

/* Fields */
.fields { display: flex; flex-direction: column; gap: 16px; }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.field-group { display: flex; flex-direction: column; gap: 5px; }
.field-label { font-size: 0.83rem; font-weight: 600; color: #334155; }
.label-hint  { font-weight: 400; color: #94a3b8; font-size: 0.75rem; margin-left: 6px; }
.req { color: #e11d48; }
.field-hint  { font-size: 0.75rem; color: #94a3b8; margin: 0; }

.input {
  padding: 10px 13px; border: 1.5px solid #e2e8f0; border-radius: 8px;
  font-size: 0.88rem; color: #1e293b; outline: none; font-family: inherit;
  background: #f8fafc; transition: border-color .15s;
  box-sizing: border-box; width: 100%;
}
.input:focus { border-color: #1b3a6b; background: #fff; }
.input:disabled { background: #f1f5f9; color: #94a3b8; cursor: not-allowed; }

.select-wrap { position: relative; }
.select-input { appearance: none; cursor: pointer; padding-right: 32px; }
.select-arrow { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); pointer-events: none; color: #94a3b8; }

/* Features */
.features-list { display: flex; flex-direction: column; gap: 8px; }
.feature-row { display: flex; align-items: center; gap: 8px; }
.feature-input { flex: 1; }
.remove-feature {
  width: 30px; height: 30px; flex-shrink: 0; border: none;
  background: #fff1f2; color: #e11d48; border-radius: 7px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: background .15s;
}
.remove-feature:hover { background: #ffe4e6; }

.btn-add-feature {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 12px; border: 1.5px dashed #cbd5e1; border-radius: 8px;
  background: transparent; color: #64748b; font-size: 0.82rem;
  cursor: pointer; transition: border-color .15s, color .15s;
  font-family: inherit;
}
.btn-add-feature:hover { border-color: #1b3a6b; color: #1b3a6b; }

/* Toggle */
.toggle-row { display: flex; align-items: center; gap: 10px; cursor: pointer; }
.toggle-track {
  width: 40px; height: 22px; border-radius: 11px; background: #e2e8f0;
  position: relative; transition: background .2s; flex-shrink: 0;
}
.toggle-track.toggle-on { background: #1b3a6b; }
.toggle-thumb {
  width: 16px; height: 16px; border-radius: 50%; background: #fff;
  position: absolute; top: 3px; left: 3px;
  transition: transform .2s; box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.toggle-on .toggle-thumb { transform: translateX(18px); }
.toggle-label { font-size: 0.84rem; color: #475569; }

/* Buttons */
.btn-cancel {
  padding: 9px 18px; border: 1.5px solid #e2e8f0; border-radius: 8px;
  background: #fff; color: #475569; font-size: 0.88rem; font-weight: 500;
  cursor: pointer; font-family: inherit;
}
.btn-cancel:hover { background: #f8fafc; }

.btn-save {
  padding: 9px 20px; border: none; border-radius: 8px;
  background: #cbd5e1; color: #fff; font-size: 0.88rem; font-weight: 600;
  cursor: not-allowed; font-family: inherit;
  display: inline-flex; align-items: center; gap: 7px;
  transition: background .15s;
}
.btn-save.active { background: #1b3a6b; cursor: pointer; }
.btn-save.active:hover { background: #162f58; }

.btn-delete {
  padding: 9px 20px; border: none; border-radius: 8px;
  background: #e11d48; color: #fff; font-size: 0.88rem; font-weight: 600;
  cursor: pointer; font-family: inherit;
  display: inline-flex; align-items: center; gap: 7px;
  transition: background .15s;
}
.btn-delete:hover { background: #be123c; }
.btn-delete:disabled { opacity: 0.6; cursor: not-allowed; }

.delete-msg { font-size: 0.9rem; color: #475569; line-height: 1.6; }

.modal-error {
  font-size: 0.83rem; color: #e11d48; background: #fff1f2;
  border: 1px solid #fecdd3; border-radius: 8px; padding: 10px 13px;
  margin-top: 14px;
}

/* Spinner */
.spinner-sm {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff;
  border-radius: 50%; animation: spin .7s linear infinite;
  display: inline-block;
}

/* Toast */
.toast {
  position: fixed; bottom: 28px; right: 28px;
  padding: 12px 20px; border-radius: 10px;
  font-size: 0.88rem; font-weight: 600; color: #fff;
  z-index: 300; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}
.toast--success { background: #16a34a; }
.toast--error   { background: #e11d48; }

/* Transitions */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity .2s; }
.modal-fade-enter-from,  .modal-fade-leave-to      { opacity: 0; }
.toast-fade-enter-active, .toast-fade-leave-active  { transition: opacity .25s, transform .25s; }
.toast-fade-enter-from,  .toast-fade-leave-to       { opacity: 0; transform: translateY(8px); }
</style>
