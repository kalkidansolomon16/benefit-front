<script setup lang="ts">
import { ref } from 'vue'
import { useApi } from '@/composables/useApi'

export interface Crowd {
  inside_now: number
  today_checkins: number
  selected_today: number
  capacity: number
  percent: number
  level: 'quiet' | 'moderate' | 'busy' | 'full'
  level_label: string
}

interface Person { name: string; is_me: boolean; since: string | null; minutes_ago: number }

const props = defineProps<{ crowd?: Crowd | null; gymId?: number }>()

const api = useApi()
const open = ref(false)
const loading = ref(false)
const error = ref('')
const people = ref<Person[]>([])
const hidden = ref(0)

async function fetchPeople() {
  if (!props.gymId) return
  loading.value = true
  error.value = ''
  try {
    const res = await api.get<{ people: Person[]; hidden_count: number }>(`employee/gyms/${props.gymId}/occupants`)
    people.value = res.people
    hidden.value = res.hidden_count
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Could not load who is there.'
  } finally {
    loading.value = false
  }
}

async function toggle(ev: Event) {
  // the card itself may be a button / clickable: don't let this toggle select it
  ev.stopPropagation()
  open.value = !open.value
  if (open.value) await fetchPeople()
}

function ago(m: number): string {
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  return `${Math.floor(m / 60)}h ${m % 60}m ago`
}
</script>

<template>
  <div v-if="crowd" class="crowd" :class="'crowd--' + crowd.level">
    <div class="crowd-top">
      <span class="crowd-level">
        <span class="crowd-dot"></span>{{ crowd.level_label }} right now
      </span>
      <span class="crowd-pct">{{ crowd.inside_now }} / {{ crowd.capacity }}</span>
    </div>
    <div class="crowd-bar" role="progressbar" :aria-valuenow="crowd.percent" aria-valuemin="0" aria-valuemax="100">
      <span class="crowd-fill" :style="{ width: Math.max(crowd.percent, crowd.inside_now ? 4 : 0) + '%' }"></span>
    </div>
    <p class="crowd-stats">
      <span><strong>{{ crowd.inside_now }}</strong> working out now</span>
      <span><strong>{{ crowd.today_checkins }}</strong> checked in today</span>
      <span><strong>{{ crowd.selected_today }}</strong> planning to come</span>
    </p>

    <template v-if="gymId">
      <span class="crowd-toggle" role="button" tabindex="0" @click="toggle" @keydown.enter.stop.prevent="toggle($event)">
        {{ open ? 'Hide who is there' : `See who is there (${crowd.inside_now})` }}
      </span>

      <div v-if="open" class="crowd-people" @click.stop>
        <p v-if="loading" class="crowd-note">Loading…</p>
        <p v-else-if="error" class="crowd-note crowd-note--err">{{ error }}</p>
        <template v-else>
          <p v-if="!people.length && !hidden" class="crowd-note">Nobody is working out here right now.</p>
          <ul v-else class="crowd-list">
            <li v-for="(p, i) in people" :key="i" :class="{ me: p.is_me }">
              <span class="crowd-avatar">{{ p.name.slice(0, 1) }}</span>
              <span class="crowd-name">{{ p.name }}</span>
              <span class="crowd-since">{{ p.since }} · {{ ago(p.minutes_ago) }}</span>
            </li>
          </ul>
          <p v-if="hidden" class="crowd-note">+ {{ hidden }} more who prefer not to be shown</p>
          <span class="crowd-refresh" role="button" tabindex="0" @click.stop="fetchPeople">Refresh</span>
        </template>
      </div>
    </template>
  </div>
</template>

<style scoped>
.crowd { margin-top: 10px; padding: 10px 12px; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0; text-align: left; }
.crowd-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 0.78rem; font-weight: 700; }
.crowd-level { display: inline-flex; align-items: center; gap: 6px; }
.crowd-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
.crowd-pct { font-weight: 600; }
.crowd-bar { height: 6px; border-radius: 999px; background: #e2e8f0; overflow: hidden; margin: 7px 0 8px; }
.crowd-fill { display: block; height: 100%; border-radius: 999px; background: currentColor; transition: width 0.3s; }
.crowd-stats { margin: 0; display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 0.74rem; color: #64748b; }
.crowd-stats strong { color: #0f172a; }
.crowd--quiet    .crowd-top, .crowd--quiet    .crowd-bar { color: #16a34a; }
.crowd--moderate .crowd-top, .crowd--moderate .crowd-bar { color: #ca8a04; }
.crowd--busy     .crowd-top, .crowd--busy     .crowd-bar { color: #ea580c; }
.crowd--full     .crowd-top, .crowd--full     .crowd-bar { color: #dc2626; }
.crowd-pct { color: #64748b !important; }
.crowd-toggle, .crowd-refresh { display: inline-block; margin-top: 8px; font-size: 0.76rem; font-weight: 700; color: #4D7C0F; cursor: pointer; }
.crowd-toggle:hover, .crowd-refresh:hover { text-decoration: underline; }
.crowd-people { margin-top: 6px; padding-top: 8px; border-top: 1px dashed #e2e8f0; }
.crowd-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; max-height: 190px; overflow-y: auto; }
.crowd-list li { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: #0f172a; }
.crowd-list li.me .crowd-name { font-weight: 700; }
.crowd-avatar { width: 22px; height: 22px; border-radius: 50%; background: #EEF9DC; color: #4D7C0F; display: inline-flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; flex-shrink: 0; }
.crowd-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.crowd-since { font-size: 0.72rem; color: #94a3b8; white-space: nowrap; }
.crowd-note { margin: 4px 0 0; font-size: 0.76rem; color: #64748b; }
.crowd-note--err { color: #dc2626; }
</style>
