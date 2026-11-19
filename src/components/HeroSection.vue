<script setup lang="ts">
// Home hero: full-screen, softly blurred photo of people holding FitAccess
// cards, with the headline on top. Drop the photo at
// public/images/landing/hero-home-cards.jpg; until it exists the team photo is used.
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

const PHOTO = '/images/landing/hero-home-cards.jpg'
const FALLBACK = '/images/landing/team-highfive-et.jpg'
const src = ref(PHOTO)

function onError() {
  if (src.value !== FALLBACK) src.value = FALLBACK
}
</script>

<template>
  <header id="hero" class="hx">
    <img :src="src" alt="" class="hx-photo" aria-hidden="true" @error="onError" />
    <div class="hx-shade" aria-hidden="true"></div>

    <div class="lp-container hx-inner">
      <div class="hx-content">
        <span class="hx-eyebrow">One card · Many gyms · Paid by your company</span>
        <h1 class="hx-title">Active employees, <span class="hx-mark">healthier teams</span></h1>
        <p class="hx-text">
          FitAccess opens the doors of partner gyms, pools and spas across Addis Ababa to your
          employees, all covered by your company with one invoice in ETB.
        </p>
        <div class="hx-btns">
          <RouterLink :to="{ path: '/', hash: '#plans' }" class="lp-btn hx-cta">See Plans</RouterLink>
          <RouterLink :to="{ path: '/', hash: '#how-it-works' }" class="lp-btn hx-secondary">How it works</RouterLink>
        </div>
      </div>
    </div>

    <a href="#how-it-works" class="hx-scroll" aria-label="Scroll down">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6" /></svg>
    </a>
  </header>
</template>

<style scoped>
.hx {
  position: relative;
  min-height: calc(100vh - 84px); /* full screen below the sticky nav bar */
  min-height: calc(100svh - 84px);
  display: flex;
  align-items: center;
  overflow: hidden;
  background: #0b0c10;
  isolation: isolate;
}
/* Softly blurred photo; scaled up so the blur never shows soft edges */
.hx-photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 30%;
  /* light blur only: the people and their cards stay recognisable */
  filter: blur(1.5px) saturate(1.1);
  transform: scale(1.04);
  z-index: -2;
  animation: hx-zoom 22s ease-in-out infinite alternate;
}
/* slow "Ken Burns" drift on the photo */
@keyframes hx-zoom {
  from { transform: scale(1.04) translate3d(0, 0, 0); }
  to   { transform: scale(1.14) translate3d(-1.5%, -1%, 0); }
}
/* Dark-to-clear wash so the white text always reads */
.hx-shade {
  position: absolute;
  inset: 0;
  z-index: -1;
  /* The group fills the whole photo, so darken it evenly with a soft vignette */
  /* lighter wash: darkest behind the text in the centre, clearer at the sides */
  background:
    radial-gradient(ellipse 55% 60% at center, rgba(11, 12, 16, 0.55) 0%, rgba(11, 12, 16, 0.3) 70%, rgba(11, 12, 16, 0.38) 100%),
    linear-gradient(0deg, rgba(11, 12, 16, 0.45) 0%, rgba(11, 12, 16, 0) 35%);
}

/* Staggered entrance for the text and buttons */
.hx-eyebrow, .hx-title, .hx-text, .hx-btns {
  opacity: 0;
  animation: hx-rise 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
.hx-eyebrow { animation-delay: 0.1s; }
.hx-title   { animation-delay: 0.25s; }
.hx-text    { animation-delay: 0.45s; }
.hx-btns    { animation-delay: 0.65s; }
@keyframes hx-rise {
  from { opacity: 0; transform: translateY(26px); }
  to   { opacity: 1; transform: none; }
}
/* Lime highlight sweeps in after the headline */
.hx-mark {
  background: linear-gradient(transparent 62%, rgba(139, 224, 0, 0.28) 62%) no-repeat 0 0 / 0% 100%;
  animation: hx-underline 0.9s ease-out 1s forwards;
}
@keyframes hx-underline { to { background-size: 100% 100%; } }
/* Gentle pulse on the main button */
.hx-cta { animation: hx-glow 2.8s ease-in-out 1.6s infinite; }
@keyframes hx-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(139, 224, 0, 0.55); }
  50%      { box-shadow: 0 0 0 12px rgba(139, 224, 0, 0); }
}
.hx-inner { width: 100%; padding-top: 64px; padding-bottom: 96px; display: flex; justify-content: center; }
.hx-content { max-width: 760px; color: #fff; text-align: center; display: flex; flex-direction: column; align-items: center; }
.hx-eyebrow {
  display: inline-block;
  margin-bottom: 18px;
  padding: 7px 14px;
  border-radius: 999px;
  background: rgba(139, 224, 0, 0.16);
  border: 1px solid rgba(139, 224, 0, 0.5);
  color: #c8f57a;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.hx-title {
  margin: 0 0 20px;
  font-family: var(--font-heading);
  font-size: clamp(2.4rem, 5.4vw, 4.4rem);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: #fff;
  text-shadow: 0 2px 24px rgba(0, 0, 0, 0.35);
}
.hx-mark { color: #8be000; }
.hx-text {
  margin: 0 0 32px;
  max-width: 600px;
  font-size: clamp(1rem, 1.4vw, 1.2rem);
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.92);
  text-shadow: 0 1px 12px rgba(0, 0, 0, 0.55);
}
.hx-btns { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; }
.hx-cta { background: #8be000; color: #0b0c10; border: 2px solid #8be000; }
.hx-cta:hover { background: #a6f23a; border-color: #a6f23a; }
.hx-secondary { background: transparent; color: #fff; border: 2px solid rgba(255, 255, 255, 0.7); }
.hx-secondary:hover { background: #fff; color: #0b0c10; border-color: #fff; }
.hx-scroll {
  position: absolute;
  left: 50%;
  bottom: 22px;
  transform: translateX(-50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, 0.5);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: hx-bob 2.2s ease-in-out infinite;
}
.hx-scroll:hover { background: rgba(255, 255, 255, 0.12); }
@keyframes hx-bob { 0%, 100% { transform: translate(-50%, 0); } 50% { transform: translate(-50%, 6px); } }
@media (prefers-reduced-motion: reduce) {
  .hx-scroll, .hx-photo, .hx-cta, .hx-mark { animation: none; }
  .hx-mark { background-size: 100% 100%; }
  .hx-eyebrow, .hx-title, .hx-text, .hx-btns { animation: none; opacity: 1; }
}
@media (max-width: 700px) {
  .hx-shade { background: rgba(11, 12, 16, 0.55); }
  .hx-inner { padding-top: 48px; padding-bottom: 88px; }
}
</style>
