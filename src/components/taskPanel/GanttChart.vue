<template>
  <div class="gantt-container">
    <!-- Timeline header -->
    <div class="gantt-header">
      <div class="gantt-task-col">Task</div>
      <div class="gantt-timeline">
        <div v-for="hour in hours" :key="hour" class="gantt-hour">+{{ Math.round(hour) }}s</div>
      </div>
    </div>

    <!-- Task rows -->
    <div class="gantt-body">
      <div v-for="task in tasks" :key="task.id" class="gantt-row">
        <div class="gantt-task-col">
          <span class="priority-dot" :class="getPriorityDotClass(task.priority)"></span>
          <span class="task-name">{{ task.id }}-{{ task.name }}</span>
        </div>
        <div class="gantt-timeline">
          <div v-for="hour in hours" :key="hour" class="gantt-cell"></div>
          <div v-if="task.startTime != null" class="gantt-bar" :title="`${task.id}: +${task.startTime.toFixed(1)}s → +${task.finishTime.toFixed(1)}s`" :class="getBarClass(task.status)" :style="getBarStyle(task)">
            {{ task.robotId || 'Unassigned' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="gantt-legend">
      <div class="legend-item"><span class="legend-dot executing"></span>In Progress</div>
      <div class="legend-item"><span class="legend-dot waiting"></span>Waiting</div>
      <div class="legend-item"><span class="legend-dot completed"></span>Completed</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '../../stores/appStore'

const store = useAppStore()
const tasks = computed(() => store.tasks)

const end = computed(() => Math.max(60, Math.ceil(Math.max(store.uiNow, ...tasks.value.map(t => t.finishTime || 0)) / 60) * 60))
const hours = computed(() => Array.from({ length: 6 }, (_, i) => end.value * i / 6))

function getPriorityDotClass(priority) {
  return {
    'dot-urgent': priority === 'urgent',
    'dot-normal': priority === 'normal',
    'dot-low': priority === 'low'
  }
}

function getBarClass(status) {
  return {
    'bar-executing': status === 'executing',
    'bar-waiting': status === 'waiting',
    'bar-completed': status === 'completed'
  }
}

function getBarStyle(task) {
  return { left: `${task.startTime / end.value * 100}%`,
    width: `${(task.finishTime - task.startTime) / end.value * 100}%`, minWidth:'2px' }

}
</script>

<style scoped>
.gantt-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1e293b;
  border-radius: 8px;
  overflow: hidden;
}

.gantt-header {
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
}

.gantt-task-col {
  width: 180px;
  flex-shrink: 0;
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  gap: 8px;
}

.gantt-timeline {
  flex: 1;
  display: flex;
  position: relative;
}

.gantt-hour {
  flex: 1;
  padding: 10px 4px;
  font-size: 11px;
  text-align: left;
  color: rgba(255, 255, 255, 0.5);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
}

.gantt-body {
  flex: 1;
  overflow-y: auto;
}

.gantt-row {
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  transition: background 0.15s ease;
}

.gantt-row:hover {
  background: rgba(255, 255, 255, 0.02);
}

.gantt-cell {
  flex: 1;
  border-right: 1px solid rgba(255, 255, 255, 0.04);
}

.priority-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-urgent { background: #ef4444; }
.dot-normal { background: #f59e0b; }
.dot-low { background: #10b981; }

.task-name {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gantt-bar {
  position: absolute;
  top: 8px;
  height: 24px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  color: #fff;
  display: flex;
  align-items: center;
  padding: 0 8px;
  white-space: nowrap;
}

.bar-executing { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.bar-waiting { background: linear-gradient(135deg, #f59e0b, #d97706); }
.bar-completed { background: linear-gradient(135deg, #10b981, #059669); }

.gantt-legend {
  display: flex;
  gap: 16px;
  padding: 12px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.2);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
}

.legend-dot.executing { background: #3b82f6; }
.legend-dot.waiting { background: #f59e0b; }
.legend-dot.completed { background: #10b981; }
</style>
