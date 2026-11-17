<script setup lang="ts">
import { computed, ref } from 'vue'

interface Topic { id: string; title: string; icon: string; items: { q: string; a: string }[] }

const topics: Topic[] = [
  {
    id: 'card', title: 'FitAccess card', icon: '▭',
    items: [
      { q: 'Where do I get my card number?', a: 'Your company HR sends your 12-digit FitAccess card number to you by email or Telegram. If you have not received it, ask your HR team to send it again.' },
      { q: 'How do I activate my card?', a: 'Open Cards (or the Start page), type the 12-digit number and press "Add card". Once it is accepted, every portal feature is unlocked.' },
      { q: 'What can I do before I add my card?', a: 'You can sign in, browse partner gyms, trainings and news. Joining trainings, check-in codes and editing your profile need an active card.' },
    ],
  },
  {
    id: 'app', title: 'Mobile app & check-in', icon: '📱',
    items: [
      { q: 'How do I check in at a gym?', a: 'Open the FitAccess mobile app and show your QR code at the gym reception. For your security the code changes every 30 seconds.' },
      { q: 'When can I check in?', a: 'Partner gyms scan FitAccess codes between 4:00 PM and 4:00 AM. You can check in once per day.' },
    ],
  },
  {
    id: 'gyms', title: 'Partner gyms', icon: '🏋️',
    items: [
      { q: 'Which gyms can I use?', a: 'Gyms on your plan, and on every lower plan, are listed under Gyms. Use the map or search by name or area.' },
      { q: 'A gym on the list is closed or wrong', a: 'Please contact support below with the gym name and what is wrong, and we will update it.' },
    ],
  },
  {
    id: 'trainings', title: 'Trainings & news', icon: '🎬',
    items: [
      { q: 'How do I join a training?', a: 'Open a training and press "Join training". Some trainings have limited places.' },
      { q: 'Who publishes the news?', a: 'The FitAccess team publishes news, offers and challenges for all members, or only for your company.' },
    ],
  },
  {
    id: 'account', title: 'Account & privacy', icon: '🔒',
    items: [
      { q: 'How do I change my password?', a: 'Go to My account and use the password section.' },
      { q: 'Can I hide my name at the gym?', a: 'Yes. In My account you can choose whether your name appears in the "who is in the gym" list.' },
    ],
  },
]

const query = ref('')
const openTopic = ref<string | null>(null)
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return topics
  return topics
    .map((t) => ({ ...t, items: t.items.filter((i) => (i.q + ' ' + i.a).toLowerCase().includes(q)) }))
    .filter((t) => t.items.length)
})
</script>

<template>
  <div class="eh">
    <section class="eh-hero">
      <h1>How can we help?</h1>
      <label class="eh-search">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
        <input v-model="query" type="search" placeholder="Search for answers…" aria-label="Search help" />
      </label>
    </section>

    <div class="eh-grid">
      <article v-for="t in filtered" :key="t.id" class="eh-topic" :class="{ open: openTopic === t.id || !!query }">
        <button type="button" class="eh-topic-head" @click="openTopic = openTopic === t.id ? null : t.id">
          <span class="eh-ico" aria-hidden="true">{{ t.icon }}</span>
          <span>
            <strong>{{ t.title }}</strong>
            <small>{{ t.items.length }} {{ t.items.length === 1 ? 'article' : 'articles' }}</small>
          </span>
        </button>
        <dl v-if="openTopic === t.id || query" class="eh-items">
          <template v-for="i in t.items" :key="i.q">
            <dt>{{ i.q }}</dt>
            <dd>{{ i.a }}</dd>
          </template>
        </dl>
      </article>
    </div>
    <p v-if="!filtered.length" class="eh-none">No answers match "{{ query }}".</p>

    <section class="eh-contact">
      <h2>Still need help?</h2>
      <p>Email us at <a href="mailto:auto@fit-access.com">auto@fit-access.com</a> or contact your company HR team.</p>
    </section>
  </div>
</template>

<style scoped>
.eh { display: flex; flex-direction: column; gap: 28px; }
.eh-hero {
  border-radius: 24px; padding: 48px 24px; text-align: center; color: #fff;
  background: radial-gradient(120% 140% at 100% 0%, rgba(139, 224, 0, 0.55), transparent 55%), #0b0c10;
}
.eh-hero h1 { margin: 0 0 22px; font-family: var(--font-heading); font-size: 34px; font-weight: 700; }
.eh-search {
  display: flex; align-items: center; gap: 10px; max-width: 620px; margin: 0 auto; padding: 0 16px;
  background: rgba(255, 255, 255, 0.14); border-radius: 14px; color: #fff;
}
.eh-search input { flex: 1; min-width: 0; padding: 16px 0; border: none; outline: none; background: transparent; color: #fff; font-size: 16px; font-family: inherit; }
.eh-search input::placeholder { color: rgba(255, 255, 255, 0.75); }
.eh-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; align-items: start; }
.eh-topic { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; }
.eh-topic.open { border-color: #8be000; }
.eh-topic-head { display: flex; align-items: center; gap: 16px; width: 100%; padding: 20px; border: none; background: none; cursor: pointer; text-align: left; font-family: inherit; }
.eh-topic-head strong { display: block; font-size: 16px; color: #111827; }
.eh-topic-head small { color: #6b7280; font-size: 13px; }
.eh-ico { width: 46px; height: 46px; border-radius: 12px; background: #f3fce6; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
.eh-items { margin: 0; padding: 0 20px 18px; }
.eh-items dt { font-weight: 600; color: #111827; font-size: 14px; margin-top: 12px; }
.eh-items dd { margin: 4px 0 0; color: #4b5563; font-size: 14px; line-height: 1.55; }
.eh-none { color: #6b7280; margin: 0; }
.eh-contact { background: #fff; border-radius: 18px; padding: 24px; }
.eh-contact h2 { margin: 0 0 6px; font-family: var(--font-heading); font-size: 22px; }
.eh-contact p { margin: 0; color: #4b5563; }
.eh-contact a { color: #4d7c0f; font-weight: 600; }
</style>
