<script setup lang="ts">
import { RouterLink } from 'vue-router'

// Dark call-to-action band shown near the bottom of every landing page.
defineProps<{
  title: string
  text: string
  to: string
  label: string
  secondaryTo?: string
  secondaryLabel?: string
}>()
</script>

<template>
  <section class="lp-section--tight">
    <div class="lp-container">
      <div class="lp-cta">
        <div>
          <h2 class="lp-h2">{{ title }}</h2>
          <p>{{ text }}</p>
        </div>
        <div class="lp-btn-row">
          <RouterLink :to="to" class="lp-btn lp-btn--primary">{{ label }}</RouterLink>
          <RouterLink v-if="secondaryTo" :to="secondaryTo" class="lp-btn lp-btn--outline-light">{{ secondaryLabel }}</RouterLink>
        </div>
      </div>
    </div>
  </section>
</template>
