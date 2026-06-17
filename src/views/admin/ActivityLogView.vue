<template>
  <div class="page">

    <!-- Filters -->
    <div class="filter-bar">
      <div class="date-wrap">
        <input v-model="dateFrom" type="date" class="date-input" placeholder="From date" @change="page = 1" />
        <svg class="date-icon" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      </div>
      <div class="date-wrap">
        <input v-model="dateTo" type="date" class="date-input" placeholder="To date" @change="page = 1" />
        <svg class="date-icon" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      </div>
      <select v-model="filterRole" class="select-box" @change="page = 1">
        <option value="">All roles</option>
        <option value="super_admin">Super Admin</option>
        <option value="fitaccess_admin">Admin</option>
        <option value="company_hr">Company</option>
        <option value="employee">Employee</option>
        <option value="gym_staff">Gym Staff</option>
      </select>
      <select v-model="filterAction" class="select-box" @change="page = 1">
        <option value="">All actions</option>
        <option value="created">Created</option>
        <option value="updated">Updated</option>
        <option value="deleted">Deleted</option>
      </select>
      <span class="count-label">{{ filtered.length }} entries</span>
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
          <tr v-for="log in paginated" :key="log.id">
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

    <AppPagination
      v-model:page="page"
      :total-pages="totalPages"
      :total="filtered.length"
      :per-page="perPage"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useApi } from '@/composables/useApi'
import AppPagination from '@/components/AppPagination.vue'

const api = useApi()

interface LogEntry {
  id: number; action: string; model_type: string; model_id: number; created_at: string
  user: { name: string; email: string; role: string } | null
}

const logs         = ref<LogEntry[]>([])
const loading      = ref(true)
const dateFrom     = ref('')
const dateTo       = ref('')
const filterRole   = ref('')
const filterAction = ref('')

const page    = ref(1)
const perPage = 10

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

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))
const paginated  = computed(() => filtered.value.slice((page.value - 1) * perPage, page.value * perPage))

// Reset page when filters change
watch(filtered, () => { page.value = 1 })

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
  const labels: Record<string, string> | undefined = ({
    Employee:   { created: 'Employee Registered',  updated: 'Employee Updated',  deleted: 'Employee Removed' },
    Checkin:    { created: 'Member Checked In',     updated: 'Check-in Updated',  deleted: 'Check-in Removed' },
    Membership: { created: 'Membership Created',    updated: 'Status Changed',    deleted: 'Membership Removed' },
    Company:    { created: 'Company Registered',    updated: 'Package Updated',   deleted: 'Company Removed' },
    Invoice:    { created: 'Invoice Generated',     updated: 'Invoice Updated',   deleted: 'Invoice Removed' },
    Gym:        { created: 'Gym Registered',        updated: 'Gym Updated',       deleted: 'Gym Removed' },
  } as Record<string, Record<string, string>>)[model]
  return labels?.[action] ?? `${model} ${action}`
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }

.filter-bar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.count-label { font-size: 0.82rem; color: #94a3b8; margin-left: auto; white-space: nowrap; }
.select-box {
  padding: 9px 12px; background: white; border: 1px solid #e2e8f0;
  border-radius: 10px; font-size: 0.84rem; color: #0f172a; outline: none;
}
.select-box:focus { border-color: #4CD964; }
.date-wrap { position: relative; }
.date-input {
  padding: 9px 38px 9px 13px; background: white; border: 1.5px solid #e2e8f0;
  border-radius: 10px; font-size: 0.84rem; color: #0f172a; outline: none;
  font-family: inherit; cursor: pointer; color-scheme: light;
  transition: border-color .15s, box-shadow .15s;
}
.date-input:focus { border-color: #4CD964; box-shadow: 0 0 0 3px rgba(76,217,100,0.1); }
.date-icon {
  position: absolute; right: 11px; top: 50%; transform: translateY(-50%);
  color: #94a3b8; pointer-events: none;
}
.date-input::-webkit-calendar-picker-indicator {
  opacity: 0; cursor: pointer; position: absolute; right: 0; top: 0; width: 38px; height: 100%;
}

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

.role-badge {
  display: inline-block; padding: 3px 10px; border-radius: 20px;
  font-size: 0.72rem; font-weight: 600; text-transform: lowercase;
}
.role-company_hr      { background: #fef9c3; color: #a16207; border: 1px solid #fde68a; }
.role-fitaccess_admin { background: #EBFAEE; color: #2EB84B; border: 1px solid #B8F0C0; }
.role-super_admin     { background: #ede9fe; color: #2EB84B; border: 1px solid #B8F0C0; }
.role-employee        { background: #d1fae5; color: #2EB84B; border: 1px solid #a7f3d0; }
.role-gym_staff       { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
.role-system          { background: #f1f5f9; color: #64748b; }
</style>
