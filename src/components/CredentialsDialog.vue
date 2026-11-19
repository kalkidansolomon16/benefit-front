<script setup lang="ts">
import { ref } from 'vue'
import type { IssuedLogin } from '@/utils/credentials'

// Shown once after an application is approved: the logins that were created and
// whether their email went out, so the admin can pass on any that did not arrive.

defineProps<{ title: string; logins: IssuedLogin[] }>()
const emit = defineEmits<{ close: [] }>()

const copied = ref('')
async function copy(l: IssuedLogin) {
  try {
    await navigator.clipboard.writeText(`Login: ${l.email}\nTemporary password: ${l.temp_password}`)
    copied.value = l.email
    setTimeout(() => (copied.value = ''), 1800)
  } catch {
    /* clipboard blocked: the admin can still select the text */
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="cd-overlay" @click.self="emit('close')">
      <div class="cd-box" role="dialog" aria-modal="true">
        <h3 class="cd-title">{{ title }}</h3>
        <p class="cd-sub">
          The login details below were emailed to each account. They must choose their own password
          the first time they sign in. <strong>This is the only time these passwords are shown.</strong>
        </p>

        <ul class="cd-list">
          <li v-for="l in logins" :key="l.email" class="cd-item">
            <div class="cd-item-head">
              <strong>{{ l.label }}</strong>
              <span class="cd-badge" :class="l.emailed ? 'ok' : 'fail'">{{ l.emailed ? 'Email sent' : 'Email failed' }}</span>
            </div>
            <p class="cd-row"><span>Name</span>{{ l.name }}</p>
            <p class="cd-row"><span>Login</span><code>{{ l.email }}</code></p>
            <p class="cd-row"><span>Temporary password</span><code>{{ l.temp_password }}</code></p>
            <p v-if="!l.emailed" class="cd-warn">The email could not be sent. Please share these details with them securely.</p>
            <button type="button" class="cd-copy" @click="copy(l)">{{ copied === l.email ? 'Copied ✓' : 'Copy details' }}</button>
          </li>
        </ul>

        <div class="cd-actions">
          <button type="button" class="cd-close" @click="emit('close')">Done</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.cd-overlay { position: fixed; inset: 0; z-index: 2000; background: rgba(11, 12, 16, 0.55); display: flex; align-items: center; justify-content: center; padding: 16px; }
.cd-box { width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; background: #fff; border-radius: 18px; padding: 26px; box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25); }
.cd-title { margin: 0 0 6px; font-size: 1.2rem; color: #0B0C10; }
.cd-sub { margin: 0 0 18px; font-size: 0.88rem; line-height: 1.55; color: #44403c; }
.cd-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.cd-item { border: 1.5px solid #e7e5e4; border-radius: 14px; padding: 14px 16px; }
.cd-item-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 8px; }
.cd-badge { font-size: 0.72rem; font-weight: 700; padding: 3px 10px; border-radius: 999px; white-space: nowrap; }
.cd-badge.ok { background: #EEF9DC; color: #3f6212; }
.cd-badge.fail { background: #fee2e2; color: #b91c1c; }
.cd-row { margin: 4px 0; display: flex; gap: 10px; font-size: 0.88rem; align-items: baseline; flex-wrap: wrap; }
.cd-row span { width: 140px; color: #78716c; flex-shrink: 0; }
.cd-row code { background: #f5f5f4; padding: 2px 8px; border-radius: 6px; font-size: 0.86rem; word-break: break-all; }
.cd-warn { margin: 8px 0 0; font-size: 0.8rem; color: #b91c1c; }
.cd-copy { margin-top: 10px; padding: 6px 14px; border-radius: 999px; border: 1.5px solid #0B0C10; background: #fff; font-size: 0.8rem; font-weight: 700; cursor: pointer; }
.cd-copy:hover { background: #0B0C10; color: #fff; }
.cd-actions { display: flex; justify-content: flex-end; margin-top: 18px; }
.cd-close { padding: 10px 26px; border-radius: 999px; border: none; background: #8BE000; color: #0B0C10; font-weight: 700; cursor: pointer; }
</style>
