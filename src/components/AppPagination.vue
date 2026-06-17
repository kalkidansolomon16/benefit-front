<template>
  <div v-if="totalPages >= 1" class="apg">
    <!-- Prev -->
    <button class="apg-btn" :disabled="page <= 1" @click="emit('update:page', page - 1)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </button>

    <!-- Page numbers -->
    <template v-for="n in visiblePages" :key="n">
      <span v-if="n === '...'" class="apg-ellipsis">…</span>
      <button
        v-else
        class="apg-btn apg-num"
        :class="{ 'apg-num--active': n === page }"
        @click="emit('update:page', n as number)"
      >{{ n }}</button>
    </template>

    <!-- Next -->
    <button class="apg-btn" :disabled="page >= totalPages" @click="emit('update:page', page + 1)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </button>

    <!-- Info text -->
    <span class="apg-info">
      {{ ((page - 1) * perPage) + 1 }}–{{ Math.min(page * perPage, total) }} of {{ total }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  page: number
  totalPages: number
  total: number
  perPage: number
}>()

const emit = defineEmits<{ 'update:page': [n: number] }>()

const visiblePages = computed(() => {
  const { page, totalPages: tp } = props
  if (tp <= 7) return Array.from({ length: tp }, (_, i) => i + 1)

  const pages: (number | '...')[] = []
  if (page <= 4) {
    pages.push(1, 2, 3, 4, 5, '...', tp)
  } else if (page >= tp - 3) {
    pages.push(1, '...', tp - 4, tp - 3, tp - 2, tp - 1, tp)
  } else {
    pages.push(1, '...', page - 1, page, page + 1, '...', tp)
  }
  return pages
})
</script>

<style scoped>
.apg {
  display: flex; align-items: center; justify-content: center;
  gap: 4px; flex-wrap: wrap; padding: 12px 0 4px;
}
.apg-btn {
  min-width: 32px; height: 32px; padding: 0 6px;
  border-radius: 8px; border: 1.5px solid #e2e8f0;
  background: #fff; color: #475569; font-size: 0.82rem; font-weight: 500;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.15s; font-family: inherit;
}
.apg-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.apg-btn:not(:disabled):hover { border-color: #4CD964; color: #4CD964; }
.apg-num--active {
  background: #0f172a; border-color: #0f172a; color: #fff !important;
  font-weight: 700;
}
.apg-num--active:hover { background: #0f172a !important; }
.apg-ellipsis { color: #94a3b8; padding: 0 4px; font-size: 0.82rem; line-height: 32px; }
.apg-info {
  font-size: 0.76rem; color: #94a3b8; margin-left: 8px; white-space: nowrap;
}
</style>
