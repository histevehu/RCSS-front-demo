<template>
  <section class="task-inspector" :class="{expanded}" :aria-label="ui.t('taskDetails')" @keydown.esc.stop="close">
    <div class="inspector-heading">
      <button class="inspector-toggle" :aria-expanded="expanded" aria-controls="selected-task-body" @click="toggle">
        <span class="inspector-identity"><span class="inspector-caption">{{ ui.t('taskDetails') }}</span><strong :title="task.name">{{ task.id }} · {{ task.name }}</strong></span>
        <span class="inspector-status" :class="`status-${task.status}`">{{ ui.t(task.status) }}</span>
        <span class="inspector-robot">{{ task.robotId || ui.t('unassigned') }}</span>
        <span class="inspector-affordance">{{ ui.t(expanded ? 'collapse':'details') }} <span aria-hidden="true">{{ expanded ? '−':'＋' }}</span></span>
      </button>
      <button class="inspector-close" :aria-label="ui.t('clearSelection')" @click="close">×</button>
    </div>
    <div v-if="expanded" id="selected-task-body" class="inspector-body"><TaskDetails :task="task" /></div>
  </section>
</template>
<script setup>
import { ref,watch,nextTick } from 'vue'
import { useAppStore } from '../../stores/appStore'
import { useUiStore } from '../../stores/uiStore'
import TaskDetails from './TaskDetails.vue'
const props=defineProps({task:{type:Object,required:true}}),emit=defineEmits(['layoutChange'])
const store=useAppStore(),ui=useUiStore(),expanded=ref(false)
// 新选择从简洁摘要开始，不改变左侧记录列表的位置或滚动位置。
watch(()=>props.task.id,()=>{expanded.value=false})
async function toggle() { expanded.value=!expanded.value;await nextTick();emit('layoutChange') }
async function close() {
  const id=props.task.id
  store.selectTask(null)
  await nextTick()
  document.querySelector(`[data-task-id="${CSS.escape(id)}"]`)?.focus()
}
</script>
<style scoped>
.task-inspector { position:absolute; z-index:12; left:var(--left-space); right:var(--right-space); bottom:68px; background:var(--surface); border:1px solid var(--border); border-radius:8px; overflow:hidden; }
.inspector-heading { display:flex; align-items:stretch; min-height:62px; }
.inspector-toggle { display:flex; flex:1; min-width:0; align-items:center; gap:14px; padding:10px 14px; border:0; border-radius:0; background:transparent; text-align:left; }
.inspector-identity { display:flex; flex-direction:column; gap:3px; min-width:0; flex:1; }.inspector-caption { color:var(--muted); font-size:11px; }.inspector-identity strong { font-size:13px; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.inspector-status,.inspector-robot,.inspector-affordance { font-size:12px; white-space:nowrap; flex:none; }.inspector-robot { color:var(--muted); }.inspector-affordance { color:var(--text); }
.inspector-close { width:40px; flex:none; border:0; border-left:1px solid var(--border); border-radius:0; background:transparent; font-size:22px; }
.inspector-body { padding:12px 16px; max-height:230px; overflow:auto; border-top:1px solid var(--border); }
.inspector-body :deep(.task-details) { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:4px 20px; }.inspector-body :deep(.task-details>strong) { display:none; }.inspector-body :deep(.task-details>p),.inspector-body :deep(.task-details>progress) { grid-column:1/-1; }.inspector-body :deep(.field-row) { font-size:12px; }
@media(max-width:1100px) { .inspector-toggle { flex-wrap:wrap; gap:5px 10px; padding:9px 10px; }.inspector-identity { flex:1 1 calc(100% - 20px); }.inspector-affordance { margin-left:auto; } }
@media(max-width:800px) { .task-inspector { bottom:116px; }.inspector-heading { min-height:72px; }.inspector-toggle { padding:10px 12px; }.inspector-close { width:44px; }.inspector-body { max-height:230px; padding:12px; }.inspector-body :deep(.task-details) { grid-template-columns:1fr; } }
</style>
