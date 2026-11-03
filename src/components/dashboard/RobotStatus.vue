<template>
  <div class="robot-content">
    <p v-if="store.scene?.source==='database'" class="location-key">{{ ui.t('simulatedPosition') }}</p>
    <div class="robot-list"  tabindex="0" :aria-label="ui.t('robots')">
      <div v-for="robot in store.robots" :key="robot.id" class="robot-item">
        <div class="robot-identity" :title="[robot.model,robot.sn].filter(Boolean).join(' · ')"><span class="robot-dot" :class="`status-${robot.status}`"></span><strong>{{ robot.id }}</strong><span class="robot-status" :class="`status-${robot.status}`">{{ ui.t(robot.status) }}</span></div><div class="robot-location" :title="`${ui.t(store.robotLocation(robot).inTransit ? 'moving':'atNode')}: ${ui.display(store.robotLocation(robot).label)}`">{{ ui.t('currentLocation') }}{{ ui.preferences.locale==='zh-CN' ? '：':': ' }}{{ ui.display(store.robotLocation(robot).label) }}</div>
        <span class="robot-capabilities" :title="ui.t('supportedCapabilities')">{{ ui.t('robotCapabilities') }}{{ ui.preferences.locale==='zh-CN' ? '：':': ' }}{{ (robot.capabilities || []).map(ui.capability).join(' · ') || ui.t('unknownCapability') }}</span>
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
.robot-content { display:flex; flex-direction:column; min-height:0; width:100%; height:100%; }.location-key { color:var(--muted); font-size:11px; margin:0 0 10px; flex:none; }.robot-list { min-height:0; flex:1; overflow:auto; overscroll-behavior:contain; display:grid; grid-auto-rows:max-content; align-content:start; }.robot-item { display:flex; flex-direction:column; justify-content:center; gap:2px; padding:10px 6px; border-bottom:1px solid var(--row-border); }.robot-item:last-child { border-bottom:0; }.robot-identity { display:flex; align-items:center; gap:8px; }.robot-identity strong { font-size:14px; font-weight:600; }.robot-dot { width:6px; height:6px; background:currentColor; color:var(--muted); border-radius:50%; flex:none; }.robot-dot.status-executing { color:var(--accent); }.robot-location { flex:1; min-width:0; margin-left:0; color:var(--muted); font-size:13px; line-height:1.5; overflow:hidden; text-overflow:ellipsis; white-space:normal; overflow-wrap:anywhere; }.robot-capabilities { margin-left:0; font-size:11px; color:var(--muted); line-height:1.5; }.robot-status { margin-left:auto; font-size:12px; flex:none; }.utilization { display:flex; align-items:baseline; justify-content:space-between; border-top:1px solid var(--border); margin-top:10px; padding:12px 6px 0; flex:none; font-size:12px; color:var(--muted); }.utilization strong { color:var(--text); font-size:22px; font-weight:500; font-variant-numeric:tabular-nums; }
</style>
