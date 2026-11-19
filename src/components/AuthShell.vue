<script setup lang="ts">
// Frame for the Log in / Register pages, using the whole screen:
// left — a full-height photo panel with the message for this audience
// (employee, company, gym…); right — the form with the header action.
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

type Variant = 'login' | 'register' | 'employee' | 'company' | 'partner' | 'join'

const props = withDefaults(
  defineProps<{
    /** e.g. "Don't have an account yet?" */
    prompt: string
    actionLabel: string
    actionTo: string
    /** wider form column for the multi-step registration forms */
    wide?: boolean
    /** which story the photo panel tells */
    variant?: Variant
  }>(),
  { wide: false, variant: 'login' },
)

const PANELS: Record<Variant, { image: string; kicker: string; title: string; text: string; points: string[]; stat?: [string, string][] }> = {
  login: {
    image: '/images/landing/hero-home-cards.jpg',
    kicker: 'Welcome back',
    title: 'One card. Every partner gym.',
    text: 'Sign in to manage your FitAccess membership, your company benefit or your gym.',
    points: ['Employees: your card, gyms, trainings and news', 'Companies: employees, invoices and cards', 'Gyms: check-ins, members and payouts'],
  },
  register: {
    image: '/images/landing/team-highfive-et.jpg',
    kicker: 'Join FitAccess',
    title: 'Wellness that works for everyone.',
    text: 'The corporate gym and wellness membership for companies, employees and fitness partners across Ethiopia.',
    points: ['Access to partner gyms with one card', 'Simple monthly billing for companies', 'New members for gyms every month'],
  },
  employee: {
    image: '/images/landing/hero-employee-et.webp',
    kicker: 'For employees',
    title: 'Your company pays. You get fit.',
    text: 'Join FitAccess through your workplace and use partner gyms, pools and classes with one personal card.',
    points: ['One card for many partner gyms', 'See how busy a gym is before you go', 'Trainings and wellness news in your portal'],
  },
  company: {
    image: '/images/landing/hr-manager-et.jpg',
    kicker: 'For companies',
    title: 'A benefit your team will actually use.',
    text: 'Offer FitAccess to your employees. We handle the gyms, the cards and the check-ins; you get one simple invoice.',
    points: ['Import your employees from one Excel file', 'Pay monthly, every 3, 6 or 12 months', 'Card numbers e-mailed straight to employees'],
  },
  partner: {
    image: '/images/landing/hero-partners-et.webp',
    kicker: 'For gyms & facilities',
    title: 'Fill your gym with new members.',
    text: 'Become a FitAccess partner and welcome employees from companies across Ethiopia.',
    points: ['Steady visits from corporate members', 'Check members in with a quick scan', 'Clear monthly payouts'],
  },
  join: {
    image: '/images/landing/checkin-phone-et.jpg',
    kicker: 'Registered by your company',
    title: 'Create your account in a minute.',
    text: 'Confirm the details your company sent us, choose a password, and your FitAccess portal is ready.',
    points: ['Explore gyms, trainings and news right away', 'Your card number arrives after your company pays', 'Activate the card once and start checking in'],
  },
}

const panel = computed(() => PANELS[props.variant])
</script>

<template>
  <div class="as">
    <!-- Photo panel (left) -->
    <aside class="as-side" :style="{ '--as-img': `url(${panel.image})` }">
      <div class="as-side-in">
        <RouterLink to="/" class="as-logo as-logo--light" aria-label="FitAccess home">
          <img src="/logo.png" alt="" />
          <span>FitAccess</span>
        </RouterLink>

        <div class="as-story">
          <span class="as-kicker">{{ panel.kicker }}</span>
          <h2 class="as-title">{{ panel.title }}</h2>
          <p class="as-text">{{ panel.text }}</p>
          <ul class="as-points">
            <li v-for="p in panel.points" :key="p">
              <span class="as-tick" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              </span>
              {{ p }}
            </li>
          </ul>
        </div>

        <p class="as-strip">
          One account for
          <span class="as-chip">Employees</span>
          <span class="as-chip">Companies</span>
          <span class="as-chip">Gyms</span>
        </p>
      </div>
    </aside>

    <!-- Form (right) -->
    <div class="as-body">
      <header class="as-head">
        <RouterLink to="/" class="as-logo as-logo--mobile" aria-label="FitAccess home">
          <img src="/logo.png" alt="" />
          <span>FitAccess</span>
        </RouterLink>
        <div class="as-act">
          <span class="as-prompt">{{ prompt }}</span>
          <RouterLink :to="actionTo" class="as-act-btn">{{ actionLabel }}</RouterLink>
        </div>
      </header>

      <main class="as-main" :class="{ wide }">
        <slot />
      </main>

      <footer class="as-foot">
        <p>
          This site is protected by reCAPTCHA and the Google
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Privacy Policy</a> and
          <a href="https://policies.google.com/terms" target="_blank" rel="noopener">Terms of Service</a> apply.
        </p>
        <p>© {{ new Date().getFullYear() }} FitAccess Ethiopia</p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.as {
  min-height: 100vh; display: grid; grid-template-columns: minmax(380px, 44%) minmax(0, 1fr);
  background: #fff; font-family: var(--font-body); color: #111827;
}

/* ── Photo panel ─────────────────────────────────────────── */
.as-side {
  position: sticky; top: 0; height: 100vh; overflow: hidden; color: #fff;
  background:
    linear-gradient(160deg, rgba(11, 12, 16, 0.92) 0%, rgba(11, 12, 16, 0.55) 45%, rgba(40, 70, 0, 0.78) 100%),
    var(--as-img) center / cover no-repeat, #0b0c10;
}
.as-side::after {
  /* soft lime glow */
  content: ''; position: absolute; width: 520px; height: 520px; right: -180px; bottom: -200px; border-radius: 50%;
  background: radial-gradient(circle, rgba(139, 224, 0, 0.45) 0%, rgba(139, 224, 0, 0) 70%); pointer-events: none;
}
.as-side-in {
  position: relative; z-index: 1; height: 100%; box-sizing: border-box;
  display: flex; flex-direction: column; justify-content: space-between; gap: 32px; padding: 36px 48px 40px;
}
.as-story { max-width: 480px; animation: as-up .6s ease both; }
.as-kicker {
  display: inline-block; padding: 5px 12px; border-radius: 999px; background: rgba(139, 224, 0, 0.18);
  border: 1px solid rgba(139, 224, 0, 0.5); color: #c5f27a; font-size: 12.5px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
}
.as-title { margin: 18px 0 14px; font-family: var(--font-heading); font-size: clamp(30px, 3.2vw, 46px); line-height: 1.08; font-weight: 800; letter-spacing: -0.02em; }
.as-text { margin: 0 0 26px; font-size: 16.5px; line-height: 1.6; color: rgba(255, 255, 255, 0.86); }
.as-points { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.as-points li { display: flex; align-items: center; gap: 12px; font-size: 15px; font-weight: 600; }
.as-tick {
  flex-shrink: 0; width: 26px; height: 26px; border-radius: 50%; background: #8be000; color: #0b0c10;
  display: inline-flex; align-items: center; justify-content: center;
}
.as-strip { margin: 0; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 13.5px; color: rgba(255, 255, 255, 0.75); }
.as-chip { font-weight: 700; color: #0b0c10; padding: 4px 11px; border-radius: 999px; background: #8be000; font-size: 12.5px; }

/* ── Logo ────────────────────────────────────────────────── */
.as-logo { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; }
.as-logo img { width: 40px; height: 40px; border-radius: 10px; }
.as-logo span { font-family: var(--font-heading); font-size: 23px; font-weight: 800; letter-spacing: -0.02em; color: #0b0c10; }
.as-logo--light span { color: #fff; }
.as-logo--mobile { display: none; }

/* ── Form side ───────────────────────────────────────────── */
/* Form side: soft sage base + lime glows + faint dot grid, so the white card stands out */
.as-body {
  position: relative; min-width: 0; display: flex; flex-direction: column; min-height: 100vh;
  background-color: #d9e4c8;
  background-image:
    radial-gradient(circle at 1px 1px, rgba(63, 107, 0, 0.22) 1px, transparent 1.7px),
    radial-gradient(55% 45% at 100% 0%, rgba(139, 224, 0, 0.55) 0%, rgba(139, 224, 0, 0) 70%),
    radial-gradient(50% 45% at 0% 100%, rgba(77, 124, 15, 0.35) 0%, rgba(77, 124, 15, 0) 70%),
    linear-gradient(160deg, #e6eed9 0%, #d6e2c3 50%, #c9d8b2 100%);
  background-size: 22px 22px, 100% 100%, 100% 100%, 100% 100%;
  background-attachment: fixed, scroll, scroll, scroll;
}
.as-body > * { position: relative; }
.as-head { display: flex; align-items: center; justify-content: flex-end; gap: 16px; padding: 22px 48px; }
.as-act { display: flex; align-items: center; gap: 14px; }
.as-prompt { font-size: 14px; color: #374151; }
.as-act-btn {
  padding: 9px 26px; border-radius: 999px; border: 2px solid #0b0c10; color: #0b0c10; font-weight: 700;
  font-size: 15px; text-decoration: none; white-space: nowrap; transition: background 0.15s, border-color 0.15s;
}
.as-act-btn { background: rgba(255, 255, 255, 0.75); backdrop-filter: blur(4px); }
.as-act-btn:hover { background: #8be000; border-color: #8be000; }
.as-main {
  flex: 1; width: 100%; max-width: 600px; margin: 0 auto; padding: 24px 40px 48px; box-sizing: border-box;
  display: flex; flex-direction: column; justify-content: center; animation: as-fade .5s ease both;
}
.as-main.wide { max-width: 780px; justify-content: flex-start; }
.as-foot { padding: 18px 48px 26px; text-align: center; font-size: 12px; color: #6b7a5c; }
.as-foot p { margin: 4px 0; }
.as-foot a { color: #3f5a1a; }

@keyframes as-up { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes as-fade { from { opacity: 0; } to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .as-story, .as-main { animation: none; } }

/* Tablet: shorter photo band on top, form below */
@media (max-width: 980px) {
  .as { grid-template-columns: minmax(0, 1fr); }
  .as-side { position: relative; height: auto; }
  .as-side-in { padding: 24px 28px 28px; gap: 20px; }
  .as-title { font-size: 30px; margin: 14px 0 10px; }
  .as-text { margin-bottom: 18px; font-size: 15px; }
  .as-points { gap: 8px; }
  .as-strip { display: none; }
  .as-head { padding: 16px 24px; }
  .as-main { padding: 28px 24px 40px; justify-content: flex-start; }
  .as-foot { padding: 16px 24px 24px; }
}
/* Phone: hide the photo story, keep a compact header */
@media (max-width: 600px) {
  .as-side { display: none; }
  .as-head { justify-content: space-between; border-bottom: 1px solid rgba(77, 124, 15, 0.15); background: rgba(255, 255, 255, 0.6); }
  .as-logo--mobile { display: inline-flex; }
  .as-logo--mobile span { font-size: 19px; }
  .as-prompt { display: none; }
  .as-main { padding: 24px 16px 36px; }
}
</style>
