<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

const router     = useRouter()
const isScrolled = ref(false)
const mobileOpen = ref(false)

const onScroll = () => { isScrolled.value = window.scrollY > 20 }
onMounted(() => window.addEventListener('scroll', onScroll))
onUnmounted(() => window.removeEventListener('scroll', onScroll))

const navLinks = [
  { label: 'Plans & Pricing', href: '#plans',        route: null },
  { label: 'How It Works',    href: '#how-it-works', route: null },
  { label: 'For Companies',   href: null,             route: '/signup/company' },
  { label: 'For Employees',   href: null,             route: '/signup/employee' },
  { label: 'For Partners',    href: null,             route: '/signup/partner' },
]

function handleNavClick(link: { href: string | null; route: string | null }) {
  mobileOpen.value = false
  if (link.route) {
    router.push(link.route)
  } else if (link.href) {
    const el = document.querySelector(link.href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
    else window.location.hash = link.href
  }
}
</script>

<template>
  <nav class="navbar" :class="{ scrolled: isScrolled }">
    <div class="nav-inner container">
      <!-- Logo -->
      <a href="/" class="logo">
        <img src="/logo.png" alt="FitAccess" class="logo-img" />
        <span class="logo-text">FitAccess</span>
      </a>

      <!-- Desktop Links -->
      <ul class="nav-links">
        <li v-for="link in navLinks" :key="link.label">
          <a
            class="nav-link"
            :class="{ 'nav-link-route': link.route }"
            @click.prevent="handleNavClick(link)"
            href="#"
          >{{ link.label }}</a>
        </li>
      </ul>

      <!-- Actions -->
      <div class="nav-actions">
        <RouterLink to="/login" class="nav-login">Log in</RouterLink>
        <RouterLink to="/signup/company" class="btn btn-primary nav-cta">Get Started</RouterLink>
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
          <a class="mobile-link" href="#" @click.prevent="handleNavClick(link)">{{ link.label }}</a>
        </li>
      </ul>
      <div class="mobile-actions">
        <RouterLink to="/login" class="btn btn-outline w-full" @click="mobileOpen = false">Log in</RouterLink>
        <RouterLink to="/signup/company" class="btn btn-primary w-full" @click="mobileOpen = false">Get Started</RouterLink>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 1000;
  padding: 18px 0;
  background: transparent;
  transition: all 0.3s ease;
}
.navbar.scrolled {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(12px);
  box-shadow: 0 2px 20px rgba(27, 58, 107, 0.1);
  padding: 12px 0;
}

.nav-inner {
  display: flex;
  align-items: center;
  gap: 40px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-white);
  flex-shrink: 0;
  transition: var(--transition);
}
.navbar.scrolled .logo { color: var(--color-primary); }
.logo-img { width: 34px; height: 34px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }

.nav-links {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}
.nav-link {
  padding: 8px 14px;
  border-radius: var(--radius-full);
  font-size: 0.95rem;
  font-weight: 500;
  color: rgba(255,255,255,0.9);
  transition: var(--transition);
}
.nav-link:hover { background: rgba(255,255,255,0.15); color: #fff; }
.navbar.scrolled .nav-link { color: var(--color-text); }
.navbar.scrolled .nav-link:hover { background: var(--color-bg-light); color: var(--color-primary); }

.nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.nav-login {
  font-size: 0.95rem;
  font-weight: 500;
  color: rgba(255,255,255,0.9);
  padding: 8px 16px;
  transition: var(--transition);
}
.nav-login:hover { color: #fff; }
.navbar.scrolled .nav-login { color: var(--color-text); }
.nav-cta { padding: 10px 22px; font-size: 0.9rem; }

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
  background: var(--color-white);
  border-radius: 2px;
  transition: var(--transition);
}
.navbar.scrolled .hamburger span { background: var(--color-primary); }
.hamburger span.open:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
.hamburger span.open:nth-child(2) { opacity: 0; }
.hamburger span.open:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }

.mobile-menu {
  display: none;
  padding: 16px 24px 24px;
  background: var(--color-white);
  border-top: 1px solid var(--color-border);
  flex-direction: column;
  gap: 8px;
}
.mobile-menu.open { display: flex; }
.mobile-link {
  display: block;
  padding: 12px 16px;
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text);
  border-radius: var(--radius-md);
  transition: var(--transition);
}
.mobile-link:hover { background: var(--color-bg-light); color: var(--color-primary); }
.mobile-actions { display: flex; gap: 12px; margin-top: 12px; }
.w-full { flex: 1; text-align: center; }

@media (max-width: 900px) {
  .nav-links { display: none; }
  .nav-actions { display: none; }
  .hamburger { display: flex; }
}
</style>
