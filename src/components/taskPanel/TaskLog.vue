<template>
  <div class="log-container">
    <div class="log-list">
      <div v-for="(log, index) in logs" :key="index" class="log-item">
        <div class="log-dot" :class="getLogTypeClass(log.type)"></div>
        <div class="log-content">
          <div class="log-meta">
            <span class="log-time">{{ log.time }}</span>
            <span v-if="log.taskId" class="log-task-id">{{ log.taskId }}</span>
          </div>
          <div class="log-message">{{ log.message }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '../../stores/appStore'

const store = useAppStore()
const logs = computed(() => store.taskLogs)

function getLogTypeClass(type) {
  return `dot-${type}`
}
</script>

<style scoped>
.log-container {
  height: 100%;
  background: #1e293b;
  border-radius: 8px;
  overflow: hidden;
}

.log-list {
  height: 100%;
  overflow-y: auto;
  padding: 8px 0;
}

.log-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  transition: background 0.15s ease;
}

.log-item:hover {
  background: rgba(255, 255, 255, 0.02);
}

.log-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 6px;
  flex-shrink: 0;
}

.dot-create { background: #3b82f6; }
.dot-start,.dot-executing { background: #10b981; }
.dot-completed { background: #059669; }
.dot-assign { background: #f59e0b; }
.dot-conflict { background: #ef4444; }
.dot-failed { background: #dc2626; }

.log-content {
  flex: 1;
  min-width: 0;
}

.log-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.log-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
  font-variant-numeric: tabular-nums;
}

.log-task-id {
  font-size: 11px;
  padding: 2px 6px;
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border-radius: 4px;
}

.log-message {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.4;
}
</style>
