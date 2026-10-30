<template>
  <div class="queue-list"><button v-for="task in store.waitingQueue" :key="task.id" class="queue-item" @click="store.selectTask(task.id)">
    <div><strong>{{ task.id }} · {{ task.name }}</strong><span class="status-waiting">{{ ui.t(task.priority) }}</span></div>
    <p class="route-text">{{ ui.display(store.formatRoute(task.routeNodes)) }}</p><p>{{ ui.reason(task) }}</p>
    <div class="queue-time"><span>{{ ui.t('waited') }} {{ ui.duration(task.waitSeconds) }}</span><span v-if="task.startTime != null">{{ ui.t('startsIn') }} {{ ui.duration(task.startTime-store.uiNow) }}</span></div>
  </button><p v-if="!store.waitingQueue.length" class="empty">{{ ui.t('noWaiting') }}</p></div>
</template>
<script setup>
import { useAppStore } from '../../stores/appStore'
import { useUiStore } from '../../stores/uiStore'
const store=useAppStore(),ui=useUiStore()
</script>
<style scoped>
.queue-list { display:flex; flex-direction:column; gap:6px; }.queue-item { padding:8px; text-align:left; background:var(--subtle); border:0; width:100%; }.queue-item>div { display:flex; gap:6px; justify-content:space-between; }.queue-item strong { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:11px; }.queue-item p { font-size:10px; line-height:1.7; color:var(--muted); }.queue-item .route-text { color:var(--accent); }.queue-time { color:var(--muted); margin-top:3px; font-size:10px; flex-wrap:wrap; }
</style>
