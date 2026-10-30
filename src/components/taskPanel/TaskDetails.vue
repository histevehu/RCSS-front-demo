<template>
  <div class="task-details">
    <strong>{{ task.id }} · {{ task.name }}</strong>
    <div class="field-row"><span>{{ ui.t('status') }}</span><span :class="`status-${task.status}`">{{ ui.t(task.status) }}</span></div>
    <div class="field-row"><span>{{ ui.t('robot') }}</span><span>{{ task.robotId || ui.t('unassigned') }}</span></div>
    <div class="field-row"><span>{{ ui.t('taskType') }}</span><span>{{ ui.t(task.taskType) }}</span></div>
    <template v-if="task.scheduleStage==='assigned'">
      <div class="field-row"><span>{{ ui.t('plannedStart') }}</span><span>{{ ui.time(task.startTime,store.clock.epoch) }}</span></div>
      <div class="field-row"><span>{{ ui.t('execution') }}</span><span>{{ ui.duration(task.estimatedTime) }}</span></div>
      <div class="field-row"><span>{{ ui.t('plannedFinish') }}</span><span>{{ ui.time(task.finishTime,store.clock.epoch) }}</span></div>
      <div class="field-row"><span>{{ ui.t('remaining') }}</span><span>{{ ui.duration(task.remaining) }}</span></div>
      <progress :value="task.duration" :max="task.estimatedTime || 1" :aria-label="ui.t('elapsed')"></progress>
    </template>
    <p v-else :class="{'error-text':task.status==='failed'}">{{ ui.reason(task) }}</p>
    <p class="route-text">{{ ui.display(store.formatRoute(task.path?.length ? task.path : task.routeNodes)) }}</p>
    <button v-if="task.status==='failed'" :disabled="!store.connected || store.busy" @click="store.retryTask(task)">{{ ui.t('retry') }}</button>
  </div>
</template>
<script setup>
import { useAppStore } from '../../stores/appStore'
import { useUiStore } from '../../stores/uiStore'
defineProps({task:{type:Object,required:true}})
const store=useAppStore(),ui=useUiStore()
</script>
<style scoped>.task-details>strong { display:block; margin-bottom:7px; overflow-wrap:anywhere; }.task-details>p { font-size:11px; margin-top:7px; }.task-details>button { margin-top:8px; }</style>
