<template>
  <section class="planning-metrics panel" :class="{folded}" :aria-label="ui.t('schedulingMetrics')">
    <h2><button class="panel-heading" :aria-expanded="!folded" aria-controls="planning-metric-body" @click="ui.toggleFold('metrics')"><span>{{ ui.t('schedulingMetrics') }}</span><span class="metric-heading-end"><span>{{ ui.t('planningConflicts') }} · {{ conflicts.detected }}</span><span aria-hidden="true">{{ folded ? '＋':'−' }}</span></span></button></h2>
    <div v-show="!folded" id="planning-metric-body" class="metric-body">
      <div class="conflict-strip"><div v-for="metric in conflictValues" :key="metric.label"><span>{{ ui.t(metric.label) }}</span><strong>{{ metric.value }}</strong></div></div>
      <div class="resource-heading"><h3>{{ ui.t('verticalUsage') }}</h3><span :title="ui.t('usageDefinition')">{{ ui.t('simulationHour') }}</span><button @click="showEvents=true">{{ ui.t('conflictEvents') }}</button></div>
      <div class="resource-grid"><div><div v-for="resource in resources.stairs" :key="resource.id" class="resource-row"><span>{{ ui.display(resource.label) }}</span><progress :value="resource.utilization ?? 0" max="100" :aria-label="ui.display(resource.label)"></progress><strong>{{ percent(resource.utilization) }}</strong></div><p v-if="!resources.stairs.length">{{ ui.t('noStairs') }}</p></div><div><div v-for="resource in resources.elevators" :key="resource.id" class="resource-row"><span>{{ ui.display(resource.label) }}</span><progress :value="resource.utilization ?? 0" max="100" :aria-label="ui.display(resource.label)"></progress><strong>{{ percent(resource.utilization) }}</strong></div><div v-if="!resources.elevators.length" class="no-elevators"><span>{{ ui.t('elevators') }}</span><span>{{ ui.t('noElevators') }}</span><strong>—</strong></div></div></div>
      <p class="metric-footnote">{{ ui.t('usageDefinition') }}</p>
    </div>
    <Modal v-model="showEvents" :title="ui.t('conflictEvents')">
      <p class="event-explanation">{{ ui.t('conflictDefinition') }}</p>
      <div class="conflict-events"><div v-for="event in conflicts.events" :key="event.id"><span>{{ ui.time(event.time,store.clock.epoch) }} · {{ ui.t(`resource_${event.kind}`) }}</span><strong>{{ event.taskIds.join(' / ') }} · {{ event.robotIds.join(' / ') }}</strong><span>{{ ui.t(event.resolved ? 'resolved':'unresolved') }}</span></div><p v-if="!conflicts.events.length" class="empty">{{ ui.t('noConflictEvents') }}</p></div>
    </Modal>
  </section>
</template>
<script setup>
import {computed,ref} from 'vue'
import {useAppStore} from '../../stores/appStore'
import {useUiStore} from '../../stores/uiStore'
import Modal from '../common/Modal.vue'
const store=useAppStore(),ui=useUiStore(),showEvents=ref(false)
const folded=computed(()=>ui.preferences.folds.metrics===true)
const conflicts=computed(()=>store.snapshot?.conflicts || {detected:0,resolved:0,unresolved:0,resolutionRate:null,recentResolved:0,events:[]})
const resources=computed(()=>store.snapshot?.verticalResources || {stairs:[],elevators:[]})
const percent=value=>value==null ? '—':`${Math.round(value)}%`
const conflictValues=computed(()=>[
  {label:'planningConflicts',value:conflicts.value.detected},
  {label:'resolved',value:conflicts.value.resolved},
  {label:'unresolved',value:conflicts.value.unresolved},
  {label:'resolutionRate',value:percent(conflicts.value.resolutionRate)},
  {label:'recentResolved',value:conflicts.value.recentResolved},
])
</script>
<style scoped>
.planning-metrics { position:absolute; z-index:10; left:var(--left-space); right:var(--right-space); bottom:76px; max-height:240px; }.panel-heading { min-height:38px; padding:7px 12px; }.metric-heading-end { display:flex; gap:12px; align-items:center; font-size:12px; font-weight:400; color:var(--muted); }.metric-body { padding:0 12px 10px; }.conflict-strip { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:10px; padding:7px 0 12px; }.conflict-strip>div { display:flex; flex-direction:column; gap:4px; }.conflict-strip span { color:var(--muted); font-size:12px; line-height:1.4; }.conflict-strip strong { font-size:22px; font-weight:500; }.resource-heading { display:flex; align-items:center; gap:10px; padding-top:8px; border-top:1px solid var(--border); }.resource-heading h3 { font-size:13px; font-weight:600; }.resource-heading>span { font-size:12px; color:var(--muted); }.resource-heading button { margin-left:auto; border:0; padding:2px; font-size:12px; background:transparent; }.resource-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:8px; }.resource-row,.no-elevators { display:flex; align-items:center; gap:8px; font-size:12px; }.resource-row progress { flex:1; min-width:12px; width:0; }.resource-row strong { min-width:30px; text-align:right; }.no-elevators { color:var(--muted); }.no-elevators span:nth-child(2) { flex:1; }.metric-footnote { color:var(--muted); font-size:11px; margin-top:8px; }.event-explanation { font-size:13px; color:var(--muted); line-height:1.7; }.conflict-events { max-height:50dvh; overflow:auto; }.conflict-events>div { display:flex; flex-direction:column; gap:4px; padding:12px 0; border-bottom:1px solid var(--border); }.conflict-events>div>span { font-size:12px; color:var(--muted); }
@media(max-width:1100px) and (min-width:801px) { .resource-grid { grid-template-columns:1fr; gap:6px; }.metric-footnote { display:none; }.resource-heading>span { display:none; }.conflict-strip { gap:4px; }.conflict-strip strong { font-size:20px; } }
@media(max-width:800px) { .planning-metrics { left:16px; right:16px; bottom:116px; max-height:none; }.metric-body { max-height:calc(100dvh - var(--header-height) - 196px); overflow:auto; }.conflict-strip { grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }.conflict-strip>div:last-child { grid-column:1/-1; }.resource-grid { grid-template-columns:1fr; gap:12px; }.metric-heading-end>span:first-child { display:none; }.resource-heading { flex-wrap:wrap; }.resource-heading button { min-height:44px; }.metric-footnote { font-size:12px; line-height:1.5; } }
</style>
