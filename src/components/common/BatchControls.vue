<template>
  <section class="batch-controls" :aria-label="ui.t('batchSubmission')">
    <label class="batch-toggle"><span>{{ ui.t('batchSubmission') }}</span><input type="checkbox" role="switch" :checked="store.batching.enabled" :disabled="disabled" @change="saveMode"></label>
    <template v-if="store.batching.enabled">
      <div class="batch-window"><label>{{ ui.t('batchWindow') }} <input v-model="window" type="number" min="1" max="60" step="1" :disabled="disabled" @change="saveWindow" :aria-label="ui.t('batchWindow')"> s</label><button v-for="n in [5,10]" :key="n" type="button" :disabled="disabled" @click="store.saveBatch({batchWindowSeconds:n})">{{ n }}s</button></div>
      <p class="batch-status" role="status"><template v-if="!store.connected">{{ ui.t('disconnected') }}</template><template v-else-if="store.batching.collecting">{{ store.batching.collecting.batchId }} · {{ store.batching.collecting.taskCount }} {{ ui.t('collectedTasks') }} · {{ store.batchRemaining > 0 ? `${Math.ceil(store.batchRemaining)}s` : ui.t('awaitScheduling') }}</template><template v-else>{{ ui.t('awaitFirstTask') }}</template></p>
      <p v-if="store.batching.collecting && store.batching.collecting.windowSeconds!==store.batching.windowSeconds" class="batch-status">{{ ui.t('nextBatchWindow') }}: {{ store.batching.windowSeconds }}s</p>
    </template>
    <p v-if="localError || store.batchError" role="alert">{{ localError || ui.errorText(store.batchError) }}</p>
  </section>
</template>
<script setup>
import {computed,ref,watch} from 'vue'
import {useAppStore} from '../../stores/appStore'
import {useUiStore} from '../../stores/uiStore'
const store=useAppStore(),ui=useUiStore(),window=ref(10),localError=ref('')
const disabled=computed(()=>!store.connected || store.busy || store.batchSaving)
watch(()=>[store.batching.windowSeconds,store.batchSaving],()=>{window.value=store.batching.windowSeconds},{immediate:true})
async function saveMode(event){await store.saveBatch({batchEnabled:event.target.checked});event.target.checked=store.batching.enabled}
function saveWindow(){const n=Number(window.value);if(!Number.isInteger(n)||n<1||n>60){localError.value=ui.t('invalidBatchWindow');window.value=store.batching.windowSeconds;return}localError.value='';store.saveBatch({batchWindowSeconds:n})}
</script>
<style scoped>
.batch-controls{padding:10px 12px;background:var(--surface-solid);border:1px solid var(--border);border-radius:6px;font-size:13px;display:flex;flex-direction:column;gap:8px}.batch-toggle,.batch-window{display:flex;align-items:center;justify-content:space-between;gap:6px}.batch-toggle{min-height:32px;font-weight:500}.batch-toggle input{width:18px;height:18px}.batch-window label{display:flex;align-items:center;gap:4px;flex:1}.batch-window input{width:54px;height:34px;padding:4px;font-variant-numeric:tabular-nums}.batch-window button{height:34px;padding:4px 7px}.batch-status{margin:0;color:var(--muted);font-size:12px;line-height:1.5;font-variant-numeric:tabular-nums}@media(max-width:800px){.batch-toggle,.batch-window input,.batch-window button{min-height:44px}}
</style>
