<template>
  <div class="robot-content">
    <p class="location-key">{{ ui.t('locationKey') }}</p>
    <div class="robot-list"><div v-for="robot in store.robots" :key="robot.id" class="robot-item">
      <span class="robot-dot" :class="`status-${robot.status}`"></span><strong>{{ robot.id }}</strong><span class="robot-location" :title="`${ui.t(store.robotLocation(robot).inTransit ? 'moving':'atNode')}: ${ui.display(store.robotLocation(robot).label)}`">{{ ui.display(store.robotLocation(robot).label) }}</span><span class="robot-status" :class="`status-${robot.status}`">{{ ui.t(robot.status) }}</span>
    </div></div>
    <div class="utilization field-row"><span>{{ ui.t('utilization') }}</span><strong>{{ store.robotStats.utilization }}%</strong></div>
  </div>
</template>
<script setup>
import { useAppStore } from '../../stores/appStore'
import { useUiStore } from '../../stores/uiStore'
const store=useAppStore(),ui=useUiStore()
</script>
<style scoped>
.location-key { color:var(--muted); font-size:10px; margin-bottom:8px; }.robot-list { display:flex; flex-direction:column; gap:4px; }.robot-item { display:flex; align-items:center; gap:6px; min-height:34px; padding:6px; background:var(--subtle); border-radius:6px; font-size:11px; }.robot-dot { width:5px; height:5px; background:currentColor; color:var(--muted); border-radius:50%; flex:none; }.robot-dot.status-executing { color:var(--accent); }.robot-location { color:var(--muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }.robot-status { margin-left:auto; font-size:10px; white-space:nowrap; flex:none; }.utilization { border-top:1px solid var(--border); margin-top:9px; padding-top:8px; }.utilization strong { color:var(--accent); font-size:15px; }
</style>
