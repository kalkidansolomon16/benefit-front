<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

// Hero with a cut-out person standing on organic blobs plus playful
// decorations (dot halftone, rings, zigzags) — modelled on the inspiration.
const props = withDefaults(defineProps<{
  theme?: 'gray' | 'green' | 'black' | 'white' | 'white-dark'
  eyebrow?: string
  image: string
  alt: string
  ctaLabel: string
  ctaTo: string | { path: string; hash?: string }
  secondaryLabel?: string
  secondaryTo?: string | { path: string; hash?: string }
  secondaryHref?: string
}>(), { theme: 'gray' })

// Halftone dot field: dots shrink with distance from the top-left corner
const dots = computed(() => {
  const out: { x: number; y: number; r: number }[] = []
  for (let row = 0; row < 14; row++) {
    for (let col = 0; col < 9; col++) {
      const x = col * 16 + (row % 2) * 8
      const y = row * 14
      const d = Math.hypot(col / 9, (row - 5) / 14)
      const r = Math.max(0, 5.2 - d * 6.2)
      if (r > 0.6) out.push({ x, y, r })
    }
  }
  return out
})

const isLinkSecondary = computed(() => !!props.secondaryTo)
</script>

<template>
  <header class="bh" :class="`bh--${theme}`">
    <div class="lp-container bh-inner">
      <div class="bh-content">
        <span v-if="eyebrow" class="bh-eyebrow">{{ eyebrow }}</span>
        <h1 class="lp-h1 bh-title"><slot name="title" /></h1>
        <p class="bh-text"><slot name="text" /></p>
        <div class="lp-btn-row">
          <RouterLink :to="ctaTo" class="lp-btn bh-cta">{{ ctaLabel }}</RouterLink>
          <RouterLink v-if="isLinkSecondary && secondaryTo" :to="secondaryTo" class="lp-btn bh-secondary">{{ secondaryLabel }}</RouterLink>
          <a v-else-if="secondaryHref" :href="secondaryHref" class="lp-btn bh-secondary">{{ secondaryLabel }}</a>
        </div>
      </div>

      <div class="bh-visual" aria-hidden="false">
        <!-- decorations -->
        <svg class="bh-deco bh-halftone" viewBox="0 0 150 190" aria-hidden="true">
          <circle v-for="(d, i) in dots" :key="i" :cx="d.x + 6" :cy="d.y + 6" :r="d.r" />
        </svg>
        <svg class="bh-deco bh-zig bh-zig--1" viewBox="0 0 110 24" aria-hidden="true"><path d="M3 5l17 14 17-14 17 14 17-14 17 14 17-14" /></svg>
        <svg class="bh-deco bh-zig bh-zig--2" viewBox="0 0 64 16" aria-hidden="true"><path d="M2 4l10 8 10-8 10 8 10-8 10 8 10-8" /></svg>
        <svg class="bh-deco bh-x" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 3l14 14M17 3L3 17" /></svg>
        <span class="bh-deco bh-ring bh-ring--1"></span>
        <span class="bh-deco bh-ring bh-ring--2"></span>
        <span class="bh-deco bh-dot bh-dot--1"></span>
        <span class="bh-deco bh-dot bh-dot--2"></span>
        <span class="bh-deco bh-dot bh-dot--3"></span>
        <svg class="bh-deco bh-orbit" viewBox="0 0 600 420" aria-hidden="true" preserveAspectRatio="none">
          <path d="M40 330C-20 230 120 120 300 70S600 40 560 150 380 400 220 400 80 390 40 330z" />
        </svg>

        <!-- blobs -->
        <svg class="bh-blob bh-blob--back" viewBox="0 0 500 500" aria-hidden="true">
          <path d="M412 318Q390 392 322 428Q254 464 184 434Q114 404 82 338Q50 272 76 200Q102 128 166 92Q230 56 302 74Q374 92 404 162Q434 232 412 318Z" />
        </svg>
        <svg class="bh-blob bh-blob--front" viewBox="0 0 500 500" aria-hidden="true">
          <path d="M428 302Q408 380 336 420Q264 460 190 432Q116 404 78 336Q40 268 66 192Q92 116 162 80Q232 44 306 70Q380 96 414 160Q448 224 428 302Z" />
        </svg>

        <img :src="image" :alt="alt" class="bh-person" />
      </div>
    </div>
  </header>
</template>

<style scoped>
.bh {
  --bh-bg: var(--lp-gray);
  --bh-ink: var(--lp-ink);
  --bh-blob: var(--lp-ink);
  --bh-blob-back: var(--lp-green);
  --bh-deco: var(--lp-ink);
  --bh-dots: var(--lp-green);
  position: relative;
  background: var(--bh-bg);
  color: var(--bh-ink);
  overflow: hidden;
}
.bh--green {
  --bh-bg: var(--lp-green);
  --bh-ink: var(--lp-ink);
  --bh-blob: #ffffff;
  --bh-blob-back: var(--lp-ink);
  --bh-deco: var(--lp-ink);
  --bh-dots: var(--lp-ink);
}
.bh--white {
  --bh-bg: #ffffff;
  --bh-ink: var(--lp-ink);
  --bh-blob: var(--lp-green);
  --bh-blob-back: var(--lp-ink);
  --bh-deco: var(--lp-ink);
  --bh-dots: var(--lp-green);
}
.bh--white-dark {
  --bh-bg: #ffffff;
  --bh-ink: var(--lp-ink);
  --bh-blob: var(--lp-ink);
  --bh-blob-back: var(--lp-green);
  --bh-deco: var(--lp-ink);
  --bh-dots: var(--lp-green);
}
.bh--black {
  --bh-bg: var(--lp-ink);
  --bh-ink: #ffffff;
  --bh-blob: var(--lp-green);
  --bh-blob-back: #ffffff;
  --bh-deco: #ffffff;
  --bh-dots: var(--lp-green);
}

.bh-inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 40px;
  min-height: min(calc(88vh - 84px), 720px);
  padding-top: 40px;
  padding-bottom: 60px;
}
.bh-content { display: flex; flex-direction: column; gap: 1.6rem; position: relative; z-index: 3; }
.bh-eyebrow {
  align-self: flex-start;
  font-size: .85rem;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--bh-ink);
  border-bottom: 4px solid var(--bh-dots);
  padding-bottom: 4px;
}
.bh--green .bh-eyebrow { border-color: var(--lp-ink); }
.bh-title { color: var(--bh-ink); font-size: clamp(2.4rem, 4.6vw, 4rem); }
.bh-title :deep(.lp-mark) { color: inherit; }
.bh--black .bh-title :deep(.lp-mark) { background: none; color: var(--lp-green); padding: 0; }
.bh--green .bh-title :deep(.lp-mark) { background: linear-gradient(transparent 62%, #fff 62%, #fff 92%, transparent 92%); }
.bh-text { font-size: 1.3rem; line-height: 1.55; color: var(--bh-ink); max-width: 560px; }

/* Buttons per theme */
.bh-cta { background: var(--lp-green); color: var(--lp-ink); }
.bh-cta:hover { background: var(--lp-green-dark); }
.bh--green .bh-cta { background: var(--lp-ink); color: #fff; }
.bh--green .bh-cta:hover { background: #24262d; }
.bh-secondary { background: transparent; border-color: var(--bh-ink); color: var(--bh-ink); }
.bh-secondary:hover { background: var(--bh-ink); color: var(--bh-bg); }
.bh--gray .bh-secondary:hover,
.bh--white .bh-secondary:hover,
.bh--white-dark .bh-secondary:hover { color: #fff; }

/* ── Visual ── */
.bh-visual {
  position: relative;
  width: 100%;
  max-width: 600px;
  aspect-ratio: 1 / 1;
  justify-self: end;
}
.bh-blob { position: absolute; }
.bh-blob path { fill: var(--bh-blob); }
.bh-blob--front { left: -6%; top: 2%; width: 108%; height: 104%; z-index: 1; }
.bh-blob--back  { left: 6%; top: 6%; width: 104%; height: 100%; z-index: 0; transform: rotate(16deg); }
.bh-blob--back path { fill: var(--bh-blob-back); }
.bh-person {
  position: absolute;
  z-index: 2;
  left: 50%;
  bottom: 9%;
  height: 92%;
  width: auto;
  max-width: 86%;
  object-fit: contain;
  object-position: bottom center;
  transform: translateX(-46%);
  /* fade the cut at the bottom into the blob */
  -webkit-mask-image: linear-gradient(to bottom, #000 78%, transparent 99%);
          mask-image: linear-gradient(to bottom, #000 78%, transparent 99%);
}

.bh-deco { position: absolute; pointer-events: none; z-index: 0; }
.bh-halftone { right: -6%; top: 16%; width: 30%; z-index: 0; }
.bh-halftone circle { fill: var(--bh-dots); }
.bh-zig path, .bh-x path { fill: none; stroke: var(--bh-deco); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.bh-zig--1 { right: 2%; bottom: 4%; width: 18%; z-index: 3; }
.bh-zig--2 { left: -10%; top: 38%; width: 10%; }
.bh-x { right: 6%; top: 52%; width: 4%; }
.bh-ring { border: 4px solid var(--bh-deco); border-radius: 50%; }
.bh-ring--1 { left: 12%; top: 6%; width: 11%; aspect-ratio: 1; }
.bh-ring--2 { right: 8%; bottom: 14%; width: 9%; aspect-ratio: 1; border-color: var(--bh-dots); z-index: 3; }
.bh--green .bh-ring--2 { border-color: #fff; }
.bh-dot { border-radius: 50%; background: var(--bh-deco); }
.bh-dot--1 { left: 8%; top: 2%; width: 2.4%; aspect-ratio: 1; }
.bh-dot--2 { right: 4%; top: 6%; width: 5.5%; aspect-ratio: 1; background: var(--bh-dots); }
.bh--green .bh-dot--2 { background: #fff; }
.bh-dot--3 { right: 14%; bottom: -1%; width: 2.4%; aspect-ratio: 1; }
.bh-orbit { left: -4%; top: 22%; width: 108%; height: 78%; z-index: 1; opacity: .55; }
.bh-orbit path { fill: none; stroke: var(--bh-deco); stroke-width: 2; }

@media (max-width: 991px) {
  .bh-inner { grid-template-columns: 1fr; text-align: center; min-height: 0; padding-top: 24px; }
  .bh-content { align-items: center; }
  .bh-eyebrow { align-self: center; }
  .bh-text { margin: 0 auto; }
  .bh .lp-btn-row { justify-content: center; }
  .bh-visual { order: -1; max-width: 420px; justify-self: center; }
}
</style>
