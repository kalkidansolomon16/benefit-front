<template>
  <div class="page">

    <!-- Filters -->
    <div class="filter-bar">
      <input v-model="dateFrom" type="date" class="date-input" />
      <input v-model="dateTo"   type="date" class="date-input" />
      <select v-model="filterRole" class="select-box">
        <option value="">All roles</option>
        <option value="super_admin">Super Admin</option>
        <option value="fitaccess_admin">Admin</option>
        <option value="company_hr">Company</option>
        <option value="employee">Employee</option>
        <option value="gym_staff">Gym Staff</option>
      </select>
      <select v-model="filterAction" class="select-box">
        <option value="">All actions</option>
        <option value="created">Created</option>
        <option value="updated">Updated</option>
        <option value="deleted">Deleted</option>
      </select>
    </div>

    <div v-if="loading" class="state-msg">Loading activity log…</div>
    <div v-else-if="!filtered.length" class="state-msg">No activity entries found.</div>

    <div v-else class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>TIMESTAMP</th>
            <th>USER</th>
            <th>ROLE</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in filtered" :key="log.id">
            <td class="td-ts">{{ fmt(log.created_at) }}</td>
            <td class="td-user">{{ log.user?.name ?? 'System' }}</td>
            <td>
              <span class="role-badge" :class="'role-' + (log.user?.role ?? 'system')">
                {{ shortRole(log.user?.role) }}
              </span>
            </td>
            <td class="td-action">{{ actionLabel(log.action, log.model_type) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'

const api = useApi()

interface LogEntry {
  id: number; action: string; model_type: string; model_id: number; created_at: string
  user: { name: string; email: string; role: string } | null
}

const logs        = ref<LogEntry[]>([])
const loading     = ref(true)
const dateFrom    = ref('')
const dateTo      = ref('')
const filterRole  = ref('')
const filterAction = ref('')

onMounted(async () => {
  try {
    logs.value = await api.get<LogEntry[]>('dashboard/activity-log')
  } finally {
    loading.value = false
  }
})

const filtered = computed(() =>
  logs.value.filter(l => {
    if (filterRole.value   && l.user?.role !== filterRole.value) return false
    if (filterAction.value && l.action !== filterAction.value)   return false
    if (dateFrom.value) {
      const logDate = new Date(l.created_at)
      if (logDate < new Date(dateFrom.value)) return false
    }
    if (dateTo.value) {
      const logDate = new Date(l.created_at)
      if (logDate > new Date(dateTo.value + 'T23:59:59')) return false
    }
    return true
  })
)

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-ET', {
    month: 'numeric', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function shortRole(r?: string) {
  const map: Record<string, string> = {
    super_admin:     'super admin',
    fitaccess_admin: 'admin',
    company_hr:      'company',
    employee:        'employee',
    gym_staff:       'gym staff',
  }
  return r ? (map[r] ?? r) : 'system'
}

function actionLabel(action: string, modelType: string) {
  const model = modelType?.split('\\').pop() ?? modelType
  const labels: Record<string, string> = {
    Employee:   { created: 'Employee Registered',  updated: 'Employee Updated',  deleted: 'Employee Removed' },
    Checkin:    { created: 'Member Checked In',     updated: 'Check-in Updated',  deleted: 'Check-in Removed' },
    Membership: { created: 'Membership Created',    updated: 'Status Changed',    deleted: 'Membership Removed' },
    Company:    { created: 'Company Registered',    updated: 'Package Updated',   deleted: 'Company Removed' },
    Invoice:    { created: 'Invoice Generated',     updated: 'Invoice Updated',   deleted: 'Invoice Removed' },
    Gym:        { created: 'Gym Registered',        updated: 'Gym Updated',       deleted: 'Gym Removed' },
  }[model]?.[action]
  return labels ?? `${model} ${action}`
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }

.filter-bar { display: flex; gap: 10px; flex-wrap: wrap; }
.date-input, .select-box {
  padding: 9px 12px; background: white; border: 1px solid #e2e8f0;
  border-radius: 10px; font-size: 0.84rem; color: #0f172a; outline: none;
}
.date-input { color-scheme: light; }
.date-input:focus, .select-box:focus { border-color: #14b8a6; }

.state-msg { text-align: center; color: #94a3b8; padding: 48px; background: white; border-radius: 14px; }

.table-card { background: white; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }

.data-table { width: 100%; border-collapse: collapse; font-size: 0.84rem; }
.data-table th {
  padding: 12px 16px; text-align: left; font-size: 0.7rem; font-weight: 600;
  color: #94a3b8; letter-spacing: 0.06em; text-transform: uppercase;
  border-bottom: 1px solid #f1f5f9;
}
.data-table td { padding: 14px 16px; border-bottom: 1px solid #f8fafc; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td { background: #f8fafc; }

.td-ts     { font-size: 0.78rem; color: #64748b; white-space: nowrap; }
.td-user   { font-weight: 500; color: #0f172a; }
.td-action { color: #374151; }

/* Role badges */
.role-badge {
  display: inline-block; padding: 3px 10px; border-radius: 20px;
  font-size: 0.72rem; font-weight: 600; text-transform: lowercase;
}
.role-company_hr      { background: #fef9c3; color: #a16207; border: 1px solid #fde68a; }
.role-fitaccess_admin { background: #dbeafe; color: #1d4ed8; border: 1px solid #bfdbfe; }
.role-super_admin     { background: #ede9fe; color: #7c3aed; border: 1px solid #ddd6fe; }
.role-employee        { background: #d1fae5; color: #059669; border: 1px solid #a7f3d0; }
.role-gym_staff       { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
.role-system          { background: #f1f5f9; color: #64748b; }
</style>
