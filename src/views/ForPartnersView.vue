<script setup lang="ts">
import { RouterLink } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import FooterSection from '@/components/FooterSection.vue'
import BlobHero from '@/components/landing/BlobHero.vue'
import ContactBlock from '@/components/landing/ContactBlock.vue'
import RegisterBand from '@/components/landing/RegisterBand.vue'

const benefits = [
  {
    title: 'New business opportunities',
    text: 'Reach employees of companies across Addis Ababa who are looking for a place to train.',
    icon: ['M10 52V22h16v30M26 52V12h16v40M42 52V30h12v22'],
    acc: 'M6 52h52',
  },
  {
    title: 'Simple partnership',
    text: 'A free partner portal: scan the member barcode at the desk and every visit is logged automatically.',
    icon: ['M14 14h36v36H14z', 'M20 24v16m5-16v16m5-16v16m6-16v16m5-16v16'],
    acc: 'M8 32h48',
  },
  {
    title: 'Opportunities for your business',
    text: 'Get listed in the employee app, with your facility, opening hours and live crowd level.',
    icon: ['M32 56s-16-14-16-28a16 16 0 0132 0c0 14-16 28-16 28z'],
    acc: 'M26 28a6 6 0 1012 0 6 6 0 00-12 0',
  },
  {
    title: 'Clear insight',
    text: 'Follow your check-ins, manage your branches and your staff accounts in one place.',
    icon: ['M10 54V10', 'M10 54h46'],
    acc: 'M16 42l10-12 8 7 16-19',
  },
]

// Simple line icons (24×24) for each partner category
const categories = [
  { label: 'Gyms and weight training', d: 'M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12' },
  { label: 'Group and dance classes',  d: 'M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zm12-2a3 3 0 11-6 0 3 3 0 016 0z' },
  { label: 'Yoga and Pilates',         d: 'M12 4a2 2 0 100 4 2 2 0 000-4zM4 20h16M12 8v6m-6 6l6-6 6 6M5 11l7 1 7-1' },
  { label: 'Swimming pools',           d: 'M2 16c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2M2 20c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2M8 13V5a2 2 0 014 0M16 13V5a2 2 0 00-4 0M8 9h8' },
  { label: 'Spa and wellness',         d: 'M12 21c-4-2-7-5-7-9 3 0 5 1 7 4 2-3 4-4 7-4 0 4-3 7-7 9zM12 16c0-5 0-8 0-12M9 7c1-2 2-3 3-3s2 1 3 3' },
  { label: 'Martial arts and boxing',  d: 'M7 9a5 5 0 0110 0v4a4 4 0 01-4 4h-2a4 4 0 01-4-4V9zM9 17v4h6v-4M7 11h10' },
  { label: 'Racket and ball sports',   d: 'M14 4a6 6 0 110 12 6 6 0 010-12zM9.8 14.2L3 21M10 8l8 8M12 6l6 6' },
  { label: 'Health and nutrition',     d: 'M12 21s-8-5-8-11a4.5 4.5 0 018-3 4.5 4.5 0 018 3c0 6-8 11-8 11zM9 11h6M12 8v6' },
  { label: 'Hotel fitness centres',    d: 'M4 21V4h16v17M2 21h20M8 8h2m4 0h2M8 12h2m4 0h2M10 21v-4h4v4' },
  { label: 'Other activities',         d: 'M12 3l2.6 5.6 6.1.7-4.5 4.1 1.2 6L12 16.4 6.6 19.4l1.2-6L3.3 9.3l6.1-.7z' },
]

const process = [
  'Register your facility',
  'We review your application',
  'We get in touch with you',
  'Your account is approved',
  'Set up your facility and branches',
  'Add and train your staff',
  'Scan members and start welcoming them',
]
</script>

<template>
  <div class="lp">
    <NavBar theme="white" />

    <BlobHero
      theme="white"
      image="/images/landing/hero-partners-et.webp"
      alt="Smiling personal trainer with arms crossed"
      cta-label="I want to become a partner"
      cta-to="/signup/partner"
      secondary-label="Contact us"
      secondary-href="#contact"
    >
      <template #title>Attract new customers with FitAccess</template>
      <template #text>
        Reach new customers and increase the number of visits from existing ones. Become a
        FitAccess partner and welcome employees of companies across Addis Ababa.
      </template>
    </BlobHero>

    <!-- Benefits -->
    <section class="lp-section">
      <div class="lp-container">
        <div class="lp-section-head">
          <h2 class="lp-h2">What you get by partnering with FitAccess</h2>
        </div>
        <div class="lp-cards lp-cards--4">
          <article v-for="b in benefits" :key="b.title" class="lp-card">
            <span class="lp-icard-icon">
              <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path v-for="(d, i) in b.icon" :key="i" :d="d" />
                <path class="acc" :d="b.acc" />
              </svg>
            </span>
            <h3 class="lp-card-title" style="font-size: 1.2rem">{{ b.title }}</h3>
            <p class="lp-card-text">{{ b.text }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- Categories (tilted green) -->
    <section class="lp-tilted lp-tilted--green">
      <div class="lp-container lp-tilted-inner">
        <div class="lp-section-head">
          <h2 class="lp-h2">We welcome partners from the following areas</h2>
        </div>
        <ul class="lp-cats">
          <li v-for="c in categories" :key="c.label" class="lp-cat">
            <span class="lp-cat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path :d="c.d" /></svg>
            </span>
            {{ c.label }}
          </li>
        </ul>
        <div class="lp-center" style="margin-top: 3rem">
          <p class="lp-lead">We are looking for partners in other categories as well.</p>
        </div>
      </div>
    </section>

    <!-- Front desk media -->
    <section class="lp-section">
      <div class="lp-container">
        <div class="lp-media lp-media--left">
          <figure class="lp-media-figure">
            <img src="/images/landing/gym-members-et.jpg" alt="Men and women training together in a modern gym" loading="lazy" />
          </figure>
          <div class="lp-media-content">
            <h2 class="lp-h2">Built for your front desk</h2>
            <div class="lp-quotes">
              <p class="lp-quote">Members show a personal barcode pass. Your staff scan it and the visit is recorded.</p>
              <p class="lp-quote">One check-in per member per day keeps visits fair and easy to verify.</p>
              <p class="lp-quote">Manage several branches and give each staff member their own login and role.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Process (tilted black) -->
    <section class="lp-tilted">
      <div class="lp-container lp-tilted-inner">
        <div class="lp-section-head">
          <h2 class="lp-h2">What the process of establishing cooperation looks like</h2>
        </div>
        <ol class="lp-process">
          <li v-for="p in process" :key="p">{{ p }}</li>
        </ol>
      </div>
    </section>

    <div id="contact">
      <ContactBlock />
    </div>

    <RegisterBand
      title="I want to become a partner"
      text="Register your facility today and start welcoming FitAccess members."
      to="/signup/partner"
      label="Register as Partner"
      secondary-to="/login"
      secondary-label="Partner log in"
    />

    <FooterSection />
  </div>
</template>
