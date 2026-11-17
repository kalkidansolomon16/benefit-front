<script setup lang="ts">
// Image card used for trainings and news (grid pages and dashboard rows).
defineProps<{
  image: string | null
  category: string
  title: string
  excerpt?: string | null
  /** small chip on the image, e.g. "55:00" or "Read" */
  badge?: string
  badgeIcon?: 'time' | 'read'
  locked?: boolean
  joined?: boolean
}>()
defineEmits<{ open: [] }>()
</script>

<template>
  <button type="button" class="cc" @click="$emit('open')">
    <div class="cc-media">
      <img v-if="image" :src="image" alt="" loading="lazy" />
      <div v-else class="cc-ph" aria-hidden="true">
        <img src="/logo.png" alt="" />
      </div>
      <span v-if="badge" class="cc-badge">
        <svg v-if="badgeIcon === 'time'" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
        <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M4 5h7a3 3 0 0 1 3 3v11a2 2 0 0 0-2-2H4z" /><path d="M20 5h-4a2 2 0 0 0-2 2" /></svg>
        {{ badge }}
      </span>
      <span v-if="locked" class="cc-lock" title="Activate your card to unlock">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
      </span>
      <span v-if="joined" class="cc-joined">Joined</span>
    </div>
    <div class="cc-body">
      <p class="cc-cat">{{ category }}</p>
      <p class="cc-title">{{ title }}</p>
      <p v-if="excerpt" class="cc-excerpt">{{ excerpt }}</p>
    </div>
  </button>
</template>

<style scoped>
.cc {
  display: flex; flex-direction: column; width: 100%; padding: 0; border: none; text-align: left;
  background: #fff; border-radius: 18px; overflow: hidden; cursor: pointer; font-family: inherit;
  box-shadow: 0 1px 2px rgba(11, 12, 16, 0.04); transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.cc:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(11, 12, 16, 0.1); }
.cc:focus-visible { outline: 3px solid #8be000; outline-offset: 2px; }
.cc-media { position: relative; aspect-ratio: 16 / 9; background: #0b0c10; overflow: hidden; }
.cc-media > img { width: 100%; height: 100%; object-fit: cover; display: block; }
.cc-ph {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  background: radial-gradient(120% 120% at 100% 0%, rgba(139, 224, 0, 0.55) 0%, #0b0c10 65%);
}
.cc-ph img { width: 46px; height: 46px; border-radius: 12px; opacity: 0.9; }
.cc-badge {
  position: absolute; right: 10px; bottom: 10px; display: inline-flex; align-items: center; gap: 5px;
  background: rgba(11, 12, 16, 0.82); color: #fff; font-size: 12px; font-weight: 600;
  padding: 5px 9px; border-radius: 8px;
}
.cc-lock {
  position: absolute; top: 10px; right: 10px; width: 28px; height: 28px; border-radius: 50%;
  background: rgba(255, 255, 255, 0.92); color: #0b0c10; display: flex; align-items: center; justify-content: center;
}
.cc-joined {
  position: absolute; top: 10px; left: 10px; background: #8be000; color: #0b0c10;
  font-size: 11px; font-weight: 800; padding: 4px 9px; border-radius: 999px;
}
.cc-body { padding: 14px 16px 18px; display: flex; flex-direction: column; gap: 4px; }
.cc-cat { margin: 0; font-size: 12px; color: #6b7280; }
.cc-title {
  margin: 0; font-size: 16px; font-weight: 600; color: #1f2937; line-height: 1.3;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.cc-excerpt {
  margin: 2px 0 0; font-size: 13px; color: #4b5563; line-height: 1.45;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
</style>
