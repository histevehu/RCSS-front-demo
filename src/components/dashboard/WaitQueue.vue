<template>
  <div class="queue-content">
    <div class="queue-list">
      <div
        v-for="(task, index) in waitingQueue.slice(0, 5)"
        :key="task.id"
        class="queue-item" @click="store.selectTask(task.id)"
        :class="{ 'queue-urgent': task.priority === 'urgent' }"
      >
        <div class="queue-priority" :class="getPriorityClass(task.priority)"></div>
        <div class="queue-info">
          <div class="queue-task-header">
            <span class="queue-id">{{ task.id }}</span>
            <span class="queue-name">{{ task.name }}</span>
          </div>
          <div class="queue-route">{{ getRouteText(task) }}</div>
          <div class="queue-route">{{ task.scheduleStage === 'scheduling' ? 'Scheduling…' : task.reason }}</div>
        </div>
        <div class="queue-time">Waited {{ formatDuration(task.waitSeconds) }}<br><span v-if="task.startTime != null">Starts in {{ formatDuration(task.startTime - store.uiNow) }}</span></div>
      </div>

      <div v-if="waitingQueue.length === 0" class="queue-empty">
        No waiting tasks
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '../../stores/appStore'
import { formatDuration } from '../../utils/demo'

const store = useAppStore()
const waitingQueue = computed(() => store.waitingQueue)

function getPriorityClass(priority) {
  const classes = {
    urgent: 'priority-urgent',
    normal: 'priority-normal',
    low: 'priority-low'
  }
  return classes[priority] || 'priority-normal'
}

function getRouteText(task) { return store.formatRoute(task.routeNodes) }
</script>

<style scoped>
.queue-content {
  flex: 1;
  min-height: 0;
  padding: 12px 16px 16px;
  overflow: hidden;
}

.queue-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  height: 100%;
  overflow-y: auto;
}

.queue-list::-webkit-scrollbar {
  width: 4px;
}

.queue-list::-webkit-scrollbar-track {
  background: transparent;
}

.queue-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.queue-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  transition: all 0.15s ease;
}

.queue-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.queue-urgent {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.15);
}

.queue-priority {
  width: 4px;
  height: 28px;
  border-radius: 2px;
  flex-shrink: 0;
}

.priority-urgent {
  background: #ef4444;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
}

.priority-normal {
  background: #f59e0b;
}

.priority-low {
  background: #10b981;
}

.queue-info {
  flex: 1;
  min-width: 0;
}

.queue-task-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.queue-id {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.queue-name {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.queue-route {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.queue-time {
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.queue-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
}
</style>
