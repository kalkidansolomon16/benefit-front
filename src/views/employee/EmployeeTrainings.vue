<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useApi } from '@/composables/useApi'
import {
  TRAINING_LABELS,
  formatDuration,
  useEmployeePortal,
  type TrainingItem,
} from '@/composables/useEmployeePortal'
import ContentCard from '@/components/employee/ContentCard.vue'
import TrainingDetail from '@/components/employee/TrainingDetail.vue'

const api = useApi()
const portal = useEmployeePortal()
const items = ref<TrainingItem[]>([])
const categories = ref<string[]>([])
const category = ref('')
const loading = ref(true)
const error = ref('')
const open = ref<number | null>(null)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get<{ data: TrainingItem[]; categories: string[] }>(
      `employee/trainings${category.value ? `?category=${encodeURIComponent(category.value)}` : ''}`,
    )
    items.value = res.data
    categories.value = res.categories
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not load trainings.'
  } finally {
    loading.value = false
  }
}
onMounted(load)
watch(category, load)

function show(t: TrainingItem) {
  portal.requireCard(
    'The training is ready!',
    'Add your FitAccess card to your account to unlock all portal features, including trainings.',
    () => (open.value = t.id),
  )
}
function onChanged(joined: boolean) {
  const t = items.value.find((x) => x.id === open.value)
  if (t) t.joined = joined
}
</script>

<template>
  <div class="et">
    <h1 class="et-h1">Trainings</h1>

    <div class="et-pills" role="tablist" aria-label="Filter by category">
      <button type="button" :class="{ on: !category }" @click="category = ''">Browse</button>
      <button v-for="c in categories" :key="c" type="button" :class="{ on: category === c }" @click="category = c">
        {{ TRAINING_LABELS[c] ?? c }}
      </button>
    </div>

    <p v-if="loading" class="et-msg">Loading trainings…</p>
    <p v-else-if="error" class="et-msg error">{{ error }}</p>
    <p v-else-if="!items.length" class="et-msg">No trainings in this category yet.</p>
    <div v-else class="et-grid">
      <ContentCard
        v-for="t in items"
        :key="t.id"
        :image="t.image_url"
        :category="TRAINING_LABELS[t.category] ?? t.category"
        :title="t.title"
        :badge="formatDuration(t.duration_minutes) || undefined"
        badge-icon="time"
        :locked="!portal.activated.value"
        :joined="t.joined"
        @open="show(t)"
      />
    </div>

    <TrainingDetail v-if="open" :id="open" @close="open = null" @changed="onChanged" />
  </div>
</template>

<style scoped>
.et { display: flex; flex-direction: column; gap: 24px; }
.et-h1 { margin: 0; font-family: var(--font-heading); font-size: 42px; font-weight: 600; color: #1f2937; }
.et-pills { display: flex; gap: 8px; flex-wrap: wrap; }
.et-pills button {
  padding: 13px 22px; border-radius: 999px; border: 1px solid #e5e7eb; background: #fff; color: #374151;
  font-size: 15px; font-family: inherit; cursor: pointer;
}
.et-pills button.on { border-color: #0b0c10; color: #0b0c10; font-weight: 600; }
.et-pills button:hover { border-color: #8be000; }
.et-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
.et-msg { margin: 0; color: #6b7280; }
.et-msg.error { color: #dc2626; }
@media (max-width: 600px) { .et-h1 { font-size: 30px; } }
</style>
