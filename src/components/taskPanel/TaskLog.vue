<template>
  <div class="log-container">
    <div class="log-list" lang="en">
      <div v-for="(log, index) in logs" :key="index" class="log-item">
        <div class="log-dot" :class="getLogTypeClass(log.type)"></div>
        <div class="log-content">
          <div class="log-meta">
            <span class="log-time">{{ log.time }}</span>
            <span v-if="log.taskId" class="log-task-id">{{ log.taskId }}</span>
          </div>
          <div class="log-message">{{ englishLogMessage(log) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { englishLogMessage } from '../../utils/presentation.js'
import { useAppStore } from '../../stores/appStore'

const store = useAppStore()
const logs = computed(() => store.taskLogs)

function getLogTypeClass(type) {
  return `dot-${type}`
}
</script>

<style scoped>
.log-container { max-height:60vh; overflow:auto; border-radius:8px; background:var(--subtle); }.log-item { display:flex; gap:10px; padding:10px 12px; border-bottom:1px solid var(--border); }.log-dot { width:6px; height:6px; border-radius:50%; margin-top:6px; background:var(--muted); flex:none; }.dot-create,.dot-assign { background:var(--accent); }.dot-start,.dot-executing,.dot-completed { background:var(--success); }.dot-failed { background:var(--danger); }.log-content { min-width:0; }.log-meta { display:flex; gap:8px; margin-bottom:4px; color:var(--muted); font-size:10px; }.log-task-id { color:var(--accent); }.log-message { font-size:12px; overflow-wrap:anywhere; }
</style>
