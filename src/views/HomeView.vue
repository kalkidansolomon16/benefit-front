<script setup lang="ts">
import { RouterLink } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import HeroSection from '@/components/HeroSection.vue'
import PlansSection from '@/components/PlansSection.vue'
import CardCheck from '@/components/landing/CardCheck.vue'
import AudienceCards from '@/components/landing/AudienceCards.vue'
import ContactBlock from '@/components/landing/ContactBlock.vue'
import RegisterBand from '@/components/landing/RegisterBand.vue'
import AppSection from '@/components/landing/AppSection.vue'
import OfferTabs from '@/components/landing/OfferTabs.vue'
import FooterSection from '@/components/FooterSection.vue'

const steps = [
  {
    title: 'Your company joins',
    text: 'Your company applies, we verify it, and HR picks Basic, Basic Plus or Premium for each employee level. One quarterly invoice in ETB covers everyone.',
  },
  {
    title: 'Employees get their pass',
    text: 'Every enrolled employee receives a 12-digit FitAccess card number and a personal barcode pass in the app.',
  },
  {
    title: 'Train at partner facilities',
    text: 'Choose a partner gym on your package, show your pass at reception and start your session. HR sees every visit in its dashboard.',
  },
]
</script>

<template>
  <div class="lp">
    <NavBar theme="white" />
    <HeroSection />

    <!-- What is FitAccess? -->
    <section class="lp-section">
      <div class="lp-container lp-section-head">
        <h2 class="lp-h2">Meet FitAccess</h2>
        <hr class="lp-sep" />
        <p class="lp-lead">
          FitAccess is a workplace wellness benefit built in Ethiopia. Companies enrol their staff, and
          every employee can make <strong>one visit a day</strong> to a partner facility, from gyms to
          swimming pools and spas, using a single digital pass.
        </p>
        <div class="lp-btn-row lp-btn-row--center" style="margin-top: 2.5rem">
          <a href="#how-it-works" class="lp-btn lp-btn--primary">See how it works</a>
        </div>
      </div>
    </section>

    <!-- Media + text blocks -->
    <section class="lp-section" style="padding-top: 20px">
      <div class="lp-container">
        <div class="lp-media lp-media--left">
          <figure class="lp-media-figure">
            <img src="/images/landing/gym-members-et.jpg" alt="Men and women training together in a modern gym" loading="lazy" />
          </figure>
          <div class="lp-media-content">
            <h2 class="lp-h2">One pass, many places to train</h2>
            <div class="lp-quotes">
              <p class="lp-quote">Your employer covers the membership. You just show up and train.</p>
              <p class="lp-quote">Visit one partner facility every day, wherever suits your schedule.</p>
              <p class="lp-quote">Gyms, swimming pools, spas and wellness centres, depending on your package.</p>
              <p class="lp-quote">Three packages, Basic, Basic Plus and Premium, matched to each employee level.</p>
            </div>
          </div>
        </div>

        <div class="lp-media lp-media--right">
          <figure class="lp-media-figure">
            <img src="/images/landing/checkin-phone-et.jpg" alt="Member showing his phone pass at gym reception" loading="lazy" />
          </figure>
          <div class="lp-media-content">
            <h2 class="lp-h2">Check in with your phone</h2>
            <hr class="lp-sep lp-sep--short" style="margin: 0" />
            <div class="lp-quotes">
              <p class="lp-quote">Your personal barcode pass is always in the FitAccess app and employee portal.</p>
              <p class="lp-quote">Reception staff scan it in seconds: no plastic card and no cash at the desk.</p>
              <p class="lp-quote">The code refreshes on its own, so only you can use your pass.</p>
            </div>
            <div class="lp-btn-row">
              <RouterLink to="/for-employees" class="lp-btn lp-btn--dark">How it works for employees</RouterLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- For Employers / Employees / Partners -->
    <AudienceCards />

    <!-- How it works (tilted band) -->
    <section id="how-it-works" class="lp-tilted">
      <div class="lp-container lp-tilted-inner">
        <div class="lp-section-head">
          <h2 class="lp-h2">How it works</h2>
          <p class="lp-lead">Three simple steps from sign-up to your first workout.</p>
        </div>
        <div class="lp-steps">
          <div v-for="s in steps" :key="s.title" class="lp-step">
            <h3>{{ s.title }}</h3>
            <p>{{ s.text }}</p>
          </div>
        </div>
        <div class="lp-btn-row lp-btn-row--center" style="margin-top: 3rem">
          <a href="#plans" class="lp-btn lp-btn--primary">See Plans</a>
        </div>
      </div>
    </section>

    <PlansSection />

    <CardCheck />

    <AppSection />

    <OfferTabs />

    <RegisterBand
      title="Ready to join FitAccess?"
      text="Whether you run a company, work for one or own a sports facility, getting started takes only a few minutes."
      to="/for-employers"
      label="Register as Employer"
      secondary-to="/for-partners"
      secondary-label="Become a Partner"
    />

    <ContactBlock title="Questions? Get in touch" />
    <FooterSection />
  </div>
</template>
