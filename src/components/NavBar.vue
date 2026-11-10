<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

withDefaults(defineProps<{ theme?: 'gray' | 'green' | 'black' | 'white' }>(), { theme: 'gray' })

const route      = useRoute()
const router     = useRouter()
const isScrolled = ref(false)
const mobileOpen = ref(false)
const regOpen    = ref(false)
const regRef     = ref<HTMLElement | null>(null)

const onScroll = () => { isScrolled.value = window.scrollY > 10 }
const onDocClick = (e: MouseEvent) => {
  if (regRef.value && !regRef.value.contains(e.target as Node)) regOpen.value = false
}
onMounted(() => {
  window.addEventListener('scroll', onScroll)
  document.addEventListener('click', onDocClick)
})
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  document.removeEventListener('click', onDocClick)
})
watch(() => route.fullPath, () => { mobileOpen.value = false; regOpen.value = false })

const navLinks = [
  { label: 'For Employers',   to: '/for-employers' },
  { label: 'For Employees',   to: '/for-employees' },
  { label: 'For Partners',    to: '/for-partners' },
  { label: 'Plans', to: '/', hash: '#plans' },
  { label: 'How It Works',    to: '/', hash: '#how-it-works' },
]

const registerOptions = [
  { label: 'Register as Employer', hint: 'Enrol your company',          page: '/for-employers', form: '/signup/company' },
  { label: 'Register as Employee', hint: 'Join through your workplace', page: '/for-employees', form: '/signup/employee' },
  { label: 'Register as Partner',  hint: 'List your gym or facility',   page: '/for-partners',  form: '/signup/partner' },
]

// Like the inspiration, registering always passes through the audience page
// first; only from that page does "Register" open the actual form.
const regTarget = (opt: { page: string; form: string }) => (route.path === opt.page ? opt.form : opt.page)

function goSection(hash: string) {
  mobileOpen.value = false
  if (route.path === '/') {
    document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' })
  } else {
    router.push({ path: '/', hash })
  }
}
</script>

<template>
  <nav class="navbar" :class="[`navbar--${theme}`, { scrolled: isScrolled }]">
    <div class="nav-inner lp-container">
      <!-- Logo -->
      <RouterLink to="/" class="logo">
        <img src="/logo.png" alt="FitAccess" class="logo-img" />
        <span class="logo-text">FitAccess</span>
      </RouterLink>

      <!-- Desktop Links -->
      <ul class="nav-links">
        <li v-for="link in navLinks" :key="link.label">
          <a
            v-if="link.hash"
            :href="link.hash"
            class="nav-link"
            @click.prevent="goSection(link.hash)"
          >{{ link.label }}</a>
          <RouterLink v-else :to="link.to" class="nav-link" active-class="active">{{ link.label }}</RouterLink>
        </li>
      </ul>

      <!-- Actions -->
      <div class="nav-actions">
        <RouterLink to="/login" class="nav-login">Log in</RouterLink>
        <div ref="regRef" class="reg">
          <button
            type="button"
            class="lp-btn lp-btn--primary lp-btn--sm reg-btn"
            :aria-expanded="regOpen"
            aria-haspopup="true"
            @click="regOpen = !regOpen"
          >
            Register
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" :class="{ flip: regOpen }"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <div v-if="regOpen" class="reg-menu" role="menu">
            <RouterLink
              v-for="opt in registerOptions"
              :key="opt.page"
              :to="regTarget(opt)"
              class="reg-item"
              role="menuitem"
            >
              <strong>{{ opt.label }}</strong>
              <span>{{ opt.hint }}</span>
            </RouterLink>
          </div>
        </div>
      </div>

      <!-- Hamburger -->
      <button class="hamburger" @click="mobileOpen = !mobileOpen" aria-label="Toggle menu">
        <span :class="{ open: mobileOpen }"></span>
        <span :class="{ open: mobileOpen }"></span>
        <span :class="{ open: mobileOpen }"></span>
      </button>
    </div>

    <!-- Mobile Menu -->
    <div class="mobile-menu" :class="{ open: mobileOpen }">
      <ul>
        <li v-for="link in navLinks" :key="link.label">
          <a v-if="link.hash" class="mobile-link" :href="link.hash" @click.prevent="goSection(link.hash)">{{ link.label }}</a>
          <RouterLink v-else :to="link.to" class="mobile-link" active-class="active">{{ link.label }}</RouterLink>
        </li>
      </ul>
      <p class="mobile-label">Register</p>
      <div class="mobile-register">
        <RouterLink v-for="opt in registerOptions" :key="opt.page" :to="regTarget(opt)" class="lp-btn lp-btn--primary lp-btn--sm">
          {{ opt.label }}
        </RouterLink>
      </div>
      <RouterLink to="/login" class="lp-btn lp-btn--outline lp-btn--sm mobile-login">Log in</RouterLink>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: var(--lp-gray);
  transition: background-color .25s ease, box-shadow .25s ease;
}
.navbar--white { background: #ffffff; }
.navbar--green { background: var(--lp-green); }
.navbar--black { background: var(--lp-ink); }
.navbar--black:not(.scrolled) .logo,
.navbar--black:not(.scrolled) .nav-link,
.navbar--black:not(.scrolled) .nav-login { color: #fff; }
.navbar--black:not(.scrolled) .hamburger span { background: #fff; }
.navbar--green:not(.scrolled) .nav-link::after { background: var(--lp-ink); }
.navbar--green:not(.scrolled) .nav-login:hover { text-decoration-color: var(--lp-ink); }
.navbar--green:not(.scrolled) .reg-btn { background: var(--lp-ink); color: #fff; }
.navbar.scrolled {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(12px);
  box-shadow: 0 2px 20px rgba(11, 12, 16, 0.08);
}

.nav-inner {
  display: flex;
  align-items: center;
  gap: 32px;
  height: 84px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--lp-ink);
  flex-shrink: 0;
}
.logo-img { width: 36px; height: 36px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }

.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}
.nav-link {
  position: relative;
  display: inline-block;
  padding: 8px 12px;
  font-size: 0.97rem;
  font-weight: 600;
  color: var(--lp-ink);
  white-space: nowrap;
}
.nav-link::after {
  content: '';
  position: absolute;
  left: 12px; right: 12px; bottom: 2px;
  height: 4px;
  border-radius: 50rem;
  background: var(--lp-green);
  transform: scaleX(0);
  transition: transform .2s ease-out;
}
.nav-link:hover::after,
.nav-link.active::after { transform: scaleX(1); }

.nav-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.nav-login {
  font-size: 0.97rem;
  font-weight: 600;
  color: var(--lp-ink);
  padding: 8px 14px;
}
.nav-login:hover { text-decoration: underline; text-decoration-color: var(--lp-green); text-decoration-thickness: 3px; text-underline-offset: 6px; }

.reg { position: relative; }
.reg-btn svg { transition: transform .2s ease; }
.reg-btn svg.flip { transform: rotate(180deg); }
.reg-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 270px;
  padding: 8px;
  background: #fff;
  border-radius: 1.25rem;
  box-shadow: 0 16px 40px rgba(11, 12, 16, 0.16);
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.reg-item {
  display: flex;
  flex-direction: column;
  padding: 12px 14px;
  border-radius: 0.9rem;
  color: var(--lp-ink);
}
.reg-item strong { font-size: 0.95rem; }
.reg-item span { font-size: 0.82rem; }
.reg-item:hover { background: var(--lp-tint); }

.hamburger {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  padding: 4px;
  margin-left: auto;
}
.hamburger span {
  display: block;
  width: 24px; height: 2px;
  background: var(--lp-ink);
  border-radius: 2px;
  transition: transform .25s ease, opacity .25s ease;
}
.hamburger span.open:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
.hamburger span.open:nth-child(2) { opacity: 0; }
.hamburger span.open:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }

.mobile-menu {
  display: none;
  padding: 12px 24px 24px;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  flex-direction: column;
  gap: 8px;
}
.mobile-menu.open { display: flex; }
.mobile-link {
  display: block;
  padding: 12px 16px;
  font-size: 1rem;
  font-weight: 600;
  color: var(--lp-ink);
  border-radius: 12px;
}
.mobile-link:hover, .mobile-link.active { background: var(--lp-tint); }
.mobile-label { margin-top: 8px; font-size: 0.8rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; padding: 0 16px; }
.mobile-register { display: flex; flex-direction: column; gap: 8px; }
.mobile-login { margin-top: 4px; }

@media (max-width: 1080px) {
  .nav-links, .nav-actions { display: none; }
  .hamburger { display: flex; }
}
</style>
