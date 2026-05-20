<template>
  <div class="page">

    <div class="page-actions">
      <p class="count-label">{{ meta?.total ?? employees.length }} total</p>
      <button class="btn-export" @click="exportCsv">↓ Export CSV</button>
    </div>

    <!-- Search + filters -->
    <div class="filter-bar">
      <input v-model="search" class="search-box" placeholder="Search name or FAN…" />
      <select v-model="filterTier" class="select-box">
        <option value="">All packages</option>
        <option value="basic">Basic</option>
        <option value="basic_plus">Basic Plus</option>
        <option value="platinum">Platinum</option>
      </select>
      <select v-model="filterStatus" class="select-box">
        <option value="">All status</option>
        <option value="enrolled">Active</option>
        <option value="not_enrolled">Inactive</option>
      </select>
    </div>

    <div v-if="loading" class="state-msg">Loading employees…</div>
    <div v-else-if="!filtered.length" class="state-msg">No employees found.</div>

    <!-- Table -->
    <div v-else class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>NAME</th>
            <th>COMPANY</th>
            <th>FAN NUMBER</th>
            <th>PACKAGE</th>
            <th>STATUS</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in filtered" :key="e.id">
            <td class="td-name">{{ e.user?.name ?? '—' }}</td>
            <td class="td-muted">{{ e.company?.name ?? '—' }}</td>
            <td class="td-fan">{{ e.fan_number ?? '—' }}</td>
            <td>
              <span class="pkg-badge" :class="'pkg-' + (e.company?.tier ?? 'basic')">
                {{ tierLabel(e.company?.tier) }}
              </span>
            </td>
            <td>
              <span class="status-badge" :class="e.is_enrolled ? 'enrolled' : 'not'">
                {{ e.is_enrolled ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td>
              <button
                v-if="e.is_enrolled && e.active_membership_id"
                class="action-link suspend"
                @click="suspendMembership(e)"
              >Suspend</button>
              <span v-else class="action-none">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="meta && meta.last_page > 1" class="pagination">
      <button :disabled="page <= 1"             @click="page--; load()" class="pg-btn">‹ Prev</button>
      <span class="pg-info">{{ page }} / {{ meta.last_page }}</span>
      <button :disabled="page >= meta.last_page" @click="page++; load()" class="pg-btn">Next ›</button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'

const api = useApi()

interface Employee {
  id: number
  fan_number: string | null
  is_enrolled: boolean
  active_membership_id: number | null
  user?:    { name: string; email: string; phone: string | null }
  company?: { name: string; tier: string }
}
interface Meta { current_page: number; last_page: number; total: number }

const employees   = ref<Employee[]>([])
const loading     = ref(true)
const search      = ref('')
const filterTier  = ref('')
const filterStatus = ref('')
const page        = ref(1)
const meta        = ref<Meta | null>(null)

async function load() {
  loading.value = true
  try {
    const res = await api.get<{ data: Employee[]; meta: Meta }>(`employees?page=${page.value}&per_page=20`)
    employees.value = res.data ?? []
    meta.value      = res.meta ?? null
  } finally {
    loading.value = false
  }
}

onMounted(load)

const filtered = computed(() =>
  employees.value.filter(e => {
    const q = search.value.toLowerCase()
    if (q) {
      const name = e.user?.name?.toLowerCase() ?? ''
      const fan  = e.fan_number?.toLowerCase() ?? ''
      if (!name.includes(q) && !fan.includes(q)) return false
    }
    if (filterTier.value && e.company?.tier !== filterTier.value) return false
    if (filterStatus.value === 'enrolled'     && !e.is_enrolled) return false
    if (filterStatus.value === 'not_enrolled' &&  e.is_enrolled) return false
    return true
  })
)

function tierLabel(t?: string) {
  return { basic: 'Basic', basic_plus: 'Basic Plus', platinum: 'Platinum' }[t ?? ''] ?? 'Basic'
}

async function suspendMembership(e: Employee) {
  if (!e.active_membership_id) return
  try {
    await api.post(`memberships/${e.active_membership_id}/suspend`)
    e.is_enrolled = false
    e.active_membership_id = null
  } catch (err: unknown) {
    alert((err as Error).message)
  }
}

function exportCsv() {
  const rows = [
    ['Name', 'Email', 'Company', 'FAN Number', 'Package', 'Status'],
    ...employees.value.map(e => [
      e.user?.name ?? '', e.user?.email ?? '', e.company?.name ?? '',
      e.fan_number ?? '', tierLabel(e.company?.tier), e.is_enrolled ? 'Active' : 'Inactive',
    ]),
  ]
  const csv  = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const a    = document.createElement('a')
  a.href     = URL.createObjectURL(blob)
  a.download = `employees_${new Date().toISOString().slice(0,10)}.csv`
  a.click()
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }

.page-actions { display: flex; align-items: center; justify-content: space-between; }
.count-label  { font-size: 0.85rem; color: #94a3b8; margin: 0; }
.btn-export   {
  padding: 9px 18px; background: #14b8a6; color: white;
  border: none; border-radius: 10px; font-size: 0.84rem; font-weight: 600;
  cursor: pointer; transition: opacity .15s;
}
.btn-export:hover { opacity: .85; }

.filter-bar { display: flex; gap: 10px; flex-wrap: wrap; }
.search-box {
  flex: 1; min-width: 280px; padding: 9px 14px;
  background: white; border: 1px solid #e2e8f0; border-radius: 10px;
  font-size: 0.875rem; color: #0f172a; outline: none;
}
.search-box:focus { border-color: #14b8a6; box-shadow: 0 0 0 3px rgba(20,184,166,0.1); }
.select-box {
  padding: 8px 12px; background: white; border: 1px solid #e2e8f0;
  border-radius: 10px; color: #64748b; font-size: 0.82rem; outline: none; cursor: pointer;
}
.select-box:focus { border-color: #14b8a6; }

.state-msg { text-align: center; color: #94a3b8; padding: 48px; background: white; border-radius: 14px; }

.table-card { background: white; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }

.data-table { width: 100%; border-collapse: collapse; font-size: 0.84rem; }
.data-table th {
  padding: 12px 16px; text-align: left; font-size: 0.7rem; font-weight: 600;
  color: #94a3b8; letter-spacing: 0.06em; text-transform: uppercase;
  border-bottom: 1px solid #f1f5f9; background: white;
}
.data-table td { padding: 14px 16px; border-bottom: 1px solid #f8fafc; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td { background: #f8fafc; }

.td-name  { font-weight: 600; color: #0f172a; }
.td-muted { color: #64748b; }
.td-fan   { font-family: monospace; font-size: 0.8rem; color: #94a3b8; letter-spacing: 0.03em; }

.pkg-badge {
  display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 600;
}
.pkg-basic      { background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; }
.pkg-basic_plus { background: #d1fae5; color: #059669; border: 1px solid #a7f3d0; }
.pkg-platinum   { background: #ede9fe; color: #7c3aed; border: 1px solid #ddd6fe; }

.status-badge {
  display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 600;
}
.status-badge.enrolled { background: #d1fae5; color: #059669; border: 1px solid #a7f3d0; }
.status-badge.not      { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }

.action-link {
  background: none; border: none; font-size: 0.82rem; font-weight: 600; cursor: pointer; padding: 0;
}
.action-link.suspend { color: #ef4444; }
.action-link.suspend:hover { text-decoration: underline; }
.action-none { color: #cbd5e1; font-size: 0.82rem; }

.pagination { display: flex; align-items: center; gap: 12px; justify-content: center; }
.pg-btn {
  padding: 6px 14px; background: white; border: 1px solid #e2e8f0;
  border-radius: 8px; color: #64748b; font-size: 0.8rem; cursor: pointer;
}
.pg-btn:disabled { opacity: .4; cursor: default; }
.pg-btn:not(:disabled):hover { border-color: #14b8a6; color: #14b8a6; }
.pg-info { font-size: 0.8rem; color: #94a3b8; }
</style>
