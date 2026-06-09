<template>
  <div class="page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Permissions</h1>
        <p class="page-sub">Grant or revoke permissions for each admin role.</p>
      </div>
      <button class="btn-save" @click="savePermissions" :disabled="saving">
        <span v-if="saving" class="spinner"></span>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          <polyline points="17 21 17 13 7 13 7 21" />
          <polyline points="7 3 7 8 15 8" />
        </svg>
        {{ saving ? 'Saving…' : 'Save Changes' }}
      </button>
    </div>

    <!-- Save feedback -->
    <div v-if="saveMsg" class="save-toast" :class="saveOk ? 'toast-ok' : 'toast-err'">
      <svg v-if="saveOk" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {{ saveMsg }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="state-loading">
      <div class="spinner-lg"></div>
      <p>Loading permissions…</p>
    </div>

    <template v-else>
      <!-- Role legend -->
      <div class="role-legend">
        <div
          v-for="(role, idx) in editableRoles"
          :key="role.key"
          class="role-pill"
          :style="{
            background: pal(idx).bg,
            borderColor: pal(idx).accent + '66',
            color: pal(idx).text,
          }"
        >
          <span
            class="role-dot"
            :style="{ background: pal(idx).accent }"
          ></span>
          {{ role.label }}
        </div>
      </div>

      <!-- Permission groups -->
      <div v-for="group in groupedPermissions" :key="group.name" class="group-card">
        <!-- Group title bar -->
        <div class="group-title">
          <span class="group-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
          {{ group.name }}
          <span class="group-count"
            >{{ group.perms.length }} permission{{ group.perms.length !== 1 ? 's' : '' }}</span
          >
        </div>

        <!-- Column headers -->
        <div class="perm-row perm-head">
          <div class="perm-name-col">Permission</div>
          <div v-for="(role, rIdx) in editableRoles" :key="role.key" class="perm-role-col">
            <span
              class="head-role-badge"
              :style="{
                background: pal(rIdx).bg,
                color: pal(rIdx).text,
              }"
              >{{ role.label }}</span
            >
          </div>
        </div>

        <!-- Permission rows -->
        <div
          v-for="(perm, idx) in group.perms"
          :key="perm.name"
          class="perm-row"
          :class="{ 'perm-row-alt': idx % 2 === 1 }"
        >
          <div class="perm-name-col">
            <span class="perm-label">{{ perm.label }}</span>
            <span v-if="perm.description" class="perm-desc">{{ perm.description }}</span>
          </div>
          <div v-for="(role, rIdx) in editableRoles" :key="role.key" class="perm-role-col">
            <button
              class="toggle-btn"
              :class="{ on: hasRolePerm(role.key, perm.name) }"
              :style="
                hasRolePerm(role.key, perm.name)
                  ? {
                      background: pal(rIdx).accent,
                      borderColor: pal(rIdx).accent,
                      color: '#fff',
                    }
                  : {}
              "
              @click="toggleRolePerm(role.key, perm.name)"
              :title="hasRolePerm(role.key, perm.name) ? 'Revoke permission' : 'Grant permission'"
            >
              <svg
                v-if="hasRolePerm(role.key, perm.name)"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const PALETTE = [
  { accent: '#4CD964', bg: '#EBFAEE', text: '#1A9E38' },
  { accent: '#3b82f6', bg: '#eff6ff', text: '#1d4ed8' },
  { accent: '#f59e0b', bg: '#fffbeb', text: '#b45309' },
  { accent: '#8b5cf6', bg: '#f5f3ff', text: '#6d28d9' },
  { accent: '#ec4899', bg: '#fdf2f8', text: '#be185d' },
  { accent: '#14b8a6', bg: '#f0fdfa', text: '#0f766e' },
]
function pal(idx: number): { accent: string; bg: string; text: string } { return PALETTE[idx % PALETTE.length] ?? PALETTE[0]! }

interface Permission {
  name: string
  label: string
  group_name: string
  scope: string
  description?: string
}

interface RolePermissions {
  [role: string]: { role: string; permission_name: string }[]
}

const permissions = ref<Permission[]>([])
const rolePermissions = ref<RolePermissions>({})
const loading = ref(false)
const saving = ref(false)
const saveMsg = ref('')
const saveOk = ref(true)
const editableRoles = ref<{ key: string; label: string }[]>([])
const localGrants = ref<Record<string, Set<string>>>({})

async function fetchPermissions() {
  loading.value = true
  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/team/permissions`, {
      headers: { Authorization: `Bearer ${auth.token}`, Accept: 'application/json' },
    })
    const data = await res.json()
    permissions.value = data.permissions
    rolePermissions.value = data.role_permissions

    // Roles come from the server — fully dynamic
    editableRoles.value = data.roles ?? []

    const grants: Record<string, Set<string>> = {}
    for (const role of editableRoles.value) {
      const perms = (data.role_permissions[role.key] || []).map((p: any) => p.permission_name)
      grants[role.key] = new Set(perms)
    }
    localGrants.value = grants
  } finally {
    loading.value = false
  }
}

onMounted(fetchPermissions)

const groupedPermissions = computed(() => {
  const groups: Record<string, { name: string; perms: Permission[] }> = {}
  for (const p of permissions.value) {
    if (!groups[p.group_name]) groups[p.group_name] = { name: p.group_name, perms: [] }
    groups[p.group_name]!.perms.push(p)
  }
  return Object.values(groups)
})

function hasRolePerm(role: string, permName: string): boolean {
  return localGrants.value[role]?.has(permName) ?? false
}

function toggleRolePerm(role: string, permName: string) {
  if (!localGrants.value[role]) localGrants.value[role] = new Set()
  const set = localGrants.value[role]
  set.has(permName) ? set.delete(permName) : set.add(permName)
}

async function savePermissions() {
  saving.value = true
  saveMsg.value = ''
  try {
    for (const role of editableRoles.value) {
      await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/admin/team/permissions/roles/${role.key}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${auth.token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ permissions: [...(localGrants.value[role.key] ?? [])] }),
        }
      )
    }
    saveOk.value = true
    saveMsg.value = 'Permissions saved successfully.'
  } catch {
    saveOk.value = false
    saveMsg.value = 'Failed to save. Please try again.'
  } finally {
    saving.value = false
    setTimeout(() => {
      saveMsg.value = ''
    }, 3500)
  }
}
</script>

<style scoped>
/* ── Page shell ─────────────────────────────────────────── */
.page {
  padding: 28px 32px 48px;
  max-width: 960px;
  margin: 0 auto;
  font-family: 'Inter', system-ui, sans-serif;
}

/* ── Header ─────────────────────────────────────────────── */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
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

/* ── Save button ────────────────────────────────────────── */
.btn-save {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px;
  background: #4cd964;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s;
  box-shadow: 0 2px 8px rgba(76, 217, 100, 0.28);
  white-space: nowrap;
}
.btn-save svg {
  width: 16px;
  height: 16px;
}
.btn-save:hover:not(:disabled) {
  background: #2eb84b;
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(76, 217, 100, 0.38);
}
.btn-save:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* ── Toast ──────────────────────────────────────────────── */
.save-toast {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 11px 18px;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 20px;
  animation: fadeIn 0.2s ease;
}
.save-toast svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
.toast-ok {
  background: #f0fdf4;
  border: 1px solid #86efac;
  color: #15803d;
}
.toast-err {
  background: #fef2f2;
  border: 1px solid #fca5a5;
  color: #b91c1c;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ── Role legend ────────────────────────────────────────── */
.role-legend {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.role-pill {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 14px;
  border-radius: 99px;
  font-size: 0.8rem;
  font-weight: 600;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  color: #475569;
}

.role-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

/* role-pill colours are applied inline via PALETTE */

/* ── Group card ─────────────────────────────────────────── */
.group-card {
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05), 0 0 0 0 transparent;
  transition: box-shadow 0.2s;
}
.group-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

/* ── Group title bar ────────────────────────────────────── */
.group-title {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  background: linear-gradient(to right, #f8fafc, #fff);
  border-bottom: 1.5px solid #e2e8f0;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #374151;
}

.group-icon {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ebfaee;
  border-radius: 6px;
  color: #4cd964;
}
.group-icon svg {
  width: 14px;
  height: 14px;
}

.group-count {
  margin-left: auto;
  font-size: 0.72rem;
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 2px 10px;
  border-radius: 99px;
}

/* ── Permission rows ────────────────────────────────────── */
.perm-row {
  display: flex;
  align-items: center;
  padding: 0 20px;
  min-height: 54px;
  border-top: 1px solid #f1f5f9;
  transition: background 0.1s;
  overflow-x: auto;
}
.perm-row:hover:not(.perm-head) {
  background: #fafbff;
}
.perm-row-alt {
  background: #fafbff;
}
.perm-row-alt:hover {
  background: #f3f4ff !important;
}

.perm-head {
  border-top: none;
  background: #f8fafc;
  border-bottom: 1.5px solid #e2e8f0;
  min-height: 40px;
  padding: 0 20px;
}
.perm-head:hover {
  background: #f8fafc !important;
}

.perm-name-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.perm-role-col {
  min-width: 90px;
  max-width: 140px;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Head labels */
.head-role-badge {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 3px 12px;
  border-radius: 99px;
}
/* head-role-badge colours are applied inline via PALETTE */

/* Permission name + desc */
.perm-label {
  font-size: 0.88rem;
  color: #1e293b;
  font-weight: 500;
}
.perm-desc {
  font-size: 0.76rem;
  color: #94a3b8;
  line-height: 1.4;
}

/* ── Toggle button ──────────────────────────────────────── */
.toggle-btn {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  border: 2px solid #e2e8f0;
  background: #fff;
  color: #d1d5db;
  cursor: pointer;
  transition: all 0.15s;
}
.toggle-btn svg {
  width: 14px;
  height: 14px;
}

/* OFF hover */
.toggle-btn:hover:not(.on) {
  border-color: #94a3b8;
  color: #475569;
  background: #f8fafc;
}

/* ON state — colour applied inline; hover turns red to signal "click to revoke" */
.toggle-btn.on:hover {
  background: #ef4444 !important;
  border-color: #ef4444 !important;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}
.toggle-btn.on {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

/* ── Loading ─────────────────────────────────────────────── */
.state-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 100px 0;
  color: #94a3b8;
  font-size: 0.875rem;
}
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
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
