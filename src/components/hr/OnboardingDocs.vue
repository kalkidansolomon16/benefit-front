<script setup lang="ts">
// The two documents every company needs, always visible in the HR portal:
// the employee contract (Word) and the Excel template for the employee list.
import { ref } from 'vue'
import { useApi } from '@/composables/useApi'

withDefaults(defineProps<{ showImport?: boolean; title?: string }>(), {
  showImport: true,
  title: 'Enrol your employees',
})
const emit = defineEmits<{ import: [] }>()

const api = useApi()
const busy = ref<'' | 'contract' | 'template'>('')
const error = ref('')

async function download(kind: 'contract' | 'template') {
  busy.value = kind
  error.value = ''
  try {
    await api.download(`hr/onboarding/${kind}`, kind === 'template' ? 'FitAccess-employees.xlsx' : 'FitAccess-Employee-Enrolment-and-Consent-Form.pdf')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Download failed. Please try again.'
  } finally {
    busy.value = ''
  }
}
</script>

<template>
  <section class="od" aria-labelledby="od-title">
    <div class="od-head">
      <div>
        <h2 id="od-title">{{ title }}</h2>
        <p>Give the consent form to your employees, list everyone who signed in the Excel template and import it by the 20th.</p>
      </div>
      <button v-if="showImport" type="button" class="od-import" @click="emit('import')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3M7 8l5-5 5 5" /><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /></svg>
        Import employees
      </button>
    </div>

    <div class="od-docs">
      <button type="button" class="od-doc" :disabled="busy !== ''" @click="download('contract')">
        <span class="od-ico od-ico--pdf" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M8 17v-4h1.5a1.5 1.5 0 0 1 0 3H8" /><path d="M13 13v4h1a2 2 0 0 0 0-4z" /></svg>
        </span>
        <span class="od-text">
          <span class="od-step">Step 1</span>
          <strong>Enrolment &amp; consent form</strong>
          <small>PDF · print it, the employee signs, you keep it</small>
        </span>
        <span class="od-dl">{{ busy === 'contract' ? 'Downloading…' : 'Download' }}</span>
      </button>

      <button type="button" class="od-doc" :disabled="busy !== ''" @click="download('template')">
        <span class="od-ico od-ico--excel" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M8.5 12.5l5 5M13.5 12.5l-5 5" /></svg>
        </span>
        <span class="od-text">
          <span class="od-step">Step 2</span>
          <strong>Excel template</strong>
          <small>One row per employee who signed, with their plan</small>
        </span>
        <span class="od-dl">{{ busy === 'template' ? 'Downloading…' : 'Download' }}</span>
      </button>
    </div>
    <p v-if="error" class="od-error" role="alert">{{ error }}</p>
  </section>
</template>

<style scoped>
.od {
  background: linear-gradient(135deg, #0b0c10 0%, #1d2412 100%); color: #fff; border-radius: 18px;
  padding: 20px 22px; margin-bottom: 18px; box-shadow: 0 10px 28px rgba(11, 12, 16, 0.16); position: relative; overflow: hidden;
}
.od::after {
  content: ''; position: absolute; width: 320px; height: 320px; right: -110px; top: -160px; border-radius: 50%;
  background: radial-gradient(circle, rgba(139, 224, 0, 0.35), rgba(139, 224, 0, 0) 70%); pointer-events: none;
}
.od > * { position: relative; z-index: 1; }
.od-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
.od-head h2 { margin: 0 0 4px; font-size: 1.08rem; font-weight: 800; }
.od-head p { margin: 0; font-size: 0.86rem; color: rgba(255, 255, 255, 0.72); max-width: 640px; }
.od-import {
  display: inline-flex; align-items: center; gap: 8px; padding: 11px 18px; border-radius: 12px; border: none;
  background: #8be000; color: #0b0c10; font-weight: 800; font-size: 0.88rem; cursor: pointer; font-family: inherit;
  box-shadow: 0 8px 20px rgba(139, 224, 0, 0.3); transition: transform .15s;
}
.od-import:hover { transform: translateY(-1px); }
.od-docs { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.od-doc {
  display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 14px; text-align: left;
  background: #fff; border: 1.5px solid transparent; color: #0b0c10; cursor: pointer; font-family: inherit;
  transition: border-color .15s, transform .15s, box-shadow .15s;
}
.od-doc:hover:not(:disabled) { border-color: #8be000; transform: translateY(-2px); box-shadow: 0 10px 22px rgba(0, 0, 0, 0.18); }
.od-doc:disabled { opacity: .75; cursor: progress; }
.od-ico { flex-shrink: 0; width: 48px; height: 48px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; color: #fff; }
.od-ico--pdf { background: #c62828; }
.od-ico--excel { background: #217346; }
.od-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.od-step { font-size: 0.68rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #4d7c0f; }
.od-text strong { font-size: 0.98rem; }
.od-text small { font-size: 0.78rem; color: #6b7280; }
.od-dl {
  flex-shrink: 0; padding: 8px 14px; border-radius: 10px; background: #0b0c10; color: #fff; font-size: 0.8rem; font-weight: 700;
  transition: background .15s, color .15s;
}
.od-doc:hover .od-dl { background: #8be000; color: #0b0c10; }
.od-error { margin: 10px 0 0; font-size: 0.84rem; color: #fecaca; }
@media (max-width: 760px) { .od-docs { grid-template-columns: 1fr; } }
</style>
