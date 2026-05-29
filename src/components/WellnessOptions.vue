<script setup lang="ts">
const categories = [
  {
    label: 'Premium Gyms — Addis',
    icon: '🏋️',
    items: ['Sheraton Addis Gym', 'Intercontinental Fitness', 'Elilly Hotel Gym', 'Monarch Gym', 'Atlas Gym'],
    color: '#EBFAEE',
    accent: '#4CD964',
  },
  {
    label: 'Yoga & Mindfulness',
    icon: '🧘',
    items: ['Addis Yoga Studio', 'Zen Wellness Addis', 'Hilton Pool & Spa', 'Balance Studio', 'Serenity Centre'],
    color: '#f3e8ff',
    accent: '#2EB84B',
  },
  {
    label: 'Cardio & Group Classes',
    icon: '🚴',
    items: ['Century Park Gym', 'Radisson Blu Fitness', 'Hyatt Fitness Centre', 'Capital Hotel Gym', 'Sapphire Gym'],
    color: '#fce7f3',
    accent: '#db2777',
  },
  {
    label: 'Nutrition & Wellness Clinics',
    icon: '🥗',
    items: ['Tikur Anbessa Nutrition Clinic', 'Bethzatha Health Centre', 'Rift Valley Wellness', 'Harmony Clinic', 'Welo Health'],
    color: '#dcfce7',
    accent: '#16a34a',
  },
  {
    label: 'Mental Health Support',
    icon: '💆',
    items: ['Fikir Mental Health', 'Addis Counselling Centre', 'Bethel Mental Wellness', 'Hope Ethiopia', 'Mind & Soul Addis'],
    color: '#fef3c7',
    accent: '#d97706',
  },
  {
    label: 'Medical & Dental',
    icon: '🏥',
    items: ['MCM General Hospital', 'Korean Hospital Addis', 'St. Gabriel Hospital', 'Landmark Dental', 'Hayat Hospital'],
    color: '#fee2e2',
    accent: '#dc2626',
  },
]
</script>

<template>
  <section id="wellness" class="section wellness-section">
    <div class="container">
      <div class="section-header">
        <span class="section-tag">Wellness Options</span>
        <h2 class="section-title">Top wellness destinations<br>across Addis Ababa</h2>
        <p class="section-subtitle">
          From premium hotel gyms to nutrition clinics and mental health centres —
          all accessible with your FAN number, right here in Addis.
        </p>
      </div>

      <div class="wellness-grid">
        <div
          v-for="cat in categories"
          :key="cat.label"
          class="wellness-card"
          :style="{ borderTopColor: cat.accent }"
        >
          <div class="wellness-card-header">
            <div class="wellness-icon-wrap" :style="{ background: cat.color }">
              {{ cat.icon }}
            </div>
            <h3 class="wellness-label" :style="{ color: cat.accent }">{{ cat.label }}</h3>
          </div>
          <ul class="wellness-items">
            <li v-for="item in cat.items" :key="item" class="wellness-item">
              <span class="item-dot" :style="{ background: cat.accent }"></span>
              {{ item }}
            </li>
          </ul>
          <div class="wellness-more" :style="{ color: cat.accent }">+ hundreds more →</div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.wellness-section { background: var(--color-white); }

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

.wellness-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.wellness-card {
  background: var(--color-bg-soft);
  border-radius: var(--radius-lg);
  border: 1.5px solid var(--color-border);
  border-top: 3px solid;
  padding: 28px 24px;
  transition: var(--transition);
}
.wellness-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--color-card-shadow-hover);
  background: var(--color-white);
}

.wellness-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.wellness-icon-wrap {
  width: 48px; height: 48px;
  border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.4rem;
  flex-shrink: 0;
}
.wellness-label {
  font-size: 1rem;
  font-weight: 700;
}

.wellness-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}
.wellness-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.88rem;
  color: var(--color-text);
}
.item-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.wellness-more {
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}
.wellness-more:hover { text-decoration: underline; }

@media (max-width: 900px) {
  .wellness-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 560px) {
  .wellness-grid { grid-template-columns: 1fr; }
  .section-title { font-size: 2rem; }
}
</style>
