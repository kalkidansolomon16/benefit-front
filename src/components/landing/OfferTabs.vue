<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'

// "Tailored to your needs" tabs modelled on the inspiration: one offer per
// audience with a checklist, a button to that audience's page and two round photos.
type Key = 'employees' | 'employers' | 'partners'

const offers: Record<Key, {
  tab: string
  title: string
  accent: string
  subtitle: string
  lead: string
  points: string[]
  cta: string
  to: string
  imgs: [string, string]
}> = {
  employees: {
    tab: 'For Employees',
    title: 'Made for',
    accent: 'you',
    subtitle: 'Train across Addis Ababa with a single pass',
    lead: 'Fitness that fits around your working day',
    points: [
      'Visit one partner facility every day',
      'Gyms, swimming pools, spas and wellness centres',
      'Digital barcode pass on your phone, no plastic card',
      'Live gym busyness and nearby-gym search',
    ],
    cta: 'See how to join',
    to: '/for-employees',
    imgs: ['/images/landing/runner-stretch-et.jpg', '/images/landing/pool-lounge-et.jpg'],
  },
  employers: {
    tab: 'For Employers',
    title: 'Made for',
    accent: 'your company',
    subtitle: 'A benefit your employees notice and use',
    lead: 'Healthier staff, fewer sick days, stronger teams',
    points: [
      'One quarterly ETB invoice for the whole company',
      'Basic, Basic Plus and Premium packages by employee level',
      'HR dashboard for employees, branches and visits',
      'Attract and keep talent with a modern benefit',
    ],
    cta: 'See how to offer FitAccess',
    to: '/for-employers',
    imgs: ['/images/landing/office-et.jpg', '/images/landing/hr-manager-et.jpg'],
  },
  partners: {
    tab: 'For Partners',
    title: 'Made for',
    accent: 'partner facilities',
    subtitle: 'Grow your business with FitAccess members',
    lead: 'More visitors and a steady stream of income',
    points: [
      'Reach employees from companies across Addis Ababa',
      'Get listed on the FitAccess website and app',
      'Free partner portal: scan passes and see every visit',
      'Manage branches and staff from one account',
    ],
    cta: 'See how to become a partner',
    to: '/for-partners',
    imgs: ['/images/landing/gym-members-et.jpg', '/images/landing/team-highfive-et.jpg'],
  },
}

const keys = Object.keys(offers) as Key[]
const active = ref<Key>('employees')
const offer = computed(() => offers[active.value])
</script>

<template>
  <section id="offer" class="lp-section offer">
    <div class="lp-container">
      <div class="lp-section-head">
        <h2 class="lp-h2">What FitAccess <span class="lp-mark">offers you</span></h2>
        <p class="lp-lead">See what FitAccess brings to employees, companies and partner facilities.</p>
      </div>

      <div class="offer-tabs" role="tablist">
        <button
          v-for="k in keys"
          :key="k"
          type="button"
          role="tab"
          class="offer-tab"
          :class="{ active: active === k }"
          :aria-selected="active === k"
          @click="active = k"
        >{{ offers[k].tab }}</button>
      </div>

      <Transition name="offer-fade" mode="out-in">
        <div :key="active" class="offer-grid" role="tabpanel">
          <div class="offer-copy">
            <h3 class="offer-title">{{ offer.title }} <span class="lp-mark">{{ offer.accent }}</span></h3>
            <p class="offer-sub">{{ offer.subtitle }}</p>
            <p class="offer-lead">{{ offer.lead }}</p>
            <ul class="offer-list">
              <li v-for="p in offer.points" :key="p">{{ p }}</li>
            </ul>
            <div class="lp-btn-row">
              <RouterLink :to="offer.to" class="lp-btn lp-btn--dark">{{ offer.cta }}</RouterLink>
            </div>
          </div>

          <div class="offer-visual" aria-hidden="true">
            <svg class="offer-map" viewBox="0 0 400 400" preserveAspectRatio="none">
              <path d="M20 120c40-30 70 10 110-10s50-60 100-40 60 50 110 30M10 220c50-20 80 20 130 0s60-50 110-30 70 40 140 20M30 320c40 10 90-30 140-10s70 40 120 20 60-30 100-20M80 20c-10 60 20 90 10 140s-40 80-20 140 30 70 20 100M200 10c20 50-10 90 10 140s50 70 30 130-20 80 0 110M320 30c-20 40 10 80-10 130s-40 60-20 110 30 60 20 110M60 80l60 40 50-30 70 50 60-20 80 40M40 280l70-30 60 40 80-40 70 30 60-20" />
            </svg>
            <svg class="offer-doodle offer-doodle--heart" viewBox="0 0 100 100"><path d="M50 88S10 62 10 34a20 20 0 0140-8 20 20 0 0140 8c0 28-40 54-40 54z" /><path d="M58 20c6-6 14-8 20-6" /></svg>
            <svg class="offer-doodle offer-doodle--medal" viewBox="0 0 80 110"><path d="M22 6l18 40 18-40M30 6l10 22 10-22" /><circle cx="40" cy="74" r="26" /><path d="M36 64l6-4v28M34 88h14" /><path d="M8 70h-6M12 52l-6-4M12 90l-6 4" /></svg>
            <div class="offer-photo offer-photo--a"><img :src="offer.imgs[0]" alt="" /></div>
            <div class="offer-photo offer-photo--b"><img :src="offer.imgs[1]" alt="" /></div>
          </div>
        </div>
      </Transition>
    </div>
  </section>
</template>

<style scoped>
.offer { background: #fafafa; }
.offer-tabs {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 14px;
  width: fit-content;
  max-width: 100%;
  margin: -1.5rem auto 4rem;
  padding: 14px 18px;
  border-radius: 50rem;
  background: #fff;
  box-shadow: 0 6px 24px rgba(11,12,16,.08);
}
.offer-tab {
  padding: 12px 26px;
  border-radius: 50rem;
  background: var(--lp-tint);
  color: var(--lp-ink);
  font-weight: 700;
  font-size: 1rem;
  transition: background-color .2s ease-out, color .2s ease-out;
}
.offer-tab:hover { background: var(--lp-tint-strong); }
.offer-tab.active { background: var(--lp-ink); color: #fff; }

.offer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
.offer-copy { display: flex; flex-direction: column; gap: 1rem; }
.offer-title { font-size: clamp(2rem, 3.4vw, 2.9rem); font-weight: 700; line-height: 1.15; }
.offer-sub { font-size: 1.45rem; font-weight: 700; line-height: 1.3; }
.offer-lead { font-size: 1.15rem; margin-top: .6rem; }
.offer-list { display: flex; flex-direction: column; gap: .65rem; margin-bottom: .8rem; }
.offer-list li {
  position: relative;
  padding-left: 2rem;
  font-size: 1.05rem;
  line-height: 1.5;
}
.offer-list li::before {
  content: '';
  position: absolute;
  left: 0; top: .2rem;
  width: 1.25rem; height: 1.25rem;
  border-radius: 50%;
  background: var(--lp-green) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%230B0C10' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 12.5l4 4 8-9'/%3E%3C/svg%3E") center / 70% no-repeat;
}

.offer-visual { position: relative; height: 560px; }
.offer-map { position: absolute; inset: 0; width: 100%; height: 100%; }
.offer-map path { fill: none; stroke: #e2e6da; stroke-width: 1.4; }
.offer-photo {
  position: absolute;
  aspect-ratio: 1;
  border-radius: 50%;
  overflow: hidden;
  border: 6px solid #fafafa;
  box-shadow: 0 18px 40px rgba(11,12,16,.12);
}
.offer-photo img { width: 100%; height: 100%; object-fit: cover; }
.offer-photo--a { width: 56%; left: 2%; bottom: 4%; z-index: 1; }
.offer-photo--b { width: 56%; right: 2%; top: 4%; z-index: 2; }
.offer-doodle { position: absolute; fill: none; stroke: var(--lp-green); stroke-width: 5; stroke-linecap: round; stroke-linejoin: round; z-index: 3; }
.offer-doodle--heart { width: 150px; left: 10%; top: 0; transform: rotate(-14deg); }
.offer-doodle--medal { width: 90px; right: 6%; bottom: 0; transform: rotate(12deg); }

.offer-fade-enter-active, .offer-fade-leave-active { transition: opacity .2s ease, transform .2s ease; }
.offer-fade-enter-from, .offer-fade-leave-to { opacity: 0; transform: translateY(8px); }

@media (max-width: 991px) {
  .offer-grid { grid-template-columns: 1fr; }
  .offer-visual { height: 460px; max-width: 520px; width: 100%; margin: 0 auto; }
  .offer-tabs { border-radius: 1.5rem; }
}
@media (max-width: 560px) {
  .offer-visual { height: 360px; }
  .offer-doodle--heart { width: 100px; }
  .offer-doodle--medal { width: 64px; }
  .offer-tab { padding: 10px 18px; font-size: .92rem; }
}
</style>
