<script setup lang="ts">
import { RouterLink } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import FooterSection from '@/components/FooterSection.vue'
import BlobHero from '@/components/landing/BlobHero.vue'
import RegisterBand from '@/components/landing/RegisterBand.vue'
import CardCheck from '@/components/landing/CardCheck.vue'

const reasons = [
  {
    title: 'Sport and relaxation for every mood',
    text: 'Gyms, group classes, yoga and wellness centres at partner facilities across Addis Ababa.',
    cta: { label: 'See plans', to: { path: '/', hash: '#plans' } },
  },
  {
    title: 'One free check-in every day',
    text: 'Pick a different partner facility every day if you like. Your plan covers the visit.',
    cta: { label: 'See plans', to: { path: '/', hash: '#plans' } },
  },
  {
    title: 'Your digital barcode pass',
    text: 'No plastic card needed. Show the barcode from your employee portal and the partner scans it at the desk.',
    cta: { label: 'Log in', to: '/login' },
  },
  {
    title: 'Find gyms near you',
    text: 'Browse the partner gyms on your plan, see how busy they are right now and choose where to go.',
    cta: { label: 'How to join', to: { path: '/for-employees', hash: '#how-to-join' } },
  },
  {
    title: 'FitAccess tip',
    text: 'Is your company not on FitAccess yet? Recommend us to your employer.',
    cta: { label: 'Recommend', to: { path: '/for-employees', hash: '#recommend' } },
  },
  {
    title: 'Track your visits',
    text: 'See your check-in history in one place and keep yourself motivated.',
    cta: { label: 'Log in', to: '/login' },
  },
]

const recommendMail =
  'mailto:?subject=' +
  encodeURIComponent('Employee wellness benefit: FitAccess') +
  '&body=' +
  encodeURIComponent(
    'Hi,\n\nI would like to suggest FitAccess as an employee benefit. It gives employees access to partner gyms and wellness centres across Addis Ababa, billed in ETB.\n\nMore information: ' +
      window.location.origin + '/for-employers\n',
  )

const venueMail =
  'mailto:auto@fit-access.com?subject=' + encodeURIComponent('Gym recommendation for FitAccess')
</script>

<template>
  <div class="lp">
    <NavBar theme="white" />

    <BlobHero
      theme="white-dark"
      image="/images/landing/hero-employee-et.webp"
      alt="Smiling man holding a dumbbell"
      cta-label="Register as Employee"
      cta-to="/signup/employee"
    >
      <template #title>A benefit that makes you <span class="lp-mark">feel better</span></template>
      <template #text>
        Clear your head from the stress of the working day. With FitAccess you can train and relax
        at partner facilities across Addis Ababa, one free check-in every day.
      </template>
    </BlobHero>

    <!-- Reasons -->
    <section class="lp-section">
      <div class="lp-container">
        <div class="lp-section-head">
          <h2 class="lp-h2">{{ reasons.length }} reasons for FitAccess</h2>
        </div>
        <div class="lp-blobs">
          <article v-for="(r, i) in reasons" :key="r.title" class="lp-blob-card">
            <span class="lp-blob-num">{{ i + 1 }}</span>
            <h3>{{ r.title }}</h3>
            <p>{{ r.text }}</p>
            <RouterLink :to="r.cta.to" class="lp-btn lp-btn--primary lp-btn--sm">{{ r.cta.label }}</RouterLink>
          </article>
        </div>
      </div>
    </section>

    <!-- Get moving -->
    <section class="lp-section" style="padding-top: 0">
      <div class="lp-container lp-section-head" style="margin-bottom: 0">
        <h2 class="lp-h2" style="text-transform: uppercase">Get moving, relax, discover new things</h2>
        <hr class="lp-sep" />
        <p class="lp-lead">
          FitAccess adapts to your needs, moods and abilities. You do not have to be an active
          athlete: build strength, join a class or simply unwind. One free check-in every day,
          all year round.
        </p>
      </div>
    </section>

    <!-- Recommend -->
    <section id="recommend" class="lp-band">
      <div class="lp-container">
        <div class="lp-band-grid">
          <article class="lp-wcard">
            <span class="lp-card-icon">
              <svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12"/></svg>
            </span>
            <h3><span>Recommend a sports venue</span></h3>
            <p>Know a great gym or wellness centre in Addis that should join FitAccess? Tell us about it, or send them to our partner page.</p>
            <div class="lp-btn-row lp-btn-row--center">
              <a :href="venueMail" class="lp-btn lp-btn--dark lp-btn--sm">Send recommendation</a>
              <RouterLink to="/for-partners" class="lp-btn lp-btn--outline lp-btn--sm">For partners</RouterLink>
            </div>
          </article>
          <article class="lp-wcard">
            <span class="lp-card-icon">
              <svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v.01M9 12v.01M9 15v.01M9 18v.01"/></svg>
            </span>
            <h3><span>Recommend us to your employer</span></h3>
            <p>Your company does not offer FitAccess yet? Send your HR team a quick email. We will take care of the rest.</p>
            <div class="lp-btn-row lp-btn-row--center">
              <a :href="recommendMail" class="lp-btn lp-btn--dark lp-btn--sm">Email my HR team</a>
              <RouterLink to="/for-employers" class="lp-btn lp-btn--outline lp-btn--sm">For employers</RouterLink>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- Get moving media -->
    <section class="lp-section">
      <div class="lp-container">
        <div class="lp-media lp-media--left">
          <figure class="lp-media-figure">
            <img src="/images/landing/addis-street-et.jpg" alt="Man with a gym bag walking along an Addis Ababa street" loading="lazy" />
          </figure>
          <div class="lp-media-content">
            <h2 id="how-to-join" class="lp-h2">How to join</h2>
            <div class="lp-quotes">
              <p class="lp-quote"><strong>Register</strong>Create your account with your name, phone and email.</p>
              <p class="lp-quote"><strong>Link your employer</strong>Choose your company and branch so your HR team can confirm you.</p>
              <p class="lp-quote"><strong>Get approved</strong>Once HR approves you and your plan is active, your barcode pass is ready.</p>
              <p class="lp-quote"><strong>Start training</strong>Show your pass at any partner facility in your plan.</p>
            </div>
            <div class="lp-btn-row">
              <RouterLink to="/login" class="lp-btn lp-btn--outline">Log in</RouterLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <CardCheck />

    <RegisterBand
      title="Already a FitAccess company?"
      text="Register as an employee and get your barcode pass."
      to="/signup/employee"
      label="Register as Employee"
      secondary-to="/login"
      secondary-label="Log in"
    />

    <FooterSection />
  </div>
</template>
