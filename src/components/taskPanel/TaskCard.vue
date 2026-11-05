<template>
  <button class="task-card" :data-task-id="task.id" :aria-pressed="isSelected" :class="{selected:isSelected}" @click="$emit('select',task.id)">
    <div><strong>{{ task.id }} · {{ task.name }}</strong><span :class="`status-${task.status}`">{{ ui.t(task.status) }}</span></div>
    <dl class="task-meta">
      <div class="type-field"><dt>{{ ui.t('taskType') }}:</dt><dd>{{ task.taskType ? ui.t(task.taskType) : '—' }}</dd></div>
      <div><dt>{{ ui.t('taskUrgency') }}:</dt><dd :class="{'urgent-priority':task.priority==='urgent'}">{{ ui.t(task.priority) }}</dd></div>
      <div><dt>{{ ui.t('assignedRobot') }}:</dt><dd>{{ task.robotId || ui.t('unassigned') }}</dd></div>
      <div class="finish-field"><dt>{{ ui.t('plannedFinish') }}:</dt><dd>{{ Number.isFinite(task.finishTime) ? ui.time(task.finishTime,store.clock.epoch) : '—' }}</dd></div>
    </dl>
    <p v-if="task.status==='waiting'" class="waiting-context">{{ ui.reason(task) }} · {{ ui.t('waited') }} {{ ui.duration(task.waitSeconds) }}<span v-if="task.startTime!=null"> · {{ ui.t('startsIn') }} {{ ui.duration(task.startTime-store.uiNow) }}</span></p>
    <p class="route-text">{{ ui.display(store.formatRoute(task.routeNodes)) }}</p>
    <section class="execution-progress">
      <p v-if="progress.phase==='scheduling'">{{ ui.t('awaitScheduling') }}</p>
      <template v-else><p class="duration-row"><span>{{ ui.t('executionDuration') }}</span><span>{{ ui.duration(progress.elapsed) }}<template v-if="progress.phase!=='failed'"> / {{ ui.duration(progress.total) }}</template><template v-if="progress.percent!==null"> · {{ Math.floor(progress.percent) }}%</template></span></p>
        <progress v-if="progress.percent!==null" :value="progress.percent" max="100" :aria-label="ui.t('executionProgress')" :aria-valuetext="`${ui.duration(progress.elapsed)} / ${ui.duration(progress.total)} · ${Math.floor(progress.percent)}%`"></progress>
      </template>
    </section>
  </button>
</template>
<script setup>
import { useAppStore } from '../../stores/appStore'
import { useUiStore } from '../../stores/uiStore'
import {computed} from 'vue'
import {taskProgress} from '../../utils/taskProgress.js'
const props=defineProps({task:Object,isSelected:Boolean})
defineEmits(['select'])
const store=useAppStore(),ui=useUiStore()
const progress=computed(()=>taskProgress(props.task))
</script>
<style scoped>
.task-card { width:100%; text-align:left; padding:10px; background:transparent; flex:none; border-color:var(--border); border-radius:6px; }.task-card:hover { background:var(--subtle); border-color:var(--control-border); }.task-card.selected { border-color:var(--accent); background:var(--active); }.task-card>div { display:flex; justify-content:space-between; align-items:baseline; gap:8px; font-size:12px; }.task-card strong { font-size:13px; font-weight:600; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }.task-card>div>span { flex:none; }.task-card p { margin-top:5px; font-size:12px; line-height:1.5; color:var(--muted); }.task-card .route-text { color:var(--text); }.task-card.selected .route-text { color:var(--accent); }.task-card .waiting-context { color:var(--warning); }
/* One compact bottom band; progress is clock-driven, with no independent timer. */
.task-meta { display:grid; grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr); gap:4px 10px; margin:6px 0 0; font-size:12px; line-height:1.5; }
.task-meta>div { display:flex; align-items:baseline; gap:4px; flex-wrap:wrap; min-width:0; }
.task-meta dt { color:var(--muted); white-space:nowrap; }.task-meta dd { margin:0; color:var(--text); font-variant-numeric:tabular-nums; white-space:nowrap; }
.task-meta .type-field { grid-column:1/-1; }.task-meta .type-field dd { white-space:normal; overflow-wrap:anywhere; }
.task-meta .finish-field { grid-column:1/-1; }.task-meta .urgent-priority { color:var(--danger); }
.execution-progress { margin-top:7px; }
.execution-progress .duration-row { display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:2px 8px; margin:0; }
.duration-row>span:last-child { font-variant-numeric:tabular-nums; color:var(--text); }
.execution-progress progress { display:block; height:3px; margin-top:5px; accent-color:var(--accent); }
.execution-progress progress::-webkit-progress-value { background:var(--accent); }
.execution-progress progress::-moz-progress-bar { background:var(--accent); }
</style>
