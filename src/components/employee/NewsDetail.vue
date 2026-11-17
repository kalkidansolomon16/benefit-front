<script setup lang="ts">
// Full news article (readable by every employee, card or not).
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useApi } from '@/composables/useApi'
import { formatDate, type NewsItem } from '@/composables/useEmployeePortal'

const props = defineProps<{ id: number }>()
const emit = defineEmits<{ close: [] }>()
const api = useApi()
const item = ref<NewsItem | null>(null)
const error = ref('')

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
onMounted(async () => {
  window.addEventListener('keydown', onKey)
  try {
    item.value = await api.get<NewsItem>(`employee/news/${props.id}`)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not load this article.'
  }
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <div class="nd-backdrop" @click.self="emit('close')">
      <article class="nd" role="dialog" aria-modal="true">
        <button type="button" class="nd-x" aria-label="Close" @click="emit('close')">✕</button>
        <p v-if="error" class="nd-error">{{ error }}</p>
        <template v-else-if="item">
          <img v-if="item.image_url" :src="item.image_url" alt="" class="nd-img" />
          <div class="nd-body">
            <p class="nd-meta">{{ item.category }} · {{ formatDate(item.published_at) }}</p>
            <h2 class="nd-title">{{ item.title }}</h2>
            <p v-if="item.excerpt" class="nd-lead">{{ item.excerpt }}</p>
            <div v-if="item.body" class="nd-text">{{ item.body }}</div>
            <a v-if="item.link_url" :href="item.link_url" target="_blank" rel="noopener" class="nd-link">
              {{ item.link_label || 'Learn more' }} →
            </a>
          </div>
        </template>
        <p v-else class="nd-loading">Loading…</p>
      </article>
    </div>
  </Teleport>
</template>

<style scoped>
.nd-backdrop {
  position: fixed; inset: 0; z-index: 1000; background: rgba(11, 12, 16, 0.45);
  display: flex; align-items: center; justify-content: center; padding: 16px;
}
.nd {
  position: relative; width: 100%; max-width: 720px; max-height: calc(100vh - 32px); overflow-y: auto;
  background: #fff; border-radius: 24px; font-family: var(--font-body); box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
}
.nd-x {
  position: absolute; top: 14px; right: 14px; z-index: 1; width: 36px; height: 36px; border-radius: 50%;
  border: none; background: rgba(255, 255, 255, 0.92); font-size: 16px; cursor: pointer;
}
.nd-img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; display: block; }
.nd-body { padding: 26px 30px 32px; }
.nd-meta { margin: 0 0 8px; font-size: 13px; color: #6b7280; }
.nd-title { margin: 0 0 12px; font-family: var(--font-heading); font-size: 28px; color: #0b0c10; line-height: 1.2; }
.nd-lead { margin: 0 0 16px; font-size: 16px; color: #374151; line-height: 1.55; }
.nd-text { white-space: pre-line; font-size: 15px; color: #374151; line-height: 1.65; }
.nd-link {
  display: inline-block; margin-top: 20px; padding: 12px 20px; border-radius: 14px; background: #0b0c10;
  color: #fff; text-decoration: none; font-weight: 700; font-size: 14px;
}
.nd-link:hover { background: #8be000; color: #0b0c10; }
.nd-loading, .nd-error { padding: 40px; text-align: center; color: #6b7280; }
.nd-error { color: #dc2626; }
@media (max-width: 520px) { .nd-body { padding: 20px; } .nd-title { font-size: 22px; } }
</style>
