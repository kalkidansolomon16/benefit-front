<script setup lang="ts">
import { RouterLink } from 'vue-router'

const columns = [
  {
    heading: 'About FitAccess',
    links: [
      { label: 'How It Works',    to: '/#how-it-works' },
      { label: 'Plans', to: '/#plans' },
      { label: 'Log in',          to: '/login' },
    ],
  },
  {
    heading: 'Cooperation',
    links: [
      { label: 'For Employers', to: '/for-employers' },
      { label: 'For Employees', to: '/for-employees' },
      { label: 'For Partners',  to: '/for-partners' },
    ],
  },
  {
    heading: 'Register',
    links: [
      { label: 'Register as Employer', to: '/for-employers' },
      { label: 'Register as Employee', to: '/for-employees' },
      { label: 'Register as Partner',  to: '/for-partners' },
    ],
  },
]

const socials = [
  { name: 'LinkedIn',  href: '#', path: 'M4.98 3.5a2.5 2.5 0 11-.02 5 2.5 2.5 0 01.02-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05C20.6 8.65 21 11.3 21 14.7V21h-4v-5.6c0-1.33-.02-3.05-1.86-3.05-1.86 0-2.14 1.45-2.14 2.95V21H9z' },
  { name: 'Instagram', href: '#', path: 'M12 2.2c3.2 0 3.58 0 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s0 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.65.07-4.85.07s-3.58 0-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12s0-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zM12 6.86a5.14 5.14 0 100 10.28 5.14 5.14 0 000-10.28zm0 8.48a3.34 3.34 0 110-6.68 3.34 3.34 0 010 6.68zm5.34-9.9a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4z' },
  { name: 'Facebook',  href: '#', path: 'M14 8.5V6.6c0-.83.2-1.25 1.5-1.25H17V2.2C16.7 2.16 15.7 2 14.5 2 12 2 10.3 3.5 10.3 6.3v2.2H7.5v3.5h2.8V22H14v-10h2.8l.4-3.5z' },
  { name: 'Telegram',  href: '#', path: 'M21.9 4.3l-3.2 15.1c-.24 1.06-.87 1.33-1.76.83l-4.87-3.59-2.35 2.26c-.26.26-.48.48-.98.48l.35-4.96 9.03-8.16c.39-.35-.09-.54-.6-.2L6.36 13.1 1.55 11.6c-1.05-.33-1.07-1.05.22-1.55l18.8-7.25c.87-.32 1.64.2 1.33 1.5z' },
]
</script>

<template>
  <footer class="footer">
    <div class="lp-container footer-main">
      <!-- Brand column -->
      <div class="footer-brand">
        <RouterLink to="/" class="footer-logo">
          <img src="/logo.png" alt="FitAccess" class="logo-icon" />
          <span>FitAccess</span>
        </RouterLink>
        <p class="footer-tagline">
          Workplace wellness for Ethiopian companies: one pass to gyms, pools and spas
          across Addis Ababa.
        </p>
        <div class="footer-socials">
          <a v-for="s in socials" :key="s.name" :href="s.href" class="social-btn" :aria-label="s.name">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path :d="s.path" /></svg>
          </a>
        </div>
      </div>

      <!-- Link columns -->
      <div v-for="col in columns" :key="col.heading" class="footer-col">
        <h4 class="footer-col-heading">{{ col.heading }}</h4>
        <ul class="footer-col-links">
          <li v-for="link in col.links" :key="link.label">
            <RouterLink :to="link.to" class="footer-link">{{ link.label }}</RouterLink>
          </li>
        </ul>
      </div>

      <!-- Contacts -->
      <div class="footer-col">
        <h4 class="footer-col-heading">Contacts</h4>
        <ul class="footer-col-links">
          <li><a href="tel:+251911000000" class="footer-link">+251 911 000 000</a></li>
          <li><a href="mailto:auto@fit-access.com" class="footer-link">auto@fit-access.com</a></li>
          <li class="footer-plain">Bole Road, Addis Ababa</li>
        </ul>
      </div>
    </div>

    <div class="footer-bottom">
      <div class="lp-container footer-bottom-inner">
        <p>© {{ new Date().getFullYear() }} FitAccess Ethiopia. All rights reserved.</p>
        <div class="footer-legal">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer { background: var(--lp-ink); color: #fff; }

.footer-main {
  display: grid;
  grid-template-columns: 1.6fr repeat(4, 1fr);
  gap: 40px;
  padding-top: 72px;
  padding-bottom: 56px;
}

.footer-logo {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 1.5rem;
  font-weight: 800;
  color: #fff;
  margin-bottom: 16px;
}
.logo-icon { width: 34px; height: 34px; border-radius: 8px; object-fit: cover; }

.footer-tagline {
  font-size: 0.95rem;
  line-height: 1.7;
  color: rgba(255,255,255,.8);
  margin-bottom: 24px;
  max-width: 320px;
}

.footer-socials { display: flex; gap: 10px; }
.social-btn {
  width: 42px; height: 42px;
  border-radius: 50%;
  background: rgba(255,255,255,.08);
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  transition: background-color .2s ease, color .2s ease;
}
.social-btn:hover { background: var(--lp-green); color: var(--lp-ink); }

.footer-col-heading {
  font-size: 1rem;
  font-weight: 700;
  color: var(--lp-green);
  margin-bottom: 18px;
}
.footer-col-links { display: flex; flex-direction: column; gap: 12px; }
.footer-link, .footer-plain {
  font-size: 0.93rem;
  color: rgba(255,255,255,.85);
}
.footer-link:hover { color: var(--lp-green); }

.footer-bottom { border-top: 1px solid rgba(255,255,255,.1); padding: 22px 0; }
.footer-bottom-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 0.85rem;
  color: rgba(255,255,255,.7);
}
.footer-legal { display: flex; gap: 20px; }
.footer-legal a:hover { color: var(--lp-green); }

@media (max-width: 1024px) {
  .footer-main { grid-template-columns: repeat(2, 1fr); }
  .footer-brand { grid-column: 1 / -1; }
}
@media (max-width: 520px) {
  .footer-main { grid-template-columns: 1fr; }
  .footer-bottom-inner { flex-direction: column; text-align: center; }
}
</style>
