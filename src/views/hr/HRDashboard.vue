<template>
  <div class="dashboard">

    <!-- ── Stats row ───────────────────────────────────────────── -->
    <section class="stats-row">
      <div class="stat-card">
        <div class="stat-icon teal">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <div class="stat-body">
          <p class="stat-key">TOTAL EMPLOYEES</p>
          <p class="stat-num">{{ loading ? '…' : stats.total_employees }}</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon teal">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="23 11 17 11 20 8"/></svg>
        </div>
        <div class="stat-body">
          <p class="stat-key">ACTIVE MEMBERS</p>
          <p class="stat-num">{{ loading ? '…' : stats.active_members }}</p>
          <p class="stat-hint">Currently active</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon purple">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="18" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="18" y2="13"/></svg>
        </div>
        <div class="stat-body">
          <p class="stat-key">SUSPENDED</p>
          <p class="stat-num">{{ loading ? '…' : stats.suspended_members }}</p>
        </div>
      </div>
    </section>

    <!-- ── Package Distribution ─────────────────────────────────── -->
    <div class="card">
      <div class="card-header">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
        <h3 class="card-title">Package Distribution</h3>
      </div>
      <div class="pkg-grid">
        <div class="pkg-card" v-for="p in packageCards" :key="p.label">
          <span class="pkg-badge" :class="'pkb-' + p.key">{{ p.label }}</span>
          <p class="pkg-num">{{ loading ? '…' : p.count }}</p>
          <p class="pkg-sub">employees</p>
        </div>
      </div>
    </div>

    <!-- ── Recent Registrations ─────────────────────────────────── -->
    <div class="card">
      <div class="card-header space-between">
        <h3 class="card-title no-margin">Recent Registrations</h3>
        <RouterLink to="/hr/employees" class="view-all">View all →</RouterLink>
      </div>

      <div v-if="loading" class="loading-msg">Loading…</div>
      <div v-else-if="!recent.length" class="empty-msg">No employees registered yet.</div>

      <ul v-else class="reg-list">
        <li v-for="r in recent" :key="r.id" class="reg-row">
          <div class="avatar" :style="{ background: avatarColor(r.name) }">
            {{ initials(r.name) }}
          </div>
          <div class="reg-info">
            <p class="reg-name">{{ r.name }}</p>
            <p class="reg-fan">{{ r.fan_number }}</p>
          </div>
          <div class="reg-right">
            <span class="pkg-badge" :class="'pkb-' + r.package">{{ tierLabel(r.package) }}</span>
            <span class="status-badge" :class="r.status === 'active' ? 'active' : 'inactive'">
              {{ r.status === 'active' ? 'Active' : r.status }}
            </span>
          </div>
        </li>
      </ul>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useApi } from '@/composables/useApi'

const api = useApi()

interface Stats { total_employees: number; active_members: number; suspended_members: number }
interface Pkg   { basic: number; basic_plus: number; platinum: number }
interface Reg   { id: number; name: string; fan_number: string; package: string; status: string; enrolled_at: string }

const stats   = ref<Stats>({ total_employees: 0, active_members: 0, suspended_members: 0 })
const pkgDist = ref<Pkg>({ basic: 0, basic_plus: 0, platinum: 0 })
const recent  = ref<Reg[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await api.get<{
      stats: Stats; package_distribution: Pkg; recent_registrations: Reg[]
    }>('hr/dashboard')
    stats.value   = res.stats
    pkgDist.value = res.package_distribution
    recent.value  = res.recent_registrations
  } finally {
    loading.value = false
  }
})

const packageCards = computed(() => [
  { key: 'basic',      label: 'Basic',      count: pkgDist.value.basic      },
  { key: 'basic_plus', label: 'Basic Plus', count: pkgDist.value.basic_plus },
  { key: 'platinum',   label: 'Platinum',   count: pkgDist.value.platinum   },
])

function tierLabel(t: string) {
  return { basic: 'Basic', basic_plus: 'Basic Plus', platinum: 'Platinum' }[t] ?? t
}

const COLORS = ['#3b82f6','#7c3aed','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899']
function avatarColor(name: string) {
  let h = 0; for (const c of (name ?? '')) h = (h * 31 + c.charCodeAt(0)) & 0xff
  return COLORS[h % COLORS.length]
}
function initials(name: string) {
  return (name ?? '').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}
</script>

<style scoped>
.dashboard { display: flex; flex-direction: column; gap: 20px; }

/* Stats */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.stat-card {
  background: white; border-radius: 14px; padding: 20px;
  display: flex; align-items: center; gap: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.stat-icon {
  width: 48px; height: 48px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.stat-icon.teal   { background: rgba(20,184,166,0.1); color: #14b8a6; }
.stat-icon.purple { background: rgba(124,58,237,0.1); color: #7c3aed; }
.stat-key  { font-size: 0.7rem; font-weight: 600; color: #94a3b8; letter-spacing: 0.08em; text-transform: uppercase; margin: 0 0 4px; }
.stat-num  { font-size: 2rem; font-weight: 800; color: #0f172a; margin: 0; line-height: 1; }
.stat-hint { font-size: 0.72rem; color: #94a3b8; margin: 4px 0 0; }

/* Cards */
.card { background: white; border-radius: 14px; padding: 22px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 18px; }
.card-header.space-between { justify-content: space-between; }
.card-title { font-size: 1rem; font-weight: 600; color: #0f172a; margin: 0; }
.card-title.no-margin { margin: 0; }
.view-all { font-size: 0.82rem; color: #14b8a6; text-decoration: none; font-weight: 500; }
.view-all:hover { text-decoration: underline; }

/* Package grid */
.pkg-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
.pkg-card {
  background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px;
  padding: 18px; text-align: center;
}
.pkg-badge {
  display: inline-block; padding: 4px 14px; border-radius: 20px;
  font-size: 0.78rem; font-weight: 600; margin-bottom: 12px;
}
.pkb-basic      { background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; }
.pkb-basic_plus { background: #d1fae5; color: #059669; border: 1px solid #a7f3d0; }
.pkb-platinum   { background: #ede9fe; color: #7c3aed; border: 1px solid #ddd6fe; }
.pkg-num { font-size: 2rem; font-weight: 800; color: #0f172a; margin: 0 0 4px; }
.pkg-sub { font-size: 0.75rem; color: #94a3b8; margin: 0; }

/* Registrations list */
.loading-msg, .empty-msg { color: #94a3b8; font-size: 0.85rem; padding: 24px 0; text-align: center; }
.reg-list { list-style: none; margin: 0; padding: 0; }
.reg-row {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 0; border-bottom: 1px solid #f1f5f9;
}
.reg-row:last-child { border-bottom: none; }
.avatar {
  width: 42px; height: 42px; border-radius: 50%;
  color: white; font-size: 0.8rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.reg-info  { flex: 1; min-width: 0; }
.reg-name  { font-size: 0.9rem; font-weight: 600; color: #0f172a; margin: 0 0 2px; }
.reg-fan   { font-size: 0.72rem; color: #94a3b8; font-family: monospace; margin: 0; }
.reg-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

.status-badge {
  display: inline-block; padding: 3px 10px; border-radius: 20px;
  font-size: 0.72rem; font-weight: 600;
}
.status-badge.active   { background: #d1fae5; color: #059669; border: 1px solid #a7f3d0; }
.status-badge.inactive { background: #fee2e2; color: #dc2626; }

@media (max-width: 700px) {
  .stats-row  { grid-template-columns: 1fr; }
  .pkg-grid   { grid-template-columns: 1fr; }
}
</style>
