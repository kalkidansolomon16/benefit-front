<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AuthShell from '@/components/AuthShell.vue'

const options = [
  {
    to: '/signup/employee',
    tag: 'Employee',
    title: 'I’m an employee',
    text: 'My company offers FitAccess. I want my card and access to partner gyms.',
    image: '/images/landing/gym-members-et.jpg',
    perks: ['Personal card', 'Many gyms'],
  },
  {
    to: '/signup/company',
    tag: 'Employer',
    title: 'I’m an employer',
    text: 'I want to offer FitAccess to our employees as a benefit.',
    image: '/images/landing/office-et.jpg',
    perks: ['Excel import', 'One invoice'],
  },
  {
    to: '/signup/partner',
    tag: 'Gym / facility',
    title: 'I run a gym or facility',
    text: 'I want to become a FitAccess partner and welcome members.',
    image: '/images/landing/hero-partners-et.webp',
    perks: ['New members', 'Monthly payouts'],
  },
]
</script>

<template>
  <AuthShell prompt="Already have an account?" action-label="Log in" action-to="/login" variant="register" wide>
    <div class="rg">
      <span class="rg-kicker">Create your account</span>
      <h1 class="rg-title">Who are you joining as?</h1>
      <p class="rg-sub">Choose one and we’ll open the right registration form. It only takes a few minutes.</p>

      <div class="rg-list">
        <RouterLink v-for="(o, i) in options" :key="o.to" :to="o.to" class="rg-opt" :style="{ animationDelay: `${0.08 * i}s` }">
          <span class="rg-img" :style="{ backgroundImage: `url(${o.image})` }" aria-hidden="true">
            <span class="rg-tag">{{ o.tag }}</span>
          </span>
          <span class="rg-text">
            <strong>{{ o.title }}</strong>
            <small>{{ o.text }}</small>
            <span class="rg-perks">
              <span v-for="p in o.perks" :key="p">✓ {{ p }}</span>
            </span>
          </span>
          <span class="rg-go" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </span>
        </RouterLink>
      </div>

      <p class="rg-alt">
        Registered by your company already? <RouterLink to="/join">Create your account here</RouterLink>
      </p>
      <p class="rg-alt">Already have an account? <RouterLink to="/login">Log in</RouterLink></p>
    </div>
  </AuthShell>
</template>

<style scoped>
.rg { display: flex; flex-direction: column; gap: 14px; }
.rg-kicker { align-self: flex-start; padding: 5px 12px; border-radius: 999px; background: #eefbd6; color: #3f6b00; font-size: 12.5px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
.rg-title { margin: 4px 0 0; font-family: var(--font-heading); font-size: clamp(28px, 3vw, 40px); font-weight: 800; color: #0b0c10; line-height: 1.1; letter-spacing: -0.02em; }
.rg-sub { margin: 0 0 12px; font-size: 16px; color: #4b5563; }
.rg-list { display: flex; flex-direction: column; gap: 16px; }
.rg-opt {
  display: grid; grid-template-columns: 170px minmax(0, 1fr) auto; align-items: center; gap: 22px;
  padding: 12px 22px 12px 12px; border-radius: 24px; background: #fff; border: 1.5px solid #e9ece3;
  text-decoration: none; color: inherit; box-shadow: 0 2px 10px rgba(11, 12, 16, 0.04);
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
  animation: rg-in .45s ease both;
}
.rg-opt:hover, .rg-opt:focus-visible {
  transform: translateY(-3px); border-color: #8be000; outline: none;
  box-shadow: 0 16px 34px rgba(11, 12, 16, 0.10), 0 0 0 4px rgba(139, 224, 0, 0.18);
}
.rg-img {
  position: relative; height: 118px; border-radius: 16px; background-size: cover; background-position: center;
  overflow: hidden;
}
.rg-img::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 40%, rgba(11, 12, 16, 0.55)); }
.rg-tag {
  position: absolute; left: 10px; bottom: 10px; z-index: 1; padding: 3px 10px; border-radius: 999px;
  background: #8be000; color: #0b0c10; font-size: 11.5px; font-weight: 800;
}
.rg-text { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.rg-text strong { font-size: 19px; color: #0b0c10; font-family: var(--font-heading); }
.rg-text small { font-size: 14px; color: #4b5563; line-height: 1.45; }
.rg-perks { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.rg-perks span { font-size: 12px; font-weight: 700; color: #3f6b00; background: #f3fce6; padding: 3px 9px; border-radius: 999px; }
.rg-go {
  width: 46px; height: 46px; border-radius: 50%; background: #0b0c10; color: #fff;
  display: inline-flex; align-items: center; justify-content: center; transition: background .2s, color .2s, transform .2s;
}
.rg-opt:hover .rg-go { background: #8be000; color: #0b0c10; transform: translateX(3px); }
.rg-alt { margin: 4px 0 0; text-align: center; font-size: 15px; color: #4b5563; }
.rg-alt a { color: #0b0c10; font-weight: 700; }
@keyframes rg-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .rg-opt { animation: none; transition: none; } }
@media (max-width: 640px) {
  .rg-opt { grid-template-columns: 1fr; padding: 12px; gap: 12px; }
  .rg-img { height: 140px; }
  .rg-go { display: none; }
  .rg-text { padding: 0 6px 6px; }
}
</style>
