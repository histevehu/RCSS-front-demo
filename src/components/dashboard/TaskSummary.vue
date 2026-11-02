<template>
  <div class="task-counts"><button v-for="status in statusFilters" :key="status" :class="{active:filter===status}" :aria-pressed="filter===status" @click="$emit('filter',status)"><strong>{{ status==='all' ? store.stats.total:store.stats[status] }}</strong><span>{{ ui.t(`filter_${status}`) }}</span></button></div>
  <div class="completion-strip"><span>{{ ui.t('completionRate') }}</span><progress :value="store.stats.completionRate" max="100" :aria-label="ui.t('completionRate')"></progress><strong>{{ store.stats.completionRate }}%</strong></div>
  <div class="summary-duration"><span>{{ ui.t('avgCompletion') }}</span><strong>{{ ui.duration(store.snapshot?.stats.avgCompletionSeconds) }}</strong></div>
</template>
<script setup>
import {useAppStore} from '../../stores/appStore'
import {useUiStore} from '../../stores/uiStore'
import {statusFilters} from '../../utils/taskFilters.js'
defineProps({filter:{type:String,default:'all'}})
defineEmits(['filter'])
const store=useAppStore(),ui=useUiStore()
</script>
<style scoped>
.task-counts { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); margin-bottom:8px; }
.task-counts button { border:0; border-radius:4px; background:transparent; padding:3px 2px; display:flex; flex-direction:column; gap:3px; align-items:center; }
.task-counts button.active { background:var(--active); }.task-counts button:hover { background:var(--subtle); }
.task-counts strong { font-size:20px; font-weight:600; line-height:1.1; }.task-counts span { font-size:12px; color:var(--muted); }
.completion-strip { display:flex; align-items:center; gap:8px; font-size:12px; color:var(--muted); min-height:18px; }.completion-strip>span { flex:none; }.completion-strip progress { flex:1; width:0; height:3px; }.completion-strip strong { font-weight:500; }
.summary-duration { display:flex; align-items:center; justify-content:space-between; gap:12px; border-top:1px solid var(--border); padding-top:6px; margin-top:6px; font-size:12px; line-height:18px; color:var(--muted); }.summary-duration strong { font-size:14px; font-weight:600; color:var(--text); white-space:nowrap; }
@media(max-width:800px) { .task-counts button { min-height:44px; } }
</style>
