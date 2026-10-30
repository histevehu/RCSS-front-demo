<template>
  <main class="workspace" :class="{'left-hidden':!leftVisible,'right-hidden':!rightVisible}">
    <ConferenceMap />
    <Header :focus="focus" @focus="toggleFocus" />
    <button class="rail-toggle left-toggle" :aria-label="ui.t(leftVisible ? 'hideLeft':'showLeft')" :aria-expanded="leftVisible" @click="toggleRail('left')">{{ leftVisible ? '‹':'›' }}</button>
    <aside v-show="leftVisible" class="workspace-rail left-rail" :aria-label="ui.t('taskArea')" @wheel.stop>
      <CollapsiblePanel panel-id="summary" :title="ui.t('tasks')" :badge="store.stats.total">
        <div class="task-counts"><button v-for="status in ['executing','waiting','completed']" :key="status" :class="`status-${status}`" @click="filterTasks(status)"><strong>{{ store.stats[status] }}</strong><span>{{ ui.t(status) }}</span></button></div>
        <div class="field-row"><span>{{ ui.t('completionRate') }}</span><span class="status-completed">{{ store.stats.completionRate }}%</span></div>
        <progress :value="store.stats.completionRate" max="100" :aria-label="ui.t('completionRate')"></progress>
        <div class="session-metrics"><div><strong>{{ store.stats.total }}</strong><span>{{ ui.t('sessionTotal') }}</span></div><div><strong>{{ ui.duration(store.snapshot?.stats.avgCompletionSeconds) }}</strong><span>{{ ui.t('avgCompletion') }}</span></div><button @click="filterTasks('failed')"><strong>{{ store.stats.failed }}</strong><span>{{ ui.t('failedScheduling') }}</span></button></div>
      </CollapsiblePanel>
      <CollapsiblePanel v-if="store.selectedTask" panel-id="details" :title="ui.t('taskDetails')" :badge="store.selectedTask.id"><TaskDetails :task="store.selectedTask" /></CollapsiblePanel>
      <CollapsiblePanel v-if="!taskView" panel-id="queue" :title="ui.t('waitingQueue')" :badge="store.waitingQueue.length"><WaitQueue /></CollapsiblePanel>
      <CollapsiblePanel v-else panel-id="list" :title="ui.t('taskList')" :badge="store.stats.total">
        <div class="task-actions"><button @click="showGantt=true">{{ ui.t('timeline') }}</button><button @click="showLogs=true">{{ ui.t('logs') }}</button></div>
        <TaskList :initial-filter="filter" @select-task="openDetails" />
      </CollapsiblePanel>
    </aside>
    <button class="rail-toggle right-toggle" :aria-label="ui.t(rightVisible ? 'hideRight':'showRight')" :aria-expanded="rightVisible" @click="toggleRail('right')">{{ rightVisible ? '›':'‹' }}</button>
    <aside v-show="rightVisible" class="workspace-rail right-rail" :aria-label="ui.t('robotArea')" @wheel.stop><CollapsiblePanel panel-id="robots" :title="ui.t('robots')" :badge="`${store.robotStats.total} ${ui.t('online')}`"><RobotStatus /></CollapsiblePanel></aside>
    <div class="left-dock"><button class="primary new-task-button" @click="showForm=true">＋ {{ ui.t('newTask') }}</button></div>
    <div class="mobile-drawers"><button :aria-expanded="mobilePanel==='left'" @click="mobilePanel=mobilePanel==='left' ? null:'left'">{{ ui.t('tasks') }} · {{ store.stats.total }}</button><button :aria-expanded="mobilePanel==='right'" @click="mobilePanel=mobilePanel==='right' ? null:'right'">{{ ui.t('robots') }} · {{ store.robotStats.total }}</button></div>
    <Modal v-model="showForm" :title="ui.t('newTask')"><TaskForm @submit="created" @cancel="showForm=false" /></Modal>
    <Modal v-model="showGantt" :title="ui.t('timeline')" size="xl"><GanttChart /></Modal>
    <Modal v-model="showLogs" :title="ui.t('logs')"><TaskLog /></Modal>
  </main>
</template>
<script setup>
import { computed,ref,onMounted,onUnmounted,watch } from 'vue'
import { useRoute,useRouter } from 'vue-router'
import { useAppStore } from '../stores/appStore'
import { useUiStore } from '../stores/uiStore'
import Header from '../components/common/Header.vue'
import Modal from '../components/common/Modal.vue'
import CollapsiblePanel from '../components/common/CollapsiblePanel.vue'
import ConferenceMap from '../components/ConferenceMap.vue'
import RobotStatus from '../components/dashboard/RobotStatus.vue'
import WaitQueue from '../components/dashboard/WaitQueue.vue'
import TaskForm from '../components/taskPanel/TaskForm.vue'
import TaskList from '../components/taskPanel/TaskList.vue'
import TaskDetails from '../components/taskPanel/TaskDetails.vue'
import GanttChart from '../components/taskPanel/GanttChart.vue'
import TaskLog from '../components/taskPanel/TaskLog.vue'
const store=useAppStore(),ui=useUiStore(),route=useRoute(),router=useRouter()
const taskView=computed(()=>route.name==='tasks'),filter=computed(()=>route.query.filter || 'all')
const showForm=ref(false),showGantt=ref(false),showLogs=ref(false),focus=ref(false),mobilePanel=ref(null)
const mobile=ref(window.matchMedia('(max-width:800px)').matches)
const leftVisible=computed(()=>mobile.value ? mobilePanel.value==='left' : !focus.value && !ui.preferences.leftHidden)
const rightVisible=computed(()=>mobile.value ? mobilePanel.value==='right' : !focus.value && !ui.preferences.rightHidden)
function toggleRail(side) {
  if(mobile.value) mobilePanel.value=mobilePanel.value===side ? null:side
  else {
    const visible=side==='left' ? leftVisible.value:rightVisible.value
    focus.value=false
    ui.preferences[`${side}Hidden`]=visible
  }
}
function toggleFocus() { focus.value=!focus.value }
function filterTasks(value) { focus.value=false; ui.preferences.leftHidden=false; ui.preferences.folds.list=false; if(mobile.value) mobilePanel.value='left'; router.push({name:'tasks',query:{filter:value}}) }
function openDetails() { ui.preferences.folds.details=false }
function created(task) { store.selectTask(task.id); showForm.value=false; focus.value=false; ui.preferences.leftHidden=false; openDetails(); if(mobile.value) mobilePanel.value='left' }
watch(()=>store.selectedTaskId,()=>{ if(store.selectedTaskId) openDetails() })
const media=window.matchMedia('(max-width:800px)')
function resized(event) { mobile.value=event.matches; mobilePanel.value=null }
onMounted(()=>media.addEventListener('change',resized))
onUnmounted(()=>media.removeEventListener('change',resized))
</script>
<style scoped>
.workspace { --rail-width:280px; --left-space:calc(var(--rail-width) + 36px); --right-space:calc(var(--rail-width) + 36px); position:relative; width:100%; height:100%; }
.workspace.left-hidden { --left-space:42px; }.workspace.right-hidden { --right-space:42px; }
.workspace-rail { position:absolute; z-index:10; top:calc(var(--header-height) + 12px); bottom:64px; width:var(--rail-width); display:flex; flex-direction:column; gap:12px; overflow-y:auto; overscroll-behavior:contain; }
.left-rail { left:12px; }.right-rail { right:12px; }
.rail-toggle { position:absolute; top:calc(var(--header-height) + 18px); z-index:12; width:22px; height:30px; padding:0; font-size:20px; background:var(--surface); }
.left-toggle { left:calc(var(--rail-width) + 16px); }.left-hidden .left-toggle { left:12px; }.right-toggle { right:calc(var(--rail-width) + 16px); }.right-hidden .right-toggle { right:12px; }
.task-counts { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:6px; margin-bottom:8px; }.task-counts button { border:0; background:var(--subtle); padding:8px 3px; display:flex; flex-direction:column; gap:4px; align-items:center; }.task-counts strong { font-size:23px; font-weight:650; line-height:1; }.task-counts span { font-size:10px; color:var(--muted); }
.session-metrics { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:4px; border-top:1px solid var(--border); padding-top:9px; margin-top:8px; }.session-metrics>div,.session-metrics>button { display:flex; flex-direction:column; align-items:center; text-align:center; gap:4px; padding:0 2px; background:transparent; border:0; }.session-metrics strong { font-size:15px; font-weight:600; }.session-metrics span { font-size:9px; color:var(--muted); }.session-metrics button strong { color:var(--danger); }
.left-dock { position:absolute; z-index:12; left:12px; bottom:12px; width:var(--rail-width); }.new-task-button { width:100%; height:38px; }.left-hidden .left-dock { width:136px; }
.task-actions { display:flex; gap:6px; margin-bottom:8px; }.task-actions button { flex:1; font-size:10px; }
.mobile-drawers { display:none; }
@media(min-width:801px) and (max-width:1199px) { .workspace { --rail-width:240px; } }
@media(max-width:800px) { .workspace { --left-space:8px; --right-space:8px; }.workspace-rail { inset:auto 8px 106px; width:auto; max-height:calc(100% - var(--header-height) - 120px); border-radius:10px; padding:0; gap:8px; }.rail-toggle { display:none; }.workspace-rail :deep(.panel-body) { max-height:36vh; }.left-dock,.left-hidden .left-dock { left:8px; bottom:8px; width:128px; }.new-task-button { height:44px; }.mobile-drawers { position:absolute; bottom:8px; right:8px; display:flex; gap:6px; z-index:12; }.mobile-drawers button { height:44px; background:var(--surface); padding:5px 10px; } }
</style>
