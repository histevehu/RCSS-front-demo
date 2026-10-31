<template>
  <div class="task-list">
    <div class="record-toolbar">
      <span class="record-count" aria-live="polite">{{ ui.t(currentFilter) }} · {{ filteredTasks.length }} / {{ store.stats.total }}</span>
      <select :value="extraFilters.includes(currentFilter) ? currentFilter:''" :aria-label="ui.t('moreFilters')" @change="changeFilter($event.target.value || 'all')"><option value="">{{ ui.t('moreFilters') }}</option><option v-for="value in extraFilters" :key="value" :value="value">{{ ui.t(value) }}</option></select>
    </div>
    <div class="record-statuses" role="group" :aria-label="ui.t('filter')">
      <button v-for="value in statusFilters" :key="value" :aria-label="`${ui.t(value)} ${store.getTasksByFilter(value).length}`" :aria-pressed="currentFilter===value" :class="{active:currentFilter===value}" @click="changeFilter(value)"><span>{{ ui.t(`filter_${value}`) }}</span><strong>{{ store.getTasksByFilter(value).length }}</strong></button>
    </div>
    <div ref="listElement" class="task-scroll" :aria-label="ui.t('taskRecords')" tabindex="0">
      <TaskCard v-for="task in visibleTasks" :key="task.id" :task="task" :is-selected="store.selectedTaskId===task.id" @select="select" />
      <div v-if="!filteredTasks.length" class="record-empty"><p>{{ ui.t(store.stats.total ? 'emptyFiltered':'noTasks') }}</p><button v-if="store.stats.total" @click="changeFilter('all')">{{ ui.t('showAllTasks') }}</button><span v-else>{{ ui.t('emptyRecordsHint') }}</span></div>
    </div>
    <div v-if="pageCount>1" class="record-pages" :aria-label="ui.t('recordPages')"><button :disabled="page===1" @click="page--">{{ ui.t('previousPage') }}</button><span>{{ page }} / {{ pageCount }}</span><button :disabled="page===pageCount" @click="page++">{{ ui.t('nextPage') }}</button></div>
  </div>
</template>
<script setup>
import {computed,ref,watch,nextTick} from 'vue'
import {useRouter,useRoute} from 'vue-router'
import { useAppStore } from '../../stores/appStore'
import { useUiStore } from '../../stores/uiStore'
import {statusFilters,extraFilters,normalizeTaskFilter} from '../../utils/taskFilters.js'
import TaskCard from './TaskCard.vue'
const props=defineProps({initialFilter:{type:String,default:'all'}}),emit=defineEmits(['selectTask'])
const store=useAppStore(),ui=useUiStore(),router=useRouter(),route=useRoute()
const currentFilter=computed(()=>normalizeTaskFilter(props.initialFilter))
const filteredTasks=computed(()=>store.getTasksByFilter(currentFilter.value))
// 大量历史只保留当前页组件，避免轮询时更新数千张卡片；数据仍完整保留。
const page=ref(1),pageSize=30
const pageCount=computed(()=>Math.max(1,Math.ceil(filteredTasks.value.length/pageSize)))
const visibleTasks=computed(()=>filteredTasks.value.slice((page.value-1)*pageSize,page.value*pageSize))
watch(currentFilter,()=>{page.value=1})
watch(pageCount,count=>{page.value=Math.min(page.value,count)})
const listElement=ref(null)
watch(page,async()=>{await nextTick();if(listElement.value) listElement.value.scrollTop=0})
function changeFilter(filter) { router.replace({name:'dashboard',query:{...route.query,filter}}) }
function select(id) { store.selectTask(id);emit('selectTask',id) }
</script>
<style scoped>
.record-pages { display:flex; flex:none; align-items:center; justify-content:space-between; padding:6px 12px; border-top:1px solid var(--border); font-size:11px; }.record-pages button { padding:4px 7px; }.task-list { display:flex; flex-direction:column; flex:1; min-height:0; overflow:hidden; }.record-toolbar { display:flex; align-items:center; gap:10px; flex:none; padding:10px 12px; }.record-toolbar select { max-width:115px; min-width:0; min-height:30px; font-size:11px; padding:4px 6px; }.record-count { flex:1; }.record-statuses { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:2px; padding:0 12px 10px; flex:none; }.record-statuses button { display:flex; flex-direction:column; align-items:center; gap:3px; border:0; border-radius:4px; background:transparent; padding:6px 0; font-size:11px; min-width:0; }.record-statuses button strong { font-size:13px; }.record-statuses button.active { background:var(--accent-soft); color:var(--accent); }.record-statuses button:hover { background:var(--hover); }.record-count { font-size:11px; color:var(--muted); white-space:nowrap; font-variant-numeric:tabular-nums; }.task-scroll { min-height:0; flex:1; overflow:auto; overscroll-behavior:contain; padding:0 12px 12px; display:flex; flex-direction:column; gap:8px; }.record-empty { padding:20px 4px; color:var(--muted); text-align:center; }.record-empty p { font-size:13px; }.record-empty span { display:block; margin-top:8px; font-size:12px; line-height:1.6; }
</style>
