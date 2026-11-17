<script setup lang="ts">
import { computed } from 'vue'
import { formatDate, useEmployeePortal } from '@/composables/useEmployeePortal'
import FitCard from '@/components/employee/FitCard.vue'
import CardActivate from '@/components/employee/CardActivate.vue'

const portal = useEmployeePortal()
const d = computed(() => portal.data.value!)
const card = computed(() => d.value.card)
</script>

<template>
  <div class="ec">
    <header class="ec-head">
      <h1>Your cards</h1>
      <p>Here you can see the FitAccess card your company has given you.</p>
    </header>

    <section v-if="card.activated" class="ec-panel">
      <FitCard :plan="d.pass.plan_name" :number="card.number" :active="!card.banned && d.pass.status === 'active'" :paused="!card.banned && d.pass.status !== 'active'" :blocked="card.banned" size="lg" />
      <div class="ec-info">
        <p class="ec-kicker">Main card</p>
        <h2>FitAccess {{ d.pass.plan_name }}</h2>
        <div v-if="card.banned" class="ec-blocked" role="alert">
          <strong>⛔ Your card is blocked {{ card.banned_text }}.</strong>
          You can't check in at any gym while it is blocked. Once the ban is lifted, this same card number works again.
          Please contact your HR team if you have questions.
        </div>
        <ul>
          <li>Card number: <strong>{{ card.number }}</strong></li>
          <li v-if="card.banned">Status: <strong class="ec-red">Blocked</strong></li>
          <li v-else>Active since: {{ formatDate(card.active_since) }}</li>
          <li>{{ card.company }}</li>
          <li v-if="d.pass.valid_until && !card.banned">Paid by your company until {{ formatDate(d.pass.valid_until) }}</li>
        </ul>
        <p v-if="d.pass.access_message && !card.banned" class="ec-warn">{{ d.pass.access_message }}</p>
        <p v-if="!card.banned" class="ec-note">
          At the gym, open the FitAccess mobile app and show your QR code. It refreshes every 30 seconds.
        </p>
      </div>
    </section>

    <section v-else class="ec-panel ec-panel--add">
      <div class="ec-stack" aria-hidden="true">
        <FitCard :plan="d.pass.plan_name" placeholder />
      </div>
      <div class="ec-info">
        <h2>Add your FitAccess card</h2>
        <p>Enter your FitAccess card number to access all portal features.</p>
        <CardActivate />
      </div>
    </section>
  </div>
</template>

<style scoped>
.ec { display: flex; flex-direction: column; gap: 28px; }
.ec-head h1 { margin: 0 0 8px; font-family: var(--font-heading); font-size: 42px; font-weight: 600; color: #1f2937; }
.ec-head p { margin: 0; color: #4b5563; font-size: 17px; }
.ec-panel {
  display: grid; grid-template-columns: minmax(0, 340px) minmax(0, 1fr); gap: 44px; align-items: center;
  background: #fff; border-radius: 22px; padding: 32px;
}
.ec-panel--add { background: #eef9dc; }
.ec-kicker { margin: 0 0 2px; font-size: 12px; color: #6b7280; }
.ec-info h2 { margin: 0 0 14px; font-family: var(--font-heading); font-size: 26px; font-weight: 600; color: #1f2937; }
.ec-info > p { margin: 0 0 18px; color: #4b5563; font-size: 15px; }
.ec-info ul { list-style: none; margin: 0; padding: 0; max-width: 640px; }
.ec-info li { padding: 13px 0; border-bottom: 1px solid #f0f1ec; color: #4b5563; font-size: 15px; }
.ec-info li:last-child { border-bottom: none; }
.ec-warn { margin: 14px 0 0 !important; padding: 10px 12px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; color: #92400e !important; font-size: 13px !important; }
.ec-blocked {
  margin: 0 0 14px; padding: 14px 16px; max-width: 640px; border-radius: 14px;
  background: #fef2f2; border: 1px solid #fecaca; color: #7f1d1d; font-size: 14px; line-height: 1.55;
}
.ec-blocked strong { display: block; margin-bottom: 4px; color: #b91c1c; }
.ec-red { color: #dc2626; }
.ec-note { margin: 16px 0 0 !important; font-size: 13px !important; color: #6b7280 !important; }
.ec-stack { position: relative; padding: 10px 24px; }
@media (max-width: 800px) {
  .ec-head h1 { font-size: 30px; }
  .ec-panel { grid-template-columns: 1fr; gap: 22px; padding: 22px; }
}
</style>
