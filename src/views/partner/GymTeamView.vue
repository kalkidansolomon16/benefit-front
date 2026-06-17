<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Staff Management</h1>
        <p class="page-sub">Manage check-in staff and roles for your gym.</p>
      </div>
      <button class="btn-primary" @click="openCreate">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Staff Member
      </button>
    </div>

    <div v-if="loading" class="state-loading"><div class="spinner-lg"></div></div>

    <div v-else-if="!members.length" class="state-empty">
      <p>No staff members yet. Add check-in staff to get started.</p>
    </div>

    <div v-else class="card">
      <table class="tbl">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in paginatedMembers" :key="m.id">
            <td class="td-name">{{ m.name }}</td>
            <td class="td-email">{{ m.email }}</td>
            <td>
              <span class="role-badge">{{ roleLabel(m.role) }}</span>
            </td>
            <td>
              <span class="status-badge" :class="m.is_active ? 'active' : 'inactive'">
                {{ m.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="td-date">{{ m.created_at }}</td>
            <td>
              <div class="action-row">
                <button
                  class="btn-icon"
                  :title="m.is_active ? 'Deactivate' : 'Activate'"
                  @click="toggleActive(m)"
                >
                  <svg
                    v-if="m.is_active"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <rect x="1" y="5" width="22" height="14" rx="7" />
                    <circle cx="16" cy="12" r="3" fill="currentColor" />
                  </svg>
                  <svg
                    v-else
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <rect x="1" y="5" width="22" height="14" rx="7" />
                    <circle cx="8" cy="12" r="3" fill="currentColor" />
                  </svg>
                </button>
                <button class="btn-icon" title="Reset Password" @click="confirmResetTemp(m)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </button>
                <button class="btn-icon btn-danger" title="Remove" @click="confirmRemove(m)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M9 6V4h6v2" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AppPagination
      v-model:page="teamPage"
      :total-pages="teamTotalPages"
      :total="members.length"
      :per-page="teamPerPage"
    />

    <!-- ── Create staff modal ─────────────────────────────── -->
    <div v-if="showCreate" class="modal-overlay" @click.self="showCreate = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Add Staff Member</h3>
          <button class="close-btn" @click="showCreate = false">✕</button>
        </div>
        <form @submit.prevent="submitCreate" class="modal-body">
          <div class="field">
            <label>Full Name</label>
            <input v-model="createForm.name" required placeholder="Alex Johnson" />
          </div>
          <div class="field">
            <label>Email Address</label>
            <input type="email" v-model="createForm.email" required placeholder="alex@gym.com" />
          </div>
          <div class="field">
            <label>Role</label>
            <select v-model="createForm.role" required>
              <option value="">Select a role…</option>
              <option v-for="r in GYM_ROLES" :key="r.name" :value="r.name">
                {{ r.label }}
              </option>
            </select>
          </div>
          <p v-if="createError" class="err-msg">{{ createError }}</p>
          <div class="modal-footer">
            <button type="button" class="btn-ghost" @click="showCreate = false">Cancel</button>
            <button type="submit" class="btn-primary" :disabled="createLoading">
              <span v-if="createLoading" class="spinner"></span>
              {{ createLoading ? 'Creating…' : 'Create Staff' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ── Temp password reveal ──────────────────────────── -->
    <div v-if="tempPwModal.show" class="modal-overlay">
      <div class="modal">
        <div class="modal-header"><h3>Staff Account Created</h3></div>
        <div class="modal-body">
          <div class="alert-info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Share this password with <strong>{{ tempPwModal.name }}</strong
            >. It won't be shown again.
          </div>
          <div class="pw-reveal">
            <span class="pw-text">{{ tempPwModal.password }}</span>
            <button class="copy-btn" @click="copyTempPw">
              {{ copiedPw ? '✓ Copied!' : 'Copy' }}
            </button>
          </div>
          <p class="pw-note">The staff member must set a new password on first login.</p>
        </div>
        <div class="modal-footer">
          <button class="btn-primary" @click="tempPwModal.show = false">I've Saved It</button>
        </div>
      </div>
    </div>

    <!-- ── Remove confirm ───────────────────────────────── -->
    <div v-if="removeModal.show" class="modal-overlay" @click.self="removeModal.show = false">
      <div class="modal modal-sm">
        <div class="modal-header">
          <h3>Remove Staff</h3>
          <button class="close-btn" @click="removeModal.show = false">✕</button>
        </div>
        <div class="modal-body">
          <p class="confirm-text">
            Remove <strong>{{ removeModal.name }}</strong
            >? This cannot be undone.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn-ghost" @click="removeModal.show = false">Cancel</button>
          <button class="btn-danger-solid" @click="submitRemove" :disabled="removeModal.loading">
            <span v-if="removeModal.loading" class="spinner"></span>
            {{ removeModal.loading ? 'Removing…' : 'Remove' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── Reset temp password confirm ─────────────────── -->
    <div v-if="resetModal.show" class="modal-overlay" @click.self="resetModal.show = false">
      <div class="modal modal-sm">
        <div class="modal-header">
          <h3>Reset Password</h3>
          <button class="close-btn" @click="resetModal.show = false">✕</button>
        </div>
        <div class="modal-body">
          <p class="confirm-text">
            Generate a new temporary password for <strong>{{ resetModal.name }}</strong
            >?
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn-ghost" @click="resetModal.show = false">Cancel</button>
          <button class="btn-primary" @click="submitResetTemp" :disabled="resetModal.loading">
            <span v-if="resetModal.loading" class="spinner"></span>
            {{ resetModal.loading ? 'Resetting…' : 'Reset' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AppPagination from '@/components/AppPagination.vue'

const auth = useAuthStore()

interface Member {
  id: number
  name: string
  email: string
  role: string
  is_active: boolean
  must_reset_password: boolean
  created_at: string
}

/* Static gym staff roles — permissions are managed by the admin */
const GYM_ROLES = [
  { name: 'gym_hr',        label: 'HR' },
  { name: 'gym_executive', label: 'Executive' },
  { name: 'gym_finance',   label: 'Finance' },
] as const

const members = ref<Member[]>([])
const loading = ref(false)

const teamPage     = ref(1)
const teamPerPage  = 10
const teamTotalPages  = computed(() => Math.max(1, Math.ceil(members.value.length / teamPerPage)))
const paginatedMembers = computed(() =>
  members.value.slice((teamPage.value - 1) * teamPerPage, teamPage.value * teamPerPage)
)

/* ── Fetch ──────────────────────────────────────────────── */
async function fetchMembers() {
  loading.value = true
  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/partner/team`, {
      headers: { Authorization: `Bearer ${auth.token}`, Accept: 'application/json' },
    })
    members.value = await res.json()
  } finally {
    loading.value = false
  }
}

onMounted(() => { fetchMembers() })

function roleLabel(roleName: string): string {
  return GYM_ROLES.find((r) => r.name === roleName)?.label ?? roleName
}

/* ── Create staff ───────────────────────────────────────── */
const showCreate = ref(false)
const createForm = ref({ name: '', email: '', role: '' })
const createError = ref('')
const createLoading = ref(false)
const tempPwModal = ref({ show: false, name: '', password: '' })
const copiedPw = ref(false)

function openCreate() {
  createForm.value = { name: '', email: '', role: '' }
  createError.value = ''
  showCreate.value = true
}

async function submitCreate() {
  createError.value = ''
  createLoading.value = true
  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/partner/team`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(createForm.value),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Failed to create staff.')
    showCreate.value = false
    tempPwModal.value = { show: true, name: data.user.name, password: data.temp_password }
    fetchMembers()
  } catch (e: any) {
    createError.value = e.message
  } finally {
    createLoading.value = false
  }
}

function copyTempPw() {
  navigator.clipboard.writeText(tempPwModal.value.password).catch(() => {})
  copiedPw.value = true
  setTimeout(() => {
    copiedPw.value = false
  }, 2000)
}

/* ── Toggle active ─────────────────────────────────────── */
async function toggleActive(m: Member) {
  await fetch(`${import.meta.env.VITE_API_BASE_URL}/partner/team/${m.id}/toggle-active`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${auth.token}`, Accept: 'application/json' },
  })
  fetchMembers()
}

/* ── Remove ────────────────────────────────────────────── */
const removeModal = ref({ show: false, id: 0, name: '', loading: false })
function confirmRemove(m: Member) {
  removeModal.value = { show: true, id: m.id, name: m.name, loading: false }
}
async function submitRemove() {
  removeModal.value.loading = true
  try {
    await fetch(`${import.meta.env.VITE_API_BASE_URL}/partner/team/${removeModal.value.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${auth.token}`, Accept: 'application/json' },
    })
    removeModal.value.show = false
    fetchMembers()
  } finally {
    removeModal.value.loading = false
  }
}

/* ── Reset temp password ───────────────────────────────── */
const resetModal = ref({ show: false, id: 0, name: '', loading: false })
function confirmResetTemp(m: Member) {
  resetModal.value = { show: true, id: m.id, name: m.name, loading: false }
}
async function submitResetTemp() {
  resetModal.value.loading = true
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/partner/team/${resetModal.value.id}/reset-temp`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${auth.token}`, Accept: 'application/json' },
      }
    )
    const data = await res.json()
    resetModal.value.show = false
    tempPwModal.value = { show: true, name: resetModal.value.name, password: data.temp_password }
    fetchMembers()
  } finally {
    resetModal.value.loading = false
  }
}

</script>

<style scoped>
/* ── Page ───────────────────────────────────────────────── */
.page {
  padding: 28px 32px;
  max-width: 1100px;
  margin: 0 auto;
  font-family: 'Inter', system-ui, sans-serif;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 28px;
}
.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px;
}
.page-sub {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

/* ── Buttons ────────────────────────────────────────────── */
.btn-primary {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 20px;
  background: #4cd964;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(76, 217, 100, 0.28);
}
.btn-primary svg {
  width: 16px;
  height: 16px;
}
.btn-primary:hover:not(:disabled) {
  background: #2eb84b;
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(76, 217, 100, 0.38);
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.btn-secondary svg {
  width: 16px;
  height: 16px;
}
.btn-secondary:hover {
  border-color: #4cd964;
  color: #4cd964;
  background: #ebfaee;
}

/* ── States ─────────────────────────────────────────────── */
.state-loading {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}
.state-empty {
  text-align: center;
  padding: 80px 0;
  color: #94a3b8;
  font-size: 0.9rem;
}

/* ── Table card ─────────────────────────────────────────── */
.card {
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05);
}
.tbl {
  width: 100%;
  border-collapse: collapse;
}
.tbl thead {
  background: #f8fafc;
}
.tbl th {
  padding: 13px 18px;
  text-align: left;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
  border-bottom: 1.5px solid #e2e8f0;
}
.tbl td {
  padding: 15px 18px;
  font-size: 0.875rem;
  color: #475569;
  border-top: 1px solid #f1f5f9;
}
.tbl tbody tr {
  background: #fff;
  transition: background 0.1s;
}
.tbl tbody tr:hover {
  background: #fdfaff;
}

.td-name {
  font-weight: 600;
  color: #0f172a;
}
.td-email {
  color: #64748b;
}
.td-date {
  color: #94a3b8;
  font-size: 0.82rem;
}

/* ── Badges ─────────────────────────────────────────────── */
.role-badge {
  display: inline-block;
  padding: 3px 11px;
  border-radius: 99px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: #ebfaee;
  color: #2eb84b;
}
.status-badge {
  display: inline-block;
  padding: 3px 11px;
  border-radius: 99px;
  font-size: 0.72rem;
  font-weight: 700;
}
.status-badge.active {
  background: #f0fdf4;
  color: #15803d;
}
.status-badge.inactive {
  background: #f1f5f9;
  color: #64748b;
}

/* ── Action icons ───────────────────────────────────────── */
.action-row {
  display: flex;
  gap: 6px;
}
.btn-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 7px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-icon svg {
  width: 14px;
  height: 14px;
}
.btn-icon:hover {
  border-color: #4cd964;
  color: #4cd964;
  background: #ebfaee;
}
.btn-icon.btn-danger:hover {
  border-color: #ef4444;
  color: #ef4444;
  background: #fef2f2;
}

/* ── Spinners ───────────────────────────────────────────── */
.spinner-lg {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #4cd964;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Roles section ──────────────────────────────────────── */
.section-divider {
  border: none;
  border-top: 1.5px solid #f1f5f9;
  margin: 36px 0 28px;
}
.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}
.section-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px;
}

.roles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}
.role-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  padding: 14px 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.15s, border-color 0.15s;
}
.role-card:hover {
  border-color: #b8f0c0;
  box-shadow: 0 4px 12px rgba(76, 217, 100, 0.08);
}
.role-card-icon {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ebfaee;
  border-radius: 9px;
  color: #4cd964;
}
.role-card-icon svg {
  width: 18px;
  height: 18px;
}
.role-card-body {
  flex: 1;
  min-width: 0;
}
.role-card-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.role-card-slug {
  font-size: 0.72rem;
  color: #94a3b8;
  font-family: monospace;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.system-badge {
  flex-shrink: 0;
  display: inline-block;
  padding: 3px 10px;
  background: #f1f5f9;
  border-radius: 99px;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
}
.role-del {
  flex-shrink: 0;
}

/* ── Modal ──────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
}
.modal {
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 18px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  animation: modalIn 0.2s ease;
}
.modal-sm {
  max-width: 400px;
}
@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 22px 0;
}
.modal-header h3 {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}
.close-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border: none;
  border-radius: 7px;
  color: #64748b;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.15s;
}
.close-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}
.modal-body {
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.modal-footer {
  padding: 16px 22px;
  border-top: 1.5px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* ── Form fields ────────────────────────────────────────── */
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
}
.field input,
.field select {
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  color: #0f172a;
  padding: 11px 14px;
  font-size: 0.9rem;
  transition: border-color 0.15s, box-shadow 0.15s;
  width: 100%;
  box-sizing: border-box;
}
.field input:focus,
.field select:focus {
  outline: none;
  border-color: #4cd964;
  box-shadow: 0 0 0 3px rgba(76, 217, 100, 0.12);
  background: #fff;
}
.field select {
  cursor: pointer;
}

.field-hint {
  font-size: 0.78rem;
  color: #94a3b8;
  margin-top: 2px;
}
.field-hint code {
  background: #f1f5f9;
  border-radius: 5px;
  padding: 1px 6px;
  font-size: 0.78rem;
  color: #475569;
}

.err-msg {
  background: #fef2f2;
  border: 1.5px solid #fca5a5;
  border-radius: 10px;
  color: #b91c1c;
  font-size: 0.875rem;
  padding: 11px 14px;
}

/* ── Ghost / danger ─────────────────────────────────────── */
.btn-ghost {
  padding: 10px 20px;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-ghost:hover {
  border-color: #94a3b8;
  color: #0f172a;
  background: #f8fafc;
}

.btn-danger-solid {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 20px;
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-danger-solid:hover:not(:disabled) {
  background: #dc2626;
}
.btn-danger-solid:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.confirm-text {
  color: #475569;
  font-size: 0.9rem;
  line-height: 1.65;
  margin: 0;
}
.confirm-text strong {
  color: #0f172a;
}

/* ── Alert / password ───────────────────────────────────── */
.alert-info {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #ebfaee;
  border: 1.5px solid #b8f0c0;
  border-radius: 10px;
  padding: 13px 15px;
  color: #1a9e38;
  font-size: 0.875rem;
}
.alert-info svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  margin-top: 1px;
}
.alert-info strong {
  color: #1a9e38;
}

.pw-reveal {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px 18px;
}
.pw-text {
  flex: 1;
  font-family: monospace;
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: #1a9e38;
}
.copy-btn {
  background: #ebfaee;
  border: 1.5px solid #b8f0c0;
  color: #1a9e38;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}
.copy-btn:hover {
  background: #4cd964;
  border-color: #4cd964;
  color: #fff;
}
.pw-note {
  font-size: 0.8rem;
  color: #94a3b8;
  margin: 0;
}
</style>
