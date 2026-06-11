<template>
  <div class="partner-shell">

    <!-- ── Sidebar ──────────────────────────────────────────────── -->
    <aside class="sidebar" :class="{ 'sidebar--open': mobileOpen }">

      <!-- Logo -->
      <div class="sidebar-logo">
        <img src="/logo.png" alt="FitAccess" class="logo-img" />
        <div>
          <p class="logo-name">FitAccess</p>
          <p class="logo-sub">PARTNER</p>
        </div>
      </div>

      <!-- Gym chip -->
      <div class="gym-chip">
        <p class="chip-label">{{ auth.user?.role === 'gym_staff' ? 'GYM STAFF' : 'GYM PARTNER' }}</p>
        <p class="chip-name" :title="gymName">{{ gymName }}</p>
        <span class="chip-tier" :class="`tier--${gymTier}`">{{ tierLabel }}</span>
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign out
        </button>
      </div>
    </aside>

    <!-- Mobile overlay -->
    <div v-if="mobileOpen" class="mobile-overlay" @click="mobileOpen = false"></div>

    <!-- ── Main ─────────────────────────────────────────────────── -->
    <div class="main-wrap">
      <header class="top-bar">
        <button class="hamburger" @click="mobileOpen = !mobileOpen">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div class="top-bar-text">
          <h1 class="page-title">{{ currentTitle }}</h1>
          <p v-if="currentSubtitle" class="page-sub">{{ currentSubtitle }}</p>
        </div>
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

const mobileOpen = ref(false)
const gymName    = ref('Loading…')
const gymTier    = ref('')

onMounted(async () => {
  try {
    const res = await api.get<{ gym: { name: string; tier: string } }>('partner/dashboard')
    gymName.value = res.gym?.name ?? auth.user?.name ?? 'My Gym'
    gymTier.value = res.gym?.tier ?? ''
  } catch {
    gymName.value = auth.user?.name ?? 'My Gym'
  }
})

const tierLabel = computed(() => {
  const map: Record<string, string> = {
    basic: 'Basic',
    basic_plus: 'Basic Plus',
    premium: 'Premium',
    platinum: 'Platinum',
  }
  return map[gymTier.value] ?? gymTier.value ?? ''
})

const navItems = computed(() => {
  const all = [
    {
      name: 'dashboard',
      label: 'Dashboard',
      to: '/partner/dashboard',
      permission: 'gym.dashboard.view',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`,
    },
    {
      name: 'checkins',
      label: 'Check-ins',
      to: '/partner/checkins',
      permission: 'gym.checkins.view',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
    },
    {
      name: 'facility',
      label: 'Facility Info',
      to: '/partner/facility',
      permission: 'gym.facility.view',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    },
    {
      name: 'team',
      label: 'Staff',
      to: '/partner/team',
      permission: 'gym.team.view',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    },
    {
      name: 'settings',
      label: 'Settings',
      to: '/partner/settings',
      permission: null,
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    },
  ]

  return all.filter(item => item.permission === null || auth.hasPermission(item.permission))
})

const pageMeta: Record<string, { title: string; sub?: string }> = {
  'partner-dashboard': { title: 'Dashboard',      sub: 'Your gym performance overview' },
  'partner-checkins':  { title: 'Check-ins',      sub: 'All member visits to your gym' },
  'partner-facility':  { title: 'Facility Info',  sub: 'Your gym profile & details' },
  'partner-team':      { title: 'Staff',          sub: 'Manage check-in staff members' },
}

const currentTitle = computed(() => {
  if (route.name === 'partner-dashboard') return `Welcome, ${gymName.value.split(' ')[0]}`
  return pageMeta[route.name as string]?.title ?? 'Partner Portal'
})
const currentSubtitle = computed(() => pageMeta[route.name as string]?.sub ?? '')

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.partner-shell {
  display: flex;
  min-height: 100vh;
  background: #f0f2f5;
  font-family: 'Inter', system-ui, sans-serif;
}

/* ── Sidebar ───────────────────────────────────────────────────── */
.sidebar {
  width: 240px;
  min-height: 100vh;
  background:#0d1b2e;
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

/* Gym chip */
.gym-chip {
  padding: 14px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.chip-label { font-size: 0.65rem; color: #64748b; letter-spacing: 0.1em; margin: 0 0 3px; text-transform: uppercase; }
.chip-name  {
  font-size: 0.85rem; font-weight: 600; color: #e2e8f0; margin: 0 0 6px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.chip-tier {
  display: inline-block;
  font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.08em; padding: 2px 8px; border-radius: 20px;
}
.tier--basic        { background: rgba(100,116,139,0.2); color: #94a3b8; }
.tier--basic_plus   { background: rgba(59,130,246,0.2);  color: #60a5fa; }
.tier--premium      { background: rgba(76,217,100,0.2);  color: #34d399; }
.tier--platinum     { background: rgba(168,85,247,0.2);  color: #c084fc; }

/* Nav */
.sidebar-nav {
  flex: 1; padding: 12px 10px;
  display: flex; flex-direction: column; gap: 2px;
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
