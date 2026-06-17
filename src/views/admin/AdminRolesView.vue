<template>
  <div class="roles-page">

    <!-- Scope tabs -->
    <div class="scope-tabs">
      <button class="scope-tab" :class="{ active: scope === 'company' }" @click="switchScope('company')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
        Company Roles
      </button>
      <button class="scope-tab" :class="{ active: scope === 'gym' }" @click="switchScope('gym')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>
        Gym Roles
      </button>
    </div>

    <!-- Entity selector -->
    <div class="selector-row">
      <div class="select-wrap">
        <select v-model="selectedId" @change="fetchRoles" :disabled="loading || entities.length === 0">
          <option value="">— Select a {{ scope === 'company' ? 'company' : 'gym' }} —</option>
          <option v-for="e in entities" :key="e.id" :value="e.id">{{ e.name }}</option>
        </select>
      </div>
    </div>

    <!-- No selection -->
    <div v-if="!selectedId" class="empty-state">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
      <p>Select a {{ scope === 'company' ? 'company' : 'gym' }} to manage its roles.</p>
    </div>

    <template v-else>
      <!-- Role list -->
      <div class="card">
        <div class="card-header">
          <h3>Roles</h3>
          <span class="count">{{ roles.length }} total</span>
        </div>

        <div v-if="loadingRoles" class="loading-row">Loading…</div>

        <div v-else-if="roles.length === 0" class="empty-list">No roles yet.</div>

        <div v-else class="role-list">
          <div v-for="r in roles" :key="r.id" class="role-row">
            <div class="role-info">
              <span class="role-label">{{ r.label }}</span>
              <span class="role-name">{{ r.name }}</span>
              <span v-if="r.is_system" class="badge-system">System</span>
              <span v-else class="badge-custom">Custom</span>
            </div>
            <button
              v-if="!r.is_system"
              class="btn-delete"
              :disabled="deletingId === r.id"
              @click="deleteRole(r)"
              title="Delete role"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </div>
        </div>

        <!-- Add role form -->
        <div class="add-role">
          <input
            v-model="newLabel"
            type="text"
            placeholder="New role name (e.g. Operations Manager)"
            maxlength="80"
            @keyup.enter="addRole"
          />
          <button class="btn-add" :disabled="!newLabel.trim() || saving" @click="addRole">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Role
          </button>
        </div>
      </div>

      <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
    </template>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const API  = import.meta.env.VITE_API_BASE_URL

interface Entity { id: number; name: string }
interface Role   { id: number; name: string; label: string; is_system: boolean }

const scope      = ref<'company' | 'gym'>('company')
const entities   = ref<Entity[]>([])
const selectedId = ref<number | ''>('')
const roles      = ref<Role[]>([])
const newLabel   = ref('')
const loading    = ref(false)
const loadingRoles = ref(false)
const saving     = ref(false)
const deletingId = ref<number | null>(null)
const errorMsg   = ref('')

const headers = () => ({ Authorization: `Bearer ${auth.token}`, Accept: 'application/json', 'Content-Type': 'application/json' })

async function fetchEntities() {
  loading.value = true
  errorMsg.value = ''
  try {
    const url  = scope.value === 'company' ? `${API}/companies?per_page=500` : `${API}/gyms?per_page=500`
    const res  = await fetch(url, { headers: headers() })
    const data = await res.json()
    // companies returns { data: [...] } (paginated), gyms may return array
    entities.value = (data.data ?? data).map((e: any) => ({ id: e.id, name: e.name }))
  } catch {
    errorMsg.value = 'Failed to load entities.'
  } finally {
    loading.value = false
  }
}

async function fetchRoles() {
  if (!selectedId.value) return
  loadingRoles.value = true
  errorMsg.value = ''
  roles.value = []
  try {
    const base = scope.value === 'company' ? 'companies' : 'gyms'
    const res  = await fetch(`${API}/${base}/${selectedId.value}/roles`, { headers: headers() })
    roles.value = await res.json()
  } catch {
    errorMsg.value = 'Failed to load roles.'
  } finally {
    loadingRoles.value = false
  }
}

async function addRole() {
  const label = newLabel.value.trim()
  if (!label || !selectedId.value) return
  saving.value = true
  errorMsg.value = ''
  try {
    const base = scope.value === 'company' ? 'companies' : 'gyms'
    const res  = await fetch(`${API}/${base}/${selectedId.value}/roles`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ label }),
    })
    const data = await res.json()
    if (!res.ok) { errorMsg.value = data.message || 'Failed to create role.'; return }
    roles.value.push(data.role)
    newLabel.value = ''
  } catch {
    errorMsg.value = 'Failed to create role.'
  } finally {
    saving.value = false
  }
}

async function deleteRole(role: Role) {
  if (!confirm(`Delete role "${role.label}"? Users with this role will keep it but it won't be assignable.`)) return
  deletingId.value = role.id
  errorMsg.value = ''
  try {
    const base = scope.value === 'company' ? 'companies' : 'gyms'
    const res  = await fetch(`${API}/${base}/${selectedId.value}/roles/${role.id}`, {
      method: 'DELETE',
      headers: headers(),
    })
    if (!res.ok) { const d = await res.json(); errorMsg.value = d.message || 'Failed to delete.'; return }
    roles.value = roles.value.filter(r => r.id !== role.id)
  } catch {
    errorMsg.value = 'Failed to delete role.'
  } finally {
    deletingId.value = null
  }
}

function switchScope(s: 'company' | 'gym') {
  scope.value = s
  selectedId.value = ''
  roles.value = []
  errorMsg.value = ''
  fetchEntities()
}

onMounted(() => fetchEntities())
</script>

<style scoped>
.roles-page { display: flex; flex-direction: column; gap: 20px; max-width: 700px; }

/* Scope tabs */
.scope-tabs { display: flex; gap: 10px; }
.scope-tab {
  display: flex; align-items: center; gap: 7px;
  padding: 9px 18px; border-radius: 10px; border: 1.5px solid #e2e8f0;
  background: #fff; font-size: 0.875rem; font-weight: 500; color: #64748b;
  cursor: pointer; transition: all 0.15s;
}
.scope-tab.active { border-color: #4CD964; color: #16a34a; background: #f0fdf4; }

/* Selector */
.selector-row { display: flex; gap: 12px; align-items: center; }
.select-wrap { flex: 1; }
.select-wrap select {
  width: 100%; padding: 10px 14px; border-radius: 9px;
  border: 1.5px solid #e2e8f0; background: #f8fafc;
  font-size: 0.875rem; color: #0f172a; cursor: pointer;
}
.select-wrap select:focus { outline: none; border-color: #4CD964; }

/* Empty state */
.empty-state {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 48px 0; color: #94a3b8; text-align: center;
}
.empty-state p { font-size: 0.9rem; }

/* Card */
.card { background: #fff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; }
.card-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid #f1f5f9;
}
.card-header h3 { font-size: 0.95rem; font-weight: 600; color: #0f172a; margin: 0; }
.count { font-size: 0.75rem; color: #94a3b8; background: #f1f5f9; padding: 2px 8px; border-radius: 20px; }

.loading-row, .empty-list { padding: 24px 20px; color: #94a3b8; font-size: 0.875rem; text-align: center; }

/* Role list */
.role-list { display: flex; flex-direction: column; }
.role-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 20px; border-bottom: 1px solid #f1f5f9;
}
.role-row:last-child { border-bottom: none; }
.role-info { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.role-label { font-size: 0.875rem; font-weight: 600; color: #0f172a; }
.role-name { font-size: 0.75rem; color: #94a3b8; font-family: monospace; }
.badge-system {
  font-size: 0.7rem; padding: 2px 8px; border-radius: 20px;
  background: #f1f5f9; color: #64748b; font-weight: 600;
}
.badge-custom {
  font-size: 0.7rem; padding: 2px 8px; border-radius: 20px;
  background: #eff6ff; color: #3b82f6; font-weight: 600;
}
.btn-delete {
  padding: 6px; border-radius: 7px; border: 1px solid #fee2e2;
  background: #fff5f5; color: #ef4444; cursor: pointer; display: flex;
  transition: background 0.15s;
}
.btn-delete:hover { background: #fee2e2; }
.btn-delete:disabled { opacity: 0.4; cursor: not-allowed; }

/* Add role form */
.add-role {
  display: flex; gap: 10px; padding: 14px 20px;
  border-top: 1px solid #f1f5f9; background: #fafafa;
}
.add-role input {
  flex: 1; padding: 9px 12px; border-radius: 8px;
  border: 1.5px solid #e2e8f0; font-size: 0.875rem;
  background: #fff; color: #0f172a;
}
.add-role input:focus { outline: none; border-color: #4CD964; }
.btn-add {
  display: flex; align-items: center; gap: 6px;
  padding: 9px 16px; border-radius: 8px; border: none;
  background: #4CD964; color: #fff; font-size: 0.875rem; font-weight: 600;
  cursor: pointer; white-space: nowrap; transition: background 0.15s;
}
.btn-add:hover { background: #3ab554; }
.btn-add:disabled { opacity: 0.5; cursor: not-allowed; }

.error-msg { color: #ef4444; font-size: 0.85rem; }
</style>
