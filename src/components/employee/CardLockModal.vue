<script setup lang="ts">
// Shown when an employee without an activated card tries a card-only action.
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { useEmployeePortal } from '@/composables/useEmployeePortal'

const { lock, awaitingApproval } = useEmployeePortal()
const router = useRouter()

function close() {
  lock.open = false
}
function addCard() {
  lock.open = false
  router.push('/employee/cards')
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}
watch(
  () => lock.open,
  (open) => (open ? window.addEventListener('keydown', onKey) : window.removeEventListener('keydown', onKey)),
)
</script>

<template>
  <Teleport to="body">
    <div v-if="lock.open" class="lm-backdrop" @click.self="close">
      <div class="lm" role="dialog" aria-modal="true" aria-labelledby="lm-title">
        <button type="button" class="lm-x" aria-label="Close" @click="close">✕</button>
        <h2 id="lm-title" class="lm-title">{{ lock.title || 'Activate your card' }}</h2>
        <p class="lm-text">
          {{ lock.message || 'Add your FitAccess card to your account to unlock all portal features.' }}
        </p>
        <div v-if="awaitingApproval" class="lm-actions lm-actions--one">
          <button type="button" class="lm-btn" @click="close">OK</button>
        </div>
        <div v-else class="lm-actions">
          <button type="button" class="lm-btn ghost" @click="close">Close</button>
          <button type="button" class="lm-btn" @click="addCard">Add card</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.lm-backdrop {
  position: fixed; inset: 0; z-index: 1000; background: rgba(11, 12, 16, 0.45);
  display: flex; align-items: center; justify-content: center; padding: 16px;
}
.lm {
  position: relative; width: 100%; max-width: 560px; background: #fff; border-radius: 24px;
  padding: 36px 32px 28px; text-align: center; box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
  font-family: var(--font-body);
}
.lm-x { position: absolute; top: 18px; right: 20px; border: none; background: none; font-size: 18px; color: #4b5563; cursor: pointer; }
.lm-title { margin: 0 0 12px; font-family: var(--font-heading); font-size: 28px; font-weight: 700; color: #0b0c10; }
.lm-text { margin: 0 0 24px; color: #4b5563; font-size: 15px; line-height: 1.55; }
.lm-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.lm-actions--one { grid-template-columns: 1fr; max-width: 240px; margin: 0 auto; }
.lm-btn {
  padding: 14px; border-radius: 14px; border: 1.5px solid #0b0c10; background: #0b0c10; color: #fff;
  font-weight: 700; font-size: 14px; font-family: inherit; cursor: pointer;
}
.lm-btn:hover { background: #8be000; border-color: #8be000; color: #0b0c10; }
.lm-btn.ghost { background: #fff; color: #0b0c10; border-color: #e5e7eb; }
.lm-btn.ghost:hover { border-color: #0b0c10; background: #fff; }
@media (max-width: 480px) { .lm { padding: 32px 20px 22px; } .lm-title { font-size: 22px; } .lm-actions { grid-template-columns: 1fr; } }
</style>
