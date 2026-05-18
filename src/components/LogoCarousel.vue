<script setup lang="ts">
const logos = [
  { name: 'Commercial Bank of Ethiopia', emoji: '🏦' },
  { name: 'Ethiopian Airlines', emoji: '✈️' },
  { name: 'Ethio Telecom', emoji: '📡' },
  { name: 'Awash Bank', emoji: '💳' },
  { name: 'Dashen Bank', emoji: '🏛️' },
  { name: 'Bank of Abyssinia', emoji: '💰' },
  { name: 'UNDP Ethiopia', emoji: '🌍' },
  { name: 'GIZ Ethiopia', emoji: '🤝' },
  { name: 'Zemen Bank', emoji: '🏧' },
  { name: 'Ethiopian Electric Power', emoji: '⚡' },
  { name: 'Oromia Bank', emoji: '🌿' },
  { name: 'Wegagen Bank', emoji: '📊' },
  { name: 'WHO Ethiopia', emoji: '🏥' },
  { name: 'African Union', emoji: '🌐' },
]
</script>

<template>
  <section class="carousel-section">
    <div class="container">
      <p class="carousel-label">Trusted by leading Ethiopian organizations including</p>
    </div>
    <div class="carousel-track-wrapper">
      <div class="carousel-track">
        <div v-for="(logo, i) in [...logos, ...logos]" :key="`logo-${i}`" class="logo-item">
          <span class="logo-emoji">{{ logo.emoji }}</span>
          <span class="logo-name">{{ logo.name }}</span>
        </div>
      </div>
    </div>
    <div class="fade-left"></div>
    <div class="fade-right"></div>
  </section>
</template>

<style scoped>
.carousel-section {
  background: var(--color-bg-soft);
  padding: 48px 0;
  overflow: hidden;
  position: relative;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}
.carousel-label {
  text-align: center;
  font-size: 0.9rem;
  color: var(--color-text-muted);
  font-weight: 500;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  margin-bottom: 28px;
}
.carousel-track-wrapper { overflow: hidden; }
.carousel-track {
  display: flex;
  gap: 16px;
  width: max-content;
  animation: scrollTrack 35s linear infinite;
}
.carousel-track:hover { animation-play-state: paused; }
@keyframes scrollTrack {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
.logo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  white-space: nowrap;
  transition: var(--transition);
  cursor: default;
}
.logo-item:hover {
  border-color: var(--color-accent);
  box-shadow: var(--color-card-shadow);
  transform: translateY(-2px);
}
.logo-emoji { font-size: 1.3rem; }
.logo-name  { font-size: 0.9rem; font-weight: 600; color: var(--color-text-muted); }
.fade-left, .fade-right {
  position: absolute; top: 0; bottom: 0;
  width: 120px; pointer-events: none; z-index: 2;
}
.fade-left  { left: 0;  background: linear-gradient(to right, var(--color-bg-soft), transparent); }
.fade-right { right: 0; background: linear-gradient(to left,  var(--color-bg-soft), transparent); }
</style>
