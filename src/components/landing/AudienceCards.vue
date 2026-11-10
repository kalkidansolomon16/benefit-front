<script setup lang="ts">
import { RouterLink } from 'vue-router'

const audiences = [
  {
    title: 'For Employers',
    text: 'Offer a benefit your team will actually use, and keep your people healthy, focused and loyal.',
    img: '/images/landing/office-et.jpg',
    alt: 'Colleagues talking in a bright office',
    to: '/for-employers',
    register: '/for-employers',
  },
  {
    title: 'For Employees',
    text: 'Work out, swim or unwind at partner facilities across the city with one pass from your employer.',
    img: '/images/landing/runner-stretch-et.jpg',
    alt: 'Man stretching before a morning run',
    to: '/for-employees',
    register: '/for-employees',
  },
  {
    title: 'Become a Partner',
    text: 'Welcome new regular visitors from companies all over Addis Ababa to your gym or wellness centre.',
    img: '/images/landing/addis-skyline-et.jpg',
    alt: 'Addis Ababa skyline at sunset',
    to: '/for-partners',
    register: '/for-partners',
  },
]
</script>

<template>
  <section class="lp-section" id="audiences">
    <div class="lp-container">
      <div class="lp-cards">
        <article v-for="a in audiences" :key="a.to" class="lp-card">
          <img :src="a.img" :alt="a.alt" class="lp-card-img" loading="lazy" />
          <h2 class="lp-card-title">{{ a.title }}</h2>
          <p class="lp-card-text">{{ a.text }}</p>
          <div class="audience-actions">
            <RouterLink :to="a.to" class="lp-btn lp-btn--dark lp-btn--sm">Learn more</RouterLink>
            <RouterLink :to="a.register" class="audience-register">Register</RouterLink>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.audience-actions {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.audience-actions .lp-btn { min-width: 12rem; }
.audience-register {
  font-weight: 700;
  text-decoration: underline;
  text-decoration-color: var(--lp-green);
  text-decoration-thickness: 3px;
  text-underline-offset: 5px;
}
</style>
