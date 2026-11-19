<script setup lang="ts">
// Dashboard section: title, "More →" link and a horizontally scrolling row.
import { ref } from 'vue'

defineProps<{ title: string; more?: string; empty?: string; count: number }>()
const track = ref<HTMLDivElement | null>(null)

function scroll(dir: 1 | -1) {
  const el = track.value
  if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' })
}
</script>

<template>
  <section class="cr">
    <div class="cr-head">
      <h2 class="cr-title">{{ title }}</h2>
      <RouterLink v-if="more && count" :to="more" class="cr-more">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h16M14 6l6 6-6 6" /></svg>
        More
      </RouterLink>
    </div>
    <p v-if="!count" class="cr-empty">{{ empty ?? 'Nothing here yet.' }}</p>
    <div v-else class="cr-wrap">
      <button type="button" class="cr-arrow left" aria-label="Scroll left" @click="scroll(-1)">‹</button>
      <div ref="track" class="cr-track">
        <slot />
      </div>
      <button type="button" class="cr-arrow right" aria-label="Scroll right" @click="scroll(1)">›</button>
    </div>
  </section>
</template>

<style scoped>
.cr { display: flex; flex-direction: column; gap: 18px; }
.cr-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.cr-title { margin: 0; font-family: var(--font-heading); font-size: 30px; font-weight: 600; color: #1f2937; }
.cr-more { display: inline-flex; align-items: center; gap: 6px; color: #1f2937; text-decoration: none; font-weight: 600; font-size: 14px; }
.cr-more:hover { color: #0b0c10; text-decoration: underline; }
.cr-empty { margin: 0; color: #9ca3af; font-size: 14px; }
.cr-wrap { position: relative; }
.cr-track {
  display: grid; grid-auto-flow: column; grid-auto-columns: minmax(240px, calc((100% - 48px) / 4));
  gap: 16px; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; padding-bottom: 4px;
}
.cr-track::-webkit-scrollbar { display: none; }
.cr-track > :deep(*) { scroll-snap-align: start; }
.cr-arrow {
  position: absolute; top: 28%; z-index: 2; width: 44px; height: 44px; border-radius: 50%;
  border: 1px solid #e5e7eb; background: #fff; color: #0b0c10; font-size: 24px; line-height: 1;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12); cursor: pointer;
}
.cr-arrow.left { left: -14px; }
.cr-arrow.right { right: -14px; }
.cr-arrow:hover { background: #8be000; border-color: #8be000; }
@media (max-width: 900px) { .cr-track { grid-auto-columns: minmax(220px, 70%); } .cr-arrow { display: none; } }
@media (max-width: 600px) { .cr-title { font-size: 24px; } }
</style>
