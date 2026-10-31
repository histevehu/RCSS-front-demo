<template>
  <div class="robot-content">
    <p class="location-key">{{ ui.t('locationKey') }}</p>
    <div class="robot-list" :style="{'--robot-count':Math.max(store.robots.length,1)}" tabindex="0" :aria-label="ui.t('robots')">
      <div v-for="robot in store.robots" :key="robot.id" class="robot-item">
        <div class="robot-identity"><span class="robot-dot" :class="`status-${robot.status}`"></span><strong>{{ robot.id }}</strong><span class="robot-status" :class="`status-${robot.status}`">{{ ui.t(robot.status) }}</span></div>
        <span class="robot-location" :title="`${ui.t(store.robotLocation(robot).inTransit ? 'moving':'atNode')}: ${ui.display(store.robotLocation(robot).label)}`">{{ ui.display(store.robotLocation(robot).label) }}</span>
      </div>
    </div>
    <div class="utilization"><span>{{ ui.t('utilization') }}</span><strong>{{ store.robotStats.utilization }}%</strong></div>
  </div>
</template>
<script setup>
import { useAppStore } from '../../stores/appStore'
import { useUiStore } from '../../stores/uiStore'
const store=useAppStore(),ui=useUiStore()
</script>
<style scoped>
.robot-content { display:flex; flex-direction:column; min-height:0; width:100%; height:100%; }.location-key { color:var(--muted); font-size:11px; margin:0 0 10px; flex:none; }.robot-list { min-height:0; flex:1; overflow:auto; overscroll-behavior:contain; display:grid; grid-template-rows:repeat(var(--robot-count),minmax(52px,1fr)); }.robot-item { display:flex; flex-direction:column; justify-content:center; gap:4px; padding:8px 6px; border-bottom:1px solid var(--row-border); }.robot-item:last-child { border-bottom:0; }.robot-identity { display:flex; align-items:center; gap:8px; }.robot-identity strong { font-size:14px; font-weight:600; }.robot-dot { width:6px; height:6px; background:currentColor; color:var(--muted); border-radius:50%; flex:none; }.robot-dot.status-executing { color:var(--accent); }.robot-location { margin-left:14px; color:var(--muted); font-size:13px; line-height:1.5; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }.robot-status { margin-left:auto; font-size:12px; flex:none; }.utilization { display:flex; align-items:baseline; justify-content:space-between; border-top:1px solid var(--border); margin-top:10px; padding:12px 6px 0; flex:none; font-size:12px; color:var(--muted); }.utilization strong { color:var(--text); font-size:22px; font-weight:500; font-variant-numeric:tabular-nums; }
</style>
