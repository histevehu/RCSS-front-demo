<template>
  <button class="task-card" :data-task-id="task.id" :aria-pressed="isSelected" :class="{selected:isSelected}" @click="$emit('select',task.id)">
    <div class="task-heading"><strong :title="`${task.id} · ${task.name}`">{{ task.id }} · {{ task.name }}</strong><span class="task-status" :class="`status-${task.status}`">{{ ui.t(task.status) }}</span></div>
    <p class="route-text">{{ ui.display(store.formatRoute(task.routeNodes)) }}</p>
    <dl class="task-meta">
      <div><dt>{{ ui.t('taskType') }}</dt><dd>{{ task.taskType ? ui.t(task.taskType) : '—' }}</dd></div>
      <div><dt>{{ ui.t('taskUrgency') }}</dt><dd :class="{'urgent-priority':task.priority==='urgent'}">{{ ui.t(task.priority) }}</dd></div>
      <div><dt>{{ ui.t('assignedRobot') }}</dt><dd>{{ task.robotId || ui.t('unassigned') }}</dd></div>
      <div><dt>{{ ui.t('plannedFinish') }}</dt><dd>{{ Number.isFinite(task.finishTime) ? ui.time(task.finishTime,store.clock.epoch) : '—' }}</dd></div>
    </dl>
    <p v-if="task.status==='waiting'" class="waiting-context">{{ ui.reason(task) }} · {{ ui.t('waited') }} {{ ui.duration(task.waitSeconds) }}<span v-if="task.startTime!=null"> · {{ ui.t('startsIn') }} {{ ui.duration(task.startTime-store.uiNow) }}</span></p>
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
/* Two equal columns keep four labelled fields aligned at every sidebar width. */
.task-card {
  width:100%; min-width:0; text-align:left; padding:10px 12px;
  background:transparent; flex:none; border-color:var(--border); border-radius:6px;
}
.task-card:hover { background:var(--subtle); border-color:var(--control-border); }
.task-card.selected { border-color:var(--accent); background:var(--active); }
.task-card:focus-visible { outline:2px solid var(--accent); outline-offset:2px; }
.task-heading { display:flex; align-items:baseline; justify-content:space-between; gap:8px; }
.task-heading strong {
  min-width:0; font-size:13px; line-height:1.5; font-weight:600; color:var(--text);
  display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:2; overflow:hidden;
  overflow-wrap:anywhere;
}
.task-status { flex:none; font-size:11px; line-height:1.5; white-space:nowrap; }
.task-card p { margin:0; font-size:12px; line-height:1.5; }
.task-card .route-text { margin-top:4px; color:var(--text); overflow-wrap:anywhere; }
.task-card.selected .route-text { color:var(--accent); }
.task-meta {
  display:grid; grid-template-columns:repeat(2,minmax(0,1fr));
  gap:4px 12px; margin:6px 0 0;
}
.task-meta>div { min-width:0; }
.task-meta dt { font-size:11px; line-height:14px; color:var(--muted); }
.task-meta dd {
  margin:1px 0 0; font-size:12px; line-height:16px; color:var(--text);
  font-variant-numeric:tabular-nums; overflow-wrap:anywhere;
}
.task-meta .urgent-priority { color:var(--danger); }
.task-card .waiting-context { margin-top:6px; color:var(--warning); }
/* No separate timer: execution figures continue to follow the shared clock. */
.execution-progress { margin-top:6px; color:var(--muted); }
.execution-progress .duration-row {
  display:flex; justify-content:space-between; align-items:baseline;
  flex-wrap:wrap; gap:2px 8px; font-size:11px;
}
.duration-row>span:last-child { font-variant-numeric:tabular-nums; color:var(--text); }
.execution-progress progress { display:block; width:100%; height:3px; margin-top:4px; accent-color:var(--accent); }
.execution-progress progress::-webkit-progress-value { background:var(--accent); }
.execution-progress progress::-moz-progress-bar { background:var(--accent); }
</style>
