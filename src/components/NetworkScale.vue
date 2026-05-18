<script setup lang="ts">
const cards = [
  {
    icon: '🏋️',
    value: '120+',
    label: 'Partner Gyms in Addis',
    desc: 'Premium hotel gyms, fitness studios, and wellness centres across Addis Ababa',
    color: '#dbeafe',
    accent: '#2563eb',
  },
  {
    icon: '🏢',
    value: '500+',
    label: 'Enrolled Companies',
    desc: 'Ethiopian organisations trust FitAccess to manage their employee wellness',
    color: '#dcfce7',
    accent: '#16a34a',
  },
  {
    icon: '🧑‍⚕️',
    value: '200+',
    label: 'Certified Wellness Coaches',
    desc: 'Licensed trainers, nutritionists, and mental health professionals in Addis',
    color: '#fce7f3',
    accent: '#db2777',
  },
  {
    icon: '📍',
    value: '10+',
    label: 'Addis Ababa Sub-Cities',
    desc: 'Partner locations spread across Bole, Kazanchis, Piassa, CMC, and beyond',
    color: '#fef3c7',
    accent: '#d97706',
  },
]
</script>

<template>
  <section class="section network-section">
    <div class="container">
      <div class="network-layout">
        <div class="network-text">
          <span class="section-tag">Our Network</span>
          <h2 class="section-title">Addis Ababa's largest<br>wellness network</h2>
          <p class="section-subtitle">
            Whether your team works in Bole, Kazanchis, or anywhere across the capital —
            they'll always have a FitAccess partner location nearby.
          </p>
          <a href="#plans" class="btn btn-primary network-cta">Explore the Network</a>
        </div>

        <div class="network-cards">
          <div
            v-for="card in cards"
            :key="card.label"
            class="network-card"
          >
            <div class="network-card-icon" :style="{ background: card.color }">
              {{ card.icon }}
            </div>
            <div class="network-card-value" :style="{ color: card.accent }">{{ card.value }}</div>
            <div class="network-card-label">{{ card.label }}</div>
            <div class="network-card-desc">{{ card.desc }}</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.network-section {
  background: var(--color-bg-soft);
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
  line-height: 1.7;
  margin-bottom: 32px;
  max-width: 440px;
}

.network-layout {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 80px;
  align-items: center;
}

.network-cta { align-self: flex-start; }

.network-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.network-card {
  background: var(--color-white);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 28px 22px;
  transition: var(--transition);
}
.network-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--color-card-shadow-hover);
  border-color: transparent;
}

.network-card-icon {
  width: 52px; height: 52px;
  border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem;
  margin-bottom: 16px;
}

.network-card-value {
  font-size: 2rem;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 4px;
  letter-spacing: -0.02em;
}

.network-card-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: 8px;
}

.network-card-desc {
  font-size: 0.82rem;
  color: var(--color-text-muted);
  line-height: 1.5;
}

@media (max-width: 900px) {
  .network-layout { grid-template-columns: 1fr; gap: 40px; }
  .section-title { font-size: 2rem; }
  .section-subtitle { max-width: 100%; }
}
@media (max-width: 480px) {
  .network-cards { grid-template-columns: 1fr; }
}
</style>
