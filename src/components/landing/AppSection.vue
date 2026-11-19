<script setup lang="ts">
// "Mobile app" block modelled on the inspiration: intro + feature tiles, then
// a checklist with store buttons beside two phone mockups.
// Store links come from env; until they are set the buttons show "Coming soon".
const androidUrl = import.meta.env.VITE_ANDROID_APP_URL || ''
const iosUrl = import.meta.env.VITE_IOS_APP_URL || ''

const stores = [
  {
    name: 'Google Play',
    url: androidUrl,
    icon: 'M4 3.5v17c0 .4.4.6.7.4L19 12.4c.3-.2.3-.6 0-.8L4.7 3.1c-.3-.2-.7 0-.7.4z',
  },
  {
    name: 'App Store',
    url: iosUrl,
    icon: 'M16.4 12.6c0-2.5 2-3.7 2.1-3.8-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.7.9-.8 0-2-.9-3.2-.9-1.7 0-3.2 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.1-1.2 2.9-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.4-1-2.4-3.6zM14 5.2c.7-.8 1.1-1.9 1-3-1 0-2.1.6-2.8 1.4-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.5 2.8-1.3z',
  },
]

const tiles = [
  { label: 'Digital barcode pass', icon: 'M4 6h16v12H4zM7 9v6M9.5 9v6M12 9v6M15 9v6M17 9v6' },
  { label: 'Gyms near you',        icon: 'M12 21s-7-6.2-7-11.5A7 7 0 0119 9.5C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z' },
  { label: 'Live crowd levels',    icon: 'M4 20V10M10 20V4M16 20v-7M22 20H2' },
]

const features = [
  'Check in at reception in seconds with your personal barcode',
  'Discover partner gyms and wellness centres close to you',
  'See how busy a gym is before you leave home',
  'Look back at every visit you have made',
  'Get updates and news from FitAccess',
]

// deterministic barcode bars for the phone mockup
const bars = Array.from({ length: 34 }, (_, i) => ({ x: i * 6 + ((i * 7) % 3), w: [1, 2, 3][(i * 5) % 3] }))
</script>

<template>
  <section id="app" class="lp-section app">
    <div class="lp-container">
      <div class="lp-section-head">
        <p class="app-kicker">Your gym pass in your pocket</p>
        <h2 class="lp-h2">The <span class="lp-mark">FitAccess</span> mobile app</h2>
        <p class="lp-lead">Everything you need for your next workout, in one free app.</p>
      </div>

      <div class="app-tiles">
        <div v-for="t in tiles" :key="t.label" class="app-tile">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path :d="t.icon" /></svg>
          <strong>{{ t.label }}</strong>
        </div>
      </div>

      <div class="app-grid">
        <div class="app-copy">
          <h3 class="app-title">Leave the card at home, <span class="lp-mark">bring your phone</span></h3>
          <p class="app-text">With the FitAccess app you can:</p>
          <ul class="app-list">
            <li v-for="f in features" :key="f">{{ f }}</li>
          </ul>
          <p class="app-text app-text--strong">The app is free for every enrolled employee.</p>
          <div class="app-stores">
            <component
              :is="s.url ? 'a' : 'span'"
              v-for="s in stores"
              :key="s.name"
              :href="s.url || undefined"
              :target="s.url ? '_blank' : undefined"
              :rel="s.url ? 'noopener' : undefined"
              :aria-disabled="s.url ? undefined : 'true'"
              class="store-btn"
              :class="{ 'store-btn--soon': !s.url }"
            >
              <svg viewBox="0 0 24 24" fill="currentColor"><path :d="s.icon" /></svg>
              <span>{{ s.name }}<small v-if="!s.url">Coming soon</small></span>
            </component>
          </div>
        </div>

        <!-- Phone mockups -->
        <div class="app-visual" aria-hidden="true">
          <span class="app-ring app-ring--1"></span>
          <span class="app-ring app-ring--2"></span>
          <svg class="app-doodle app-doodle--star" viewBox="0 0 100 100"><path d="M50 6l12 30 32 2-25 20 9 32-28-18-28 18 9-32L6 38l32-2z" /></svg>
          <svg class="app-doodle app-doodle--pin" viewBox="0 0 60 90"><path d="M30 86S6 54 6 32a24 24 0 0148 0c0 22-24 54-24 54z" /><circle cx="30" cy="32" r="11" /></svg>

          <!-- back phone: find a gym -->
          <div class="phone phone--back">
            <div class="phone-notch"></div>
            <div class="screen">
              <div class="scr-top"><span>&lsaquo;</span><b>Find a gym</b><span></span></div>
              <div class="scr-hero"><img src="/images/landing/runner-stretch-et.jpg" alt="" /><span>Train close to you</span></div>
              <div class="scr-search">Search gyms<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/></svg></div>
              <div class="scr-grid">
                <div v-for="a in ['Gym', 'Yoga', 'Swimming', 'Boxing', 'Dance', 'Spa']" :key="a" class="scr-tile"><i></i>{{ a }}</div>
              </div>
            </div>
          </div>

          <!-- front phone: my pass -->
          <div class="phone phone--front">
            <div class="phone-notch"></div>
            <div class="screen">
              <div class="scr-top"><span></span><b>My pass</b><span>&#9675;</span></div>
              <div class="scr-card">
                <div class="scr-card-head"><img src="/logo.png" alt="" /> FitAccess <em>Premium</em></div>
                <svg class="scr-barcode" viewBox="0 0 210 48" preserveAspectRatio="none">
                  <rect v-for="(b, i) in bars" :key="i" :x="b.x" y="0" :width="b.w" height="48" />
                </svg>
                <small>FA7Q 2KD9 X41M</small>
              </div>
              <div class="scr-btn">Show barcode</div>
              <div class="scr-member">
                <span class="scr-avatar">TA</span>
                <div><b>Tigist A.</b><small>Premium member</small></div>
                <span class="scr-chip">Active</span>
              </div>
              <div class="scr-row">Checked in today · Partner gym</div>
              <div class="scr-row">Valid at all gyms in your plan</div>
            </div>
          </div>

          <span class="app-badge app-badge--1">Check in within seconds</span>
          <span class="app-badge app-badge--2">Find gyms near you</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.app-kicker { font-weight: 700; margin-bottom: .6rem; }
.app-tiles {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 22px;
  margin: -1rem auto 5rem;
}
.app-tile {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 250px;
  padding: 20px 28px;
  border-radius: 1.25rem;
  background: #fff;
  box-shadow: 0 6px 24px rgba(11,12,16,.08);
  font-size: 1.05rem;
}
.app-tile svg { width: 42px; height: 42px; color: var(--lp-ink); flex-shrink: 0; }

.app-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
.app-copy { display: flex; flex-direction: column; gap: 1.1rem; }
.app-title { font-size: clamp(1.8rem, 2.8vw, 2.4rem); font-weight: 700; line-height: 1.2; }
.app-text { font-size: 1.1rem; line-height: 1.6; }
.app-text--strong { font-weight: 600; margin-top: .8rem; }
.app-list { display: flex; flex-direction: column; gap: .7rem; }
.app-list li {
  position: relative;
  padding-left: 2rem;
  font-size: 1.08rem;
  line-height: 1.5;
}
.app-list li::before {
  content: '';
  position: absolute;
  left: 0; top: .2rem;
  width: 1.25rem; height: 1.25rem;
  border-radius: 50%;
  background: var(--lp-green) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%230B0C10' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 12.5l4 4 8-9'/%3E%3C/svg%3E") center / 70% no-repeat;
}
.app-stores { display: flex; flex-wrap: wrap; gap: 12px; }
.store-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 3.4rem;
  padding: .5rem 1.6rem;
  border-radius: 50rem;
  background: var(--lp-ink);
  color: #fff;
  font-weight: 700;
  font-size: 1.05rem;
  transition: background-color .2s ease-out;
}
.store-btn:hover { background: #24262d; }
.store-btn svg { width: 22px; height: 22px; color: var(--lp-green); }
.store-btn--soon { cursor: default; opacity: .9; }
.store-btn--soon:hover { background: var(--lp-ink); }
.store-btn > span { display: flex; flex-direction: column; line-height: 1.15; }
.store-btn--soon small { font-size: .7rem; font-weight: 600; color: var(--lp-green); text-transform: uppercase; letter-spacing: .06em; }

/* ── Phones ── */
.app-visual { position: relative; height: 560px; }
.app-ring { position: absolute; border-radius: 50%; border: 2px solid var(--lp-tint-strong); }
.app-ring--1 { width: 520px; height: 520px; left: 50%; top: 50%; transform: translate(-50%, -50%); }
.app-ring--2 { width: 400px; height: 400px; left: 50%; top: 50%; transform: translate(-50%, -50%); border-color: var(--lp-tint); }
.app-doodle { position: absolute; fill: none; stroke: var(--lp-green); stroke-width: 5; stroke-linejoin: round; z-index: 3; }
.app-doodle--star { width: 110px; left: 4%; top: 2%; transform: rotate(-12deg); }
.app-doodle--pin { width: 64px; right: 2%; bottom: 18%; }

.phone {
  position: absolute;
  width: 250px;
  height: 500px;
  padding: 12px;
  border-radius: 40px;
  background: #f6f6f6;
  box-shadow: 0 30px 60px rgba(11,12,16,.18), inset 0 0 0 2px #e6e6e6;
}
.phone--front { left: 16%; top: 50px; z-index: 2; }
.phone--back  { right: 6%; top: 0; z-index: 1; }
.phone-notch { position: absolute; top: 14px; left: 50%; width: 90px; height: 20px; border-radius: 0 0 14px 14px; background: #e9e9e9; transform: translateX(-50%); z-index: 2; }
.screen {
  height: 100%;
  border-radius: 30px;
  background: #fff;
  overflow: hidden;
  padding: 34px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 11px;
  color: var(--lp-ink);
}
.scr-top { display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
.scr-card { border-radius: 14px; background: var(--lp-ink); color: #fff; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.scr-card-head { display: flex; align-items: center; gap: 6px; font-weight: 800; font-size: 12px; }
.scr-card-head img { width: 18px; height: 18px; border-radius: 4px; }
.scr-card-head em { margin-left: auto; font-style: normal; font-size: 9px; padding: 2px 8px; border-radius: 50rem; background: var(--lp-green); color: var(--lp-ink); }
.scr-barcode { width: 100%; height: 48px; background: #fff; border-radius: 6px; padding: 4px; }
.scr-barcode rect { fill: var(--lp-ink); }
.scr-card small { text-align: center; letter-spacing: .2em; font-size: 9px; }
.scr-btn { text-align: center; padding: 9px; border-radius: 10px; background: var(--lp-green); font-weight: 700; }
.scr-member { display: flex; align-items: center; gap: 8px; padding: 10px; border-radius: 12px; background: #f4f4f4; }
.scr-member b { display: block; }
.scr-member small { font-size: 9px; }
.scr-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--lp-ink); color: var(--lp-green); display: flex; align-items: center; justify-content: center; font-weight: 800; }
.scr-chip { margin-left: auto; padding: 2px 8px; border-radius: 50rem; background: var(--lp-tint-strong); font-size: 9px; font-weight: 700; }
.scr-row { padding: 9px 4px; border-bottom: 1px solid #eee; }
.scr-hero { position: relative; border-radius: 12px; overflow: hidden; height: 110px; }
.scr-hero img { width: 100%; height: 100%; object-fit: cover; }
.scr-hero span { position: absolute; left: 8px; bottom: 8px; padding: 3px 8px; border-radius: 6px; background: rgba(255,255,255,.92); font-weight: 700; }
.scr-search { display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; border-radius: 10px; border: 1px solid #e6e6e6; }
.scr-search svg { width: 14px; height: 14px; }
.scr-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.scr-tile { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 2px; border-radius: 10px; border: 1px solid #ececec; font-size: 9.5px; }
.scr-tile i { width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--lp-ink); }

.app-badge {
  position: absolute;
  z-index: 4;
  padding: 10px 18px;
  border-radius: 50rem;
  background: var(--lp-green);
  font-weight: 700;
  font-size: .95rem;
  box-shadow: 0 10px 24px rgba(11,12,16,.14);
  white-space: nowrap;
}
.app-badge--1 { left: 2%; top: 46%; transform: rotate(-3deg); }
.app-badge--2 { right: 0; top: 18%; transform: rotate(-3deg); }

@media (max-width: 991px) {
  .app-grid { grid-template-columns: 1fr; }
  .app-visual { height: 540px; max-width: 520px; margin: 0 auto; width: 100%; }
}
@media (max-width: 560px) {
  .app-visual { height: 470px; transform: scale(.82); transform-origin: top center; margin-bottom: -80px; }
  .app-ring--1 { width: 420px; height: 420px; }
  .phone--front { left: 2%; }
  .phone--back { right: -4%; }
  .app-tile { min-width: 0; width: 100%; }
}
</style>
