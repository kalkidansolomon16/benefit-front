<script setup lang="ts">
import { ref } from 'vue'

const testimonials = [
  {
    quote:
      'FitAccess completely transformed how our employees think about their health. Participation jumped from 11% to 74% in the first year alone — remarkable for Ethiopia.',
    name: 'Tigist Haile',
    role: 'VP of Human Resources',
    company: 'Commercial Bank of Ethiopia',
    avatar: '👩‍💼',
    rating: 5,
    color: '#dbeafe',
  },
  {
    quote:
      'The ROI was undeniable. We saw a 40% drop in absenteeism and our staff retention hit an all-time high. Best HR investment we have ever made in Addis.',
    name: 'Dawit Bekele',
    role: 'Chief Human Resources Officer',
    company: 'Ethiopian Airlines',
    avatar: '👨‍💼',
    rating: 5,
    color: '#dcfce7',
  },
  {
    quote:
      'I love that I can check into Sheraton Gym and track my sessions all with my FAN number. FitAccess makes staying healthy so easy in Addis Ababa.',
    name: 'Hiwot Tesfaye',
    role: 'Senior Software Engineer',
    company: 'Ethio Telecom',
    avatar: '👩‍💻',
    rating: 5,
    color: '#fce7f3',
  },
  {
    quote:
      'Onboarding was seamless. Within two weeks our entire Addis office was enrolled and using FitAccess. The local support team understood our Ethiopian context perfectly.',
    name: 'Bereket Alemu',
    role: 'HR Manager',
    company: 'Awash Bank',
    avatar: '👨‍🏫',
    rating: 5,
    color: '#fef3c7',
  },
]

const active = ref(0)
const prev = () => { active.value = (active.value - 1 + testimonials.length) % testimonials.length }
const next = () => { active.value = (active.value + 1) % testimonials.length }
</script>

<template>
  <section class="section testimonials-section">
    <div class="container">
      <div class="section-header">
        <span class="section-tag">Testimonials</span>
        <h2 class="section-title">Loved by employees.<br>Trusted by HR teams.</h2>
        <p class="section-subtitle">
          Don't take our word for it — hear from the companies and employees
          who've experienced the FitAccess difference.
        </p>
      </div>

      <!-- Featured testimonial -->
      <div class="featured-testimonial" :style="{ background: testimonials[active].color }">
        <div class="quote-icon">"</div>
        <p class="featured-quote">{{ testimonials[active].quote }}</p>
        <div class="featured-author">
          <div class="author-avatar">{{ testimonials[active].avatar }}</div>
          <div>
            <div class="author-name">{{ testimonials[active].name }}</div>
            <div class="author-role">{{ testimonials[active].role }}, {{ testimonials[active].company }}</div>
          </div>
          <div class="author-stars">
            <span v-for="n in testimonials[active].rating" :key="n">★</span>
          </div>
        </div>
        <div class="testimonial-nav">
          <button class="nav-btn" @click="prev" aria-label="Previous">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div class="nav-dots">
            <button
              v-for="(_, i) in testimonials"
              :key="i"
              class="nav-dot"
              :class="{ active: i === active }"
              @click="active = i"
            ></button>
          </div>
          <button class="nav-btn" @click="next" aria-label="Next">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      <!-- Testimonials grid -->
      <div class="testimonials-grid">
        <div
          v-for="(t, i) in testimonials"
          :key="i"
          class="testimonial-card"
          :class="{ active: i === active }"
          @click="active = i"
        >
          <div class="card-stars">
            <span v-for="n in t.rating" :key="n">★</span>
          </div>
          <p class="card-quote">"{{ t.quote.slice(0, 90) }}..."</p>
          <div class="card-author">
            <span class="card-avatar">{{ t.avatar }}</span>
            <div>
              <div class="card-name">{{ t.name }}</div>
              <div class="card-role">{{ t.role }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.testimonials-section { background: var(--color-bg-soft); }

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

/* Featured */
.featured-testimonial {
  border-radius: var(--radius-xl);
  padding: 56px 60px;
  margin-bottom: 32px;
  position: relative;
  transition: background 0.4s ease;
}

.quote-icon {
  font-size: 6rem;
  line-height: 0.6;
  color: rgba(27, 58, 107, 0.12);
  font-family: Georgia, serif;
  margin-bottom: 16px;
}

.featured-quote {
  font-size: 1.4rem;
  font-weight: 500;
  color: var(--color-primary);
  line-height: 1.6;
  max-width: 800px;
  margin-bottom: 32px;
  font-style: italic;
}

.featured-author {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.author-avatar {
  width: 52px; height: 52px;
  background: rgba(255,255,255,0.6);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem;
}
.author-name {
  font-weight: 700;
  font-size: 1rem;
  color: var(--color-primary);
}
.author-role {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}
.author-stars {
  margin-left: auto;
  font-size: 1.2rem;
  color: #f59e0b;
}

.testimonial-nav {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 28px;
}
.nav-btn {
  width: 40px; height: 40px;
  border-radius: 50%;
  background: rgba(255,255,255,0.6);
  border: 1.5px solid rgba(27,58,107,0.15);
  display: flex; align-items: center; justify-content: center;
  color: var(--color-primary);
  transition: var(--transition);
  flex-shrink: 0;
}
.nav-btn:hover {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}
.nav-dots { display: flex; gap: 8px; }
.nav-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: rgba(27,58,107,0.2);
  transition: var(--transition);
  border: none;
}
.nav-dot.active { background: var(--color-primary); width: 24px; border-radius: 4px; }

/* Grid */
.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.testimonial-card {
  background: var(--color-white);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px 20px;
  cursor: pointer;
  transition: var(--transition);
}
.testimonial-card:hover,
.testimonial-card.active {
  border-color: var(--color-accent);
  box-shadow: var(--color-card-shadow);
  transform: translateY(-3px);
}
.card-stars { color: #f59e0b; font-size: 0.85rem; margin-bottom: 10px; }
.card-quote {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  line-height: 1.6;
  margin-bottom: 14px;
  font-style: italic;
}
.card-author { display: flex; align-items: center; gap: 10px; }
.card-avatar {
  width: 34px; height: 34px;
  background: var(--color-bg-light);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}
.card-name { font-size: 0.82rem; font-weight: 600; color: var(--color-primary); }
.card-role { font-size: 0.75rem; color: var(--color-text-muted); }

@media (max-width: 900px) {
  .testimonials-grid { grid-template-columns: repeat(2, 1fr); }
  .featured-testimonial { padding: 36px 28px; }
  .featured-quote { font-size: 1.15rem; }
  .section-title { font-size: 2rem; }
}
@media (max-width: 560px) {
  .testimonials-grid { grid-template-columns: 1fr; }
  .author-stars { display: none; }
}
</style>
