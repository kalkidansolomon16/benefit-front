<template>
  <div class="admin-shell">

    <!-- ── Sidebar ─────────────────────────────────────────────── -->
    <aside class="sidebar" :class="{ 'sidebar--open': mobileOpen }">

      <!-- Logo -->
      <div class="sidebar-logo">
        <div class="logo-circle">F</div>
        <div>
          <p class="logo-name">FitAccess</p>
          <p class="logo-sub">ETHIOPIA</p>
        </div>
      </div>

      <!-- User chip -->
      <div class="user-chip">
        <p class="user-role-label">ADMIN</p>
        <p class="user-email">{{ auth.user?.email ?? 'admin@fitaccess.et' }}</p>
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
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <h1 class="page-title">{{ currentTitle }}</h1>
        <p v-if="currentSubtitle" class="page-sub">{{ currentSubtitle }}</p>
      </header>

      <main class="page-content">
        <RouterView />
      </main>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth   = useAuthStore()
const router = useRouter()
const route  = useRoute()
const mobileOpen = ref(false)

const navItems = [
  {
    name: 'dashboard', label: 'Dashboard', to: '/admin/dashboard',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`,
  },
  {
    name: 'companies', label: 'Companies', to: '/admin/companies',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  },
  {
    name: 'gyms', label: 'Gyms', to: '/admin/gyms',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>`,
  },
  {
    name: 'employees', label: 'All Employees', to: '/admin/employees',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  },
  {
    name: 'plans', label: 'Plans', to: '/admin/plans',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  },
  {
    name: 'attendance', label: 'Attendance Report', to: '/admin/attendance',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  },
  {
    name: 'activity', label: 'Activity Log', to: '/admin/activity',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  },
]

const pageMeta: Record<string, { title: string; sub?: string }> = {
  'admin-dashboard':  { title: 'Dashboard' },
  'admin-companies':  { title: 'Companies' },
  'admin-gyms':       { title: 'Gyms' },
  'admin-employees':  { title: 'All Employees' },
  'admin-plans':      { title: 'Membership Plans', sub: 'Create and manage subscription plans' },
  'admin-attendance': { title: 'Attendance Report', sub: 'Gym check-in analytics by period' },
  'admin-activity':   { title: 'Activity Log', sub: 'Immutable record of all system actions' },
}

const currentTitle    = computed(() => pageMeta[route.name as string]?.title    ?? 'Admin')
const currentSubtitle = computed(() => pageMeta[route.name as string]?.sub      ?? '')

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<style scoped>
/* ── Shell ─────────────────────────────────────────────────────── */
.admin-shell {
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
  overflow-x: hidden;
}

/* Logo */
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 22px 20px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.logo-circle {
  width: 36px; height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #14b8a6, #3b82f6);
  color: #fff;
  font-weight: 800;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.logo-name { font-size: 1rem; font-weight: 700; color: #fff; margin: 0; }
.logo-sub  { font-size: 0.65rem; color: #14b8a6; letter-spacing: 0.12em; margin: 1px 0 0; text-transform: uppercase; }

/* User chip */
.user-chip {
  padding: 14px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.user-role-label { font-size: 0.65rem; color: #64748b; letter-spacing: 0.1em; margin: 0 0 3px; text-transform: uppercase; }
.user-email      { font-size: 0.78rem; color: #e2e8f0; margin: 0; word-break: break-all; }

/* Nav */
.sidebar-nav {
  flex: 1;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px 12px;
  border-radius: 8px;
  color: #64748b;
  text-decoration: none;
  font-size: 0.84rem;
  font-weight: 500;
  transition: color 0.15s, background 0.15s;
}
.nav-item:hover { color: #94a3b8; background: rgba(255,255,255,0.04); }
.nav-item--active { color: #14b8a6; background: rgba(20,184,166,0.08); }
.nav-icon { flex-shrink: 0; display: flex; align-items: center; }
.nav-label { white-space: nowrap; }

/* Footer / sign out */
.sidebar-footer {
  padding: 14px 10px;
  border-top: 1px solid rgba(255,255,255,0.06);
}
.signout-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #64748b;
  font-size: 0.84rem;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}
.signout-btn:hover { color: #f87171; background: rgba(239,68,68,0.08); }

/* Mobile overlay */
.mobile-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 99;
}

/* ── Main ──────────────────────────────────────────────────────── */
.main-wrap {
  flex: 1;
  margin-left: 240px;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.top-bar {
  padding: 28px 32px 0;
  background: #f0f2f5;
}
.hamburger {
  display: none;
  background: none; border: none;
  color: #475569; cursor: pointer;
  margin-bottom: 8px;
}
.page-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 2px;
}
.page-sub {
  font-size: 0.82rem;
  color: #94a3b8;
  margin: 0 0 20px;
}

.page-content {
  flex: 1;
  padding: 20px 32px 32px;
}

/* ── Responsive ────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .sidebar { transform: translateX(-100%); transition: transform 0.25s; }
  .sidebar--open { transform: translateX(0); }
  .mobile-overlay { display: block; }
  .main-wrap { margin-left: 0; }
  .hamburger { display: block; }
}
</style>
