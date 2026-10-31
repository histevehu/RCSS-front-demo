<template>
  <div class="task-list">
    <div class="record-toolbar">
      <select :value="currentFilter" :aria-label="ui.t('filter')" @change="changeFilter($event.target.value)"><option v-for="value in filters" :key="value" :value="value">{{ ui.t(value) }}</option></select>
      <span class="record-count">{{ filteredTasks.length }} / {{ store.stats.total }}</span>
    </div>
    <div class="task-scroll" :aria-label="ui.t('taskRecords')" tabindex="0">
      <TaskCard v-for="task in filteredTasks" :key="task.id" :task="task" :is-selected="store.selectedTaskId===task.id" @select="select" />
      <div v-if="!filteredTasks.length" class="record-empty"><p>{{ ui.t('noTasks') }}</p><span>{{ ui.t('emptyRecordsHint') }}</span></div>
    </div>
  </div>
</template>
<script setup>
import {computed} from 'vue'
import {useRouter,useRoute} from 'vue-router'
import { useAppStore } from '../../stores/appStore'
import { useUiStore } from '../../stores/uiStore'
import TaskCard from './TaskCard.vue'
const props=defineProps({initialFilter:{type:String,default:'all'}}),emit=defineEmits(['selectTask'])
const store=useAppStore(),ui=useUiStore(),router=useRouter(),route=useRoute()
const filters=['all','urgent','executing','waiting','completed','failed','today']
const currentFilter=computed(()=>filters.includes(props.initialFilter) ? props.initialFilter:'all')
const filteredTasks=computed(()=>store.getTasksByFilter(currentFilter.value))
function changeFilter(filter) { router.replace({name:route.name,query:{...route.query,filter}}) }
function select(id) { store.selectTask(id);emit('selectTask',id) }
</script>
<style scoped>
.task-list { display:flex; flex-direction:column; flex:1; min-height:0; overflow:hidden; }.record-toolbar { display:flex; align-items:center; gap:10px; flex:none; padding:10px 12px; }.record-toolbar select { flex:1; min-width:0; min-height:34px; }.record-count { font-size:11px; color:var(--muted); white-space:nowrap; font-variant-numeric:tabular-nums; }.task-scroll { min-height:0; flex:1; overflow:auto; overscroll-behavior:contain; padding:0 12px 12px; display:flex; flex-direction:column; gap:8px; }.record-empty { padding:20px 4px; color:var(--muted); text-align:center; }.record-empty p { font-size:13px; }.record-empty span { display:block; margin-top:8px; font-size:12px; line-height:1.6; }
</style>
