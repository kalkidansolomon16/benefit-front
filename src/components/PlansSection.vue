<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount, watch } from 'vue'

// Public plan list: the API sends no price (prices are agreed with each employer).
interface Plan {
  id: number
  name: string
  tier: string
  features: string[] | null
  target_level: string | null
  is_active: boolean
}

type Kind = 'basic' | 'plus' | 'premium'

const plans   = ref<Plan[]>([])
const loading = ref(true)
const error   = ref(false)
const open    = ref<Record<number, boolean>>({})

onMounted(async () => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/public/plans`)
    if (!res.ok) throw new Error()
    const data = await res.json()
    // Already in tier order (lowest first) from the API
    plans.value = (Array.isArray(data) ? data : data.data ?? []).filter((p: Plan) => p.is_active)
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
})

const VISIBLE = 3

function label(f: string): string {
  const t = f.trim()
  return t.charAt(0).toUpperCase() + t.slice(1)
}
function shown(plan: Plan): string[] {
  return (plan.features ?? []).slice(0, VISIBLE).map(label)
}
function extra(plan: Plan): string[] {
  return (plan.features ?? []).slice(VISIBLE).map(label)
}
function toggle(id: number) {
  open.value[id] = !open.value[id]
}

/** Which package a plan is, from its tier key / name; falls back to its position. */
function kindOf(plan: Plan): Kind {
  const t = `${plan.tier} ${plan.name}`.toLowerCase()
  if (t.includes('premium') || t.includes('platinum') || t.includes('gold')) return 'premium'
  if (t.includes('plus')) return 'plus'
  if (t.includes('basic')) return 'basic'
  const idx = plans.value.indexOf(plan)
  const n = plans.value.length
  if (n > 1 && idx === n - 1) return 'premium'
  if (idx > 0) return 'plus'
  return 'basic'
}

function isPopular(idx: number): boolean {
  const n = plans.value.length
  return n >= 3 && idx === Math.floor(n / 2)
}

/** Short card description (client wording). */
const SUMMARY: Record<Kind, string> = {
  basic:   'One visit per day at selected partner gyms under the Basic package.',
  plus:    'One visit per day at selected partner gyms under the Basic Plus package, including all Basic package gyms.',
  premium: 'One visit per day at premium gyms, including all Basic and Basic Plus gyms, plus spa and swimming.',
}

/** Longer text for the "Learn more" window. */
const DETAILS: Record<Kind, { tagline: string; intro: string; included: string[]; goodFor: string }> = {
  basic: {
    tagline: 'A great start to an active routine',
    intro:
      'The Basic package gives you everyday access to a selection of FitAccess partner gyms across Addis Ababa. ' +
      'Pick the gym that is most convenient for you on the day and check in with your FitAccess pass.',
    included: [
      'One visit per day',
      'Access to the selected partner gyms in the Basic package',
      'Digital FitAccess pass and 12-digit card number',
      'See how busy a gym is before you go',
      'Find the nearest partner gyms from your location',
    ],
    goodFor: 'Employees who want regular gym workouts close to home or the office.',
  },
  plus: {
    tagline: 'More gyms, more choice',
    intro:
      'Basic Plus adds a wider selection of partner gyms on top of everything in the Basic package, ' +
      'so you can switch between more locations and keep your routine varied.',
    included: [
      'One visit per day',
      'Access to the selected partner gyms in the Basic Plus package',
      'All gyms from the Basic package included',
      'Digital FitAccess pass and 12-digit card number',
      'See how busy a gym is and find the nearest one from your location',
    ],
    goodFor: 'Employees who work out regularly and like having more places to choose from.',
  },
  premium: {
    tagline: 'The complete FitAccess experience',
    intro:
      'Premium opens the full FitAccess network: premium gyms together with every Basic and Basic Plus gym, ' +
      'plus spa and swimming facilities for recovery and relaxation.',
    included: [
      'One visit per day',
      'Access to premium partner gyms',
      'All Basic and Basic Plus gyms included',
      'Spa and swimming facilities',
      'Digital FitAccess pass, live gym busyness and nearby-gym search',
    ],
    goodFor: 'Employees who want the widest choice of facilities, from training to relaxing after work.',
  },
}

function shortTier(name: string): string {
  // "Fit Basic Plus" -> "BASIC PLUS" for the card artwork
  return name.replace(/^fit\s*/i, '').toUpperCase()
}

// ── "Learn more" window ───────────────────────────────────────────
const detailPlan = ref<Plan | null>(null)
const detail = computed(() => (detailPlan.value ? DETAILS[kindOf(detailPlan.value)] : null))
const closeBtn = ref<HTMLButtonElement | null>(null)
let lastFocus: HTMLElement | null = null

function openDetails(plan: Plan, e: Event) {
  lastFocus = e.currentTarget as HTMLElement
  detailPlan.value = plan
  nextTick(() => closeBtn.value?.focus())
}
function closeDetails() {
  detailPlan.value = null
  nextTick(() => lastFocus?.focus())
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && detailPlan.value) closeDetails()
}
watch(detailPlan, (p) => {
  document.body.style.overflow = p ? 'hidden' : ''
})
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})
</script>

<template>
  <section id="plans" class="lp-section plans-section">
    <div class="lp-container">
      <div class="lp-section-head">
        <h2 class="lp-h2">Find the FitAccess package <span class="hl">that fits you</span></h2>
        <hr class="lp-sep" />
        <p class="lp-lead">
          Whether you train every morning or just want a swim after work, there is a package for you.
        </p>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading" class="plans-grid">
        <div v-for="n in 3" :key="n" class="plan-card plan-skeleton">
          <div class="sk sk-art"></div>
          <div class="sk sk-name"></div>
          <div class="sk sk-line"></div>
          <div class="sk sk-line"></div>
          <div class="sk sk-btn"></div>
        </div>
      </div>

      <div v-else-if="error" class="plans-error">
        <p>Unable to load plans. Please refresh or contact us directly.</p>
      </div>

      <div v-else class="plans-grid">
        <article
          v-for="(plan, idx) in plans"
          :key="plan.id"
          class="plan-card"
          :class="[`plan-card--${kindOf(plan)}`, { popular: isPopular(idx) }]"
        >
          <div v-if="isPopular(idx)" class="plan-flag">★ Most popular</div>

          <!-- Card artwork -->
          <div class="card-art" :class="`card-art--${kindOf(plan)}`" aria-hidden="true">
            <div class="art-top">
              <img src="/logo.png" alt="" class="art-logo" />
              <span class="art-brand">FitAccess</span>
            </div>
            <div class="art-name">FitAccess</div>
            <div class="art-tier">{{ shortTier(plan.name) }}</div>
            <div class="art-foot">
              <span>fit-access.com</span>
              <span>Addis Ababa</span>
            </div>
          </div>

          <h3 class="plan-name">{{ plan.name }}</h3>
          <p class="plan-desc">{{ SUMMARY[kindOf(plan)] }}</p>

          <hr class="plan-rule" />

          <ul class="plan-features">
            <li v-for="f in shown(plan)" :key="f">
              <span class="tick" aria-hidden="true">✓</span>{{ f }}
            </li>
            <template v-if="open[plan.id]">
              <li v-for="f in extra(plan)" :key="'x' + f">
                <span class="tick" aria-hidden="true">✓</span>{{ f }}
              </li>
            </template>
          </ul>

          <button
            v-if="extra(plan).length"
            type="button"
            class="more-btn"
            :aria-expanded="!!open[plan.id]"
            @click="toggle(plan.id)"
          >
            {{ open[plan.id] ? 'Less details' : 'More details' }}
            <span class="chev" :class="{ up: open[plan.id] }">⌄</span>
          </button>

          <div class="plan-bottom">
            <hr class="plan-rule" />
            <button type="button" class="plan-btn" @click="openDetails(plan, $event)">Learn more</button>
            <p class="plan-note">Ask your employer for the price</p>
          </div>
        </article>
      </div>
    </div>

    <!-- Plan details window -->
    <Teleport to="body">
      <div v-if="detailPlan && detail" class="pd-backdrop" @click.self="closeDetails">
        <div
          class="pd-dialog"
          :class="`pd-dialog--${kindOf(detailPlan)}`"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pd-title"
        >
          <button ref="closeBtn" type="button" class="pd-close" aria-label="Close" @click="closeDetails">✕</button>

          <div class="pd-head">
            <div class="card-art card-art--mini" :class="`card-art--${kindOf(detailPlan)}`" aria-hidden="true">
              <div class="art-name">FitAccess</div>
              <div class="art-tier">{{ shortTier(detailPlan.name) }}</div>
            </div>
            <div>
              <p class="pd-tagline">{{ detail.tagline }}</p>
              <h3 id="pd-title" class="pd-title">{{ detailPlan.name }}</h3>
            </div>
          </div>

          <p class="pd-intro">{{ detail.intro }}</p>

          <h4 class="pd-sub">What's included</h4>
          <ul class="plan-features pd-list">
            <li v-for="item in detail.included" :key="item">
              <span class="tick" aria-hidden="true">✓</span>{{ item }}
            </li>
          </ul>

          <template v-if="detailPlan.features?.length">
            <h4 class="pd-sub">Facilities on this plan</h4>
            <div class="pd-chips">
              <span v-for="f in detailPlan.features" :key="f" class="pd-chip">{{ label(f) }}</span>
            </div>
          </template>

          <h4 class="pd-sub">Good for</h4>
          <p class="pd-text">{{ detail.goodFor }}</p>

          <h4 class="pd-sub">How it works</h4>
          <ol class="pd-steps">
            <li>Your employer joins FitAccess and chooses the package for each employee level.</li>
            <li>You register as an employee and receive your FitAccess pass and card number.</li>
            <li>Choose a partner gym on your package, show your pass at reception and train.</li>
          </ol>

          <p class="pd-price">Prices are agreed with each employer. Ask your HR team for the price of this package.</p>

          <div class="pd-actions">
            <RouterLink to="/for-employees" class="plan-btn pd-btn" @click="closeDetails">For employees</RouterLink>
            <RouterLink to="/for-employers" class="pd-btn-outline" @click="closeDetails">For employers</RouterLink>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.plans-section { background: #fff; }
.hl { color: #8BE000; }

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 28px;
  align-items: stretch;
  padding-top: 8px;
}

/* ── Card ─────────────────────────────────────────── */
.plan-card {
  position: relative;
  display: flex;
  flex-direction: column;
  background: #FAFAFA;
  border: 1px solid #ECECEC;
  border-radius: 22px;
  padding: 36px 26px 22px;
  box-shadow: 0 6px 24px rgba(11, 12, 16, 0.06);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  min-width: 0;
}
.plan-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(11, 12, 16, 0.12);
}
.plan-card.popular { border-color: #8BE000; }
.plan-card--premium { border-color: #E3C770; background: #FFFCF3; }

.plan-flag {
  position: absolute;
  top: 0;
  right: 0;
  background: #8BE000;
  color: #0B0C10;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 7px 14px;
  border-radius: 0 21px 0 14px;
}

/* ── Card artwork ─────────────────────────────────── */
.card-art {
  position: relative;
  width: 100%;
  max-width: 260px;
  aspect-ratio: 1.6 / 1;
  margin: 0 auto 26px;
  border-radius: 14px;
  padding: 12px 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 24px rgba(11, 12, 16, 0.18);
  isolation: isolate;
}
/* diagonal light swoosh, like a printed card */
.card-art::before {
  content: '';
  position: absolute;
  inset: -40% -20%;
  background: linear-gradient(115deg, transparent 38%, rgba(255,255,255,0.55) 48%, transparent 60%);
  z-index: -1;
}
.card-art::after {
  content: '';
  position: absolute;
  right: -30px;
  bottom: -50px;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  border: 18px solid rgba(139, 224, 0, 0.35);
  z-index: -1;
}
.card-art--basic { background: linear-gradient(135deg, #F4F4F4 0%, #CFCFCF 55%, #A9A9A9 100%); color: #0B0C10; }
.card-art--plus  { background: linear-gradient(135deg, #B7F04A 0%, #8BE000 50%, #5E9A00 100%); color: #0B0C10; }
.card-art--plus::after { border-color: rgba(11, 12, 16, 0.18); }
/* Premium / platinum: gold */
.card-art--premium {
  background: linear-gradient(135deg, #FFF1B8 0%, #F2C94C 35%, #D4A017 65%, #A97C10 100%);
  color: #3A2A00;
}
.card-art--premium::before { background: linear-gradient(115deg, transparent 38%, rgba(255,255,255,0.7) 48%, transparent 60%); }
.card-art--premium::after { border-color: rgba(255, 255, 255, 0.35); }

.art-top { display: flex; align-items: center; gap: 6px; }
.art-logo { width: 20px; height: 20px; object-fit: contain; }
.art-brand { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.02em; }
.art-name {
  margin-top: auto;
  font-size: 1.75rem;
  font-weight: 900;
  font-style: italic;
  letter-spacing: -0.01em;
  line-height: 1;
  text-align: center;
}
.art-tier {
  text-align: right;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  margin: 4px 6px 0 0;
}
.art-foot {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  font-size: 0.56rem;
  font-weight: 600;
  opacity: 0.8;
}

/* ── Text ─────────────────────────────────────────── */
.plan-name {
  text-align: center;
  font-size: 1.3rem;
  font-weight: 800;
  color: #0B0C10;
  margin: 0 0 10px;
}
.plan-desc {
  text-align: center;
  font-size: 0.92rem;
  line-height: 1.55;
  color: #0B0C10;
  margin: 0;
}
.plan-rule {
  border: none;
  border-top: 1px solid #DCDCDC;
  margin: 18px 0;
}

.plan-features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.plan-features li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  color: #0B0C10;
}
.tick {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #8BE000;
  color: #0B0C10;
  font-size: 0.68rem;
  font-weight: 900;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.plan-card--premium .tick,
.pd-dialog--premium .tick { background: #E9B92E; }

.more-btn {
  align-self: flex-start;
  margin-top: 14px;
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  color: #0B0C10;
  text-decoration: underline;
  text-decoration-color: #8BE000;
  text-underline-offset: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.chev { display: inline-block; transition: transform 0.2s; transform: translateY(-3px); }
.chev.up { transform: rotate(180deg) translateY(-3px); }

.plan-bottom { margin-top: auto; padding-top: 4px; }
.plan-btn {
  display: block;
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 999px;
  background: #0B0C10;
  color: #fff;
  font: inherit;
  font-size: 0.95rem;
  font-weight: 700;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.plan-btn:hover { background: #8BE000; color: #0B0C10; }
.plan-card--premium .plan-btn:hover { background: #E9B92E; }
.plan-note {
  margin: 12px 0 0;
  text-align: center;
  font-size: 0.8rem;
  color: #0B0C10;
  opacity: 0.75;
}

/* ── Details window ───────────────────────────────── */
.pd-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(11, 12, 16, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.pd-dialog {
  position: relative;
  width: 100%;
  max-width: 620px;
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  background: #fff;
  border-radius: 22px;
  padding: 30px 30px 26px;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.3);
  color: #0B0C10;
  border-top: 6px solid #8BE000;
}
.pd-dialog--basic { border-top-color: #A9A9A9; }
.pd-dialog--premium { border-top-color: #E9B92E; }
.pd-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #F2F2F2;
  font-size: 0.95rem;
  cursor: pointer;
  color: #0B0C10;
}
.pd-close:hover { background: #E4E4E4; }
.pd-head { display: flex; align-items: center; gap: 18px; margin-bottom: 18px; padding-right: 36px; }
.card-art--mini {
  width: 120px;
  max-width: none;
  margin: 0;
  padding: 8px 10px;
  border-radius: 10px;
  flex-shrink: 0;
}
.card-art--mini .art-name { font-size: 1rem; }
.card-art--mini .art-tier { font-size: 0.5rem; letter-spacing: 0.12em; margin-bottom: auto; }
.card-art--mini::after { width: 90px; height: 90px; border-width: 10px; right: -20px; bottom: -34px; }
.pd-tagline { margin: 0 0 4px; font-size: 0.82rem; font-weight: 700; color: #5E9A00; text-transform: uppercase; letter-spacing: 0.05em; }
.pd-dialog--premium .pd-tagline { color: #A97C10; }
.pd-dialog--basic .pd-tagline { color: #555; }
.pd-title { margin: 0; font-size: 1.6rem; font-weight: 900; line-height: 1.15; }
.pd-intro { margin: 0 0 6px; font-size: 0.95rem; line-height: 1.6; }
.pd-sub { margin: 20px 0 10px; font-size: 0.95rem; font-weight: 800; }
.pd-list { gap: 9px; }
.pd-text { margin: 0; font-size: 0.92rem; line-height: 1.55; }
.pd-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.pd-chip {
  padding: 5px 12px;
  border-radius: 999px;
  background: #F4F4F4;
  border: 1px solid #E4E4E4;
  font-size: 0.82rem;
}
.pd-steps { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 6px; font-size: 0.92rem; line-height: 1.5; }
.pd-price {
  margin: 20px 0 0;
  padding: 12px 14px;
  border-radius: 12px;
  background: #EEF9DC;
  font-size: 0.88rem;
  line-height: 1.5;
}
.pd-dialog--premium .pd-price { background: #FFF6D6; }
.pd-actions { display: flex; gap: 12px; margin-top: 20px; flex-wrap: wrap; }
.pd-btn { width: auto; flex: 1 1 180px; }
.pd-btn-outline {
  flex: 1 1 180px;
  display: block;
  padding: 12px 14px;
  border-radius: 999px;
  border: 2px solid #0B0C10;
  color: #0B0C10;
  font-size: 0.95rem;
  font-weight: 700;
  text-align: center;
  text-decoration: none;
  transition: background 0.2s;
}
.pd-btn-outline:hover { background: #EEF9DC; }

/* ── Skeleton / error ─────────────────────────────── */
.plan-skeleton { pointer-events: none; }
.sk {
  border-radius: 8px;
  background: linear-gradient(90deg, #f1f1f1 25%, #e4e4e4 50%, #f1f1f1 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
.sk-art  { width: 100%; max-width: 260px; aspect-ratio: 1.6 / 1; margin: 0 auto 26px; border-radius: 14px; }
.sk-name { height: 24px; width: 55%; margin: 0 auto 14px; }
.sk-line { height: 14px; width: 85%; margin: 0 auto 10px; }
.sk-btn  { height: 48px; width: 100%; margin-top: 24px; border-radius: 999px; }
@keyframes shimmer { to { background-position: -200% 0; } }

.plans-error {
  text-align: center;
  padding: 40px;
  color: #0B0C10;
  background: #F5F5F5;
  border-radius: 18px;
}

@media (max-width: 700px) {
  .plans-grid { grid-template-columns: 1fr; max-width: 420px; margin: 0 auto; }
  .pd-dialog { padding: 24px 18px 20px; }
  .pd-head { flex-direction: column; align-items: flex-start; gap: 12px; }
}
</style>
