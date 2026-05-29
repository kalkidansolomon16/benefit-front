<script setup lang="ts">
const plans = [
  {
    name: 'Basic',
    price: '3,800',
    description: 'Ideal for managers & staff. Access to standard partner gyms across Addis Ababa.',
    color: '#EBFAEE',
    accent: '#4CD964',
    badge: '',
    features: [
      'Basic-tier partner gyms in Addis',
      'FAN number gym check-in',
      'Monthly wellness report',
      'Employee mobile app access',
      'Standard equipment & facilities',
    ],
    partnerEmojis: ['🏋️', '🧘', '🏃', '💪'],
    level: 'Manager / Staff',
  },
  {
    name: 'Basic Plus',
    price: '7,200',
    description: 'Designed for directors. Mid-tier gyms with group classes & clinics.',
    color: '#1b3a6b',
    accent: '#ffffff',
    badge: 'Most Popular',
    features: [
      'Mid-tier partner gyms in Addis',
      'Group fitness classes',
      'Nutrition & wellness clinics',
      'Priority check-in support',
      'Monthly analytics for HR',
      'Dedicated account manager',
    ],
    partnerEmojis: ['🏊', '🤸', '⚡', '🥗', '🧘'],
    level: 'Director Level',
  },
  {
    name: 'Platinum',
    price: '19,600',
    description: 'The premium experience for chiefs. Top-tier gyms, spa & personal coaches.',
    color: '#fef9ec',
    accent: '#d97706',
    badge: 'Premium',
    features: [
      'All premium gyms & hotel facilities',
      'Spa, sauna & pool access',
      'Private & group classes',
      'Personal wellness coach',
      'Medical & dental clinic access',
      'Custom wellness challenges',
      'Full HR analytics dashboard',
    ],
    partnerEmojis: ['🥇', '🏆', '💆', '🏅', '⭐'],
    level: 'Chief Level',
  },
]
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

      <div class="plans-grid">
        <div
          v-for="plan in plans"
          :key="plan.name"
          class="plan-card"
          :class="{ featured: plan.name === 'Basic Plus' }"
          :style="{ background: plan.color }"
        >
          <div v-if="plan.badge" class="plan-badge" :style="{ background: plan.name === 'Basic Plus' ? 'var(--color-green)' : '#fef3c7', color: plan.name === 'Basic Plus' ? '#fff' : '#d97706' }">
            {{ plan.badge }}
          </div>

          <div class="plan-header">
            <h3 class="plan-name" :style="{ color: plan.name === 'Basic Plus' ? '#fff' : 'var(--color-primary)' }">
              {{ plan.name }}
            </h3>
            <div class="plan-price-row">
              <span class="plan-currency" :style="{ color: plan.name === 'Basic Plus' ? 'rgba(255,255,255,0.7)' : 'var(--color-text-muted)' }">ETB</span>
              <span class="plan-price" :style="{ color: plan.name === 'Basic Plus' ? '#fff' : 'var(--color-primary)' }">{{ plan.price }}</span>
              <span class="plan-period" :style="{ color: plan.name === 'Basic Plus' ? 'rgba(255,255,255,0.6)' : 'var(--color-text-muted)' }">/employee/mo</span>
            </div>
            <p class="plan-desc" :style="{ color: plan.name === 'Basic Plus' ? 'rgba(255,255,255,0.75)' : 'var(--color-text-muted)' }">
              {{ plan.description }}
            </p>
          </div>

          <div class="plan-partners">
            <span v-for="emoji in plan.partnerEmojis" :key="emoji" class="partner-emoji">{{ emoji }}</span>
          </div>

          <ul class="plan-features">
            <li
              v-for="feature in plan.features"
              :key="feature"
              class="plan-feature"
              :style="{ color: plan.name === 'Basic Plus' ? 'rgba(255,255,255,0.9)' : 'var(--color-text)' }"
            >
              <span class="check-icon" :style="{ color: plan.name === 'Basic Plus' ? 'var(--color-green)' : 'var(--color-accent)' }">✓</span>
              {{ feature }}
            </li>
          </ul>

          <a
            href="#"
            class="btn plan-btn"
            :style="{
              background: plan.name === 'Basic Plus' ? 'var(--color-green)' : 'var(--color-primary)',
              color: '#fff'
            }"
          >
            Get Started
          </a>
        </div>
      </div>

      <div class="plans-note">
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
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  align-items: start;
  margin-bottom: 32px;
}

.plan-card {
  border-radius: var(--radius-xl);
  padding: 36px 28px;
  border: 1.5px solid var(--color-border);
  position: relative;
  transition: var(--transition);
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

.plan-header { margin-bottom: 24px; }
.plan-name {
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 12px;
}
.plan-price-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 10px;
}
.plan-currency { font-size: 1.2rem; font-weight: 600; }
.plan-price { font-size: 3rem; font-weight: 900; line-height: 1; }
.plan-period { font-size: 0.82rem; }
.plan-desc { font-size: 0.88rem; line-height: 1.6; }

.plan-partners {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.partner-emoji {
  font-size: 1.4rem;
  width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.15);
  border-radius: var(--radius-sm);
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
  width: 100%;
  padding: 14px;
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  font-weight: 700;
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

@media (max-width: 900px) {
  .plans-grid { grid-template-columns: 1fr; max-width: 420px; margin: 0 auto 32px; }
  .plan-card.featured { transform: none; }
  .plan-card.featured:hover { transform: translateY(-6px); }
}
</style>
