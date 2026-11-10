<script setup lang="ts">
import BlobHero from '@/components/landing/BlobHero.vue'
</script>

<template>
  <div id="hero">
    <BlobHero
      theme="white"
      image="/images/landing/hero-home-duo.webp"
      alt="Smiling man and woman in sportswear"
      cta-label="See Plans"
      :cta-to="{ path: '/', hash: '#plans' }"
      secondary-label="How it works"
      :secondary-to="{ path: '/', hash: '#how-it-works' }"
    >
      <template #title>Active employees, <span class="lp-mark">healthier teams</span></template>
      <template #text>
        FitAccess opens the doors of partner gyms, pools and spas across Addis Ababa to your
        employees, all covered by your company with one invoice in ETB.
      </template>
    </BlobHero>
  </div>
</template>
