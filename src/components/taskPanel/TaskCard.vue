<template>
  <button class="task-card" :class="{selected:isSelected}" @click="$emit('select',task.id)">
    <div><strong>{{ task.id }} · {{ task.name }}</strong><span :class="`status-${task.status}`">{{ ui.t(task.status) }}</span></div>
    <p>{{ ui.t(task.priority) }} · {{ task.robotId || ui.t('unassigned') }}<span v-if="task.finishTime != null"> · {{ ui.time(task.finishTime,store.clock.epoch) }}</span></p>
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
.task-card { width:100%; text-align:left; padding:8px; background:var(--subtle); }.task-card.selected { border-color:var(--accent); background:var(--accent-soft); }.task-card>div { display:flex; justify-content:space-between; gap:5px; font-size:10px; }.task-card strong { font-size:11px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }.task-card>div>span { flex:none; }.task-card p { margin-top:4px; font-size:10px; color:var(--muted); }.task-card .route-text { color:var(--accent); }
</style>
