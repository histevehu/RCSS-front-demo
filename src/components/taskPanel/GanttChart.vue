<template>
  <div class="gantt-container">
    <!-- Timeline header -->
    <div class="gantt-header">
      <div class="gantt-task-col">{{ ui.t('task') }}</div>
      <div class="gantt-timeline">
        <div v-for="hour in hours" :key="hour" class="gantt-hour">+{{ ui.duration(hour) }}</div>
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
          <div v-if="task.startTime != null" class="gantt-bar" :title="`${task.id}: +${ui.duration(task.startTime)} → +${ui.duration(task.finishTime)}`" :class="getBarClass(task.status)" :style="getBarStyle(task)">
            {{ task.robotId || ui.t('unassigned') }}
          </div>
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="gantt-legend">
      <div class="legend-item"><span class="legend-dot executing"></span>{{ ui.t('executing') }}</div>
      <div class="legend-item"><span class="legend-dot waiting"></span>{{ ui.t('waiting') }}</div>
      <div class="legend-item"><span class="legend-dot completed"></span>{{ ui.t('completed') }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '../../stores/appStore'
import { useUiStore } from '../../stores/uiStore'

const store = useAppStore(), ui=useUiStore()
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
.gantt-container { min-width:600px; min-height:240px; max-height:60vh; display:flex; flex-direction:column; background:var(--surface-solid); }.gantt-header,.gantt-row { display:flex; border-bottom:1px solid var(--border); }.gantt-header { background:var(--subtle); }.gantt-task-col { width:180px; flex:none; padding:10px; color:var(--text); font-size:11px; display:flex; align-items:center; gap:6px; border-right:1px solid var(--border); }.gantt-timeline { flex:1; display:flex; position:relative; }.gantt-hour { flex:1; padding:10px 4px; color:var(--muted); font-size:11px; }.gantt-body { overflow:auto; flex:1; }.gantt-cell { flex:1; border-right:1px solid var(--border); }.priority-dot { width:5px; height:5px; border-radius:50%; flex:none; }.dot-urgent { background:var(--danger); }.dot-normal { background:var(--warning); }.dot-low { background:var(--success); }.task-name { overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }.gantt-bar { position:absolute; top:7px; height:23px; border-radius:4px; color:#fff; font-size:11px; padding:4px; white-space:nowrap; overflow:hidden; }.bar-executing { background:#2563c9; }.bar-waiting { background:#a56b06; }.bar-completed { background:#08775b; }.gantt-legend { display:flex; gap:16px; padding:12px; color:var(--muted); }.legend-item { display:flex; gap:5px; align-items:center; font-size:11px; }.legend-dot { display:inline-block; width:8px; height:8px; border-radius:2px; }.executing { background:#2563c9; }.waiting { background:#a56b06; }.completed { background:#08775b; }
</style>
