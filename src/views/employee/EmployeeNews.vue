<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useApi } from '@/composables/useApi'
import type { NewsItem } from '@/composables/useEmployeePortal'
import ContentCard from '@/components/employee/ContentCard.vue'
import NewsDetail from '@/components/employee/NewsDetail.vue'

const api = useApi()
const items = ref<NewsItem[]>([])
const categories = ref<string[]>([])
const category = ref('')
const loading = ref(true)
const error = ref('')
const open = ref<number | null>(null)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get<{ data: NewsItem[]; categories: string[] }>(
      `employee/news${category.value ? `?category=${encodeURIComponent(category.value)}` : ''}`,
    )
    items.value = res.data
    categories.value = res.categories
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not load news.'
  } finally {
    loading.value = false
  }
}
onMounted(load)
watch(category, load)
</script>

<template>
  <div class="en">
    <h1 class="en-h1">News</h1>

    <div class="en-pills" role="tablist" aria-label="Filter by category">
      <button type="button" :class="{ on: !category }" @click="category = ''">Browse</button>
      <button v-for="c in categories" :key="c" type="button" :class="{ on: category === c }" @click="category = c">
        {{ c }}
      </button>
    </div>

    <p v-if="loading" class="en-msg">Loading news…</p>
    <p v-else-if="error" class="en-msg error">{{ error }}</p>
    <p v-else-if="!items.length" class="en-msg">No news yet. Check back soon.</p>
    <div v-else class="en-grid">
      <ContentCard
        v-for="n in items"
        :key="n.id"
        :image="n.image_url"
        :category="n.category"
        :title="n.title"
        :excerpt="n.excerpt"
        badge="Read"
        badge-icon="read"
        @open="open = n.id"
      />
    </div>

    <NewsDetail v-if="open" :id="open" @close="open = null" />
  </div>
</template>

<style scoped>
.en { display: flex; flex-direction: column; gap: 24px; }
.en-h1 { margin: 0; font-family: var(--font-heading); font-size: 42px; font-weight: 600; color: #1f2937; }
.en-pills { display: flex; gap: 8px; flex-wrap: wrap; }
.en-pills button {
  padding: 13px 22px; border-radius: 999px; border: 1px solid #e5e7eb; background: #fff; color: #374151;
  font-size: 15px; font-family: inherit; cursor: pointer;
}
.en-pills button.on { border-color: #0b0c10; color: #0b0c10; font-weight: 600; }
.en-pills button:hover { border-color: #8be000; }
.en-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
.en-msg { margin: 0; color: #6b7280; }
.en-msg.error { color: #dc2626; }
@media (max-width: 600px) { .en-h1 { font-size: 30px; } }
</style>
