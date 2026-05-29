<script setup lang="ts">
const resources = [
  {
    category: 'Report',
    categoryColor: '#EBFAEE',
    categoryText: '#4CD964',
    title: '2024 Ethiopian Corporate Wellness Report',
    description: 'Discover how Addis Ababa\'s top employers are investing in staff health, reducing absenteeism, and boosting morale with structured wellness benefits.',
    emoji: '📊',
    readTime: '8 min read',
    bgColor: '#EBFAEE',
  },
  {
    category: 'Guide',
    categoryColor: '#dcfce7',
    categoryText: '#16a34a',
    title: 'HR Enrollment Guide for Ethiopian Companies',
    description: 'Step-by-step playbook for launching FitAccess in your Addis organisation — from FAN number setup to first check-in at a partner gym.',
    emoji: '📋',
    readTime: '10 min read',
    bgColor: '#f0fdf4',
  },
  {
    category: 'Calculator',
    categoryColor: '#fce7f3',
    categoryText: '#db2777',
    title: 'ETB Wellness ROI Calculator',
    description: 'Calculate how much your company can save in ETB on lost productivity and staff turnover by investing in FitAccess wellness plans.',
    emoji: '🧮',
    readTime: '5 min read',
    bgColor: '#fdf2f8',
  },
  {
    category: 'Case Study',
    categoryColor: '#fef3c7',
    categoryText: '#d97706',
    title: 'How CBE Reduced Absenteeism by 40%',
    description: 'Learn how Commercial Bank of Ethiopia transformed workforce wellness across its Addis branches with a structured FitAccess rollout.',
    emoji: '🏆',
    readTime: '6 min read',
    bgColor: '#fffbeb',
  },
]
</script>

<template>
  <section class="section resources-section">
    <div class="container">
      <div class="resources-header">
        <div>
          <span class="section-tag">Resources</span>
          <h2 class="section-title">Insights to fuel<br>your wellness strategy</h2>
        </div>
        <a href="#" class="btn btn-outline view-all">View All Resources →</a>
      </div>

      <div class="resources-grid">
        <article
          v-for="res in resources"
          :key="res.title"
          class="resource-card"
          :style="{ background: res.bgColor }"
        >
          <div class="resource-emoji">{{ res.emoji }}</div>
          <div class="resource-meta">
            <span
              class="resource-category"
              :style="{ background: res.categoryColor, color: res.categoryText }"
            >{{ res.category }}</span>
            <span class="resource-time">{{ res.readTime }}</span>
          </div>
          <h3 class="resource-title">{{ res.title }}</h3>
          <p class="resource-desc">{{ res.description }}</p>
          <a href="#" class="resource-link" :style="{ color: res.categoryText }">
            Read more
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.resources-section { background: var(--color-white); }

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
}

.resources-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 48px;
}
.view-all { flex-shrink: 0; }

.resources-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.resource-card {
  border-radius: var(--radius-lg);
  border: 1.5px solid var(--color-border);
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: var(--transition);
  cursor: pointer;
}
.resource-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--color-card-shadow-hover);
  border-color: transparent;
}

.resource-emoji { font-size: 2.2rem; }

.resource-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}
.resource-category {
  padding: 3px 12px;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 700;
}
.resource-time {
  font-size: 0.78rem;
  color: var(--color-text-light);
}

.resource-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-primary);
  line-height: 1.4;
}

.resource-desc {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  line-height: 1.6;
  flex: 1;
}

.resource-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  transition: var(--transition);
}
.resource-link:hover { gap: 10px; }

@media (max-width: 1024px) {
  .resources-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .resources-grid { grid-template-columns: 1fr; }
  .resources-header { flex-direction: column; align-items: flex-start; }
  .section-title { font-size: 2rem; }
}
</style>
