<template>
  <div class="task-mini">
    <div class="mini-row">
      <span class="mini-label">Urgent</span>
      <span class="mini-value urgent">{{ stats.urgent }}</span>
    </div>
    <div class="mini-row">
      <span class="mini-label">Peak</span>
      <span class="mini-value">{{ stats.taskPeak }} · {{ stats.taskPeakTime }}</span>
    </div>
    <div class="mini-row">
      <span class="mini-label">Average Duration</span>
      <span class="mini-value">{{ stats.avgCompletionTime }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '../../stores/appStore'

const store = useAppStore()
const stats = computed(() => store.stats)
</script>

<style scoped>
.task-mini { padding: 12px 16px; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; }
.mini-row { display: flex; justify-content: space-between; font-size: 12px; color: rgba(255, 255, 255, 0.7); padding: 6px 0; }
.mini-label { color: rgba(255, 255, 255, 0.55); }
.mini-value { font-variant-numeric: tabular-nums; }
.urgent { color: #f87171; font-weight: 600; }
</style>
