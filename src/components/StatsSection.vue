<script setup lang="ts">
import { ref, onMounted } from 'vue'

const stats = [
  {
    value: 78,
    suffix: '%',
    label: 'of Ethiopian corporate employees had no gym access before FitAccess',
    icon: '🏅',
    color: '#dbeafe',
    accent: '#2563eb',
  },
  {
    value: 40,
    suffix: '%',
    label: 'drop in absenteeism reported by enrolled Ethiopian companies',
    icon: '💰',
    color: '#dcfce7',
    accent: '#16a34a',
  },
  {
    value: 35,
    suffix: '%',
    label: 'improvement in employee retention across partner organisations',
    icon: '🤝',
    color: '#fce7f3',
    accent: '#db2777',
  },
]

const counters = ref(stats.map(() => 0))
const hasAnimated = ref(false)

const animateCounter = (target: number, index: number) => {
  const duration = 1800
  const start = Date.now()
  const tick = () => {
    const elapsed = Date.now() - start
    const progress = Math.min(elapsed / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    counters.value[index] = Math.round(eased * target)
    if (progress < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

onMounted(() => {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !hasAnimated.value) {
        hasAnimated.value = true
        stats.forEach((s, i) => animateCounter(s.value, i))
        observer.disconnect()
      }
    },
    { threshold: 0.3 }
  )
  const el = document.getElementById('stats')
  if (el) observer.observe(el)
})
</script>

<template>
  <section id="stats" class="section stats-section">
    <div class="stats-bg">
      <div class="stats-bg-shape"></div>
    </div>
    <div class="container">
      <div class="section-header">
        <span class="section-tag">Proven Results</span>
        <h2 class="section-title">The ROI speaks for itself</h2>
        <p class="section-subtitle">
          Data from thousands of companies shows that investing in employee wellness
          pays dividends across every business metric that matters.
        </p>
      </div>

      <div class="stats-grid">
        <div
          v-for="(stat, i) in stats"
          :key="i"
          class="stat-card"
        >
          <div class="stat-icon-wrap" :style="{ background: stat.color }">
            <span class="stat-icon">{{ stat.icon }}</span>
          </div>
          <div class="stat-value" :style="{ color: stat.accent }">
            {{ counters[i] }}<span class="stat-suffix">{{ stat.suffix }}</span>
          </div>
          <p class="stat-label">{{ stat.label }}</p>
          <div class="stat-progress">
            <div
              class="stat-progress-fill"
              :style="{
                width: `${counters[i]}%`,
                background: stat.accent
              }"
            ></div>
          </div>
        </div>
      </div>

      <div class="stats-note">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
        </svg>
        Based on data collected from 500+ enrolled organisations across Addis Ababa, Ethiopia.
      </div>
    </div>
  </section>
</template>

<style scoped>
.stats-section {
  background: var(--color-bg-soft);
  position: relative;
  overflow: hidden;
}

.stats-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.stats-bg-shape {
  position: absolute;
  width: 800px; height: 800px;
  background: radial-gradient(circle, rgba(37,99,235,0.05) 0%, transparent 70%);
  top: -200px; right: -200px;
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
  margin-bottom: 16px;
}
.section-subtitle {
  font-size: 1.05rem;
  color: var(--color-text-muted);
  max-width: 540px;
  margin: 0 auto;
  line-height: 1.7;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
  margin-bottom: 32px;
}

.stat-card {
  background: var(--color-white);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 36px 28px;
  text-align: center;
  transition: var(--transition);
}
.stat-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--color-card-shadow-hover);
  border-color: transparent;
}

.stat-icon-wrap {
  width: 64px; height: 64px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 20px;
}
.stat-icon { font-size: 1.8rem; }

.stat-value {
  font-size: 4rem;
  font-weight: 900;
  line-height: 1;
  margin-bottom: 12px;
  letter-spacing: -0.02em;
}
.stat-suffix { font-size: 2.5rem; }

.stat-label {
  font-size: 0.92rem;
  color: var(--color-text-muted);
  line-height: 1.6;
  margin-bottom: 20px;
  min-height: 48px;
}

.stat-progress {
  height: 4px;
  background: var(--color-bg-gray);
  border-radius: var(--radius-full);
  overflow: hidden;
}
.stat-progress-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 1.8s cubic-bezier(0.22, 1, 0.36, 1);
}

.stats-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.82rem;
  color: var(--color-text-light);
}

@media (max-width: 768px) {
  .stats-grid { grid-template-columns: 1fr; }
  .stat-value { font-size: 3rem; }
}
</style>
