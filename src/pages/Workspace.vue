<template>
  <main class="workspace" :class="{'overview-page':isOverview,'left-hidden':!leftVisible,'right-hidden':!rightVisible,'summary-folded':ui.preferences.folds.summary,'records-folded':ui.preferences.folds.list,'robots-folded':ui.preferences.folds.robots,'distribution-folded':ui.preferences.folds.distribution,'queue-folded':ui.preferences.folds.queue,'batch-on':store.batching.enabled}">
    <ConferenceMap />
    <Header :focus="focus" @focus="toggleFocus" />
    <button v-if="leftVisible" class="rail-toggle left-toggle" :aria-label="ui.t('hideLeft')" :aria-expanded="true" @click="toggleRail('left')">‹</button>
    <nav v-else class="collapsed-rail collapsed-left" :aria-label="ui.t(leftTitle)"><strong>{{ ui.t(leftTitle) }}</strong><button v-for="panel in leftPanels" :key="panel.id" :aria-expanded="false" @click="openPanel('left',panel.id)"><span>{{ ui.t(panel.title) }}</span><span class="badge">{{ panel.badge }}</span><span aria-hidden="true">›</span></button></nav>
    <aside v-show="leftVisible" class="workspace-rail left-rail" :aria-label="ui.t(leftTitle)" @wheel.stop>
      <CollapsiblePanel panel-id="summary" :title="ui.t('taskOverview')" :badge="store.stats.total"><TaskSummary :filter="isOverview ? '' : filter" @filter="filterTasks" /></CollapsiblePanel>
      <CollapsiblePanel v-if="isOverview" panel-id="robots" :title="ui.t('robots')" :badge="`${store.robotStats.total} ${ui.t('online')}`"><RobotStatus /></CollapsiblePanel>
      <CollapsiblePanel v-show="!isOverview" panel-id="list" :title="ui.t('taskRecords')"><div class="task-actions"><button @click="showGantt=true">{{ ui.t('timeline') }}</button><button @click="showLogs=true">{{ ui.t('logs') }}</button></div><TaskList :initial-filter="filter" /></CollapsiblePanel>
    </aside>
    <button v-if="rightVisible" class="rail-toggle right-toggle" :aria-label="ui.t('hideRight')" :aria-expanded="true" @click="toggleRail('right')">›</button>
    <nav v-else class="collapsed-rail collapsed-right" :aria-label="ui.t(rightTitle)"><strong>{{ ui.t(rightTitle) }}</strong><button v-for="panel in rightPanels" :key="panel.id" :aria-expanded="false" @click="openPanel('right',panel.id)"><span aria-hidden="true">‹</span><span>{{ ui.t(panel.title) }}</span><span class="badge">{{ panel.badge }}</span></button></nav>
    <aside v-show="rightVisible" class="workspace-rail right-rail" :aria-label="ui.t(rightTitle)" @wheel.stop>
      <template v-if="isOverview"><CollapsiblePanel panel-id="distribution" :title="ui.t('floorDistribution')" :badge="store.stats.total"><FloorDistribution @filter="destinationTasks" /></CollapsiblePanel><CollapsiblePanel panel-id="queue" :title="ui.t('waitingQueue')" :badge="store.waitingQueue.length"><WaitQueue @select="openTask" /></CollapsiblePanel></template>
      <CollapsiblePanel v-else panel-id="robots" :title="ui.t('robots')" :badge="`${store.robotStats.total} ${ui.t('online')}`"><RobotStatus /></CollapsiblePanel>
    </aside>
    <PlanningMetrics v-if="isOverview" v-show="!focus && (!mobile || mobilePanel==='metrics')" />
    <TaskInspector v-if="!isOverview && store.selectedTask" v-show="!mobile || !mobilePanel" :task="store.selectedTask" @layout-change="refocusSelection" />
    <div class="left-dock"><BatchControls /><button class="primary new-task-button" @click="showForm=true">＋ {{ ui.t('newTask') }}</button></div>
    <div class="mobile-drawers"><button :aria-expanded="mobilePanel==='left'" @click="toggleRail('left')">{{ ui.t(isOverview ? 'overview':'tasks') }}</button><button :aria-expanded="mobilePanel==='right'" @click="toggleRail('right')">{{ ui.t(isOverview ? 'distributionShort':'robots') }}</button><button v-if="isOverview" :aria-expanded="mobilePanel==='metrics'" @click="mobilePanel=mobilePanel==='metrics' ? null:'metrics'">{{ ui.t('metricsShort') }}</button></div>
    <Modal v-model="showForm" :title="ui.t('newTask')"><TaskForm @submit="created" @cancel="showForm=false" /></Modal>
    <Modal v-model="showGantt" :title="ui.t('timeline')" size="xl"><GanttChart /></Modal>
    <Modal v-model="showLogs" :title="ui.t('logs')"><TaskLog /></Modal>
  </main>
</template>
<script setup>
import {computed,ref,onMounted,onUnmounted,watch,nextTick} from 'vue'
import {useRoute,useRouter} from 'vue-router'
import {useAppStore} from '../stores/appStore'
import {useUiStore} from '../stores/uiStore'
import {normalizeTaskFilter} from '../utils/taskFilters.js'
import BatchControls from '../components/common/BatchControls.vue'
import Header from '../components/common/Header.vue'
import Modal from '../components/common/Modal.vue'
import CollapsiblePanel from '../components/common/CollapsiblePanel.vue'
import ConferenceMap from '../components/ConferenceMap.vue'
import RobotStatus from '../components/dashboard/RobotStatus.vue'
import TaskSummary from '../components/dashboard/TaskSummary.vue'
import FloorDistribution from '../components/dashboard/FloorDistribution.vue'
import PlanningMetrics from '../components/dashboard/PlanningMetrics.vue'
import WaitQueue from '../components/dashboard/WaitQueue.vue'
import TaskForm from '../components/taskPanel/TaskForm.vue'
import TaskList from '../components/taskPanel/TaskList.vue'
import TaskInspector from '../components/taskPanel/TaskInspector.vue'
import GanttChart from '../components/taskPanel/GanttChart.vue'
import TaskLog from '../components/taskPanel/TaskLog.vue'
const store=useAppStore(),ui=useUiStore(),route=useRoute(),router=useRouter()
const isOverview=computed(()=>route.name==='dashboard')
const filter=computed(()=>normalizeTaskFilter(route.query.filter))
const showForm=ref(false),showGantt=ref(false),showLogs=ref(false),focus=ref(false),mobilePanel=ref(null)
const media=window.matchMedia('(max-width:800px)'),mobile=ref(media.matches)
const leftVisible=computed(()=>mobile.value ? mobilePanel.value==='left' : !focus.value && !ui.preferences.leftHidden)
const rightVisible=computed(()=>mobile.value ? mobilePanel.value==='right' : !focus.value && !ui.preferences.rightHidden)
const leftTitle=computed(()=>isOverview.value ? 'overview':'taskArea'),rightTitle=computed(()=>isOverview.value ? 'dispatchArea':'robotArea')
const robotPanel=computed(()=>({id:'robots',title:'robots',badge:store.robotStats.total}))
const leftPanels=computed(()=>[{id:'summary',title:'taskOverview',badge:store.stats.total},isOverview.value ? robotPanel.value:{id:'list',title:'taskRecords',badge:store.stats.total}])
const rightPanels=computed(()=>isOverview.value ? [{id:'distribution',title:'floorDistribution',badge:store.stats.total},{id:'queue',title:'waitingQueue',badge:store.waitingQueue.length}]:[robotPanel.value])
function openPanel(side,id) {focus.value=false;ui.preferences[`${side}Hidden`]=false;ui.preferences.folds[id]=false}
function toggleRail(side) {
  if(mobile.value) mobilePanel.value=mobilePanel.value===side ? null:side
  else {const visible=side==='left' ? leftVisible.value:rightVisible.value;focus.value=false;ui.preferences[`${side}Hidden`]=visible}
}
function toggleFocus() {focus.value=!focus.value;if(focus.value) mobilePanel.value=null}
function showRecords() {focus.value=false;ui.preferences.leftHidden=false;ui.preferences.folds.list=false;if(mobile.value) mobilePanel.value='left'}
function filterTasks(value) {showRecords();router.push({name:'tasks',query:{...route.query,filter:!isOverview.value && filter.value===value ? 'all':value}})}
function destinationTasks(criteria) {showRecords();router.push({name:'tasks',query:criteria})}
/** Navigate first so route fitting measures the destination page's actual panels. */
async function openTask(id) {await router.push({name:'tasks',query:{task:id}});await nextTick();store.selectTask(id)}
function refocusSelection() {if(store.selectedTaskId) store.selectTask(store.selectedTaskId)}
async function created(task,keepOpen=false) {if(keepOpen) return;showForm.value=false;focus.value=false;await openTask(task.id)}
watch(()=>`${store.selectedTaskId}:${store.selectionVersion}`,()=>{if(store.selectedTaskId && mobile.value) mobilePanel.value=null},{flush:'post'})
// Direct links and refreshes restore selection after the first authoritative poll.
watch(()=>[route.name,route.query.task,store.sessionId],()=>{
  if(!isOverview.value && route.query.task!==store.selectedTaskId && store.snapshot?.tasks.some(task=>task.id===route.query.task)) store.selectTask(route.query.task)
},{immediate:true,flush:'post'})
watch(()=>route.name,()=>{mobilePanel.value=null})
watch(()=>store.selectedTaskId,id=>{
  if(isOverview.value) return
  const query={...route.query}
  if(id) query.task=id;else delete query.task
  if(query.task!==route.query.task) router.replace({name:'tasks',query})
})
function resized(event) {mobile.value=event.matches;mobilePanel.value=null}
onMounted(()=>media.addEventListener('change',resized))
onUnmounted(()=>media.removeEventListener('change',resized))
</script>
<style scoped>
/* One fixed frame across pages; only list interiors scroll, never an entire rail. */
.workspace { --rail-width:280px; --left-space:calc(var(--rail-width) + 48px); --right-space:calc(var(--rail-width) + 48px); --summary-row:172px; --records-row:minmax(0,1fr); position:relative; width:100%; height:100%; }
.workspace.summary-folded { --summary-row:42px; }.workspace.records-folded { --records-row:42px; }.workspace.left-hidden { --left-space:192px; }.workspace.right-hidden { --right-space:192px; }
.workspace-rail { position:absolute; z-index:10; top:calc(var(--header-height) + 16px); bottom:72px; width:var(--rail-width); min-height:0; overflow:hidden; }
.left-rail { left:16px; display:grid; grid-template-rows:var(--summary-row) var(--records-row); gap:12px; align-content:start; }.right-rail { right:16px; display:flex; flex-direction:column; bottom:16px; }
.workspace-rail :deep(.panel) { display:flex; flex-direction:column; min-height:0; }.workspace-rail :deep(.panel h2) { flex:none; }.workspace-rail :deep(.panel-body) { flex:1; min-height:0; max-height:none; }
.left-rail :deep([data-panel="list"]>.panel-body) { display:flex; flex-direction:column; overflow:hidden; padding:0; }
.workspace-rail :deep([data-panel="robots"]>.panel-body) { display:flex; overflow:hidden; }
.right-rail :deep(.panel:not(.folded)) { flex:1; }
.overview-page { --distribution-row:minmax(230px,.9fr); --queue-row:minmax(0,1fr); }
.overview-page.robots-folded { --records-row:42px; }.overview-page.distribution-folded { --distribution-row:42px; }.overview-page.queue-folded { --queue-row:42px; }
.overview-page .right-rail { display:grid; grid-template-rows:var(--distribution-row) var(--queue-row); gap:12px; bottom:72px; }
.overview-page .right-rail :deep([data-panel="distribution"]>.panel-body) { overflow:hidden; }

.left-rail :deep([data-panel="summary"]>.panel-body) { padding:8px 12px; }.left-rail :deep([data-panel="summary"] .panel-heading) { min-height:36px; padding:6px 12px; }
.rail-toggle { position:absolute; top:calc(var(--header-height) + 16px); z-index:12; height:32px; padding:4px 7px; font-size:16px; background:var(--surface); }.left-toggle { left:calc(var(--rail-width) + 20px); }.right-toggle { right:calc(var(--rail-width) + 20px); }
.collapsed-rail { position:absolute; z-index:12; top:calc(var(--header-height) + 16px); width:160px; display:flex; flex-direction:column; gap:6px; padding:10px; border:1px solid var(--border); border-radius:8px; background:var(--surface); }.collapsed-left { left:16px; }.collapsed-right { right:16px; }.collapsed-rail>strong { color:var(--muted); font-size:12px; font-weight:500; margin-bottom:2px; }.collapsed-rail>button { display:flex; align-items:center; gap:6px; padding:7px 6px; text-align:left; min-height:36px; font-size:12px; }.collapsed-rail>button>span:first-child:not([aria-hidden]) { flex:1; }.collapsed-right>button>span:nth-child(2) { flex:1; }
.left-rail { bottom:154px; }.batch-on .left-rail { bottom:248px; }.left-dock { display:flex;flex-direction:column;gap:8px; position:absolute; z-index:12; left:16px; bottom:16px; width:var(--rail-width); }.new-task-button { width:100%; height:40px; }.left-hidden .left-dock { width:var(--rail-width); }
.task-actions { display:flex; gap:8px; padding:10px 12px 0; flex:none; }.task-actions button { flex:1; font-size:12px; min-height:32px; }.mobile-drawers { display:none; }
@media(min-width:1440px) { .workspace { --rail-width:300px; } }
@media(min-width:801px) and (max-width:1199px) { .workspace { --rail-width:250px; } }
@media(max-width:800px) {
 .workspace,.workspace.left-hidden,.workspace.right-hidden { --left-space:16px; --right-space:16px; --summary-row:172px; }.workspace.summary-folded { --summary-row:44px; }
 .workspace-rail { inset:auto 16px 116px; width:auto; height:min(650px,calc(100dvh - var(--header-height) - 148px)); }.right-rail,.overview-page .right-rail { bottom:116px; }.left-rail { gap:8px; }.rail-toggle,.collapsed-rail { display:none; }
 .overview-page { --distribution-row:minmax(190px,.9fr); }.overview-page.distribution-folded { --distribution-row:44px; }.overview-page.queue-folded { --queue-row:44px; }
 .left-dock,.left-hidden .left-dock { left:16px; bottom:68px; width:calc(100% - 32px); }.workspace-rail,.left-rail {bottom:220px;height:calc(100dvh - var(--header-height) - 245px)}.batch-on .workspace-rail,.batch-on .left-rail{bottom:324px;height:calc(100dvh - var(--header-height) - 349px)}.task-inspector{bottom:324px}.new-task-button { height:44px; }
 .workspace :deep(.map-tools) {bottom:180px}.workspace.batch-on :deep(.map-tools){bottom:280px}
 .mobile-drawers { position:absolute; bottom:16px; right:16px; display:flex; gap:5px; z-index:12; }.mobile-drawers button { height:44px; background:var(--surface); padding:5px 9px; }
}
@media(max-width:440px) { .mobile-drawers { gap:4px; }.mobile-drawers button { font-size:12px; } }
</style>
