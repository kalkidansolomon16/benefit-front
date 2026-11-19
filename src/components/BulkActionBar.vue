<script setup lang="ts">
defineProps<{
  total: number          // how many items can be selected
  selected: number       // how many are currently selected
  busy?: boolean
  approveLabel?: string
}>()

const emit = defineEmits<{
  (e: 'toggle-all'): void
  (e: 'approve'): void
  (e: 'reject'): void
  (e: 'clear'): void
}>()
</script>

<template>
  <div class="bulk-bar" :class="{ active: selected > 0 }">
    <label class="bulk-all">
      <input
        type="checkbox"
        :checked="total > 0 && selected === total"
        :indeterminate.prop="selected > 0 && selected < total"
        :disabled="busy || total === 0"
        @change="emit('toggle-all')"
      />
      <span v-if="selected === 0">Select all ({{ total }})</span>
      <span v-else>{{ selected }} of {{ total }} selected</span>
    </label>

    <div v-if="selected > 0" class="bulk-actions">
      <button class="bulk-btn approve" :disabled="busy" @click="emit('approve')">
        {{ busy ? 'Working…' : (approveLabel ?? 'Approve selected') }}
      </button>
      <button class="bulk-btn reject" :disabled="busy" @click="emit('reject')">Reject selected</button>
      <button class="bulk-btn clear" :disabled="busy" @click="emit('clear')">Clear</button>
    </div>
  </div>
</template>

<style scoped>
.bulk-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 14px;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  position: sticky;
  top: 8px;
  z-index: 5;
}
.bulk-bar.active { border-color: #72B800; background: #f7fee7; }
.bulk-all { display: flex; align-items: center; gap: 10px; font-size: 0.85rem; font-weight: 600; color: #334155; cursor: pointer; }
.bulk-all input { width: 17px; height: 17px; accent-color: #72B800; cursor: pointer; }
.bulk-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.bulk-btn { padding: 8px 14px; border-radius: 9px; border: 1.5px solid transparent; font-size: 0.82rem; font-weight: 700; cursor: pointer; }
.bulk-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.bulk-btn.approve { background: #72B800; color: #fff; }
.bulk-btn.reject { background: #fff; color: #dc2626; border-color: #fecaca; }
.bulk-btn.clear { background: transparent; color: #64748b; }
</style>
