<template>
  <div class="task-list">
    <div class="record-toolbar">
      <span class="record-caption">{{ ui.t('recordConditions') }}</span>
      <button :class="{active:criteriaCount>0}" @click="openFilters">{{ ui.t('moreFilters') }}<span v-if="criteriaCount"> · {{ criteriaCount }}</span></button>
      <button v-if="criteriaCount" class="clear-criteria" :aria-label="ui.t('clearConditions')" @click="clearCriteria">×</button>
    </div>
    <p v-if="criteriaCount" class="criteria-summary" :title="criteriaSummary">{{ criteriaSummary }}</p>
    <div ref="listElement" class="task-scroll" :aria-label="ui.t('taskRecords')" tabindex="0">
      <TaskCard v-for="task in visibleTasks" :key="task.id" :task="task" :is-selected="store.selectedTaskId===task.id" @select="select" />
      <div v-if="!filteredTasks.length" class="record-empty"><p>{{ ui.t(store.stats.total ? 'emptyFiltered':'noTasks') }}</p><button v-if="store.stats.total" @click="clearAll">{{ ui.t('showAllTasks') }}</button><span v-else>{{ ui.t('emptyRecordsHint') }}</span></div>
    </div>
    <div v-if="pageCount>1" class="record-pages" :aria-label="ui.t('recordPages')"><button :disabled="page===1" @click="page--">{{ ui.t('previousPage') }}</button><span>{{ page }} / {{ pageCount }}</span><button :disabled="page===pageCount" @click="page++">{{ ui.t('nextPage') }}</button></div>
    <Modal v-model="showFilters" :title="ui.t('moreFilters')" size="sm">
      <form class="record-filter-form" @submit.prevent="applyFilters">
        <label>{{ ui.t('createdTime') }}<select v-model="draft.period" :aria-label="ui.t('createdTime')"><option v-for="value in ['all','hour','today','range']" :key="value" :value="value">{{ ui.t(`period_${value}`) }}</option></select></label>
        <div v-if="draft.period==='range'" class="date-range"><label>{{ ui.t('fromDate') }}<input v-model="draft.from" type="date" :max="draft.to || undefined"></label><label>{{ ui.t('toDate') }}<input v-model="draft.to" type="date" :min="draft.from || undefined"></label></div>
        <label>{{ ui.t('robot') }}<select v-model="draft.robot" :aria-label="ui.t('robot')"><option value="">{{ ui.t('allRobots') }}</option><option v-for="robot in store.robots" :key="robot.id" :value="robot.id">{{ robot.id }}</option></select></label>
        <label>{{ ui.t('taskType') }}<select v-model="draft.taskType" :aria-label="ui.t('taskType')"><option value="">{{ ui.t('allTypes') }}</option><option v-for="type in types" :key="type" :value="type">{{ ui.t(type) }}</option></select></label>
        <p v-if="invalidRange" class="error-text" role="alert">{{ ui.t('invalidDateRange') }}</p>
        <div class="filter-actions"><button type="button" @click="resetDraft">{{ ui.t('clearConditions') }}</button><button class="primary" :disabled="invalidRange" type="submit">{{ ui.t('applyFilters') }}</button></div>
      </form>
    </Modal>
  </div>
</template>
<script setup>
import {computed,ref,reactive,watch,nextTick} from 'vue'
import {useRouter,useRoute} from 'vue-router'
import { useAppStore } from '../../stores/appStore'
import { useUiStore } from '../../stores/uiStore'
import {readTaskCriteria,filterTaskRecords,normalizeTaskFilter} from '../../utils/taskFilters.js'
import Modal from '../common/Modal.vue'
import TaskCard from './TaskCard.vue'
const props=defineProps({initialFilter:{type:String,default:'all'}}),emit=defineEmits(['selectTask'])
const store=useAppStore(),ui=useUiStore(),router=useRouter(),route=useRoute()
const currentFilter=computed(()=>normalizeTaskFilter(props.initialFilter))
const criteria=computed(()=>readTaskCriteria(route.query))
const filteredTasks=computed(()=>filterTaskRecords(store.getTasksByFilter(currentFilter.value),criteria.value,store.currentTime.getTime()))
const types=['delivery','pickup','sample','document','other']
const showFilters=ref(false),draft=reactive(readTaskCriteria({}))
const criteriaCount=computed(()=>Number(criteria.value.period!=='all')+Number(!!criteria.value.robot)+Number(!!criteria.value.taskType))
const criteriaSummary=computed(()=>[criteria.value.period!=='all' ? (criteria.value.period==='range' ? `${criteria.value.from || '…'} – ${criteria.value.to || '…'}`:ui.t(`period_${criteria.value.period}`)):'',criteria.value.robot,criteria.value.taskType ? ui.t(criteria.value.taskType):''].filter(Boolean).join(' · '))
const invalidRange=computed(()=>draft.period==='range' && !!draft.from && !!draft.to && draft.from>draft.to)
function openFilters() {Object.assign(draft,criteria.value);showFilters.value=true}
function resetDraft() {Object.assign(draft,readTaskCriteria({}))}
function criteriaQuery(value) {
  const query={...route.query};for(const key of ['period','robot','taskType','from','to']) delete query[key]
  if(value.period!=='all') query.period=value.period
  if(value.robot) query.robot=value.robot
  if(value.taskType) query.taskType=value.taskType
  if(value.period==='range') {if(value.from) query.from=value.from;if(value.to) query.to=value.to}
  return query
}
function applyFilters() {if(invalidRange.value) return;router.replace({name:'dashboard',query:criteriaQuery(draft)});showFilters.value=false}
function clearCriteria() {router.replace({name:'dashboard',query:criteriaQuery(readTaskCriteria({}))})}
function clearAll() {router.replace({name:'dashboard',query:{...criteriaQuery(readTaskCriteria({})),filter:'all'}})}
// 大量历史只保留当前页组件，避免轮询时更新数千张卡片；数据仍完整保留。
const page=ref(1),pageSize=30
const pageCount=computed(()=>Math.max(1,Math.ceil(filteredTasks.value.length/pageSize)))
const visibleTasks=computed(()=>filteredTasks.value.slice((page.value-1)*pageSize,page.value*pageSize))
watch(()=>JSON.stringify([currentFilter.value,criteria.value]),()=>{page.value=1;nextTick(()=>{if(listElement.value) listElement.value.scrollTop=0})})
watch(pageCount,count=>{page.value=Math.min(page.value,count)})
const listElement=ref(null)
watch(page,async()=>{await nextTick();if(listElement.value) listElement.value.scrollTop=0})
function select(id) { store.selectTask(id);emit('selectTask',id) }
</script>
<style scoped>
.record-pages { display:flex; flex:none; align-items:center; justify-content:space-between; padding:6px 12px; border-top:1px solid var(--border); font-size:11px; }.record-pages button { padding:4px 7px; }.task-list { display:flex; flex-direction:column; flex:1; min-height:0; overflow:hidden; }.record-toolbar { display:flex; align-items:center; gap:6px; flex:none; padding:8px 12px; }.record-caption { flex:1; font-size:11px; color:var(--muted); }.record-toolbar button { font-size:11px; min-height:30px; padding:4px 7px; }.record-toolbar button.active { color:var(--accent); background:var(--accent-soft); }.record-toolbar .clear-criteria { width:28px; font-size:18px; padding:0; }.criteria-summary { flex:none; padding:0 12px 8px; color:var(--muted); font-size:11px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }.record-filter-form { display:flex; flex-direction:column; gap:16px; }.record-filter-form label { display:flex; flex-direction:column; gap:6px; font-size:12px; color:var(--muted); }.record-filter-form input,.record-filter-form select { width:100%; min-width:0; min-height:36px; color:var(--text); }.date-range { display:grid; grid-template-columns:1fr 1fr; gap:12px; }.filter-actions { display:flex; justify-content:space-between; gap:12px; padding-top:4px; }.filter-actions button { min-height:36px; padding:6px 14px; }
.task-scroll { min-height:0; flex:1; overflow:auto; overscroll-behavior:contain; padding:0 12px 12px; display:flex; flex-direction:column; gap:8px; }.record-empty { padding:20px 4px; color:var(--muted); text-align:center; }.record-empty p { font-size:13px; }.record-empty span { display:block; margin-top:8px; font-size:12px; line-height:1.6; }
</style>
