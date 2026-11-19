<script setup lang="ts">
// "Add your FitAccess card": the employee types the 12-digit number HR sent.
import { computed, ref } from 'vue'
import { useEmployeePortal } from '@/composables/useEmployeePortal'

withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })
const emit = defineEmits<{ activated: [] }>()

const { activateCard, awaitingApproval } = useEmployeePortal()
const raw = ref('')
const busy = ref(false)
const error = ref('')

const digits = computed(() => raw.value.replace(/\D/g, '').slice(0, 12))
const ready = computed(() => digits.value.length === 12)

function onInput(e: Event) {
  const d = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 12)
  raw.value = d.replace(/(\d{3})(?=\d)/g, '$1 ')
  error.value = ''
}

async function submit() {
  if (!ready.value || busy.value) return
  busy.value = true
  error.value = ''
  try {
    await activateCard(digits.value)
    raw.value = ''
    emit('activated')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not activate the card.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div v-if="awaitingApproval" class="ca-wait" role="status">
    <strong>Waiting for FitAccess approval</strong>
    <span>Your company has approved you. Once FitAccess gives final approval and your membership is paid, FitAccess will e-mail you your
      card number, and you can add it here.</span>
  </div>
  <form v-else class="ca" :class="{ 'ca--compact': compact }" @submit.prevent="submit">
    <label class="ca-label" for="card-number">Enter the 12-digit card number:</label>
    <div class="ca-row">
      <input
        id="card-number"
        :value="raw"
        class="ca-input"
        inputmode="numeric"
        autocomplete="off"
        placeholder="000 000 000 000"
        maxlength="15"
        :aria-invalid="!!error"
        @input="onInput"
      />
      <button type="submit" class="ca-btn" :disabled="!ready || busy">
        {{ busy ? 'Checking…' : 'Add card' }}
      </button>
    </div>
    <p v-if="error" class="ca-error" role="alert">{{ error }}</p>
    <p v-else class="ca-hint">FitAccess e-mails this number to you once your membership is paid.</p>
  </form>
</template>

<style scoped>
.ca { display: flex; flex-direction: column; gap: 8px; }
.ca-label { font-size: 14px; color: #4b5563; }
.ca-row { display: flex; gap: 10px; flex-wrap: wrap; }
.ca-input {
  flex: 1 1 200px; min-width: 0; max-width: 270px; box-sizing: border-box;
  padding: 13px 16px; border: 1.5px solid #d1d5db; border-radius: 14px;
  font-size: 16px; text-align: center; letter-spacing: 0.08em; font-family: inherit;
  background: #fff; color: #0b0c10;
}
.ca-input:focus { outline: none; border-color: #0b0c10; box-shadow: 0 0 0 3px rgba(139, 224, 0, 0.35); }
.ca-btn {
  padding: 13px 22px; border: none; border-radius: 14px; font-weight: 700; font-size: 14px;
  font-family: inherit; background: #0b0c10; color: #fff; cursor: pointer;
}
.ca-btn:disabled { background: #d1d5db; color: #fff; cursor: not-allowed; }
.ca-btn:not(:disabled):hover { background: #8be000; color: #0b0c10; }
.ca-error { margin: 0; font-size: 13px; color: #dc2626; }
.ca-hint { margin: 0; font-size: 12px; color: #9ca3af; }
.ca-wait {
  display: flex; flex-direction: column; gap: 6px; max-width: 460px;
  padding: 14px 16px; border-radius: 14px; background: #fff8e6; border: 1px solid #f5d98b;
  font-size: 13.5px; line-height: 1.5; color: #6b4e00;
}
.ca-wait strong { font-size: 14px; color: #4a3600; }
</style>
