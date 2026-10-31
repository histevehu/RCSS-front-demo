<template>
  <button class="task-card" :data-task-id="task.id" :aria-pressed="isSelected" :class="{selected:isSelected}" @click="$emit('select',task.id)">
    <div><strong>{{ task.id }} · {{ task.name }}</strong><span :class="`status-${task.status}`">{{ ui.t(task.status) }}</span></div>
    <p>{{ ui.t(task.priority) }} · {{ task.robotId || ui.t('unassigned') }}<span v-if="task.finishTime != null"> · {{ ui.time(task.finishTime,store.clock.epoch) }}</span></p>
    <p v-if="task.status==='waiting'" class="waiting-context">{{ ui.reason(task) }} · {{ ui.t('waited') }} {{ ui.duration(task.waitSeconds) }}<span v-if="task.startTime!=null"> · {{ ui.t('startsIn') }} {{ ui.duration(task.startTime-store.uiNow) }}</span></p>
    <p class="route-text">{{ ui.display(store.formatRoute(task.routeNodes)) }}</p>
  </button>
</template>
<script setup>
import { useAppStore } from '../../stores/appStore'
import { useUiStore } from '../../stores/uiStore'
defineProps({task:Object,isSelected:Boolean})
defineEmits(['select'])
const store=useAppStore(),ui=useUiStore()
</script>
<style scoped>
.task-card { width:100%; text-align:left; padding:10px; background:transparent; flex:none; border-color:var(--border); border-radius:6px; }.task-card:hover { background:var(--subtle); border-color:var(--control-border); }.task-card.selected { border-color:var(--accent); background:var(--active); }.task-card>div { display:flex; justify-content:space-between; align-items:baseline; gap:8px; font-size:12px; }.task-card strong { font-size:13px; font-weight:600; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }.task-card>div>span { flex:none; }.task-card p { margin-top:5px; font-size:12px; line-height:1.5; color:var(--muted); }.task-card .route-text { color:var(--text); }.task-card.selected .route-text { color:var(--accent); }.task-card .waiting-context { color:var(--warning); }
</style>
