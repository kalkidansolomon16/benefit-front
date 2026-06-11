<template>
  <div class="hr-shell">

    <!-- ── Sidebar ─────────────────────────────────────────────── -->
    <aside class="sidebar" :class="{ 'sidebar--open': mobileOpen }">

      <!-- Logo -->
      <div class="sidebar-logo">
        <img src="/logo.png" alt="FitAccess" class="logo-img" />
        <div>
          <p class="logo-name">FitAccess</p>
          <p class="logo-sub">ETHIOPIA</p>
        </div>
      </div>

      <!-- Company chip -->
      <div class="company-chip">
        <p class="company-label">{{ hrRoleLabel }}</p>
        <p class="company-name" :title="companyName">{{ companyName }}</p>
      </div>

      <!-- Nav -->
      <nav class="sidebar-nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="item.to"
          class="nav-item"
          active-class="nav-item--active"
          @click="mobileOpen = false"
        >
          <span class="nav-icon" v-html="item.icon"></span>
          <span class="nav-label">{{ item.label }}</span>
        </RouterLink>
      </nav>

      <!-- Sign out -->
      <div class="sidebar-footer">
        <button class="signout-btn" @click="handleLogout">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sign out
        </button>
      </div>
    </aside>

    <!-- Mobile overlay -->
    <div v-if="mobileOpen" class="mobile-overlay" @click="mobileOpen = false"></div>

    <!-- ── Main ───────────────────────────────────────────────── -->
    <div class="main-wrap">
      <header class="top-bar">
        <button class="hamburger" @click="mobileOpen = !mobileOpen">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <div class="top-bar-text">
          <h1 class="page-title">{{ currentTitle }}</h1>
          <p v-if="currentSubtitle" class="page-sub">{{ currentSubtitle }}</p>
        </div>
        <!-- Register Employee shortcut on dashboard -->
        <RouterLink v-if="route.name === 'hr-dashboard' && auth.hasPermission('co.employees.manage')" to="/hr/register" class="btn-register">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
          Register Employee
        </RouterLink>
      </header>

      <main class="page-content">
        <RouterView />
      </main>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useApi } from '@/composables/useApi'

const auth   = useAuthStore()
const router = useRouter()
const route  = useRoute()
const api    = useApi()

const mobileOpen  = ref(false)
const companyName = ref('Loading…')

onMounted(async () => {
  try {
    const res = await api.get<{ name: string }>('hr/my-company')
    companyName.value = res.name
  } catch {
    companyName.value = 'Your Company'
  }
})

const navItems = computed(() => {
  const all = [
    {
      name: 'dashboard', label: 'Dashboard', to: '/hr/dashboard',
      permission: 'co.dashboard.view',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`,
    },
    {
      name: 'register', label: 'Register Employee', to: '/hr/register',
      permission: 'co.employees.register',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>`,
    },
    {
      name: 'employees', label: 'Employees', to: '/hr/employees',
      permission: 'co.employees.view',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    },
    {
      name: 'billing', label: 'Billing & Invoices', to: '/hr/billing',
      permission: 'co.billing.view',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
    },
    {
      name: 'team', label: 'Team', to: '/hr/team',
      permission: 'co.team.view',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    },
    {
      name: 'settings', label: 'Settings', to: '/hr/settings',
      permission: null,
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    },
  ]

  return all.filter(item => item.permission === null || auth.hasPermission(item.permission))
})

const pageMeta: Record<string, { title: string; sub?: string }> = {
  'hr-dashboard': { title: `Welcome, ${companyName.value}`, sub: 'Corporate membership overview' },
  'hr-register':  { title: 'Register Employee', sub: 'Add a new employee to the gym membership programme' },
  'hr-employees': { title: 'Employees' },
  'hr-billing':   { title: 'Billing & Invoices', sub: 'View invoices and submit payments' },
  'hr-team':      { title: 'Team Management', sub: 'Manage Finance and CEO sub-accounts' },
}

const currentTitle    = computed(() => {
  if (route.name === 'hr-dashboard') return `Welcome, ${companyName.value}`
  return pageMeta[route.name as string]?.title ?? 'HR Portal'
})
const currentSubtitle = computed(() => pageMeta[route.name as string]?.sub ?? '')

const hrRoleLabel = computed(() => {
  const map: Record<string, string> = {
    company_hr:      'HR',
    company_finance: 'FINANCE',
    company_ceo:     'CEO',
  }
  return map[auth.user?.role ?? ''] ?? 'COMPANY'
})

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.hr-shell {
  display: flex;
  min-height: 100vh;
  background: #f0f2f5;
  font-family: 'Inter', system-ui, sans-serif;
}

/* ── Sidebar ───────────────────────────────────────────────────── */
.sidebar {
  width: 240px;
  min-height: 100vh;
  background: #0d1b2e;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0; left: 0; bottom: 0;
  z-index: 100;
  overflow-y: auto;
}

.sidebar-logo {
  display: flex; align-items: center; gap: 12px;
  padding: 22px 20px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.logo-img  { width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0; object-fit: cover; }
.logo-name { font-size: 1rem; font-weight: 700; color: #fff; margin: 0; }
.logo-sub  { font-size: 0.65rem; color: #4CD964; letter-spacing: 0.12em; margin: 1px 0 0; text-transform: uppercase; }

/* Company chip */
.company-chip {
  padding: 14px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.company-label { font-size: 0.65rem; color: #64748b; letter-spacing: 0.1em; margin: 0 0 3px; text-transform: uppercase; }
.company-name  {
  font-size: 0.85rem; font-weight: 600; color: #e2e8f0; margin: 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* Nav */
.sidebar-nav {
  flex: 1; padding: 12px 10px;
  display: flex; flex-direction: column; gap: 2px;
}
.nav-item {
  display: flex; align-items: center; gap: 11px;
  padding: 10px 12px; border-radius: 8px;
  color: #64748b; text-decoration: none;
  font-size: 0.84rem; font-weight: 500;
  transition: color .15s, background .15s;
}
.nav-item:hover { color: #94a3b8; background: rgba(255,255,255,0.04); }
.nav-item--active { color: #4CD964; background: rgba(76,217,100,0.08); }
.nav-icon { flex-shrink: 0; display: flex; align-items: center; }
.nav-label { white-space: nowrap; }

/* Footer */
.sidebar-footer { padding: 14px 10px; border-top: 1px solid rgba(255,255,255,0.06); }
.signout-btn {
  display: flex; align-items: center; gap: 10px; width: 100%;
  padding: 10px 12px; background: transparent; border: none;
  border-radius: 8px; color: #64748b; font-size: 0.84rem; cursor: pointer;
  transition: color .15s, background .15s;
}
.signout-btn:hover { color: #f87171; background: rgba(239,68,68,0.08); }

/* Mobile overlay */
.mobile-overlay {
  display: none; position: fixed; inset: 0;
  background: rgba(0,0,0,0.5); z-index: 99;
}

/* ── Main ──────────────────────────────────────────────────────── */
.main-wrap {
  flex: 1; margin-left: 240px;
  display: flex; flex-direction: column; min-width: 0;
}

.top-bar {
  display: flex; align-items: flex-start;
  padding: 28px 32px 0;
  background: #f0f2f5;
  gap: 12px;
}
.hamburger {
  display: none; background: none; border: none;
  color: #475569; cursor: pointer; padding: 4px; border-radius: 6px; flex-shrink: 0;
}
.top-bar-text { flex: 1; }
.page-title { font-size: 1.6rem; font-weight: 700; color: #0f172a; margin: 0 0 2px; }
.page-sub   { font-size: 0.82rem; color: #94a3b8; margin: 0; }

.btn-register {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 18px; background: #4CD964; color: white;
  border: none; border-radius: 10px; font-size: 0.84rem; font-weight: 600;
  text-decoration: none; flex-shrink: 0; margin-top: 2px;
  transition: opacity .15s;
}
.btn-register:hover { opacity: .85; }

.page-content {
  flex: 1; padding: 20px 32px 32px;
}

/* Responsive */
@media (max-width: 900px) {
  .sidebar { transform: translateX(-100%); transition: transform .25s; }
  .sidebar--open { transform: translateX(0); }
  .mobile-overlay { display: block; }
  .main-wrap { margin-left: 0; }
  .hamburger { display: block; }
}
</style>
