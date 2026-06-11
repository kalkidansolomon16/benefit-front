<template>
  <div class="admin-shell">

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

      <!-- User chip -->
      <div class="user-chip">
        <p class="user-role-label">{{ roleLabel }}</p>
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
          <span v-if="item.badge && item.badge > 0" class="nav-badge">{{ item.badge }}</span>
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
        <div class="top-bar-text">
          <h1 class="page-title">{{ currentTitle }}</h1>
          <p v-if="currentSubtitle" class="page-sub">{{ currentSubtitle }}</p>
        </div>

        <!-- Notification bell -->
        <div class="notif-wrap" v-click-outside="() => notifOpen = false">
          <button class="notif-btn" @click="toggleNotif" :class="{ active: notifOpen }">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span v-if="unreadCount > 0" class="notif-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
          </button>

          <!-- Dropdown -->
          <Transition name="notif-drop">
            <div v-if="notifOpen" class="notif-dropdown">
              <div class="notif-header">
                <span class="notif-title">Notifications</span>
                <button v-if="unreadCount > 0" class="notif-read-all" @click="markAllRead">Mark all read</button>
              </div>

              <div v-if="notifsLoading" class="notif-loading">Loading…</div>

              <div v-else-if="!notifications.length" class="notif-empty">
                <svg width="28" height="28" fill="none" stroke="#cbd5e1" stroke-width="1.5" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                <p>No notifications</p>
              </div>

              <div v-else class="notif-list">
                <div
                  v-for="n in notifications"
                  :key="n.id"
                  class="notif-item"
                  :class="{ unread: n.is_unread }"
                  @click="handleNotifClick(n)"
                >
                  <div class="notif-icon" :class="'notif-icon--' + n.type">
                    <svg v-if="n.type === 'invoice_request'" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                    <svg v-else-if="n.type === 'gym_upgrade_request'" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><polyline points="8 12 12 8 16 12"/></svg>
                    <svg v-else width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  </div>
                  <div class="notif-body">
                    <p class="notif-item-title">{{ n.title }}</p>
                    <p class="notif-item-msg">{{ n.message }}</p>
                    <p class="notif-item-time">{{ timeAgo(n.created_at) }}</p>
                  </div>
                  <div v-if="n.is_unread" class="notif-dot"></div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </header>

      <main class="page-content">
        <RouterView />
      </main>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useApi } from '@/composables/useApi'

const auth   = useAuthStore()
const router = useRouter()
const route  = useRoute()
const api    = useApi()
const mobileOpen = ref(false)
const pendingApprovals = ref(0)

// ── Notifications ────────────────────────────────────────────
interface Notif {
  id: number; type: string; title: string; message: string
  data: Record<string, unknown> | null; is_unread: boolean; created_at: string
}

const notifOpen     = ref(false)
const notifsLoading = ref(false)
const notifications = ref<Notif[]>([])
const unreadCount   = ref(0)
let   pollTimer: ReturnType<typeof setInterval> | null = null

async function fetchNotifications() {
  notifsLoading.value = true
  try {
    const res = await api.get<{ data: Notif[]; unread_count: number }>('notifications')
    notifications.value = res.data
    unreadCount.value   = res.unread_count
  } catch { /* non-critical */ } finally {
    notifsLoading.value = false
  }
}

async function fetchUnreadCount() {
  try {
    const res = await api.get<{ unread_count: number }>('notifications/unread-count')
    unreadCount.value = res.unread_count
  } catch { /* non-critical */ }
}

async function toggleNotif() {
  notifOpen.value = !notifOpen.value
  if (notifOpen.value) await fetchNotifications()
}

async function markAllRead() {
  await api.post('notifications/read-all')
  notifications.value.forEach(n => n.is_unread = false)
  unreadCount.value = 0
}

async function handleNotifClick(n: Notif) {
  if (n.is_unread) {
    await api.post(`notifications/${n.id}/read`)
    n.is_unread = false
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  }
  notifOpen.value = false
  // Navigate based on type
  if (n.type === 'invoice_request') {
    const d = n.data as Record<string, unknown>
    const companyId  = d?.company_id
    const employeeId = d?.employee_id
    if (companyId) {
      const q = employeeId
        ? `company_id=${companyId}&employee_id=${employeeId}`
        : `company_id=${companyId}`
      router.push(`/admin/billing/invoices?${q}`)
    } else {
      router.push('/admin/billing/invoices')
    }
  } else if (n.type === 'gym_upgrade_request') {
    router.push('/admin/gyms?tab=upgrades')
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// Click-outside directive
const vClickOutside = {
  mounted(el: HTMLElement, binding: { value: () => void }) {
    (el as HTMLElement & { _clickOutside: (e: Event) => void })._clickOutside = (e: Event) => {
      if (!el.contains(e.target as Node)) binding.value()
    }
    document.addEventListener('click', (el as HTMLElement & { _clickOutside: (e: Event) => void })._clickOutside)
  },
  unmounted(el: HTMLElement) {
    document.removeEventListener('click', (el as HTMLElement & { _clickOutside: (e: Event) => void })._clickOutside)
  },
}

onMounted(async () => {
  try {
    const res = await api.get<{ total: number }>('employees/pending-admin-approval')
    pendingApprovals.value = res.total ?? 0
  } catch { /* non-critical */ }

  // Fetch initial unread count, then poll every 60s
  await fetchUnreadCount()
  pollTimer = setInterval(fetchUnreadCount, 60000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})

const navItems = computed(() => {
  const all = [
    {
      name: 'dashboard', label: 'Dashboard', to: '/admin/dashboard',
      permission: 'dashboard.view',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`,
    },
    {
      name: 'companies', label: 'Companies', to: '/admin/companies',
      permission: 'companies.view',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    },
    {
      name: 'gyms', label: 'Gyms', to: '/admin/gyms',
      permission: 'gyms.view',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>`,
    },
    {
      name: 'employees', label: 'All Employees', to: '/admin/employees',
      permission: 'employees.view',
      badge: 0,
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    },
    {
      name: 'employee-approvals', label: 'Employee Approvals', to: '/admin/employee-approvals',
      permission: 'employee_approvals.view',
      get badge() { return pendingApprovals.value },
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>`,
    },
    {
      name: 'plans', label: 'Plans', to: '/admin/plans',
      permission: 'plans.view',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
    },
    {
      name: 'memberships', label: 'Memberships', to: '/admin/memberships',
      permission: 'memberships.view',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`,
    },
    {
      name: 'attendance', label: 'Attendance Report', to: '/admin/attendance',
      permission: 'reports.view',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
    },
    {
      name: 'activity', label: 'Activity Log', to: '/admin/activity',
      permission: 'activity_log.view',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    },
    {
      name: 'billing-invoices', label: 'Invoices', to: '/admin/billing/invoices',
      permission: 'billing.view',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
    },
    {
      name: 'billing-payment-methods', label: 'Payment Methods', to: '/admin/billing/payment-methods',
      permission: 'payment_methods.view',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    },
    {
      name: 'team', label: 'Team', to: '/admin/team',
      permission: 'team.view',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    },
    {
      name: 'permissions', label: 'Permissions', to: '/admin/permissions',
      permission: 'permissions.view',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    },
    {
      name: 'settings', label: 'Settings', to: '/admin/settings',
      permission: null,
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    },
  ]

  return all.filter(item => item.permission === null || auth.hasPermission(item.permission))
})

const pageMeta: Record<string, { title: string; sub?: string }> = {
  'admin-dashboard':  { title: 'Dashboard' },
  'admin-companies':  { title: 'Companies' },
  'admin-gyms':       { title: 'Gyms' },
  'admin-employees':  { title: 'All Employees' },
  'admin-plans':        { title: 'Membership Plans', sub: 'Create and manage subscription plans' },
  'admin-memberships':  { title: 'Memberships', sub: 'Assign and manage employee gym memberships' },
  'admin-attendance':         { title: 'Attendance Report', sub: 'Gym check-in analytics by period' },
  'admin-activity':           { title: 'Activity Log', sub: 'Immutable record of all system actions' },
  'admin-billing-invoices':   { title: 'Billing Invoices', sub: 'Generate and manage company invoices' },
  'admin-billing-payments':   { title: 'Payment Receipts', sub: 'Review and verify company payments' },
  'admin-payment-methods':    { title: 'Payment Methods', sub: 'Manage bank accounts for company payments' },
  'admin-team':               { title: 'Team Management', sub: 'Manage Finance and Support sub-users' },
  'admin-permissions':        { title: 'Permissions', sub: 'Grant or revoke permissions for admin roles' },
  'admin-employee-approvals': { title: 'Employee Approvals', sub: 'Final approval for HR-approved employees' },
  'admin-settings':           { title: 'Settings', sub: 'Account preferences and integrations' },
}

const currentTitle    = computed(() => pageMeta[route.name as string]?.title ?? 'Admin')
const currentSubtitle = computed(() => pageMeta[route.name as string]?.sub    ?? '')

const roleLabel = computed(() => {
  const map: Record<string, string> = {
    super_admin:    'SUPER ADMIN',
    fitaccess_admin:'ADMIN',
    admin_finance:  'FINANCE',
    admin_support:  'SUPPORT',
  }
  return map[auth.user?.role ?? ''] ?? 'ADMIN'
})

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
.logo-img  { width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0; object-fit: cover; }
.logo-name { font-size: 1rem; font-weight: 700; color: #fff; margin: 0; }
.logo-sub  { font-size: 0.65rem; color: #4CD964; letter-spacing: 0.12em; margin: 1px 0 0; text-transform: uppercase; }

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
.nav-item--active { color: #4CD964; background: rgba(76,217,100,0.08); }
.nav-icon  { flex-shrink: 0; display: flex; align-items: center; }
.nav-label { white-space: nowrap; flex: 1; }
.nav-badge {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 18px; height: 18px; padding: 0 5px;
  background: #ef4444; color: #fff; border-radius: 99px;
  font-size: 0.68rem; font-weight: 700; line-height: 1;
}

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
  display: flex; align-items: flex-start; gap: 12px;
  padding: 28px 32px 0;
  background: #f0f2f5;
}
.top-bar-text { flex: 1; }
.hamburger {
  display: none;
  background: none; border: none;
  color: #475569; cursor: pointer; padding: 4px; border-radius: 6px; flex-shrink: 0;
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

/* ── Notification bell ─────────────────────────────────────────── */
.notif-wrap {
  position: relative;
  flex-shrink: 0;
  margin-top: 4px;
}
.notif-btn {
  position: relative;
  width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  background: white; border: 1.5px solid #e2e8f0; border-radius: 10px;
  color: #64748b; cursor: pointer;
  transition: border-color .15s, color .15s, box-shadow .15s;
}
.notif-btn:hover, .notif-btn.active {
  border-color: #4CD964; color: #2EB84B;
  box-shadow: 0 0 0 3px rgba(76,217,100,0.12);
}
.notif-badge {
  position: absolute; top: -6px; right: -6px;
  min-width: 18px; height: 18px; padding: 0 4px;
  background: #ef4444; color: #fff;
  border-radius: 99px; font-size: 0.65rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid #f0f2f5;
  line-height: 1;
}

/* Dropdown */
.notif-dropdown {
  position: absolute; top: calc(100% + 10px); right: 0;
  width: 360px; max-height: 480px;
  background: white; border-radius: 14px;
  border: 1.5px solid #e2e8f0;
  box-shadow: 0 16px 48px rgba(0,0,0,0.14);
  display: flex; flex-direction: column;
  z-index: 200; overflow: hidden;
}
.notif-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px 12px;
  border-bottom: 1px solid #f1f5f9;
}
.notif-title    { font-size: 0.9rem; font-weight: 700; color: #0f172a; }
.notif-read-all {
  font-size: 0.78rem; color: #4CD964; font-weight: 600;
  background: none; border: none; cursor: pointer; padding: 0;
}
.notif-read-all:hover { color: #2EB84B; }

.notif-loading, .notif-empty {
  padding: 32px 16px; text-align: center;
  color: #94a3b8; font-size: 0.85rem;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
}

.notif-list { overflow-y: auto; flex: 1; }
.notif-item {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 13px 16px; cursor: pointer;
  border-bottom: 1px solid #f8fafc;
  transition: background .12s;
}
.notif-item:hover { background: #f8fafc; }
.notif-item.unread { background: #f0fdf4; }
.notif-item.unread:hover { background: #dcfce7; }

.notif-icon {
  width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.notif-icon--invoice_request     { background: #EBFAEE; color: #2EB84B; }
.notif-icon--gym_upgrade_request { background: #fef3c7; color: #b45309; }
.notif-icon--default              { background: #f1f5f9; color: #64748b; }

.notif-body { flex: 1; min-width: 0; }
.notif-item-title { font-size: 0.84rem; font-weight: 700; color: #0f172a; margin: 0 0 3px; }
.notif-item-msg   { font-size: 0.78rem; color: #475569; margin: 0 0 5px; line-height: 1.5; }
.notif-item-time  { font-size: 0.72rem; color: #94a3b8; margin: 0; }

.notif-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #4CD964; flex-shrink: 0; margin-top: 4px;
}

/* Dropdown animation */
.notif-drop-enter-active { transition: all .2s cubic-bezier(.34,1.56,.64,1); }
.notif-drop-leave-active { transition: all .15s ease; }
.notif-drop-enter-from, .notif-drop-leave-to { opacity: 0; transform: translateY(-8px) scale(0.97); }

/* ── Responsive ────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .sidebar { transform: translateX(-100%); transition: transform 0.25s; }
  .sidebar--open { transform: translateX(0); }
  .mobile-overlay { display: block; }
  .main-wrap { margin-left: 0; }
  .hamburger { display: block; }
  .notif-dropdown { width: calc(100vw - 32px); right: -16px; }
}
</style>
