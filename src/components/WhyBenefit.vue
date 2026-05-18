<script setup lang="ts">
const reasons = [
  {
    icon: '🇪🇹',
    title: 'Built for Ethiopia',
    description:
      'FitAccess is designed specifically for Ethiopian organisations — ETB billing, FAN-number check-in, and Addis Ababa partners. No foreign subscriptions or dollar conversions.',
    color: '#dcfce7',
    accent: '#16a34a',
  },
  {
    icon: '💸',
    title: 'Affordable ETB Pricing',
    description:
      'Plans start at ETB 3,800 per employee per month — far cheaper than individual hotel gym memberships. One quarterly invoice covers your entire team.',
    color: '#dbeafe',
    accent: '#2563eb',
  },
  {
    icon: '🔓',
    title: 'Grade-Based Access Tiers',
    description:
      'Staff and managers get Basic gyms, directors get mid-tier facilities and group classes, chiefs get full platinum access including spas and personal coaches.',
    color: '#fce7f3',
    accent: '#db2777',
  },
  {
    icon: '📊',
    title: 'Real-Time HR Analytics',
    description:
      'Track check-ins, utilisation rates, and wellness trends across your Addis workforce with our live HR dashboard — exportable for board reports.',
    color: '#fef3c7',
    accent: '#d97706',
  },
  {
    icon: '🏥',
    title: 'Beyond the Gym',
    description:
      'FitAccess covers nutrition clinics, mental health centres, and medical facilities across Addis — addressing the full spectrum of employee wellbeing.',
    color: '#f3e8ff',
    accent: '#7c3aed',
  },
  {
    icon: '🤝',
    title: 'Local Dedicated Support',
    description:
      'Our Addis-based account managers speak Amharic and understand Ethiopian corporate culture. We are here from onboarding day to every quarterly renewal.',
    color: '#fee2e2',
    accent: '#dc2626',
  },
]
</script>

<template>
  <section id="why" class="section why-section">
    <div class="why-bg">
      <div class="why-bg-blob"></div>
    </div>
    <div class="container">
      <div class="section-header">
        <span class="section-tag">Why FitAccess</span>
        <h2 class="section-title">Everything you need.<br>Nothing you don't.</h2>
        <p class="section-subtitle">
          Built with both HR teams and employees in mind — FitAccess makes corporate
          wellness simple, affordable, and genuinely effective.
        </p>
      </div>

      <div class="why-grid">
        <div
          v-for="reason in reasons"
          :key="reason.title"
          class="why-card"
        >
          <div class="why-icon-wrap" :style="{ background: reason.color }">
            <span class="why-icon">{{ reason.icon }}</span>
          </div>
          <h3 class="why-title" :style="{ color: reason.accent }">{{ reason.title }}</h3>
          <p class="why-desc">{{ reason.description }}</p>
        </div>
      </div>

      <div class="why-cta-block">
        <div class="why-cta-content">
          <h3>Ready to transform your employee wellness?</h3>
          <p>Join 500+ Ethiopian organisations already seeing results with FitAccess.</p>
        </div>
        <div class="why-cta-buttons">
          <a href="#plans" class="btn btn-primary">Get Free Quote</a>
          <a href="#plans" class="btn btn-white">See All Plans</a>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.why-section {
  background: var(--color-primary);
  position: relative;
  overflow: hidden;
}

.why-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.why-bg-blob {
  position: absolute;
  width: 700px; height: 700px;
  background: radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 70%);
  top: -200px; right: -200px;
}

.section-header {
  text-align: center;
  margin-bottom: 60px;
}
.section-tag {
  display: inline-block;
  padding: 6px 16px;
  background: rgba(255,255,255,0.12);
  color: var(--color-green);
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
  color: var(--color-white);
  margin-bottom: 16px;
  line-height: 1.2;
}
.section-subtitle {
  font-size: 1.05rem;
  color: rgba(255,255,255,0.65);
  max-width: 540px;
  margin: 0 auto;
  line-height: 1.7;
}

.why-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 60px;
}

.why-card {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: var(--radius-lg);
  padding: 32px 24px;
  transition: var(--transition);
  backdrop-filter: blur(8px);
}
.why-card:hover {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.2);
  transform: translateY(-5px);
}

.why-icon-wrap {
  width: 56px; height: 56px;
  border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 18px;
}
.why-icon { font-size: 1.6rem; }

.why-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 10px;
}

.why-desc {
  font-size: 0.9rem;
  color: rgba(255,255,255,0.65);
  line-height: 1.7;
}

/* CTA Banner */
.why-cta-block {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: var(--radius-xl);
  padding: 48px 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  backdrop-filter: blur(8px);
}
.why-cta-content h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-white);
  margin-bottom: 8px;
}
.why-cta-content p {
  font-size: 0.95rem;
  color: rgba(255,255,255,0.6);
}
.why-cta-buttons {
  display: flex;
  gap: 14px;
  flex-shrink: 0;
}

@media (max-width: 900px) {
  .why-grid { grid-template-columns: repeat(2, 1fr); }
  .why-cta-block { flex-direction: column; text-align: center; }
}
@media (max-width: 560px) {
  .why-grid { grid-template-columns: 1fr; }
  .section-title { font-size: 2rem; }
  .why-cta-buttons { flex-direction: column; width: 100%; }
}
</style>
