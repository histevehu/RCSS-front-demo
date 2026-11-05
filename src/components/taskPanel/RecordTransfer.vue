<template>
  <div class="record-transfer">
    <button :disabled="exporting || !store.connected || store.busy" :title="ui.t('exportRecordsHint')" @click="exportRecords">{{ ui.t(exporting ? 'recordsExporting':'exportRecords') }}</button>
    <button @click="fileInput.click()" :title="ui.t('importRecordsHint')">{{ ui.t('importRecords') }}</button>
    <input ref="fileInput" type="file" accept=".json,application/json" hidden @change="importRecords">
  </div>
  <Modal v-model="showError" :title="ui.t('recordsError')" size="sm"><p role="alert">{{ ui.t(error) }}</p></Modal>
  <RecordReview v-if="archive" v-model="showReview" :record="archive" />
</template>
<script setup>
import {ref,shallowRef,nextTick} from 'vue'
import {useAppStore} from '../../stores/appStore'
import {useUiStore} from '../../stores/uiStore'
import {api} from '../../utils/demo.js'
import {downloadTaskRecords,parseTaskRecords,RECORD_LIMIT} from '../../utils/taskRecords.js'
import Modal from '../common/Modal.vue'
import RecordReview from './RecordReview.vue'
const store=useAppStore(),ui=useUiStore()
const fileInput=ref(null),exporting=ref(false),showError=ref(false),error=ref(''),showReview=ref(false),archive=shallowRef(null)
function fail(code) { error.value=code; showError.value=true }
async function exportRecords() {
  if(exporting.value) return
  exporting.value=true
  try {
    const record=await api(`records?sessionId=${encodeURIComponent(store.sessionId)}`)
    downloadTaskRecords(record)
  } catch(e) { fail(e.message==='recordsTooLarge' ? e.message:'recordsExportFailed') }
  finally { exporting.value=false }
}
async function importRecords(event) {
  const file=event.target.files[0]
  event.target.value=''
  if(!file) return
  try {
    if(file.size > RECORD_LIMIT) throw new Error('recordsTooLarge')
    const record=parseTaskRecords(await file.text())
    showReview.value=false
    archive.value=record
    await nextTick()
    showReview.value=true
  } catch(e) { fail(['recordsInvalid','recordsUnsupported','recordsTooLarge'].includes(e.message) ? e.message:'recordsInvalid') }
}
</script>
<style scoped>
.record-transfer { display:flex; gap:6px; min-width:0; }
.record-transfer button { min-height:32px; padding:4px 8px; white-space:nowrap; }
</style>
