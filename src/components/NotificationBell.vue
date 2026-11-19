<script setup lang="ts">
// Portal notifications for HR and employees: a bell with the unread count and
// a list, plus a pop-up right after sign-in when there is something new.
// Every notice here was also sent by email.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi'

interface Note {
  id: number
  title: string
  body: string
  kind: string
  link: string | null
  is_read: boolean
  created_at: string | null
}

const props = withDefaults(defineProps<{ dark?: boolean }>(), { dark: false })

const api = useApi()
const router = useRouter()
const items = ref<Note[]>([])
const unread = ref(0)
const open = ref(false)
const popup = ref(false)
const root = ref<HTMLElement | null>(null)
let timer: ReturnType<typeof setInterval> | null = null

const SEEN_KEY = 'fa_notes_popup'
const latestUnread = computed(() => items.value.filter((n) => !n.is_read).slice(0, 3))

async function load(showPopup = false) {
  try {
    const res = await api.get<{ data: Note[]; unread: number }>('portal/notifications?limit=30')
    items.value = res.data
    unread.value = res.unread
    if (showPopup && res.unread > 0) {
      // Once per sign-in session
      let seen = ''
      try { seen = sessionStorage.getItem(SEEN_KEY) ?? '' } catch { /* storage blocked */ }
      const newest = String(res.data.find((n) => !n.is_read)?.id ?? '')
      if (seen !== newest) {
        popup.value = true
        try { sessionStorage.setItem(SEEN_KEY, newest) } catch { /* ignore */ }
      }
    }
  } catch {
    /* the bell stays quiet if the list can't be loaded */
  }
}

async function openItem(n: Note) {
  if (!n.is_read) {
    n.is_read = true
    unread.value = Math.max(0, unread.value - 1)
    api.post(`portal/notifications/${n.id}/read`).catch(() => {})
  }
  open.value = false
  popup.value = false
  if (n.link) router.push(n.link)
}

async function markAll() {
  items.value.forEach((n) => (n.is_read = true))
  unread.value = 0
  popup.value = false
  await api.post('portal/notifications/read-all').catch(() => {})
}

function toggle() {
  open.value = !open.value
  popup.value = false
  if (open.value) load()
}

function onDoc(e: MouseEvent) {
  if (open.value && root.value && !root.value.contains(e.target as Node)) open.value = false
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') { open.value = false; popup.value = false }
}

function ago(iso: string | null): string {
  if (!iso) return ''
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

onMounted(() => {
  load(true)
  timer = setInterval(() => load(), 60_000)
  document.addEventListener('mousedown', onDoc)
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
  document.removeEventListener('mousedown', onDoc)
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div ref="root" class="nb" :class="{ 'nb--dark': props.dark }">
    <button
      type="button"
      class="nb-btn"
      :aria-label="unread ? `Notifications, ${unread} unread` : 'Notifications'"
      :aria-expanded="open"
      @click="toggle"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
      <span v-if="unread" class="nb-count">{{ unread > 9 ? '9+' : unread }}</span>
    </button>

    <!-- List -->
    <div v-if="open" class="nb-panel" role="dialog" aria-label="Notifications">
      <div class="nb-head">
        <strong>Notifications</strong>
        <button v-if="unread" type="button" class="nb-link" @click="markAll">Mark all as read</button>
      </div>
      <p v-if="!items.length" class="nb-empty">No notifications yet. Updates about your account, invoices and cards appear here.</p>
      <ul v-else class="nb-list">
        <li v-for="n in items" :key="n.id">
          <button type="button" class="nb-item" :class="{ unread: !n.is_read }" @click="openItem(n)">
            <span class="nb-dot" aria-hidden="true"></span>
            <span class="nb-text">
              <span class="nb-title">{{ n.title }}</span>
              <span class="nb-body">{{ n.body }}</span>
              <span class="nb-time">{{ ago(n.created_at) }}</span>
            </span>
          </button>
        </li>
      </ul>
    </div>

    <!-- Pop-up after sign-in -->
    <Teleport to="body">
      <Transition name="nbp">
        <div v-if="popup && latestUnread.length" class="nbp" role="status" aria-live="polite">
          <div class="nbp-head">
            <span class="nbp-ico" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
            </span>
            <strong>{{ unread }} new notification{{ unread === 1 ? '' : 's' }}</strong>
            <button type="button" class="nbp-x" aria-label="Close" @click="popup = false">✕</button>
          </div>
          <button v-for="n in latestUnread" :key="n.id" type="button" class="nbp-item" @click="openItem(n)">
            <span class="nb-title">{{ n.title }}</span>
            <span class="nb-body">{{ n.body }}</span>
          </button>
          <div class="nbp-foot">
            <button type="button" class="nb-link" @click="popup = false; open = true">See all</button>
            <button type="button" class="nb-link" @click="markAll">Mark all as read</button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.nb { position: relative; }
.nb-btn {
  position: relative; width: 42px; height: 42px; border-radius: 12px; border: 1px solid #e5e7eb;
  background: #fff; color: #0b0c10; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
  transition: border-color .15s, box-shadow .15s;
}
.nb-btn:hover { border-color: #0b0c10; }
.nb-btn:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(139, 224, 0, .45); }
.nb--dark .nb-btn { background: rgba(255,255,255,.08); border-color: rgba(255,255,255,.18); color: #fff; }
.nb-count {
  position: absolute; top: -6px; right: -6px; min-width: 19px; height: 19px; padding: 0 5px; box-sizing: border-box;
  border-radius: 999px; background: #dc2626; color: #fff; font-size: 11px; font-weight: 800; line-height: 19px; text-align: center;
  border: 2px solid #fff;
}
.nb-panel {
  position: absolute; right: 0; top: calc(100% + 10px); z-index: 1200; width: min(380px, calc(100vw - 32px));
  background: #fff; border: 1px solid #e5e7eb; border-radius: 18px; box-shadow: 0 20px 50px rgba(11,12,16,.18); overflow: hidden;
}
.nb-head { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-bottom: 1px solid #f0f1ec; font-size: 15px; color: #0b0c10; }
.nb-link { border: none; background: none; padding: 0; color: #3f6b00; font-weight: 700; font-size: 13px; cursor: pointer; font-family: inherit; }
.nb-link:hover { text-decoration: underline; }
.nb-empty { margin: 0; padding: 22px 18px; color: #6b7280; font-size: 13.5px; line-height: 1.5; }
.nb-list { list-style: none; margin: 0; padding: 0; max-height: 420px; overflow-y: auto; }
.nb-item {
  width: 100%; display: flex; gap: 10px; text-align: left; padding: 13px 16px; border: none; border-bottom: 1px solid #f6f7f3;
  background: #fff; cursor: pointer; font-family: inherit;
}
.nb-item:hover { background: #fafcf6; }
.nb-item.unread { background: #f6fbea; }
.nb-dot { flex-shrink: 0; width: 8px; height: 8px; margin-top: 6px; border-radius: 50%; background: transparent; }
.nb-item.unread .nb-dot { background: #8be000; }
.nb-text { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.nb-title { font-weight: 700; font-size: 13.5px; color: #0b0c10; line-height: 1.35; }
.nb-body { font-size: 12.5px; color: #4b5563; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 3; line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.nb-time { font-size: 11.5px; color: #9ca3af; }

.nbp {
  position: fixed; right: 20px; bottom: 20px; z-index: 2500; width: min(380px, calc(100vw - 32px));
  background: #fff; border-radius: 18px; border: 1px solid #e5e7eb; box-shadow: 0 24px 60px rgba(11,12,16,.25); overflow: hidden;
  font-family: var(--font-body, inherit);
}
.nbp-head { display: flex; align-items: center; gap: 10px; padding: 14px 16px; background: #0b0c10; color: #fff; font-size: 14.5px; }
.nbp-ico { display: inline-flex; width: 30px; height: 30px; border-radius: 50%; background: #8be000; color: #0b0c10; align-items: center; justify-content: center; }
.nbp-x { margin-left: auto; border: none; background: none; color: #fff; font-size: 15px; cursor: pointer; opacity: .8; }
.nbp-item { display: flex; flex-direction: column; gap: 3px; width: 100%; text-align: left; padding: 12px 16px; border: none; border-bottom: 1px solid #f0f1ec; background: #fff; cursor: pointer; font-family: inherit; }
.nbp-item:hover { background: #fafcf6; }
.nbp-foot { display: flex; justify-content: space-between; padding: 12px 16px; }
.nbp-enter-active, .nbp-leave-active { transition: opacity .2s ease, transform .2s ease; }
.nbp-enter-from, .nbp-leave-to { opacity: 0; transform: translateY(12px); }
@media (prefers-reduced-motion: reduce) { .nbp-enter-active, .nbp-leave-active { transition: none; } }
@media (max-width: 480px) { .nbp { right: 16px; left: 16px; width: auto; bottom: 16px; } }
</style>
