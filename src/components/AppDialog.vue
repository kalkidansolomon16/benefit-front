<script setup lang="ts">
// The single confirm / alert dialog used across the app (see useDialog.ts).
import { nextTick, ref, watch } from 'vue'
import { answerDialog, dialogState as d } from '@/composables/useDialog'

const okBtn = ref<HTMLButtonElement | null>(null)

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') answerDialog(false)
}

watch(
  () => d.open,
  async (open) => {
    if (open) {
      window.addEventListener('keydown', onKey)
      await nextTick()
      okBtn.value?.focus()
    } else {
      window.removeEventListener('keydown', onKey)
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="dlg">
      <div v-if="d.open" class="dlg-backdrop" @click.self="answerDialog(false)">
        <div
          class="dlg"
          :class="`dlg--${d.tone}`"
          role="alertdialog"
          aria-modal="true"
          :aria-labelledby="d.title ? 'dlg-title' : undefined"
          aria-describedby="dlg-msg"
        >
          <span class="dlg-ico" aria-hidden="true">
            <svg v-if="d.tone === 'danger' || d.tone === 'error'" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>
            <svg v-else-if="d.tone === 'success'" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            <svg v-else width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9.5" /><path d="M12 11v5M12 8h.01" /></svg>
          </span>
          <h2 v-if="d.title" id="dlg-title" class="dlg-title">{{ d.title }}</h2>
          <p id="dlg-msg" class="dlg-msg">{{ d.message }}</p>
          <div class="dlg-actions" :class="{ 'dlg-actions--one': d.kind === 'alert' }">
            <button v-if="d.kind === 'confirm'" type="button" class="dlg-btn ghost" @click="answerDialog(false)">
              {{ d.cancelText }}
            </button>
            <button ref="okBtn" type="button" class="dlg-btn" :class="{ danger: d.tone === 'danger' }" @click="answerDialog(true)">
              {{ d.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dlg-backdrop {
  position: fixed; inset: 0; z-index: 3000; background: rgba(11, 12, 16, 0.5);
  backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; padding: 16px;
}
.dlg {
  width: 100%; max-width: 440px; background: #fff; border-radius: 22px; padding: 28px 26px 22px;
  text-align: center; box-shadow: 0 24px 60px rgba(0, 0, 0, 0.28); font-family: var(--font-body, inherit);
}
.dlg-ico {
  display: inline-flex; align-items: center; justify-content: center; width: 54px; height: 54px;
  border-radius: 50%; margin-bottom: 14px; background: #eefbd6; color: #3f6b00;
}
.dlg--danger .dlg-ico, .dlg--error .dlg-ico { background: #fee2e2; color: #dc2626; }
.dlg--success .dlg-ico { background: #dcfce7; color: #16a34a; }
.dlg-title { margin: 0 0 8px; font-family: var(--font-heading, inherit); font-size: 20px; font-weight: 700; color: #0b0c10; }
.dlg-msg { margin: 0 0 22px; color: #4b5563; font-size: 14.5px; line-height: 1.55; white-space: pre-line; overflow-wrap: anywhere; }
.dlg-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.dlg-actions--one { grid-template-columns: 1fr; max-width: 200px; margin: 0 auto; }
.dlg-btn {
  padding: 12px 14px; border-radius: 12px; border: 1.5px solid #0b0c10; background: #0b0c10; color: #fff;
  font-weight: 700; font-size: 14px; font-family: inherit; cursor: pointer; transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.dlg-btn:hover { background: #8be000; border-color: #8be000; color: #0b0c10; }
.dlg-btn:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(139, 224, 0, 0.45); }
.dlg-btn.danger { background: #dc2626; border-color: #dc2626; }
.dlg-btn.danger:hover { background: #b91c1c; border-color: #b91c1c; color: #fff; }
.dlg-btn.ghost { background: #fff; color: #0b0c10; border-color: #e5e7eb; }
.dlg-btn.ghost:hover { border-color: #0b0c10; background: #fff; }
.dlg-enter-active, .dlg-leave-active { transition: opacity 0.18s ease; }
.dlg-enter-active .dlg, .dlg-leave-active .dlg { transition: transform 0.18s ease; }
.dlg-enter-from, .dlg-leave-to { opacity: 0; }
.dlg-enter-from .dlg, .dlg-leave-to .dlg { transform: scale(0.95) translateY(6px); }
@media (max-width: 480px) { .dlg-actions { grid-template-columns: 1fr; } }
@media (prefers-reduced-motion: reduce) { .dlg-enter-active, .dlg-leave-active, .dlg-enter-active .dlg, .dlg-leave-active .dlg { transition: none; } }
</style>
