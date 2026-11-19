<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  TRAINING_LABELS,
  formatDate,
  formatDuration,
  useEmployeePortal,
  type TrainingItem,
} from '@/composables/useEmployeePortal'
import FitCard from '@/components/employee/FitCard.vue'
import CardActivate from '@/components/employee/CardActivate.vue'
import ContentRow from '@/components/employee/ContentRow.vue'
import ContentCard from '@/components/employee/ContentCard.vue'
import NewsDetail from '@/components/employee/NewsDetail.vue'
import TrainingDetail from '@/components/employee/TrainingDetail.vue'

const portal = useEmployeePortal()
const router = useRouter()
const d = computed(() => portal.data.value!)
const card = computed(() => d.value.card)
const firstName = computed(() => (d.value.profile.name ?? '').trim() || 'there')

// ── Banner carousel: featured news, or a built-in welcome slide ──
interface Slide { id: number | null; title: string; text: string; image: string | null; cta: string }
const slides = computed<Slide[]>(() => {
  const featured = d.value.featured.map((n) => ({
    id: n.id,
    title: n.title,
    text: n.excerpt ?? '',
    image: n.image_url,
    cta: n.link_label || 'Read more',
  }))
  return featured.length
    ? featured
    : [{ id: null, title: 'Gyms available with your FitAccess card', text: 'Train at partner gyms across the city with one card, paid for by your company.', image: null, cta: 'Find a gym' }]
})
const slide = ref(0)
let timer: ReturnType<typeof setInterval> | null = null
function go(i: number) {
  slide.value = (i + slides.value.length) % slides.value.length
}
function restart() {
  if (timer) clearInterval(timer)
  if (slides.value.length > 1) timer = setInterval(() => go(slide.value + 1), 7000)
}
function pause() {
  if (timer) clearInterval(timer)
  timer = null
}
onMounted(restart)
onBeforeUnmount(pause)
function openSlide(s: Slide) {
  if (s.id) openNews.value = s.id
  else router.push('/employee/gyms')
}

// ── Gym search ──
const q = ref('')
const facility = ref('')
const facilities = computed(() =>
  [...new Set(d.value.accessible_gyms.flatMap((g) => g.facilities ?? []))].filter(Boolean).sort(),
)
function search() {
  router.push({ path: '/employee/gyms', query: { ...(q.value ? { q: q.value } : {}), ...(facility.value ? { facility: facility.value } : {}) } })
}

// ── Detail modals ──
const openNews = ref<number | null>(null)
const openTraining = ref<number | null>(null)
function showTraining(t: TrainingItem) {
  portal.requireCard(
    'The training is ready!',
    'Add your FitAccess card to your account to unlock all portal features, including trainings.',
    () => (openTraining.value = t.id),
  )
}
function onJoinChanged(id: number, joined: boolean) {
  const t = d.value.trainings.find((x) => x.id === id)
  if (t) t.joined = joined
}

const statusLabel: Record<string, string> = {
  active: 'Active', expired: 'Expired', unpaid: 'Awaiting payment', suspended: 'Suspended', inactive: 'Not enrolled yet',
}
</script>

<template>
  <div class="ed">
    <header class="ed-hello">
      <h1>Hello {{ d.profile.name || firstName }}</h1>
      <p>Welcome to FitAccess. Here you can find your card, partner gyms, trainings and news that help you stay fit and feel well.</p>
    </header>

    <!-- Banner -->
    <section class="ed-banner" aria-roledescription="carousel" @mouseenter="pause" @mouseleave="restart">
      <div v-for="(s, i) in slides" v-show="i === slide" :key="i" class="ed-slide">
        <div class="ed-slide-media">
          <img v-if="s.image" :src="s.image" alt="" />
          <div v-else class="ed-slide-art" aria-hidden="true">
            <FitCard plan="Your plan" size="lg" />
          </div>
        </div>
        <div class="ed-slide-text">
          <h2>{{ s.title }}</h2>
          <p v-if="s.text">{{ s.text }}</p>
          <button type="button" class="ed-btn light" @click="openSlide(s)">{{ s.cta }}</button>
        </div>
      </div>
      <div v-if="slides.length > 1" class="ed-dots">
        <button
          v-for="(_, i) in slides"
          :key="i"
          type="button"
          :class="{ on: i === slide }"
          :aria-label="`Slide ${i + 1}`"
          @click="go(i); restart()"
        ></button>
      </div>
    </section>

    <!-- Gym search -->
    <section class="ed-section">
      <h2 class="ed-h2">Gym Search</h2>
      <form class="ed-search" @submit.prevent="search">
        <label class="ed-search-q">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
          <input v-model="q" type="search" placeholder="Enter the gym's name or area" aria-label="Gym name or area" />
        </label>
        <label class="ed-search-f">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6.5 6.5h11M6.5 17.5h11M3 9.5v5M21 9.5v5M6.5 4v16M17.5 4v16" /></svg>
          <select v-model="facility" aria-label="Facility">
            <option value="">Choose facility</option>
            <option v-for="f in facilities" :key="f" :value="f">{{ f }}</option>
          </select>
        </label>
        <button type="submit" class="ed-btn">Search</button>
      </form>
    </section>

    <!-- Card + promo -->
    <section class="ed-duo">
      <div class="ed-card">
        <template v-if="card.activated">
          <div class="ed-card-head">
            <h2 class="ed-h3">FitAccess Card</h2>
            <RouterLink to="/employee/cards" class="ed-more">More →</RouterLink>
          </div>
          <div class="ed-card-body">
            <FitCard :plan="d.pass.plan_name" :number="card.number" :active="!card.banned && d.pass.status === 'active'" :paused="!card.banned && d.pass.status !== 'active'" :blocked="card.banned" />
            <ul class="ed-facts">
              <li><span class="ed-ico">▭</span>Card number: <strong>{{ card.number }}</strong></li>
              <li v-if="!card.banned"><span class="ed-ico">📅</span>Active since: {{ formatDate(card.active_since) }}</li>
              <li><span class="ed-ico">🏢</span>{{ card.company }}</li>
              <li>
                <span class="ed-ico">●</span>Access:
                <span v-if="card.banned" class="ed-status ed-status--blocked">Blocked {{ card.banned_text }}</span>
                <span v-else class="ed-status" :class="d.pass.status">{{ statusLabel[d.pass.status] ?? d.pass.status }}</span>
              </li>
            </ul>
          </div>
          <p v-if="card.banned" class="ed-warn ed-warn--red">
            Your card is blocked, so you can't check in at a gym. Once the ban is lifted, the same card number works again. Contact your HR team with questions.
          </p>
          <p v-else-if="d.pass.access_message" class="ed-warn">{{ d.pass.access_message }}</p>
        </template>
        <template v-else>
          <div class="ed-add">
            <div class="ed-add-text">
              <span class="ed-add-ico" aria-hidden="true">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.5" y="5" width="19" height="14" rx="2" /><rect x="5.5" y="9" width="5" height="4" rx=".5" /><path d="M13.5 9.5h5M13.5 12.5h5" /></svg>
              </span>
              <h2 class="ed-h3">Add your FitAccess card</h2>
              <p>Enter your FitAccess card number to access all portal features.</p>
              <CardActivate />
            </div>
            <div class="ed-add-art" aria-hidden="true">
              <FitCard :plan="d.pass.plan_name" placeholder />
            </div>
          </div>
        </template>
      </div>

      <RouterLink to="/employee/gyms" class="ed-promo">
        <p class="ed-promo-kicker">It's all in FitAccess</p>
        <h2>Discover where to train!</h2>
        <p>Every workout gives you a boost of energy and a clearer head. Find partner gyms on your {{ d.pass.plan_name }} plan near you.</p>
        <span class="ed-btn">Find your way to get moving</span>
      </RouterLink>
    </section>

    <!-- Trainings -->
    <ContentRow title="Trainings" more="/employee/trainings" :count="d.trainings.length" empty="New trainings will appear here soon.">
      <ContentCard
        v-for="t in d.trainings"
        :key="t.id"
        :image="t.image_url"
        :category="TRAINING_LABELS[t.category] ?? t.category"
        :title="t.title"
        :badge="formatDuration(t.duration_minutes) || undefined"
        badge-icon="time"
        :locked="!card.activated || !!card.banned"
        :joined="t.joined"
        @open="showTraining(t)"
      />
    </ContentRow>

    <!-- News -->
    <ContentRow title="News" more="/employee/news" :count="d.news.length" empty="News from FitAccess will appear here.">
      <ContentCard
        v-for="n in d.news"
        :key="n.id"
        :image="n.image_url"
        :category="n.category"
        :title="n.title"
        :excerpt="n.excerpt"
        badge="Read"
        badge-icon="read"
        @open="openNews = n.id"
      />
    </ContentRow>

    <NewsDetail v-if="openNews" :id="openNews" @close="openNews = null" />
    <TrainingDetail
      v-if="openTraining"
      :id="openTraining"
      @close="openTraining = null"
      @changed="(j) => onJoinChanged(openTraining!, j)"
    />
  </div>
</template>

<style scoped>
.ed { display: flex; flex-direction: column; gap: 44px; }
.ed-hello h1 { margin: 0 0 8px; font-family: var(--font-heading); font-size: 42px; font-weight: 600; color: #1f2937; letter-spacing: -0.02em; }
.ed-hello p { margin: 0; max-width: 820px; color: #4b5563; font-size: 17px; line-height: 1.5; }
.ed-h2 { margin: 0 0 18px; font-family: var(--font-heading); font-size: 30px; font-weight: 600; color: #1f2937; }
.ed-h3 { margin: 0; font-family: var(--font-heading); font-size: 24px; font-weight: 600; color: #1f2937; }
.ed-btn {
  display: inline-flex; align-items: center; justify-content: center; padding: 13px 22px; border-radius: 14px;
  border: 1.5px solid #0b0c10; background: #0b0c10; color: #fff; font-weight: 700; font-size: 14px;
  font-family: inherit; cursor: pointer; text-decoration: none; white-space: nowrap;
}
.ed-btn:hover { background: #8be000; border-color: #8be000; color: #0b0c10; }
.ed-btn.light { background: #fff; color: #0b0c10; border-color: #e5e7eb; }
.ed-btn.light:hover { border-color: #0b0c10; }

/* Banner */
.ed-banner { position: relative; border-radius: 24px; overflow: hidden; background: #eef9dc; margin-top: -16px; }
.ed-slide { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); align-items: center; min-height: 320px; }
.ed-slide-media { height: 100%; min-height: 320px; position: relative; }
.ed-slide-media img { position: absolute; inset: 14px 0 14px 14px; width: calc(100% - 14px); height: calc(100% - 28px); object-fit: cover; border-radius: 18px; }
.ed-slide-art {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 32px;
  background: radial-gradient(90% 120% at 0% 100%, rgba(139, 224, 0, 0.6), transparent 60%);
}
.ed-slide-art :deep(.fc) { transform: rotate(-6deg); }
.ed-slide-text { padding: 36px 40px 48px; }
.ed-slide-text h2 { margin: 0 0 14px; font-family: var(--font-heading); font-size: 38px; font-weight: 600; line-height: 1.15; color: #1f2937; }
.ed-slide-text p { margin: 0 0 24px; color: #4b5563; font-size: 15px; line-height: 1.55; }
.ed-dots { position: absolute; right: 22px; bottom: 18px; display: flex; gap: 8px; }
.ed-dots button { width: 10px; height: 10px; border-radius: 50%; border: none; background: #fff; padding: 0; cursor: pointer; }
.ed-dots button.on { background: #4d7c0f; }

/* Search */
.ed-search {
  display: flex; align-items: stretch; gap: 0; background: #fff; border-radius: 16px; padding: 8px;
  box-shadow: 0 6px 24px rgba(11, 12, 16, 0.06);
}
.ed-search label { display: flex; align-items: center; gap: 10px; padding: 0 14px; color: #4d7c0f; }
.ed-search-q { flex: 1 1 auto; min-width: 0; }
.ed-search-f { flex: 0 0 300px; border-left: 1px solid #eef0ea; }
.ed-search input, .ed-search select {
  flex: 1; min-width: 0; border: none; outline: none; background: transparent; font-size: 15px;
  font-family: inherit; color: #1f2937; padding: 12px 0;
}
.ed-search .ed-btn { padding: 13px 40px; }

/* Card + promo */
.ed-duo { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 18px; }
.ed-card { background: #fff; border-radius: 22px; padding: 30px 32px; }
.ed-card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; }
.ed-more { color: #1f2937; text-decoration: none; font-weight: 600; font-size: 14px; }
.ed-more:hover { text-decoration: underline; }
.ed-card-body { display: grid; grid-template-columns: minmax(0, 240px) minmax(0, 1fr); gap: 28px; align-items: center; }
.ed-facts { list-style: none; margin: 0; padding: 0; }
.ed-facts li { display: flex; align-items: center; gap: 10px; padding: 12px 0; border-bottom: 1px solid #f0f1ec; color: #4b5563; font-size: 14px; }
.ed-facts li:last-child { border-bottom: none; }
.ed-ico { width: 20px; text-align: center; color: #4d7c0f; }
.ed-status { font-weight: 700; color: #4d7c0f; }
.ed-status.expired, .ed-status.unpaid, .ed-status.suspended { color: #b45309; }
.ed-status.inactive { color: #6b7280; }
.ed-status--blocked { color: #dc2626; }
.ed-warn--red { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
.ed-warn { margin: 16px 0 0; padding: 10px 12px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; color: #92400e; font-size: 13px; }
.ed-add { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 22px; align-items: center; }
.ed-add-ico { display: inline-flex; color: #4d7c0f; margin-bottom: 8px; }
.ed-add-text p { margin: 8px 0 16px; color: #4b5563; font-size: 15px; line-height: 1.5; }
.ed-add-art { display: flex; justify-content: center; }
.ed-promo {
  position: relative; overflow: hidden; border-radius: 22px; padding: 34px 32px; text-decoration: none;
  background: radial-gradient(120% 120% at 100% 100%, rgba(139, 224, 0, 0.55) 0%, rgba(139, 224, 0, 0) 55%), #0b0c10;
  color: #fff; display: flex; flex-direction: column; align-items: flex-start; gap: 10px;
}
.ed-promo-kicker { margin: 0; font-weight: 800; color: #8be000; font-size: 15px; }
.ed-promo h2 { margin: 0; font-family: var(--font-heading); font-size: 26px; font-weight: 600; }
.ed-promo p { margin: 0 0 12px; color: #d1d5db; font-size: 14px; line-height: 1.6; }
.ed-promo .ed-btn { background: #fff; color: #0b0c10; border-color: #fff; margin-top: auto; }
.ed-promo:hover .ed-btn { background: #8be000; border-color: #8be000; }

@media (max-width: 1100px) {
  .ed-duo { grid-template-columns: 1fr; }
}
@media (max-width: 800px) {
  .ed-hello h1 { font-size: 30px; }
  .ed-slide { grid-template-columns: 1fr; }
  .ed-slide-media { min-height: 200px; }
  .ed-slide-media img { inset: 12px; width: calc(100% - 24px); height: calc(100% - 24px); }
  .ed-slide-text { padding: 20px 22px 44px; }
  .ed-slide-text h2 { font-size: 26px; }
  .ed-search { flex-direction: column; gap: 6px; }
  .ed-search-f { flex-basis: auto; border-left: none; border-top: 1px solid #eef0ea; }
  .ed-card { padding: 22px 20px; }
  .ed-card-body, .ed-add { grid-template-columns: 1fr; }
  .ed-add-art { display: none; }
  .ed-h2 { font-size: 24px; }
}
</style>
