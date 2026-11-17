<script setup lang="ts">
// Training details with Join / Leave (only opened for activated cards).
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useApi } from '@/composables/useApi'
import {
  TRAINING_LABELS,
  formatDate,
  formatDuration,
  type TrainingItem,
} from '@/composables/useEmployeePortal'

const props = defineProps<{ id: number }>()
const emit = defineEmits<{ close: []; changed: [joined: boolean] }>()
const api = useApi()
const item = ref<TrainingItem | null>(null)
const error = ref('')
const busy = ref(false)
const note = ref('')

const isFull = computed(
  () => !!item.value?.max_participants && !item.value.joined && (item.value.participants ?? 0) >= item.value.max_participants,
)

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
onMounted(async () => {
  window.addEventListener('keydown', onKey)
  try {
    item.value = await api.get<TrainingItem>(`employee/trainings/${props.id}`)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not load this training.'
  }
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

async function toggleJoin() {
  if (!item.value || busy.value) return
  busy.value = true
  note.value = ''
  try {
    const path = `employee/trainings/${item.value.id}/join`
    const res = item.value.joined
      ? await api.delete<{ message: string; joined: boolean }>(path)
      : await api.post<{ message: string; joined: boolean }>(path)
    item.value.participants = (item.value.participants ?? 0) + (res.joined ? 1 : -1)
    item.value.joined = res.joined
    note.value = res.message
    emit('changed', res.joined)
  } catch (e) {
    note.value = e instanceof Error ? e.message : 'Something went wrong.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="td-backdrop" @click.self="emit('close')">
      <article class="td" role="dialog" aria-modal="true">
        <button type="button" class="td-x" aria-label="Close" @click="emit('close')">✕</button>
        <p v-if="error" class="td-msg error">{{ error }}</p>
        <template v-else-if="item">
          <div class="td-media">
            <img v-if="item.image_url" :src="item.image_url" alt="" />
            <span v-if="item.duration_minutes" class="td-chip">{{ formatDuration(item.duration_minutes) }}</span>
          </div>
          <div class="td-body">
            <p class="td-cat">{{ TRAINING_LABELS[item.category] ?? item.category }}</p>
            <h2 class="td-title">{{ item.title }}</h2>
            <ul class="td-facts">
              <li v-if="item.is_online">Online</li>
              <li v-else-if="item.location">📍 {{ item.location }}</li>
              <li v-if="item.start_date">📅 {{ formatDate(item.start_date) }}<template v-if="item.end_date"> – {{ formatDate(item.end_date) }}</template></li>
              <li v-if="item.provider">👤 {{ item.provider }}</li>
              <li v-if="item.max_participants">{{ item.participants ?? 0 }} / {{ item.max_participants }} joined</li>
            </ul>
            <p v-if="item.description" class="td-desc">{{ item.description }}</p>
            <div class="td-actions">
              <a v-if="item.video_url" :href="item.video_url" target="_blank" rel="noopener" class="td-btn">▶ Start training</a>
              <button
                type="button"
                class="td-btn"
                :class="{ ghost: item.joined || !!item.video_url }"
                :disabled="busy || isFull"
                @click="toggleJoin"
              >
                {{ busy ? '…' : item.joined ? 'Leave training' : isFull ? 'Training is full' : 'Join training' }}
              </button>
            </div>
            <p v-if="note" class="td-msg">{{ note }}</p>
          </div>
        </template>
        <p v-else class="td-msg">Loading…</p>
      </article>
    </div>
  </Teleport>
</template>

<style scoped>
.td-backdrop {
  position: fixed; inset: 0; z-index: 1000; background: rgba(11, 12, 16, 0.45);
  display: flex; align-items: center; justify-content: center; padding: 16px;
}
.td {
  position: relative; width: 100%; max-width: 680px; max-height: calc(100vh - 32px); overflow-y: auto;
  background: #fff; border-radius: 24px; font-family: var(--font-body); box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
}
.td-x {
  position: absolute; top: 14px; right: 14px; z-index: 1; width: 36px; height: 36px; border-radius: 50%;
  border: none; background: rgba(255, 255, 255, 0.92); font-size: 16px; cursor: pointer;
}
.td-media { position: relative; aspect-ratio: 16 / 9; background: radial-gradient(120% 120% at 100% 0%, rgba(139, 224, 0, 0.55), #0b0c10 65%); }
.td-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
.td-chip { position: absolute; right: 14px; bottom: 14px; background: rgba(11, 12, 16, 0.82); color: #fff; padding: 6px 10px; border-radius: 8px; font-size: 13px; font-weight: 600; }
.td-body { padding: 24px 28px 30px; }
.td-cat { margin: 0 0 6px; font-size: 13px; color: #6b7280; }
.td-title { margin: 0 0 12px; font-family: var(--font-heading); font-size: 26px; color: #0b0c10; }
.td-facts { list-style: none; margin: 0 0 14px; padding: 0; display: flex; flex-wrap: wrap; gap: 8px; }
.td-facts li { background: #f3fce6; color: #3f6212; font-size: 13px; padding: 5px 10px; border-radius: 999px; }
.td-desc { margin: 0 0 20px; white-space: pre-line; color: #374151; line-height: 1.6; font-size: 15px; }
.td-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.td-btn {
  padding: 13px 20px; border-radius: 14px; border: 1.5px solid #0b0c10; background: #0b0c10; color: #fff;
  font-weight: 700; font-size: 14px; font-family: inherit; cursor: pointer; text-decoration: none;
}
.td-btn:hover:not(:disabled) { background: #8be000; border-color: #8be000; color: #0b0c10; }
.td-btn.ghost { background: #fff; color: #0b0c10; border-color: #e5e7eb; }
.td-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.td-msg { margin: 14px 0 0; font-size: 13px; color: #4b5563; }
.td > .td-msg { padding: 40px; text-align: center; }
.td-msg.error { color: #dc2626; }
</style>
