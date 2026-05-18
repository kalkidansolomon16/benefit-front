<script setup lang="ts">
const steps = [
  {
    number: '01',
    icon: '🏢',
    title: 'Your Company Subscribes',
    description:
      'Your Ethiopian organisation picks a quarterly plan in ETB that fits your headcount and employee grade — Basic, Basic Plus, or Platinum. HR handles one invoice, we do the rest.',
    color: '#dbeafe',
    accent: '#2563eb',
  },
  {
    number: '02',
    icon: '🪪',
    title: 'Employees Get a FAN Number',
    description:
      'Each enrolled employee receives a unique FAN (FitAccess Number) tied to their level — staff, director, or chief. No membership cards, no cash — just their FAN number.',
    color: '#dcfce7',
    accent: '#16a34a',
  },
  {
    number: '03',
    icon: '🏋️',
    title: 'Check In Across Addis',
    description:
      'Employees walk into any partner gym, clinic, or wellness centre in Addis Ababa and check in with their FAN number. Sessions are logged automatically for HR reporting.',
    color: '#fef3c7',
    accent: '#d97706',
  },
]
</script>

<template>
  <section id="how-it-works" class="section how-section">
    <div class="container">
      <div class="section-header">
        <span class="section-tag">How It Works</span>
        <h2 class="section-title">Simple for companies.<br>Powerful for employees.</h2>
        <p class="section-subtitle">
          A seamless three-step model that creates shared value for organizations and their teams.
        </p>
      </div>

      <div class="steps-grid">
        <div
          v-for="step in steps"
          :key="step.number"
          class="step-card"
        >
          <div class="step-icon-wrap" :style="{ background: step.color }">
            <span class="step-icon">{{ step.icon }}</span>
          </div>
          <div class="step-number" :style="{ color: step.accent }">{{ step.number }}</div>
          <h3 class="step-title">{{ step.title }}</h3>
          <p class="step-desc">{{ step.description }}</p>
          <div class="step-bar" :style="{ background: step.color }">
            <div class="step-bar-fill" :style="{ background: step.accent }"></div>
          </div>
        </div>
      </div>

      <div class="how-cta">
        <a href="#plans" class="btn btn-primary">See Plans & Pricing</a>
        <a href="#stats" class="btn btn-outline">View ROI Data</a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.how-section {
  background: var(--color-white);
}

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
  line-height: 1.2;
  margin-bottom: 16px;
}

.section-subtitle {
  font-size: 1.1rem;
  color: var(--color-text-muted);
  max-width: 540px;
  margin: 0 auto;
  line-height: 1.7;
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
  margin-bottom: 48px;
}

.step-card {
  padding: 36px 28px;
  border-radius: var(--radius-lg);
  border: 1.5px solid var(--color-border);
  background: var(--color-white);
  transition: var(--transition);
  position: relative;
  overflow: hidden;
}

.step-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-accent), var(--color-green));
  opacity: 0;
  transition: var(--transition);
}

.step-card:hover {
  border-color: transparent;
  box-shadow: var(--color-card-shadow-hover);
  transform: translateY(-6px);
}
.step-card:hover::before { opacity: 1; }

.step-icon-wrap {
  width: 60px; height: 60px;
  border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 20px;
}
.step-icon { font-size: 1.6rem; }

.step-number {
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 10px;
}

.step-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 12px;
}

.step-desc {
  font-size: 0.95rem;
  color: var(--color-text-muted);
  line-height: 1.7;
  margin-bottom: 24px;
}

.step-bar {
  height: 4px;
  border-radius: var(--radius-full);
  overflow: hidden;
}
.step-bar-fill {
  height: 100%;
  width: 60%;
  border-radius: var(--radius-full);
  animation: barGrow 2s ease-out forwards;
}
@keyframes barGrow {
  from { width: 0; }
}

.how-cta {
  display: flex;
  gap: 16px;
  justify-content: center;
}

@media (max-width: 768px) {
  .steps-grid { grid-template-columns: 1fr; }
  .section-title { font-size: 2rem; }
  .how-cta { flex-direction: column; align-items: center; }
}
</style>
