<template>
  <div class="task-list"><select :value="currentFilter" :aria-label="ui.t('filter')" @change="changeFilter($event.target.value)"><option v-for="value in filters" :key="value" :value="value">{{ ui.t(value) }}</option></select>
    <div class="task-scroll"><TaskCard v-for="task in filteredTasks" :key="task.id" :task="task" :is-selected="store.selectedTaskId===task.id" @select="select" /><p v-if="!filteredTasks.length" class="empty">{{ ui.t('noTasks') }}</p></div>
  </div>
</template>
<script setup>
import {computed} from 'vue'
import {useRouter} from 'vue-router'
import { useAppStore } from '../../stores/appStore'
import { useUiStore } from '../../stores/uiStore'
import TaskCard from './TaskCard.vue'
const props=defineProps({initialFilter:{type:String,default:'all'}}),emit=defineEmits(['selectTask'])
const store=useAppStore(),ui=useUiStore(),router=useRouter()
const filters=['all','urgent','executing','waiting','completed','failed','today']
const currentFilter=computed(()=>filters.includes(props.initialFilter) ? props.initialFilter:'all')
const filteredTasks=computed(()=>store.getTasksByFilter(currentFilter.value))
function changeFilter(filter) { router.replace({name:'tasks',query:{filter}}) }
function select(id) { store.selectTask(id); emit('selectTask',id) }
</script>
<style scoped>.task-list>select { width:100%; margin-bottom:8px; }.task-scroll { display:flex; flex-direction:column; gap:6px; }</style>
