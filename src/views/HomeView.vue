<script setup lang="ts">
import NavBar from '@/components/NavBar.vue'
import HeroSection from '@/components/HeroSection.vue'
import LogoCarousel from '@/components/LogoCarousel.vue'
import HowItWorks from '@/components/HowItWorks.vue'
import StatsSection from '@/components/StatsSection.vue'
import PlansSection from '@/components/PlansSection.vue'
import NetworkScale from '@/components/NetworkScale.vue'
import WellnessOptions from '@/components/WellnessOptions.vue'
import WhyBenefit from '@/components/WhyBenefit.vue'
import Testimonials from '@/components/Testimonials.vue'
import ResourceCards from '@/components/ResourceCards.vue'
import FooterSection from '@/components/FooterSection.vue'
</script>

<template>
  <div class="page">
    <NavBar />
    <HeroSection />
    <LogoCarousel />
    <HowItWorks />
    <StatsSection />
    <PlansSection />
    <NetworkScale />
    <WellnessOptions />
    <WhyBenefit />
    <Testimonials />
    <ResourceCards />
    <FooterSection />
  </div>
</template>

<style scoped>
.page {
  width: 100%;
  min-height: 100vh;
}
</style>
