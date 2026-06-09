<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

interface Plan {
  id: number
  name: string
  tier: string
  monthly_fee_etb: string | number
  features: string[] | null
  target_level: string | null
  is_active: boolean
}

const plans   = ref<Plan[]>([])
const loading = ref(true)
const error   = ref(false)

onMounted(async () => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/public/plans`)
    if (!res.ok) throw new Error()
    const data = await res.json()
    // Only active plans, sorted by price ascending
    plans.value = (Array.isArray(data) ? data : data.data ?? [])
      .filter((p: Plan) => p.is_active)
      .sort((a: Plan, b: Plan) => Number(a.monthly_fee_etb) - Number(b.monthly_fee_etb))
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
})

// Palette: index-based card styles
const PALETTE = [
  { bg: '#EBFAEE', nameColor: 'var(--color-primary)', textColor: 'var(--color-text)',        mutedColor: 'var(--color-text-muted)', checkColor: 'var(--color-accent)', btnBg: 'var(--color-primary)', featured: false },
  { bg: '#1b3a6b', nameColor: '#ffffff',               textColor: 'rgba(255,255,255,0.9)',    mutedColor: 'rgba(255,255,255,0.65)',  checkColor: '#4CD964',             btnBg: '#4CD964',              featured: true  },
  { bg: '#fef9ec', nameColor: 'var(--color-primary)', textColor: 'var(--color-text)',        mutedColor: 'var(--color-text-muted)', checkColor: '#d97706',             btnBg: 'var(--color-primary)', featured: false },
  { bg: '#f5f3ff', nameColor: 'var(--color-primary)', textColor: 'var(--color-text)',        mutedColor: 'var(--color-text-muted)', checkColor: '#7c3aed',             btnBg: '#7c3aed',              featured: false },
  { bg: '#fff1f2', nameColor: 'var(--color-primary)', textColor: 'var(--color-text)',        mutedColor: 'var(--color-text-muted)', checkColor: '#e11d48',             btnBg: '#e11d48',              featured: false },
]

function palette(idx: number) {
  // For an odd number of plans: middle plan is featured (dark)
  const midIdx = Math.floor(plans.value.length / 2)
  if (idx === midIdx && plans.value.length > 1) {
    return PALETTE[1]!  // always dark/featured for the middle
  }
  if (idx < midIdx) return PALETTE[idx === 0 ? 0 : (idx % (PALETTE.length - 1)) + 1 < 1 ? 0 : idx % 2 === 0 ? 0 : 2]!
  // after mid
  const afterIdx = idx - midIdx
  return PALETTE[afterIdx === 1 ? 2 : afterIdx % 3 === 0 ? 0 : afterIdx % 3 === 1 ? 2 : 3]!
}

// Emoji sets per tier keyword
const TIER_EMOJIS: Record<string, string[]> = {
  basic:    ['🏋️', '🧘', '🏃', '💪'],
  plus:     ['🏊', '🤸', '⚡', '🥗', '🧘'],
  platinum: ['🥇', '🏆', '💆', '🏅', '⭐'],
  premium:  ['🥇', '🏆', '💆', '🏅', '⭐'],
  default:  ['🏋️', '💪', '🧘', '🏃'],
}

function emojis(tier: string): string[] {
  const t = tier.toLowerCase()
  if (t.includes('platinum') || t.includes('premium')) return TIER_EMOJIS.platinum!
  if (t.includes('plus'))    return TIER_EMOJIS.plus!
  if (t.includes('basic'))   return TIER_EMOJIS.basic!
  return TIER_EMOJIS.default!
}

function levelDesc(targetLevel: string | null, tier: string): string {
  if (targetLevel === 'chief')    return 'Top-tier access for executives. Premium gyms, spa & personal coaches.'
  if (targetLevel === 'director') return 'Designed for directors. Mid-tier gyms with group classes & clinics.'
  if (targetLevel === 'manager' || targetLevel === 'staff') return 'Ideal for managers & staff. Access to standard partner gyms.'
  // Fallback based on tier name
  const t = tier.toLowerCase()
  if (t.includes('platinum') || t.includes('premium')) return 'Premium wellness experience with top-tier facilities.'
  if (t.includes('plus'))   return 'Enhanced gym access with group classes and wellness clinics.'
  return 'Essential gym access to keep your team healthy and active.'
}

function badgeLabel(idx: number): string {
  const mid = Math.floor(plans.value.length / 2)
  if (plans.value.length >= 3 && idx === mid) return 'Most Popular'
  if (idx === plans.value.length - 1 && plans.value.length > 1) return 'Premium'
  return ''
}

function formatPrice(fee: string | number): string {
  return Number(fee).toLocaleString('en-ET')
}
</script>

<template>
  <section id="plans" class="section plans-section">
    <div class="container">
      <div class="section-header">
        <span class="section-tag">Plans & Pricing</span>
        <h2 class="section-title">Choose the right plan<br>for your team</h2>
        <p class="section-subtitle">
          Flexible plans that scale with your company. All plans include access
          to our mobile app and dedicated support.
        </p>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading" class="plans-grid">
        <div v-for="n in 3" :key="n" class="plan-card plan-skeleton">
          <div class="sk-line sk-name"></div>
          <div class="sk-line sk-price"></div>
          <div class="sk-line sk-feat"></div>
          <div class="sk-line sk-feat"></div>
          <div class="sk-line sk-feat"></div>
          <div class="sk-btn"></div>
        </div>
      </div>

      <!-- Error fallback -->
      <div v-else-if="error" class="plans-error">
        <p>Unable to load plans. Please refresh or contact us directly.</p>
      </div>

      <!-- Dynamic plan cards -->
      <div v-else class="plans-grid">
        <div
          v-for="(plan, idx) in plans"
          :key="plan.id"
          class="plan-card"
          :class="{ featured: palette(idx).featured, 'has-badge': !!badgeLabel(idx) }"
          :style="{ background: palette(idx).bg }"
        >
          <!-- Badge (Most Popular / Premium) -->
          <div
            v-if="badgeLabel(idx)"
            class="plan-badge"
            :style="{
              background: palette(idx).featured ? 'var(--color-green)' : '#fef3c7',
              color: palette(idx).featured ? '#fff' : '#d97706'
            }"
          >{{ badgeLabel(idx) }}</div>

          <div class="plan-header">
            <h3 class="plan-name" :style="{ color: palette(idx).nameColor }">{{ plan.name }}</h3>
            <div class="plan-price-row">
              <span class="plan-currency" :style="{ color: palette(idx).mutedColor }">ETB</span>
              <span class="plan-price"    :style="{ color: palette(idx).nameColor }">{{ formatPrice(plan.monthly_fee_etb) }}</span>
              <span class="plan-period"   :style="{ color: palette(idx).mutedColor }">/employee / month</span>
            </div>
            <p class="plan-desc" :style="{ color: palette(idx).mutedColor }">
              {{ levelDesc(plan.target_level, plan.tier) }}
            </p>
          </div>

          <div class="plan-partners">
            <span v-for="emoji in emojis(plan.tier)" :key="emoji" class="partner-emoji">{{ emoji }}</span>
          </div>

          <ul class="plan-features">
            <li
              v-for="feature in (plan.features ?? []).slice(0, 7)"
              :key="feature"
              class="plan-feature"
              :style="{ color: palette(idx).textColor }"
            >
              <span class="check-icon" :style="{ color: palette(idx).checkColor }">✓</span>
              {{ feature }}
            </li>
          </ul>

          <RouterLink
            to="/signup/company"
            class="btn plan-btn"
            :style="{ background: palette(idx).btnBg, color: '#fff' }"
          >
            Get Started
          </RouterLink>
        </div>
      </div>

      <div v-if="!loading && !error && plans.length" class="plans-note">
        <span>💡</span>
        All plans are billed in Ethiopian Birr (ETB) on a quarterly cycle. No hidden fees.
      </div>
    </div>
  </section>
</template>

<style scoped>
.plans-section { background: var(--color-white); }

.section-header {
  text-align: center;
  margin-bottom: 60px;
}
.section-tag {
  display: inline-block;
  padding: 6px 16px;
  background: var(--color-bg-light);
  color: var(--color-accent);
  border-radius: var(--radius-full);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 16px;
}
.section-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--color-primary);
  margin-bottom: 16px;
  line-height: 1.2;
}
.section-subtitle {
  font-size: 1.05rem;
  color: var(--color-text-muted);
  max-width: 500px;
  margin: 0 auto;
  line-height: 1.7;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
  align-items: start;
  margin-bottom: 32px;
  padding-top: 20px; /* room for top-positioned badges */
}

/* Plan card */
.plan-card {
  border-radius: var(--radius-xl);
  padding: 36px 24px;
  border: 1.5px solid var(--color-border);
  position: relative;
  transition: var(--transition);
  min-width: 0;
}
/* Give cards with a badge enough top clearance so the badge isn't clipped */
.plan-card.has-badge {
  margin-top: 16px;
}
.plan-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--color-card-shadow-hover);
}
.plan-card.featured {
  border-color: transparent;
  box-shadow: 0 20px 60px rgba(27, 58, 107, 0.25);
  transform: scale(1.03);
}
.plan-card.featured:hover { transform: scale(1.03) translateY(-6px); }

/* Skeleton */
.plan-skeleton { pointer-events: none; }
.sk-line, .sk-btn {
  border-radius: 6px;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
.sk-name  { height: 28px; width: 60%; margin-bottom: 14px; }
.sk-price { height: 48px; width: 45%; margin-bottom: 16px; }
.sk-feat  { height: 14px; width: 85%; margin-bottom: 10px; }
.sk-btn   { height: 46px; width: 100%; margin-top: 20px; border-radius: 8px; }
@keyframes shimmer { to { background-position: -200% 0; } }

.plan-badge {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  padding: 5px 18px;
  border-radius: var(--radius-full);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.plan-header  { margin-bottom: 20px; }
.plan-name    { font-size: 1.3rem; font-weight: 700; margin-bottom: 12px; word-break: break-word; }
.plan-price-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 4px;
}
.plan-currency { font-size: 1.1rem; font-weight: 600; }
.plan-price    { font-size: 2.6rem; font-weight: 900; line-height: 1; }
.plan-period   { font-size: 0.8rem; width: 100%; margin-top: 2px; }
.plan-desc     { font-size: 0.86rem; line-height: 1.6; margin-top: 8px; }

.plan-partners {
  display: flex;
  gap: 6px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.partner-emoji {
  font-size: 1.2rem;
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.15);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.plan-features {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 28px;
}
.plan-feature {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.9rem;
  line-height: 1.5;
}
.check-icon { font-weight: 700; flex-shrink: 0; margin-top: 1px; }

.plan-btn {
  display: block;
  width: 100%;
  padding: 14px;
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  font-weight: 700;
  text-align: center;
  transition: var(--transition);
}
.plan-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.15);
}

.plans-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.88rem;
  color: var(--color-text-muted);
  text-align: center;
}

.plans-error {
  text-align: center;
  padding: 40px;
  color: var(--color-text-muted);
  background: var(--color-bg-soft);
  border-radius: var(--radius-lg);
  margin-bottom: 32px;
}

@media (max-width: 1100px) {
  .plans-grid { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
}
@media (max-width: 700px) {
  .plans-grid { grid-template-columns: 1fr; max-width: 420px; margin: 0 auto 32px; }
  .plan-card.featured { transform: none; }
  .plan-card.featured:hover { transform: translateY(-6px); }
}
</style>
