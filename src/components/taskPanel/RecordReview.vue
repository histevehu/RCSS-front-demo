<template>
  <Modal :model-value="modelValue" @update:model-value="$emit('update:modelValue',$event)" :title="ui.t('recordsReview')" size="xl">
    <div class="review-intro">
      <p>{{ ui.t('recordsReadOnly') }}</p>
      <dl class="archive-meta">
        <div><dt>{{ ui.t('campus') }}</dt><dd>{{ campusName }}</dd></div>
        <div><dt>{{ ui.t('recordsExportedAt') }}</dt><dd>{{ exportedAt }}</dd></div>
        <div><dt>{{ ui.t('recordsSceneVersion') }}</dt><dd>{{ record.scene.version }}</dd></div>
        <div><dt>{{ ui.t('recordsCount') }}</dt><dd>{{ tasks.length }}</dd></div>
      </dl>
    </div>
    <div class="review-filters">
      <label>{{ ui.t('status') }}<select v-model="status"><option value="">{{ ui.t('all') }}</option><option v-for="s in ['waiting','executing','completed','failed']" :key="s" :value="s">{{ ui.t(s) }}</option></select></label>
      <label>{{ ui.t('recordsBatch') }}<select v-model="batch"><option value="">{{ ui.t('all') }}</option><option v-for="id in batches" :key="id" :value="id">{{ id==='__immediate__' ? ui.t('recordsImmediate'):id }}</option></select></label>
      <label>{{ ui.t('taskType') }}<select v-model="type"><option value="">{{ ui.t('allTypes') }}</option><option v-for="value in types" :key="value" :value="value">{{ ui.t(value) }}</option></select></label>
    </div>
    <div class="review-workspace">
      <div class="archive-list" :aria-label="ui.t('taskRecords')">
        <p v-if="!filtered.length" class="empty">{{ ui.t('emptyFiltered') }}</p>
        <button v-for="task in pageTasks" :key="task.id" :aria-pressed="selected?.id===task.id" :class="{selected:selected?.id===task.id}" @click="selectedId=task.id;tablePage=0">
          <span><strong>{{ task.id }} · {{ task.name }}</strong><span :class="`status-${task.status}`">{{ ui.t(task.status) }}</span></span>
          <small>{{ ui.t(task.taskType) }} · {{ task.batchId || ui.t('recordsImmediate') }}</small>
        </button>
        <div v-if="pageCount>1" class="review-pages"><button :disabled="page===0" @click="page--">{{ ui.t('previousPage') }}</button><span>{{ page+1 }} / {{ pageCount }}</span><button :disabled="page+1>=pageCount" @click="page++">{{ ui.t('nextPage') }}</button></div>
      </div>
      <section v-if="selected" class="archive-detail" :aria-label="ui.t('details')">
        <h4>{{ selected.id }} · {{ selected.name }}</h4>
        <p class="archive-route">{{ route(selected.routeNodes) }}</p>
        <dl class="archive-meta">
          <div><dt>{{ ui.t('taskType') }}</dt><dd>{{ ui.t(selected.taskType) }}</dd></div>
          <div><dt>{{ ui.t('taskUrgency') }}</dt><dd>{{ ui.t(selected.priority) }}</dd></div>
          <div><dt>{{ ui.t('assignedRobot') }}</dt><dd>{{ selected.robotId || ui.t('unassigned') }}</dd></div>
          <div><dt>{{ ui.t('requiredCapability') }}</dt><dd>{{ ui.capability(selected.capability) }}</dd></div>
          <div><dt>{{ ui.t('supportedCapabilities') }}</dt><dd>{{ selected.robotCapabilities?.map(c=>ui.capability(c)).join(' · ') || '—' }}</dd></div>
          <div><dt>{{ ui.t('recordsBatch') }}</dt><dd>{{ selected.batchId || ui.t('recordsImmediate') }}</dd></div>
          <div><dt>{{ ui.t('status') }}</dt><dd :class="`status-${selected.status}`">{{ ui.t(selected.status) }}</dd></div>
          <div><dt>{{ ui.t('recordsStage') }}</dt><dd>{{ ui.t('recordStage_'+selected.scheduleStage) }}</dd></div>
          <div><dt>{{ ui.t('recordsStart') }}</dt><dd>{{ time(selected.startTime) }}</dd></div>
          <div><dt>{{ ui.t('plannedFinish') }}</dt><dd>{{ time(selected.finishTime) }}</dd></div>
          <div><dt>{{ ui.t('executionDuration') }}</dt><dd>{{ selected.scheduleStage==='assigned' ? `${ui.duration(selected.duration)} / ${ui.duration(selected.estimatedTime)}` : selected.status==='failed' ? '—' : ui.t('awaitScheduling') }}</dd></div>
          <div><dt>{{ ui.t('recordsProgressAtExport') }}</dt><dd>{{ time(record.state.clock.now) }}</dd></div>
        </dl>
        <div v-if="selected.reasonCode || selected.reason" class="archive-reason"><strong>{{ ui.t('recordsOriginalReason') }}</strong><p>{{ selected.reason || '—' }}</p><code v-if="selected.reasonCode">{{ selected.reasonCode }}</code></div>
        <p v-if="selected.notes" class="archive-notes">{{ ui.t('notes') }}: {{ selected.notes }}</p>
        <h5>{{ ui.t('recordsPlannedRoute') }}</h5><p class="archive-route">{{ route(selected.path) }}</p>
        <details v-if="selected.timetable.length" :key="selected.id"><summary>{{ ui.t('recordsTimetable') }} · {{ selected.timetable.length }}</summary>
          <div class="table-scroll"><table><thead><tr><th>{{ ui.t('recordsLocation') }}</th><th>{{ ui.t('recordsArrival') }}</th><th>{{ ui.t('recordsDeparture') }}</th></tr></thead><tbody><tr v-for="(row,index) in selected.timetable.slice(tablePage*100,(tablePage+1)*100)" :key="index"><td>{{ label(row.nodeId) }}</td><td>{{ time(row.arrival) }}</td><td>{{ time(row.depart) }}</td></tr></tbody></table></div>
          <div v-if="selected.timetable.length>100" class="review-pages"><button :disabled="tablePage===0" @click="tablePage--">{{ ui.t('previousPage') }}</button><span>{{ tablePage+1 }} / {{ Math.ceil(selected.timetable.length/100) }}</span><button :disabled="(tablePage+1)*100>=selected.timetable.length" @click="tablePage++">{{ ui.t('nextPage') }}</button></div>
        </details>
        <details v-if="selected.trajectory.length" :key="selected.id+'-trajectory'"><summary>{{ ui.t('recordsTrajectory') }} · {{ selected.trajectory.length }}</summary><p>{{ ui.t('recordsTrajectoryHint') }}</p>
          <div class="table-scroll"><table><thead><tr><th>{{ ui.t('recordsSampleTime') }}</th><th>X</th><th>Y</th><th>Z</th></tr></thead><tbody><tr v-for="(point,index) in selected.trajectory.slice(trajectoryPage*100,(trajectoryPage+1)*100)" :key="index"><td>{{ point.time.toFixed(3) }}</td><td>{{ point.x.toFixed(3) }}</td><td>{{ point.y.toFixed(3) }}</td><td>{{ point.z.toFixed(3) }}</td></tr></tbody></table></div>
          <div v-if="selected.trajectory.length>100" class="review-pages"><button :disabled="trajectoryPage===0" @click="trajectoryPage--">{{ ui.t('previousPage') }}</button><span>{{ trajectoryPage+1 }} / {{ Math.ceil(selected.trajectory.length/100) }}</span><button :disabled="(trajectoryPage+1)*100>=selected.trajectory.length" @click="trajectoryPage++">{{ ui.t('nextPage') }}</button></div>
        </details>
      </section>
    </div>
    <details class="archive-logs"><summary>{{ ui.t('recordsLogs') }} · {{ record.state.logs.length }}</summary>
      <p>{{ ui.t('recordsLogsHint') }}</p>
      <ol><li v-for="(log,index) in record.state.logs.slice(logPage*100,(logPage+1)*100)" :key="index"><time>{{ time(log.time) }}</time><span>{{ log.message }}</span></li></ol>
      <div v-if="record.state.logs.length>100" class="review-pages"><button :disabled="logPage===0" @click="logPage--">{{ ui.t('previousPage') }}</button><span>{{ logPage+1 }} / {{ Math.ceil(record.state.logs.length/100) }}</span><button :disabled="(logPage+1)*100>=record.state.logs.length" @click="logPage++">{{ ui.t('nextPage') }}</button></div>
    </details>
  </Modal>
</template>
<script setup>
import {computed,ref,watch} from 'vue'
import Modal from '../common/Modal.vue'
import {useUiStore} from '../../stores/uiStore'
import {locationLabel,routeLabels} from '../../utils/locations.js'
const props=defineProps({modelValue:Boolean,record:{type:Object,required:true}})
defineEmits(['update:modelValue'])
const ui=useUiStore(),status=ref(''),batch=ref(''),type=ref(''),selectedId=ref(null),page=ref(0),tablePage=ref(0),logPage=ref(0),trajectoryPage=ref(0)
const tasks=computed(()=>props.record.state.tasks)
const nodes=computed(()=>Object.fromEntries(props.record.scene.nodes.map(n=>[n.id,n])))
const campusName=computed(()=>props.record.scene.campusNames?.[ui.preferences.locale] || ui.t('recordsUnnamedCampus'))
const exportedAt=computed(()=>new Date(props.record.exportedAt).toLocaleString(ui.preferences.locale))
const batches=computed(()=>[...new Set(tasks.value.map(t=>t.batchId || '__immediate__'))].sort())
const types=computed(()=>[...new Set(tasks.value.map(t=>t.taskType))].sort())
const filtered=computed(()=>tasks.value.filter(t=>(!status.value || t.status===status.value) && (!type.value || t.taskType===type.value) && (!batch.value || (t.batchId || '__immediate__')===batch.value)))
const pageCount=computed(()=>Math.max(1,Math.ceil(filtered.value.length/50)))
const pageTasks=computed(()=>filtered.value.slice(page.value*50,(page.value+1)*50))
const selected=computed(()=>pageTasks.value.find(t=>t.id===selectedId.value) || pageTasks.value[0])
watch(()=>props.record,()=>{status.value='';batch.value='';type.value='';page.value=0;selectedId.value=null;tablePage.value=0;trajectoryPage.value=0;logPage.value=0})
watch([status,batch,type],()=>{page.value=0;tablePage.value=0})
watch(()=>selected.value?.id,()=>{tablePage.value=0;trajectoryPage.value=0})
function time(value) {return Number.isFinite(value) ? ui.time(value,props.record.state.clock.epoch):'—'}
function route(path) {return ui.display(routeLabels(path,nodes.value).join(' → ') || ui.t('pending'))}
function label(id) {return ui.display(locationLabel(nodes.value,id))}
</script>
<style scoped>
.review-intro>p { color:var(--muted); font-size:12px; margin:0 0 12px; }
.archive-meta { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px 20px; margin:0; }
.archive-meta>div { min-width:0; }.archive-meta dt { color:var(--muted); font-size:11px; }.archive-meta dd { margin:2px 0 0; font-size:12px; overflow-wrap:anywhere; font-variant-numeric:tabular-nums; }
.review-filters { display:flex; gap:12px; flex-wrap:wrap; margin:16px 0 12px; }.review-filters label { display:flex; flex-direction:column; gap:4px; min-width:120px; flex:1; color:var(--muted); font-size:12px; }.review-filters select { min-width:0; width:100%; min-height:34px; }
.review-workspace { display:grid; grid-template-columns:230px minmax(0,1fr); gap:16px; align-items:start; }
.archive-list { max-height:50dvh; overflow:auto; display:flex; flex-direction:column; gap:6px; }
.archive-list>button { flex:none; padding:8px; text-align:left; min-width:0; width:100%; background:transparent; }.archive-list>button.selected { border-color:var(--accent); background:var(--active); }.archive-list>button>span { display:flex; justify-content:space-between; gap:8px; font-size:12px; }.archive-list>button>span>span { flex:none; white-space:nowrap; }.archive-list .review-pages { flex:none; }
.archive-list strong { min-width:0; overflow-wrap:anywhere; font-weight:600; }.archive-list small { display:block; margin-top:4px; color:var(--muted); font-size:11px; }
.archive-detail { min-width:0; }.archive-detail h4 { margin:0; font-size:14px; overflow-wrap:anywhere; }.archive-route { margin:6px 0 12px; font-size:12px; overflow-wrap:anywhere; }.archive-detail h5 { margin:14px 0 6px; font-size:12px; }
.archive-reason { margin-top:12px; padding:10px; background:var(--subtle); font-size:12px; overflow-wrap:anywhere; }.archive-reason p { margin:4px 0; }.archive-reason code { font-size:11px; }.archive-notes { font-size:12px; overflow-wrap:anywhere; }
summary { cursor:pointer; font-size:12px; padding:8px 0; }details p { font-size:12px; color:var(--muted); }.table-scroll { overflow:auto; max-height:240px; }table { width:100%; border-collapse:collapse; font-size:12px; }th,td { padding:6px; text-align:left; border-bottom:1px solid var(--border); }th { color:var(--muted); font-weight:400; }td:not(:first-child) { font-variant-numeric:tabular-nums; white-space:nowrap; }
.archive-logs { margin-top:16px; }.archive-logs ol { list-style:none; padding:0; margin:0; max-height:240px; overflow:auto; }.archive-logs li { display:flex; gap:12px; padding:4px 0; font-size:12px; }.archive-logs time { flex:none; color:var(--muted); font-variant-numeric:tabular-nums; }.archive-logs li span { overflow-wrap:anywhere; }
.review-pages { display:flex; justify-content:space-between; align-items:center; gap:8px; font-size:12px; margin-top:8px; }.review-pages button { min-height:32px; }.empty { color:var(--muted); font-size:12px; }
@media(max-width:640px) { .review-workspace { grid-template-columns:minmax(0,1fr); }.archive-list { max-height:180px; }.archive-meta { gap:8px 12px; }.review-filters { gap:8px; }.review-filters label { min-width:80px; } }
</style>
