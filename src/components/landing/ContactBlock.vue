<script setup lang="ts">
withDefaults(defineProps<{ title?: string }>(), { title: 'Contact us' })
</script>

<template>
  <section class="lp-section">
    <div class="lp-container">
      <div class="lp-section-head">
        <h2 class="lp-h2">{{ title }}</h2>
        <hr class="lp-sep" />
      </div>
      <div class="lp-contact">
        <a href="tel:+251911000000" class="lp-contact-item">
          <span class="lp-card-icon">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.8 19.8 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.1 9.9a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0122 16.92z"/></svg>
          </span>
          <span><small>Call us</small>+251 911 000 000</span>
        </a>
        <a href="mailto:auto@fit-access.com" class="lp-contact-item">
          <span class="lp-card-icon">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></svg>
          </span>
          <span><small>Write to us</small>auto@fit-access.com</span>
        </a>
      </div>
    </div>
  </section>
</template>
