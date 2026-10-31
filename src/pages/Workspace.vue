<template>
  <main class="workspace" :class="{'left-hidden':!leftVisible,'right-hidden':!rightVisible,'summary-folded':ui.preferences.folds.summary,'records-folded':ui.preferences.folds.list}">
    <ConferenceMap />
    <Header :focus="focus" @focus="toggleFocus" />
    <button v-if="leftVisible" class="rail-toggle left-toggle" :aria-label="ui.t('hideLeft')" :aria-expanded="true" @click="toggleRail('left')"><span>{{ ui.t('taskArea') }}</span> ‹</button>
    <nav v-else class="collapsed-rail collapsed-left" :aria-label="ui.t('taskArea')">
      <strong>{{ ui.t('taskArea') }}</strong>
      <button v-for="panel in leftPanels" :key="panel.id" :aria-expanded="false" @click="openPanel('left',panel.id)"><span>{{ ui.t(panel.title) }}</span><span class="badge">{{ panel.badge }}</span><span aria-hidden="true">›</span></button>
    </nav>
    <aside v-show="leftVisible" class="workspace-rail left-rail" :aria-label="ui.t('taskArea')" @wheel.stop>
      <CollapsiblePanel panel-id="summary" :title="ui.t('taskOverview')" :badge="store.stats.total">
        <div class="task-counts"><button v-for="status in ['executing','waiting','completed']" :key="status" :class="[`status-${status}`,{active:filter===status}]" :aria-pressed="filter===status" @click="filterTasks(status)"><strong>{{ store.stats[status] }}</strong><span>{{ ui.t(status) }}</span></button></div>
        <div class="completion-strip"><span>{{ ui.t('completionRate') }}</span><progress :value="store.stats.completionRate" max="100" :aria-label="ui.t('completionRate')"></progress><strong>{{ store.stats.completionRate }}%</strong></div>
        <div class="session-metrics"><div><strong>{{ store.stats.total }}</strong><span>{{ ui.t('sessionTotal') }}</span></div><div><strong>{{ ui.duration(store.snapshot?.stats.avgCompletionSeconds) }}</strong><span>{{ ui.t('avgCompletion') }}</span></div><button :class="{active:filter==='failed'}" :aria-pressed="filter==='failed'" @click="filterTasks('failed')"><strong>{{ store.stats.failed }}</strong><span>{{ ui.t('failedScheduling') }}</span></button></div>
      </CollapsiblePanel>
      <CollapsiblePanel panel-id="list" :title="ui.t('taskRecords')" :badge="store.stats.total">
        <div class="task-actions"><button @click="showGantt=true">{{ ui.t('timeline') }}</button><button @click="showLogs=true">{{ ui.t('logs') }}</button></div>
        <TaskList :initial-filter="filter" />
      </CollapsiblePanel>
    </aside>
    <button v-if="rightVisible" class="rail-toggle right-toggle" :aria-label="ui.t('hideRight')" :aria-expanded="true" @click="toggleRail('right')"><span>{{ ui.t('robotArea') }}</span> ›</button>
    <nav v-else class="collapsed-rail collapsed-right" :aria-label="ui.t('robotArea')">
      <strong>{{ ui.t('robotArea') }}</strong>
      <button :aria-expanded="false" @click="openPanel('right','robots')"><span aria-hidden="true">‹</span><span>{{ ui.t('robots') }}</span><span class="badge">{{ store.robotStats.total }} {{ ui.t('online') }}</span></button>
    </nav>
    <aside v-show="rightVisible" class="workspace-rail right-rail" :aria-label="ui.t('robotArea')" @wheel.stop><CollapsiblePanel panel-id="robots" :title="ui.t('robots')" :badge="`${store.robotStats.total} ${ui.t('online')}`"><RobotStatus /></CollapsiblePanel></aside>
    <TaskInspector v-if="store.selectedTask" v-show="!mobile || !mobilePanel" :task="store.selectedTask" @layout-change="refocusSelection" />
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
import { normalizeTaskFilter } from '../utils/taskFilters.js'
import Header from '../components/common/Header.vue'
import Modal from '../components/common/Modal.vue'
import CollapsiblePanel from '../components/common/CollapsiblePanel.vue'
import ConferenceMap from '../components/ConferenceMap.vue'
import RobotStatus from '../components/dashboard/RobotStatus.vue'
import TaskForm from '../components/taskPanel/TaskForm.vue'
import TaskList from '../components/taskPanel/TaskList.vue'
import TaskInspector from '../components/taskPanel/TaskInspector.vue'
import GanttChart from '../components/taskPanel/GanttChart.vue'
import TaskLog from '../components/taskPanel/TaskLog.vue'
const store=useAppStore(),ui=useUiStore(),route=useRoute(),router=useRouter()
const filter=computed(()=>normalizeTaskFilter(route.query.filter))
const showForm=ref(false),showGantt=ref(false),showLogs=ref(false),focus=ref(false),mobilePanel=ref(null)
const mobile=ref(window.matchMedia('(max-width:800px)').matches)
const leftVisible=computed(()=>mobile.value ? mobilePanel.value==='left' : !focus.value && !ui.preferences.leftHidden)
const rightVisible=computed(()=>mobile.value ? mobilePanel.value==='right' : !focus.value && !ui.preferences.rightHidden)
const leftPanels=computed(()=>[
  {id:'summary',title:'taskOverview',badge:store.stats.total},
  {id:'list',title:'taskRecords',badge:store.stats.total},
])
function openPanel(side,id) {
  focus.value=false
  ui.preferences[`${side}Hidden`]=false
  ui.preferences.folds[id]=false
}
function toggleRail(side) {
  if(mobile.value) mobilePanel.value=mobilePanel.value===side ? null:side
  else {
    const visible=side==='left' ? leftVisible.value:rightVisible.value
    focus.value=false
    ui.preferences[`${side}Hidden`]=visible
  }
}
function toggleFocus() { focus.value=!focus.value }
function filterTasks(value) { focus.value=false; ui.preferences.leftHidden=false; ui.preferences.folds.list=false; if(mobile.value) mobilePanel.value='left'; router.replace({name:'dashboard',query:{...route.query,filter:filter.value===value ? 'all':value}}) }
/** 显式展开详情时重新避让底部区域；后台轮询仍不触发相机重置。 */
function refocusSelection() { if(store.selectedTaskId) store.selectTask(store.selectedTaskId) }
function created(task) { store.selectTask(task.id); showForm.value=false; focus.value=false; ui.preferences.leftHidden=false; if(mobile.value) mobilePanel.value='left' }
watch(()=>`${store.selectedTaskId}:${store.selectionVersion}`,()=>{
  if(store.selectedTaskId) {
    // 手机上选完任务后让出地图，避免展开的抽屉遮住自动聚焦的路线。
    if(mobile.value) mobilePanel.value=null
  }
},{flush:'post'})
const media=window.matchMedia('(max-width:800px)')
function resized(event) { mobile.value=event.matches; mobilePanel.value=null }
onMounted(()=>media.addEventListener('change',resized))
onUnmounted(()=>media.removeEventListener('change',resized))
</script>
<style scoped>
/* 两侧使用同一固定边界；记录和机器人列表负责自己的滚动，不滚动整栏。 */
.workspace { --rail-width:280px; --rail-gap:16px; --left-space:calc(var(--rail-width) + 48px); --right-space:calc(var(--rail-width) + 48px); --summary-row:196px; --records-row:minmax(0,1fr); position:relative; width:100%; height:100%; }
.workspace.summary-folded { --summary-row:42px; }.workspace.records-folded { --records-row:42px; }
.workspace.left-hidden { --left-space:192px; }.workspace.right-hidden { --right-space:192px; }
.workspace-rail { position:absolute; z-index:10; top:calc(var(--header-height) + 16px); bottom:72px; width:var(--rail-width); min-height:0; overflow:hidden; }
.left-rail { left:16px; display:grid; grid-template-rows:var(--summary-row) var(--records-row); gap:12px; align-content:start; }.right-rail { right:16px; display:flex; flex-direction:column; bottom:16px; }
.workspace-rail :deep(.panel) { display:flex; flex-direction:column; min-height:0; }.workspace-rail :deep(.panel h2) { flex:none; }
.workspace-rail :deep(.panel-body) { flex:1; min-height:0; max-height:none; }
.left-rail :deep([data-panel="list"]>.panel-body) { display:flex; flex-direction:column; overflow:hidden; padding:0; }
.right-rail :deep(.panel:not(.folded)) { flex:1; }.right-rail :deep(.panel-body) { display:flex; overflow:hidden; }
.rail-toggle { position:absolute; top:calc(var(--header-height) + 16px); z-index:12; height:32px; padding:4px 7px; font-size:11px; white-space:nowrap; background:var(--surface); }
.left-toggle { left:calc(var(--rail-width) + 20px); }.right-toggle { right:calc(var(--rail-width) + 20px); }
.collapsed-rail { position:absolute; z-index:12; top:calc(var(--header-height) + 16px); width:160px; display:flex; flex-direction:column; gap:6px; padding:10px; border:1px solid var(--border); border-radius:8px; background:var(--surface); }
.collapsed-left { left:16px; }.collapsed-right { right:16px; }.collapsed-rail>strong { color:var(--muted); font-size:11px; font-weight:500; margin-bottom:2px; }.collapsed-rail>button { display:flex; align-items:center; gap:6px; padding:7px 6px; text-align:left; min-height:36px; font-size:12px; }.collapsed-rail>button>span:first-child:not([aria-hidden]) { flex:1; }.collapsed-right>button>span:nth-child(2) { flex:1; }
/* 概览保持紧凑且字号可读，把固定侧栏高度优先留给任务记录。 */
.left-rail :deep([data-panel="summary"]>.panel-body) { padding:8px 12px; }
.left-rail :deep([data-panel="summary"] .panel-heading) { min-height:36px; padding:6px 12px; }
.task-counts { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); margin-bottom:6px; }
.task-counts button { border:0; border-radius:4px; background:transparent; padding:3px 2px; display:flex; flex-direction:column; gap:2px; align-items:center; }
.task-counts button.active,.session-metrics button.active { background:var(--accent-soft); }.task-counts button:hover { background:var(--subtle); }
.task-counts strong { font-size:20px; font-weight:600; line-height:1.1; }.task-counts span { font-size:11px; color:var(--muted); }
.completion-strip { display:flex; align-items:center; gap:8px; font-size:11px; color:var(--muted); min-height:18px; }.completion-strip>span { flex:none; }.completion-strip progress { flex:1; width:0; height:3px; }.completion-strip strong { color:var(--success); font-size:12px; font-weight:500; }
.session-metrics { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:6px; border-top:1px solid var(--border); padding-top:6px; margin-top:6px; }.session-metrics>div,.session-metrics>button { display:flex; flex-direction:column; align-items:center; text-align:center; gap:2px; padding:0 2px; background:transparent; border:0; }.session-metrics strong { font-size:14px; font-weight:600; }.session-metrics span { font-size:11px; line-height:1.4; color:var(--muted); }.session-metrics button strong { color:var(--danger); }
.left-dock { position:absolute; z-index:12; left:16px; bottom:16px; width:var(--rail-width); }.new-task-button { width:100%; height:40px; }.left-hidden .left-dock { width:160px; }
.task-actions { display:flex; gap:8px; padding:10px 12px 0; flex:none; }.task-actions button { flex:1; font-size:11px; min-height:32px; }
.mobile-drawers { display:none; }
@media(min-width:801px) and (max-width:1199px) { .workspace { --rail-width:250px; } }
@media(max-width:800px) {
 .workspace,.workspace.left-hidden,.workspace.right-hidden { --left-space:16px; --right-space:16px; --summary-row:196px; }
 .workspace.summary-folded { --summary-row:44px; }
 .workspace-rail { inset:auto 16px 116px; width:auto; height:min(650px,calc(100dvh - var(--header-height) - 148px)); }
 .right-rail { bottom:116px; }.left-rail { gap:8px; }
 .rail-toggle,.collapsed-rail { display:none; }
 .left-dock,.left-hidden .left-dock { left:16px; bottom:16px; width:124px; }.new-task-button { height:44px; }
 .mobile-drawers { position:absolute; bottom:16px; right:16px; display:flex; gap:6px; z-index:12; }.mobile-drawers button { height:44px; background:var(--surface); padding:5px 10px; }
 .task-counts button { min-height:44px; }
}
@media(max-height:700px) and (min-width:801px) { .workspace { --summary-row:196px; }.workspace.summary-folded { --summary-row:42px; } }
@media(prefers-reduced-motion:no-preference) { .new-task-button { transition:background .15s; }.new-task-button:active { transform:translateY(1px); } }
</style>
