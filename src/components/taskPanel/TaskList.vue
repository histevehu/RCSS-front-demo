<template>
  <div class="task-list">
    <div class="record-toolbar">
      <span class="record-count" aria-live="polite">{{ ui.t(currentFilter) }} · {{ filteredTasks.length }} / {{ store.stats.total }}</span>
      <select :value="extraFilters.includes(currentFilter) ? currentFilter:''" :aria-label="ui.t('moreFilters')" @change="changeFilter($event.target.value || 'all')"><option value="">{{ ui.t('moreFilters') }}</option><option v-for="value in extraFilters" :key="value" :value="value">{{ ui.t(value) }}</option></select>
    </div>
    <div class="record-statuses" role="group" :aria-label="ui.t('filter')">
      <button v-for="value in statusFilters" :key="value" :aria-label="`${ui.t(value)} ${store.getTasksByFilter(value).length}`" :aria-pressed="currentFilter===value" :class="{active:currentFilter===value}" @click="changeFilter(value)"><span>{{ ui.t(`filter_${value}`) }}</span><strong>{{ store.getTasksByFilter(value).length }}</strong></button>
    </div>
    <div class="task-scroll" :aria-label="ui.t('taskRecords')" tabindex="0">
      <TaskCard v-for="task in filteredTasks" :key="task.id" :task="task" :is-selected="store.selectedTaskId===task.id" @select="select" />
      <div v-if="!filteredTasks.length" class="record-empty"><p>{{ ui.t(store.stats.total ? 'emptyFiltered':'noTasks') }}</p><button v-if="store.stats.total" @click="changeFilter('all')">{{ ui.t('showAllTasks') }}</button><span v-else>{{ ui.t('emptyRecordsHint') }}</span></div>
    </div>
  </div>
</template>
<script setup>
import {computed} from 'vue'
import {useRouter,useRoute} from 'vue-router'
import { useAppStore } from '../../stores/appStore'
import { useUiStore } from '../../stores/uiStore'
import {statusFilters,extraFilters,normalizeTaskFilter} from '../../utils/taskFilters.js'
import TaskCard from './TaskCard.vue'
const props=defineProps({initialFilter:{type:String,default:'all'}}),emit=defineEmits(['selectTask'])
const store=useAppStore(),ui=useUiStore(),router=useRouter(),route=useRoute()
const currentFilter=computed(()=>normalizeTaskFilter(props.initialFilter))
const filteredTasks=computed(()=>store.getTasksByFilter(currentFilter.value))
function changeFilter(filter) { router.replace({name:'dashboard',query:{...route.query,filter}}) }
function select(id) { store.selectTask(id);emit('selectTask',id) }
</script>
<style scoped>
.task-list { display:flex; flex-direction:column; flex:1; min-height:0; overflow:hidden; }.record-toolbar { display:flex; align-items:center; gap:10px; flex:none; padding:10px 12px; }.record-toolbar select { max-width:115px; min-width:0; min-height:30px; font-size:11px; padding:4px 6px; }.record-count { flex:1; }.record-statuses { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:2px; padding:0 12px 10px; flex:none; }.record-statuses button { display:flex; flex-direction:column; align-items:center; gap:3px; border:0; border-radius:4px; background:transparent; padding:6px 0; font-size:11px; min-width:0; }.record-statuses button strong { font-size:13px; }.record-statuses button.active { background:var(--accent-soft); color:var(--accent); }.record-statuses button:hover { background:var(--hover); }.record-count { font-size:11px; color:var(--muted); white-space:nowrap; font-variant-numeric:tabular-nums; }.task-scroll { min-height:0; flex:1; overflow:auto; overscroll-behavior:contain; padding:0 12px 12px; display:flex; flex-direction:column; gap:8px; }.record-empty { padding:20px 4px; color:var(--muted); text-align:center; }.record-empty p { font-size:13px; }.record-empty span { display:block; margin-top:8px; font-size:12px; line-height:1.6; }
</style>
