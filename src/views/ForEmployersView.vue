<script setup lang="ts">
import { RouterLink } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import FooterSection from '@/components/FooterSection.vue'
import BlobHero from '@/components/landing/BlobHero.vue'
import ContactBlock from '@/components/landing/ContactBlock.vue'
import RegisterBand from '@/components/landing/RegisterBand.vue'

const values = [
  { title: 'Flexibility', text: 'Choose the plan for each employee level. Quarterly billing in ETB, matched to your headcount and budget.' },
  { title: 'A partner who is there for you', text: 'Our Addis-based team supports your HR department from onboarding day through every quarterly renewal.' },
  { title: 'Satisfied team', text: 'Give your people a benefit that helps them recharge and perform better at work.' },
]

// `acc` paths are drawn in the darker brand green, the rest in black
const features = [
  {
    title: 'Movement and relaxation',
    text: 'Gyms, group classes, yoga and wellness centres. Your employees choose what suits them.',
    icon: ['M14 50h36M20 50V30m24 20V30M16 30h32', 'M26 20a6 6 0 1012 0 6 6 0 00-12 0'],
    acc: 'M8 30h6m36 0h6',
    cta: { label: 'See plans', to: { path: '/', hash: '#plans' } },
  },
  {
    title: 'One check-in per day',
    text: 'Each employee can visit one partner facility per day with their personal barcode pass.',
    icon: ['M12 16h40v32H12z', 'M18 24v16m5-16v16m4-16v16m6-16v16m4-16v16m5-16v16'],
    acc: 'M8 10l6 6m42-6l-6 6',
    cta: { label: 'How it works', to: '/for-employees' },
  },
  {
    title: 'Real-time HR dashboard',
    text: 'Manage employees and branches, track check-ins and pay invoices from one HR portal.',
    icon: ['M10 14h44v30H10z', 'M24 52h16M32 44v8'],
    acc: 'M18 36l8-8 6 5 12-12',
    cta: { label: 'How to start', to: { path: '/for-employers', hash: '#get-started' } },
  },
  {
    title: 'Access tiers by level',
    text: 'Staff get Basic, directors get Basic Plus and chiefs get Premium access, all on one invoice.',
    icon: ['M12 48h12V34H12zm14 0h12V24H26zm14 0h12V14H40z'],
    acc: 'M8 54h48',
    cta: { label: 'See plans', to: { path: '/', hash: '#plans' } },
  },
]

const steps = [
  { title: 'Register your company', text: 'Fill in your company details, contact person and password in a few minutes.' },
  { title: 'Get approved', text: 'Our team verifies your company and activates your HR portal.' },
  { title: 'Add your employees', text: 'Invite employees or import them, and assign their levels and branches.' },
  { title: 'Pay and go', text: 'Pay your quarterly ETB invoice and your team can start checking in.' },
]
</script>

<template>
  <div class="lp">
    <NavBar theme="white" />

    <BlobHero
      theme="white"
      image="/images/landing/hero-employer-et.webp"
      alt="Businesswoman with a tablet and a gym bag"
      cta-label="Register as Employer"
      cta-to="/signup/company"
      secondary-label="Contact us"
      secondary-href="#contact"
    >
      <template #title>Help your team feel better</template>
      <template #text>
        Regular rest is important for good work performance. Make it easy for your people to
        exercise and relax. With FitAccess, they always have a gym or wellness centre within reach.
      </template>
    </BlobHero>

    <!-- What do you get -->
    <section class="lp-section">
      <div class="lp-container">
        <div class="lp-media lp-media--left">
          <figure class="lp-media-figure">
            <img src="/images/landing/hr-manager-et.jpg" alt="HR manager holding a tablet with a dashboard" loading="lazy" />
          </figure>
          <div class="lp-media-content">
            <h2 class="lp-h2">What do you get with FitAccess?</h2>
            <div class="lp-features">
              <div v-for="v in values" :key="v.title">
                <h3>{{ v.title }}</h3>
                <p>{{ v.text }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- What will make your colleagues happy -->
    <section class="lp-section lp-section--tint">
      <div class="lp-container">
        <div class="lp-section-head">
          <h2 class="lp-h2">What will make your colleagues happy</h2>
        </div>
        <div class="lp-cards lp-cards--4">
          <article v-for="f in features" :key="f.title" class="lp-icard">
            <span class="lp-icard-icon">
              <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path v-for="(d, i) in f.icon" :key="i" :d="d" />
                <path class="acc" :d="f.acc" />
              </svg>
            </span>
            <h3>{{ f.title }}</h3>
            <p>{{ f.text }}</p>
            <RouterLink :to="f.cta.to" class="lp-btn lp-btn--dark lp-btn--sm">{{ f.cta.label }}</RouterLink>
          </article>
        </div>
      </div>
    </section>

    <!-- How to start (tilted) -->
    <section id="get-started" class="lp-tilted">
      <div class="lp-container lp-tilted-inner">
        <div class="lp-section-head">
          <h2 class="lp-h2">How to get started</h2>
          <p class="lp-lead">From registration to the first check-in in four simple steps.</p>
        </div>
        <div class="lp-steps lp-steps--4">
          <div v-for="s in steps" :key="s.title" class="lp-step">
            <h3>{{ s.title }}</h3>
            <p>{{ s.text }}</p>
          </div>
        </div>
        <div class="lp-btn-row lp-btn-row--center" style="margin-top: 3rem">
          <RouterLink :to="{ path: '/', hash: '#plans' }" class="lp-btn lp-btn--primary">See Plans</RouterLink>
        </div>
      </div>
    </section>

    <!-- More team experience -->
    <section class="lp-section">
      <div class="lp-container">
        <div class="lp-media lp-media--right">
          <figure class="lp-media-figure">
            <img src="/images/landing/team-highfive-et.jpg" alt="Colleagues giving high fives after a group workout" loading="lazy" />
          </figure>
          <div class="lp-media-content">
            <h2 class="lp-h2">More team experience</h2>
            <div class="lp-quotes">
              <p class="lp-quote">Wellness programmes your whole team can join.</p>
              <p class="lp-quote">Multiple branches? Manage each branch and its employees separately.</p>
              <p class="lp-quote">Invite your finance and management colleagues to the HR portal with their own roles.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div id="contact">
      <ContactBlock />
    </div>

    <RegisterBand
      title="Give your team FitAccess"
      text="Register your company today. It only takes a few minutes."
      to="/signup/company"
      label="Register as Employer"
      secondary-to="/login"
      secondary-label="Log in"
    />

    <FooterSection />
  </div>
</template>
