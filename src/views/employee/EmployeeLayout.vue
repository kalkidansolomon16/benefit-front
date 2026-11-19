<template>
  <div class="ep-shell">
    <!-- Sidebar -->
    <aside class="ep-side" :class="{ open: mobileOpen }" aria-label="Employee navigation">
      <RouterLink to="/employee/dashboard" class="ep-logo" @click="mobileOpen = false">
        <img src="/logo.png" alt="" />
        <span>FitAccess</span>
      </RouterLink>

      <nav class="ep-nav">
        <RouterLink
          v-for="item in mainNav"
          :key="item.to"
          :to="item.to"
          class="ep-link"
          active-class="active"
          @click="mobileOpen = false"
        >
          <span class="ep-ico" v-html="item.icon"></span>
          {{ item.label }}
        </RouterLink>
      </nav>

      <nav class="ep-nav ep-nav--bottom">
        <RouterLink
          v-for="item in bottomNav"
          :key="item.to"
          :to="item.to"
          class="ep-link"
          active-class="active"
          @click="mobileOpen = false"
        >
          <span class="ep-ico" v-html="item.icon"></span>
          {{ item.label }}
        </RouterLink>
        <button type="button" class="ep-link" @click="handleLogout">
          <span class="ep-ico" v-html="ICONS.logout"></span>
          Logout
        </button>
      </nav>
    </aside>

    <div v-if="mobileOpen" class="ep-overlay" @click="mobileOpen = false"></div>

    <div class="ep-main">
      <header class="ep-topbar">
        <button type="button" class="ep-burger" aria-label="Open menu" @click="mobileOpen = true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
        </button>
        <RouterLink to="/employee/dashboard" class="ep-logo small">
          <img src="/logo.png" alt="" />
          <span>FitAccess</span>
        </RouterLink>
      </header>

      <!-- Notifications (also emailed): bell top-right + pop-up after sign-in -->
      <div class="ep-bell"><NotificationBell /></div>

      <main class="ep-content">
        <div v-if="portal.loading.value && !portal.data.value" class="ep-state">
          <span class="ep-spinner" aria-hidden="true"></span>
          Loading your portal…
        </div>
        <div v-else-if="portal.error.value && !portal.data.value" class="ep-state error">
          {{ portal.error.value }}
          <button type="button" class="ep-retry" @click="portal.load(true)">Try again</button>
        </div>
        <RouterView v-else />
      </main>
    </div>

    <CardLockModal />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useEmployeePortal } from '@/composables/useEmployeePortal'
import CardLockModal from '@/components/employee/CardLockModal.vue'
import NotificationBell from '@/components/NotificationBell.vue'

const auth = useAuthStore()
const router = useRouter()
const portal = useEmployeePortal()
const mobileOpen = ref(false)

onMounted(() => portal.load())

const svg = (d: string) =>
  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`

const ICONS = {
  start: svg('<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'),
  cards: svg('<rect x="2.5" y="5" width="19" height="14" rx="2"/><rect x="5.5" y="9" width="5" height="4" rx=".5"/><path d="M13.5 9.5h5M13.5 12.5h5M5.5 16h13"/>'),
  gyms: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>'),
  trainings: svg('<rect x="6" y="6" width="15" height="13" rx="2"/><path d="M3 15V5a2 2 0 0 1 2-2h11"/><path d="m12 10 4 2.5-4 2.5z"/>'),
  news: svg('<path d="M6 3h9l5 5v13H6z"/><path d="M14 3v6h6M9 13h8M9 17h8"/>'),
  visits: svg('<path d="M8 2v3M16 2v3"/><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 15l2 2 4-4"/>'),
  help: svg('<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01"/>'),
  account: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  logout: svg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'),
}

const mainNav = [
  { label: 'Start', to: '/employee/dashboard', icon: ICONS.start },
  { label: 'Cards', to: '/employee/cards', icon: ICONS.cards },
  { label: 'Gyms', to: '/employee/gyms', icon: ICONS.gyms },
  { label: 'Trainings', to: '/employee/trainings', icon: ICONS.trainings },
  { label: 'News', to: '/employee/news', icon: ICONS.news },
  { label: 'Visits', to: '/employee/checkins', icon: ICONS.visits },
]
const bottomNav = [
  { label: 'Help', to: '/employee/help', icon: ICONS.help },
  { label: 'My account', to: '/employee/settings', icon: ICONS.account },
]

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.ep-shell {
  --ep-bg: #f7f8f5;
  --ep-ink: #1f2937;
  --ep-muted: #6b7280;
  display: flex; min-height: 100vh; background: var(--ep-bg);
  font-family: var(--font-body); color: var(--ep-ink);
}

/* Sidebar */
.ep-side {
  position: fixed; inset: 0 auto 0 0; z-index: 100; width: 232px; box-sizing: border-box;
  background: #fff; border-right: 1px solid #eef0ea; padding: 22px 16px;
  display: flex; flex-direction: column; gap: 26px; overflow-y: auto;
}
.ep-logo { display: inline-flex; align-items: center; gap: 9px; text-decoration: none; padding: 0 8px; }
.ep-logo img { width: 30px; height: 30px; border-radius: 9px; }
.ep-logo span { font-family: var(--font-heading); font-weight: 800; font-size: 22px; color: #0b0c10; letter-spacing: -0.02em; }
.ep-logo.small span { font-size: 18px; }
.ep-nav { display: flex; flex-direction: column; gap: 4px; }
.ep-nav--bottom { margin-top: auto; }
.ep-link {
  display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 12px;
  color: #4b5563; text-decoration: none; font-size: 15px; font-weight: 500; font-family: inherit;
  background: none; border: none; cursor: pointer; text-align: left; width: 100%;
  transition: background 0.15s, color 0.15s;
}
.ep-link:hover { background: #f5f7f0; color: #0b0c10; }
.ep-link.active { background: #eef9dc; color: #0b0c10; font-weight: 600; }
.ep-link.active .ep-ico { color: #4d7c0f; }
.ep-ico { display: flex; color: #6b7280; }

/* Main */
.ep-main { flex: 1; min-width: 0; margin-left: 232px; display: flex; flex-direction: column; position: relative; }
.ep-bell { position: absolute; top: 32px; right: 40px; z-index: 50; }
@media (max-width: 900px) { .ep-bell { top: 12px; right: 16px; } }
.ep-topbar { display: none; }
.ep-content { padding: 40px 48px 64px; width: 100%; max-width: 1320px; box-sizing: border-box; }
.ep-state { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 80px 0; color: var(--ep-muted); }
.ep-state.error { flex-direction: column; color: #dc2626; }
.ep-retry { border: 1.5px solid #0b0c10; background: #fff; border-radius: 12px; padding: 10px 18px; font-weight: 600; cursor: pointer; font-family: inherit; }
.ep-spinner { width: 22px; height: 22px; border-radius: 50%; border: 3px solid #e5e7eb; border-top-color: #8be000; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.ep-overlay { display: none; }

@media (max-width: 900px) {
  .ep-side { transform: translateX(-100%); transition: transform 0.25s ease; box-shadow: 0 0 40px rgba(0, 0, 0, 0.15); }
  .ep-side.open { transform: none; }
  .ep-overlay { display: block; position: fixed; inset: 0; z-index: 99; background: rgba(11, 12, 16, 0.35); }
  .ep-main { margin-left: 0; }
  .ep-topbar {
    display: flex; align-items: center; gap: 12px; position: sticky; top: 0; z-index: 50;
    padding: 12px 16px; background: #fff; border-bottom: 1px solid #eef0ea;
  }
  .ep-burger { border: none; background: none; padding: 4px; cursor: pointer; color: #0b0c10; display: flex; }
  .ep-content { padding: 24px 16px 48px; }
}
</style>
