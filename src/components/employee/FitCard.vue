<script setup lang="ts">
// The FitAccess membership card, drawn in CSS (no image assets).
withDefaults(
  defineProps<{
    plan?: string
    number?: string | null
    active?: boolean
    /** greyed out, for the "add your card" state */
    placeholder?: boolean
    /** banned: same number, but it can't be used until the ban is lifted */
    blocked?: boolean
    /** company's paid period ended: same number, active again after payment */
    paused?: boolean
    size?: 'md' | 'lg'
  }>(),
  { plan: 'FitAccess', number: null, active: false, placeholder: false, blocked: false, paused: false, size: 'md' },
)
</script>

<template>
  <div class="fc" :class="[`fc--${size}`, { 'fc--ph': placeholder, 'fc--blocked': blocked }]" role="img" :aria-label="`${plan} card${blocked ? ' (blocked)' : ''}`">
    <span v-if="blocked" class="fc-badge fc-badge--blocked">Blocked</span>
    <span v-else-if="paused" class="fc-badge fc-badge--paused">Paused</span>
    <span v-else-if="active" class="fc-badge">Active</span>
    <div class="fc-top">
      <span class="fc-logo">
        <img src="/logo.png" alt="" />
        FitAccess
      </span>
      <span class="fc-plan">{{ plan }}</span>
    </div>
    <svg class="fc-wave" viewBox="0 0 320 120" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 80 C 80 20, 160 120, 320 40 L320 120 L0 120 Z" />
      <path d="M0 100 C 100 50, 200 130, 320 70 L320 120 L0 120 Z" />
    </svg>
    <div class="fc-bottom">
      <span class="fc-number">{{ placeholder ? '•••• •••• ••••' : number ?? '•••• •••• ••••' }}</span>
      <span class="fc-country">ETHIOPIA</span>
    </div>
  </div>
</template>

<style scoped>
.fc {
  position: relative;
  width: 100%;
  max-width: 300px;
  aspect-ratio: 1.586;
  border-radius: 16px;
  padding: 16px 18px;
  box-sizing: border-box;
  overflow: hidden;
  color: #fff;
  background: radial-gradient(120% 140% at 0% 0%, #23262e 0%, #0b0c10 60%);
  box-shadow: 0 14px 30px rgba(11, 12, 16, 0.25);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  isolation: isolate;
}
.fc--lg { max-width: 340px; }
.fc--ph { filter: grayscale(1); opacity: 0.55; }
.fc-wave { position: absolute; inset: auto 0 0 0; width: 100%; height: 60%; z-index: -1; }
.fc-wave path:first-child { fill: rgba(139, 224, 0, 0.22); }
.fc-wave path:last-child { fill: rgba(139, 224, 0, 0.45); }
.fc-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
.fc-logo { display: inline-flex; align-items: center; gap: 6px; font-weight: 800; font-size: 15px; letter-spacing: -0.01em; }
.fc-logo img { width: 22px; height: 22px; border-radius: 6px; }
.fc-plan {
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
  color: #0b0c10; background: #8be000; padding: 3px 8px; border-radius: 999px; white-space: nowrap;
}
.fc-bottom { display: flex; justify-content: space-between; align-items: flex-end; gap: 8px; }
.fc-number { font-family: ui-monospace, 'SFMono-Regular', Menlo, monospace; font-size: 15px; letter-spacing: 0.12em; }
.fc-country { font-size: 9px; letter-spacing: 0.2em; opacity: 0.75; }
.fc-badge {
  position: absolute; top: 12px; left: -4px; z-index: 2;
  background: #16a34a; color: #fff; font-size: 11px; font-weight: 700;
  padding: 3px 10px; border-radius: 0 6px 6px 0;
}
.fc-badge + .fc-top { padding-top: 20px; }
.fc-badge--blocked { background: #dc2626; }
.fc-badge--paused { background: #d97706; }
.fc--blocked { filter: grayscale(0.85); }
.fc--blocked::after {
  content: ''; position: absolute; inset: 0; z-index: 1; pointer-events: none;
  background: repeating-linear-gradient(-45deg, rgba(220, 38, 38, 0.08) 0 10px, transparent 10px 20px);
}
</style>
